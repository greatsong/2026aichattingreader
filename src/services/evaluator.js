/**
 * AI 채팅 평가 서비스
 * Gemini, OpenAI, Claude API를 이용한 채팅 평가
 */

/**
 * 채팅 내용을 루브릭 기반으로 평가
 */
export async function evaluateChat({ chatContent, reflection, rubric, apiSettings }) {
    // Destructure models from settings, support legacy/fallback
    const { provider, apiKeys } = apiSettings
    const models = apiSettings.models || {}
    const evaluationRuns = apiSettings.evaluationRuns || 1 // K-run support

    // Determine the specific model to use for single-provider mode
    // If not found in `models`, fallback to legacy `model` field or default
    const currentModel = models[provider] || apiSettings.model

    // Get API key for the selected provider
    const apiKey = apiKeys?.[provider] || apiSettings.apiKey || ''

    // Validation: Check if model is valid
    if (!currentModel || currentModel === 'custom' || currentModel.trim() === '') {
        throw new Error(`'${provider}'에 대한 모델 이름이 올바르지 않습니다. 관리자 설정에서 '직접 입력'을 선택한 후 모델명(예: gemini-pro-vision, gpt-4-turbo)을 정확히 입력해주세요.`)
    }

    console.log(`Evaluating with Provider: ${provider}, Model: ${currentModel}, Runs: ${evaluationRuns}`)

    // 평가 프롬프트 생성
    const prompt = buildEvaluationPrompt(chatContent, rubric, reflection)

    // K-run evaluation: run multiple times and synthesize
    if (evaluationRuns > 1) {
        return await evaluateWithKRuns(prompt, provider, currentModel, apiKey, apiKeys, apiSettings, rubric, evaluationRuns)
    }

    // Single run (default) with fallback
    // Single run (default) with fallback and retries
    let lastError = null
    const MAX_RETRIES = 2

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) console.log(`Retry attempt ${attempt}...`)

            let response = await singleEvaluation(prompt, provider, currentModel, apiKey, apiKeys, apiSettings)

            // 🔍 DEBUG: Log raw response to identify parsing issues
            console.log('🔍 [DEBUG] RAW AI RESPONSE:', response)

            if (!response || response.trim() === '') {
                throw new Error('AI returned empty response')
            }

            const parsed = parseEvaluationResponse(response, rubric)

            // 🔍 DEBUG: Log parsed result
            console.log('🔍 [DEBUG] PARSED RESULT:', parsed)

            // Temporary debugging hook
            if (typeof window !== 'undefined') {
                window.debugLastEvaluation = { raw: response, parsed }
            }

            return parsed
        } catch (error) {
            console.warn(`Evaluation attempt ${attempt + 1} failed:`, error.message)
            lastError = error

            // Last attempt fallback to server proxy (only if client-side failed and proxy is available)
            if (attempt === MAX_RETRIES && !apiSettings.useServerSide) {
                console.warn('All retries failed, trying server proxy backup...')
                try {
                    const response = await callServerProxy({
                        prompt,
                        provider,
                        model: currentModel,
                        apiKeys: apiSettings.apiKeys,
                        models: apiSettings.models || {}
                    })
                    return parseEvaluationResponse(response, rubric)
                } catch (serverError) {
                    throw new Error(`평가 실패 (재시도 ${MAX_RETRIES}회 포함): ${error.message} (Server fallback also failed: ${serverError.message})`)
                }
            }
        }
    }

    throw lastError
}

/**
 * K-run parallel evaluation
 */
async function evaluateWithKRuns(prompt, provider, currentModel, apiKey, apiKeys, apiSettings, rubric, runs) {
    console.log(`Starting ${runs}-run parallel evaluation...`)

    const promises = []
    for (let i = 0; i < runs; i++) {
        promises.push(
            singleEvaluation(prompt, provider, currentModel, apiKey, apiKeys, apiSettings)
                .then(response => parseEvaluationResponse(response, rubric))
                .catch(err => {
                    console.warn(`Run ${i + 1} failed:`, err.message)
                    return null // Mark failed runs as null
                })
        )
    }

    const results = await Promise.all(promises)
    const successfulResults = results.filter(r => r !== null)

    if (successfulResults.length === 0) {
        throw new Error('모든 평가 시도가 실패했습니다.')
    }

    console.log(`${successfulResults.length}/${runs} evaluations succeeded`)

    // Synthesize results
    return synthesizeKRunResults(successfulResults)
}

/**
 * Single evaluation call (extracted for reuse)
 */
async function singleEvaluation(prompt, provider, currentModel, apiKey, apiKeys, apiSettings) {
    const models = apiSettings.models || {}
    const hasRequiredKeys = !!apiKey
    const useServerProxy = apiSettings.useServerSide || !hasRequiredKeys

    if (useServerProxy) {
        return await callServerProxy({
            prompt,
            provider,
            model: currentModel,
            apiKeys: apiSettings.apiKeys,
            models: models
        })
    } else {
        switch (provider) {
            case 'gemini':
                return await callGeminiAPI(prompt, apiKey, currentModel)
            case 'openai':
                return await callOpenAIAPI(prompt, apiKey, currentModel)
            case 'claude':
                return await callClaudeAPI(prompt, apiKey, currentModel)
            default:
                throw new Error('지원하지 않는 AI 제공업체입니다.')
        }
    }
}

/**
 * Synthesize multiple K-run results into one
 */
function synthesizeKRunResults(results) {
    const n = results.length

    // Calculate average score
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / n)
    const scores = results.map(r => r.totalScore)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)

    // Calculate grade based on average
    const grade = calculateGrade(avgScore)

    // Synthesize criteria scores (average each)
    const criteriaScoresMap = {}
    results.forEach(result => {
        result.criteriaScores?.forEach(cs => {
            if (!criteriaScoresMap[cs.name]) {
                criteriaScoresMap[cs.name] = {
                    ...cs,
                    scoreSum: 0,
                    count: 0,
                    allDetails: []
                }
            }
            criteriaScoresMap[cs.name].scoreSum += cs.score
            criteriaScoresMap[cs.name].count++
            if (cs.details) {
                criteriaScoresMap[cs.name].allDetails.push(cs.details)
            }
        })
    })

    const criteriaScores = Object.values(criteriaScoresMap).map(cs => {
        // Collect all details directly from criteria scores (fallback to details object if needed)
        const allStrengths = cs.allDetails.flatMap(d => d.strengths || d?.details?.strengths || [])
        const allWeaknesses = cs.allDetails.flatMap(d => d.weaknesses || d?.details?.weaknesses || [])
        const allImprovements = cs.allDetails.flatMap(d => d.improvement || d?.details?.improvement || [])
        const allEvidence = cs.allDetails.map(d => d.evidence || d?.details?.evidence).filter(Boolean)

        // Select unique and representative feedback
        const strengths = [...new Set(allStrengths)].slice(0, 2).join('\n')
        const weaknesses = [...new Set(allWeaknesses)].slice(0, 2).join('\n')
        const improvement = [...new Set(allImprovements)].slice(0, 2).join('\n')

        // Select the longest evidence description
        const evidence = allEvidence.sort((a, b) => b.length - a.length)[0] || ''

        return {
            name: cs.name,
            score: Math.round(cs.scoreSum / cs.count),
            maxScore: cs.maxScore,
            // Reconstruct detailed feedback structure
            evidence,
            strengths,
            weaknesses,
            improvement,
            details: cs.allDetails[0] // Fallback
        }
    })

    // Merge characteristics (unique values)
    const allCharacteristics = results.flatMap(r => r.characteristics || [])
    const characteristics = [...new Set(allCharacteristics)].slice(0, 5)

    // Use first qualitative feedback (they should be similar)
    const qualitative = results[0]?.qualitative || []

    // Merge suggestions (unique values)
    const allSuggestions = results.flatMap(r => r.suggestions || [])
    const suggestions = [...new Set(allSuggestions)].slice(0, 4)

    // Pick the longest student record draft
    const studentRecordDraft = results
        .map(r => r.studentRecordDraft || '')
        .sort((a, b) => b.length - a.length)[0] || ''

    return {
        totalScore: avgScore,
        grade,
        criteriaScores,
        characteristics,
        qualitative,
        suggestions,
        studentRecordDraft,
        evaluationMeta: {
            runs: n,
            scoreRange: { min: minScore, max: maxScore },
            variance: maxScore - minScore
        }
    }
}

/**
 * Calculate grade from score
 */
function calculateGrade(score) {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'B+'
    if (score >= 80) return 'B'
    if (score >= 75) return 'C+'
    if (score >= 70) return 'C'
    if (score >= 65) return 'D+'
    if (score >= 60) return 'D'
    return 'F'
}

/**
 * Server Proxy 호출 (/api/evaluate)
 */
async function callServerProxy({ prompt, provider, model }) {
    const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt,
            provider,
            model
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `Server Error: ${response.status}`)
    }

    const data = await response.json()
    return data.text || ''
}

/**
 * 평가 프롬프트 생성
 */
function buildEvaluationPrompt(chatContent, rubric, reflection) {
    const criteriaDescription = rubric.criteria.map(c => {
        const levelsDesc = c.levels
            .map(l => `  - ${l.score}점: ${l.description}`)
            .join('\n')
        return `### ${c.name} (가중치: ${c.weight}%)
설명: ${c.description}
평가 수준:
${levelsDesc}`
    }).join('\n\n')

    // Generate criteria list for clearer instruction
    const criteriaNamesList = rubric.criteria.map((c, i) => `${i + 1}. ${c.name}`).join('\n')

    return `당신은 AI 채팅 활용 능력을 평가하는 교육 전문가입니다.
학생들이 AI를 더 효과적으로 활용할 수 있도록 구체적이고 교육적인 피드백을 제공해주세요.

# 평가 루브릭: ${rubric.name}

${criteriaDescription}

# 학생 자기평가 / 추가 맥락 (Additional Context)
${reflection ? reflection : "(없음)"}

⚠️ 주의: 위 '학생 자기평가' 내용은 **정성 평가(의견, 생활기록부)**에만 반영하고, **점수(Quantitative Score)** 산정에는 절대 반영하지 마세요. 점수는 오직 채팅 내용의 품질로만 평가하세요.

# 평가할 채팅 기록 (⚠️ 중요 지침)
본 내용은 사용자가 브라우저에서 직접 복사하여 붙여넣은 것입니다. 따라서 사이드바의 채팅 목록, 설정 메뉴, 버튼 텍스트 등 불필요한 노이즈가 포함되어 있을 수 있습니다.

**평가 시 반드시 다음 지침을 따르세요:**
1. 채팅 화면의 **주요 대화 내용(사용자 질문과 AI 응답)**만 추출하여 평가에 반영하세요.
2. 사이드바의 다른 채팅 제목이나 메뉴 버튼 등 대화 외적인 텍스트는 **완전한 무시(Ignore)** 대상으로 처리하세요.
3. 만약 복사된 내용 중 여러 대화가 섞여 있다면, 가장 마지막에 진행된 주요 주제를 중심으로 평가하세요.

---
${chatContent}
---

# 평가 결과 형식

⚠️ 중요: 아래 ${rubric.criteria.length}개 평가 항목을 **모두** 평가해야 합니다:
${criteriaNamesList}

반드시 다음 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
criteriaScores 배열에는 반드시 **${rubric.criteria.length}개 항목**이 포함되어야 하며, **각 항목마다 evidence, strengths, weaknesses, improvement 필드가 비어있지 않아야 합니다**.

\`\`\`json
{
  "totalScore": 85,
  "grade": "B+",
  "criteriaScores": [
    {
      "criterionId": "criterion_1",
      "name": "첫 번째 평가 항목명",
      "score": 4,
      "maxScore": 5,
      "percentage": 80,
      "evidence": "채팅 내용 중 해당 점수의 근거가 되는 부분을 직접 인용하거나 요약",
      "strengths": "잘한 점을 구체적으로 칭찬",
      "weaknesses": "부족한 점 지적",
      "improvement": "구체적 개선 예시 (Before/After)"
    },
    {
      "criterionId": "criterion_2",
      "name": "두 번째 평가 항목명",
      "score": 3,
      "maxScore": 5,
      "percentage": 60,
      "evidence": "...",
      "strengths": "...",
      "weaknesses": "...",
      "improvement": "..."
    }
    // ... 나머지 평가 항목도 동일한 형식으로 모두 포함
  ],
  "characteristics": [
    "이 학생의 AI 활용 특징 1",
    "특징 2",
    "특징 3"
  ],
  "qualitativeEvaluation": "전반적인 정성 평가. 학생의 강점과 성장 가능성을 중심으로 작성. (학생의 자기평가 내용도 참고하여 격려)",
  "suggestions": [
    "구체적인 실천 방안 1",
    "구체적인 실천 방안 2"
  ],
  "studentRecordDraft": "생활기록부 작성용 초안 (학생의 자기평가 내용이 있다면 이를 포함하여, 구체적인 활동 맥락이 드러나도록 3-4문장으로 작성)"
}
\`\`\`

# 필수 지침 (반드시 따르세요!)

1. **criteriaScores는 반드시 ${rubric.criteria.length}개**여야 합니다. 하나라도 빠지면 안 됩니다.
2. **evidence 필드 작성법**:
   - 단순히 "잘했습니다"라고 하지 말고, **채팅의 특정 대목**을 콕 집어서 언급하세요.
   - 학생이 "내 흐름도를 반영해달라"고 했다면, 그 노력을 정성 평가에 언급해주세요.
3. **improvement 필드가 가장 중요합니다!** 구체적인 수정 예시를 보여주세요.
4. totalScore는 각 항목 점수에 가중치를 적용한 100점 만점 환산 점수입니다.
5. evidence, strengths, weaknesses, improvement 필드는 **빈 문자열("")이면 안 됩니다**. 반드시 내용을 채워주세요.
6. 반드시 유효한 JSON 형식으로 응답해주세요. 주석은 포함하지 마세요.`
}

/**
 * Gemini API 호출
 */
async function callGeminiAPI(prompt, apiKey, model = 'gemini-2.5-pro') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192
            }
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `Gemini API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * OpenAI API 호출
 */
async function callOpenAIAPI(prompt, apiKey, model = 'gpt-4o') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are an educational AI evaluation expert. Always respond in valid JSON format.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 8192
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `OpenAI API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}

/**
 * Claude API 호출
 */
async function callClaudeAPI(prompt, apiKey, model = 'claude-3-5-sonnet-20241022') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model,
            max_tokens: 8192,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `Claude API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ''
}

/**
 * Client-side Ensemble Execution
 * Only calls services that are enabled in the selection
 */
async function evaluateEnsembleOnClient(prompt, apiKeys, ensembleModels, enabledServices = { gemini: true, openai: true, claude: true }) {
    console.log('Starting Client-Side Ensemble with models:', ensembleModels, 'Enabled:', enabledServices)

    // Use user-selected models or defaults
    const geminiModel = ensembleModels?.gemini || 'gemini-2.5-flash'
    const openaiModel = ensembleModels?.openai || 'gpt-4o'
    const claudeModel = ensembleModels?.claude || 'claude-3-5-sonnet-20241022'

    // Build promises array based on enabled services (default to true if not explicitly set)
    const promises = []
    const serviceNames = []

    const geminiEnabled = enabledServices?.gemini ?? true
    const openaiEnabled = enabledServices?.openai ?? true
    const claudeEnabled = enabledServices?.claude ?? true

    console.log('Service states:', { geminiEnabled, openaiEnabled, claudeEnabled })
    console.log('API Keys present:', {
        gemini: !!apiKeys.gemini,
        openai: !!apiKeys.openai,
        claude: !!apiKeys.claude
    })

    if (geminiEnabled && apiKeys.gemini) {
        promises.push(callGeminiAPI(prompt, apiKeys.gemini, geminiModel))
        serviceNames.push('Gemini')
    }
    if (openaiEnabled && apiKeys.openai) {
        promises.push(callOpenAIAPI(prompt, apiKeys.openai, openaiModel))
        serviceNames.push('OpenAI')
    }
    if (claudeEnabled && apiKeys.claude) {
        promises.push(callClaudeAPI(prompt, apiKeys.claude, claudeModel))
        serviceNames.push('Claude')
    }

    if (promises.length < 2) {
        throw new Error(`앙상블 평가에는 최소 2개 이상의 AI 서비스가 필요합니다. (현재 활성: ${serviceNames.join(', ') || '없음'})`)
    }

    console.log(`Ensemble evaluating with: ${serviceNames.join(', ')}`)

    const results = await Promise.allSettled(promises)

    const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)

    if (successfulResults.length === 0) {
        const errors = results
            .filter(r => r.status === 'rejected')
            .map(r => r.reason?.message || 'Unknown error')
            .join(', ')
        throw new Error(`모든 AI 모델이 응답하지 않았습니다. (Errors: ${errors})`)
    }

    return synthesizeResults(successfulResults)
}

/**
 * Synthesize multiple JSON results (Client-side version)
 */
function synthesizeResults(texts) {
    const validResults = []

    // Parse each result
    texts.forEach(text => {
        try {
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
            const jsonStr = match[1].trim()
            const obj = JSON.parse(jsonStr)
            if (obj.totalScore !== undefined) {
                validResults.push(obj)
            }
        } catch (e) {
            console.warn('Failed to parse result in ensemble:', e)
        }
    })

    if (validResults.length === 0) {
        return texts[0] || "{}"
    }

    const count = validResults.length
    const base = validResults[0]

    const finalResult = {
        ...base,
        totalScore: Math.round(validResults.reduce((acc, r) => acc + (r.totalScore || 0), 0) / count),
        qualitativeEvaluation: validResults.map((r, i) => `[의견 ${i + 1}]\n${r.qualitativeEvaluation}`).join('\n\n---\n\n'),
        characteristics: [...new Set(validResults.flatMap(r => r.characteristics || []))],
        suggestions: [...new Set(validResults.flatMap(r => r.suggestions || []))],
        criteriaScores: base.criteriaScores.map((criterion, idx) => {
            const sum = validResults.reduce((acc, r) => {
                const c = r.criteriaScores[idx]
                return acc + (c ? (c.score || 0) : 0)
            }, 0)
            const avgScore = Math.round(sum / count)

            const combinedStrengths = validResults.map(r => r.criteriaScores[idx]?.strengths).filter(Boolean).join(' / ')
            const combinedWeaknesses = validResults.map(r => r.criteriaScores[idx]?.weaknesses).filter(Boolean).join('\n')
            const combinedImprovement = validResults.map(r => r.criteriaScores[idx]?.improvement).filter(Boolean).join('\n')

            // Generate combined evidence properly
            const combinedEvidence = validResults.map(r => r.criteriaScores[idx]?.evidence).filter(Boolean).join('\n')

            return {
                ...criterion,
                score: avgScore,
                strengths: combinedStrengths,
                weaknesses: combinedWeaknesses,
                improvement: combinedImprovement,
                evidence: combinedEvidence
            }
        })
    }

    return JSON.stringify(finalResult, null, 2)
}

/**
 * 평가 응답 파싱
 */
function parseEvaluationResponse(response, rubric) {
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonStr = response

    // ```json ... ``` 형식 처리
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
        jsonStr = jsonMatch[1]
    }

    // 앞뒤 공백 제거
    jsonStr = jsonStr.trim()

    try {
        if (!jsonStr) throw new Error('Empty JSON string')
        const result = JSON.parse(jsonStr)

        // 필수 필드 검증 및 기본값 설정
        return {
            totalScore: result.totalScore || 0,
            grade: result.grade || 'N/A',
            criteriaScores: (result.criteriaScores || []).map((cs, idx) => {
                // Percentage 자동 계산 (AI가 누락할 경우 대비)
                const safeScore = cs.score || 0
                const safeMax = cs.maxScore || 5
                const calculatedPercentage = Math.round((safeScore / safeMax) * 100)

                // Check for missing details
                if (!cs.strengths && !cs.weaknesses) {
                    console.warn(`⚠️ [DEBUG] Missing details for criterion ${idx + 1}:`, cs)
                }

                return {
                    criterionId: cs.criterionId || '',
                    name: cs.name || '',
                    score: safeScore,
                    maxScore: safeMax,
                    percentage: cs.percentage !== undefined ? cs.percentage : calculatedPercentage,
                    evidence: cs.evidence || cs.feedback || '근거가 제공되지 않았습니다.', // Fallback to feedback
                    strengths: cs.strengths || '',
                    weaknesses: cs.weaknesses || '',
                    improvement: cs.improvement || '추가적인 개선 제안이 없습니다.',
                    feedback: cs.feedback || '' // 이전 버전 호환
                }
            }),
            characteristics: result.characteristics || [],
            qualitativeEvaluation: result.qualitativeEvaluation || '',
            suggestions: result.suggestions || [],
            studentRecordDraft: result.studentRecordDraft || ''
        }
    } catch (error) {
        console.error('JSON 파싱 오류:', error)
        console.log('원본 응답:', response)

        // 파싱 실패 시 기본 응답 생성
        return {
            totalScore: 0,
            grade: 'N/A',
            criteriaScores: rubric.criteria.map(c => ({
                criterionId: c.id,
                name: c.name,
                score: 0,
                maxScore: 5,
                percentage: 0,
                feedback: '평가 결과를 파싱할 수 없습니다.'
            })),
            characteristics: ['평가 결과 파싱 오류'],
            qualitativeEvaluation: `AI 응답을 파싱하는 중 오류가 발생했습니다.\n\n원본 응답:\n${response.substring(0, 500)}...`,
            suggestions: ['다시 평가를 시도해 주세요.'],
            studentRecordDraft: ''
        }
    }
}
