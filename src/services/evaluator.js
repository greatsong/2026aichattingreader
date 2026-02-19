/**
 * AI 채팅 평가 오케스트레이터
 * 각 모듈에서 기능을 조합하여 평가를 실행
 */
import { getProvider } from './providers'
import { buildEvaluationPrompt } from './prompts'
import { parseEvaluationResponse } from './responseParser'
import { synthesizeKRunResults } from './synthesis'
import { fetchWithTimeout } from './utils'

const MAX_RETRIES = 2

/**
 * 채팅 내용을 루브릭 기반으로 평가
 */
export async function evaluateChat({ chatContent, reflection, rubric, apiSettings }) {
    const { provider, apiKeys } = apiSettings
    const models = apiSettings.models || {}
    const evaluationRuns = apiSettings.evaluationRuns || 1

    const currentModel = models[provider] || apiSettings.model
    const apiKey = apiKeys?.[provider] || apiSettings.apiKey || ''

    if (!currentModel || currentModel === 'custom' || currentModel.trim() === '') {
        throw new Error(`'${provider}'에 대한 모델 이름이 올바르지 않습니다. 관리자 설정에서 '직접 입력'을 선택한 후 모델명(예: gemini-pro-vision, gpt-4-turbo)을 정확히 입력해주세요.`)
    }

    const prompt = buildEvaluationPrompt(chatContent, rubric, reflection)

    // K-run evaluation: run multiple times and synthesize
    if (evaluationRuns > 1) {
        return await evaluateWithKRuns(prompt, provider, currentModel, apiKey, apiSettings, rubric, evaluationRuns)
    }

    // Single run (default) with fallback and retries
    let lastError = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            let response = await singleEvaluation(prompt, provider, currentModel, apiKey, apiSettings)

            if (!response || response.trim() === '') {
                throw new Error('AI returned empty response')
            }

            return parseEvaluationResponse(response, rubric)
        } catch (error) {
            console.warn(`Evaluation attempt ${attempt + 1} failed:`, error.message)
            lastError = error

            if (attempt === MAX_RETRIES && !apiSettings.useServerSide) {
                console.warn('All retries failed, trying server proxy backup...')
                try {
                    const response = await callServerProxy({
                        prompt,
                        provider,
                        model: currentModel
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
 * K-run 병렬 평가
 */
async function evaluateWithKRuns(prompt, provider, currentModel, apiKey, apiSettings, rubric, runs) {
    const promises = []
    for (let i = 0; i < runs; i++) {
        promises.push(
            singleEvaluation(prompt, provider, currentModel, apiKey, apiSettings)
                .then(response => parseEvaluationResponse(response, rubric))
                .catch(err => {
                    console.warn(`Run ${i + 1} failed:`, err.message)
                    return null
                })
        )
    }

    const results = await Promise.all(promises)
    const successfulResults = results.filter(r => r !== null)

    if (successfulResults.length === 0) {
        throw new Error('모든 평가 시도가 실패했습니다.')
    }

    return synthesizeKRunResults(successfulResults)
}

/**
 * 단일 평가 호출
 */
async function singleEvaluation(prompt, provider, currentModel, apiKey, apiSettings) {
    const hasRequiredKeys = !!apiKey
    const useServerProxy = apiSettings.useServerSide || !hasRequiredKeys

    if (useServerProxy) {
        return await callServerProxy({
            prompt,
            provider,
            model: currentModel
        })
    }

    const callAPI = getProvider(provider)
    return await callAPI(prompt, apiKey, currentModel)
}

/**
 * Server Proxy 호출 (/api/evaluate)
 */
async function callServerProxy({ prompt, provider, model }) {
    const response = await fetchWithTimeout('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, model })
    }, 30000)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `Server Error: ${response.status}`)
    }

    const data = await response.json()
    return data.text || ''
}
