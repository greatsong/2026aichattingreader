
// GoogleGenerativeAI import removed to support Edge Runtime

const SERVER_KEYS = {
    gemini: process.env.GEMINI_API_KEY || '',
    claude: process.env.CLAUDE_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || ''
};

export const config = {
    runtime: 'edge',
};

// Learning-Oriented System Prompt
const LEARNING_SYSTEM_PROMPT = `
당신은 AI 교육 평가 전문가입니다.
첨부된 채팅 로그를 "학습 참여도(Learning Engagement)"와 "인지적 마찰(Cognitive Friction)" 관점에서 분석하십시오.

# 1. 상호작용 패턴 분류 (Interaction Patterns)
사용자의 행동을 다음 4가지 모드 중 하나로 분류하십시오:
1. 위임 (Delegation) - 낮은 점수: AI에게 코드를 짜달라고만 하고 이해하려 하지 않음.
2. 수동적 디버깅 (Iterative Debugging) - 낮은 점수: 에러 해결을 수동적으로 요청함.
3. 생성 후 이해 (Generation-then-Comprehension) - 높은 점수: 생성된 코드를 검토하고 질문함.
4. 개념적 탐구 (Conceptual Inquiry) - 높은 점수: 원리를 먼저 질문하거나 힌트를 요청함.

# 2. 출력 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하십시오 (마크다운 없이). JSON 파싱이 가능해야 합니다.
{
  "totalScore": 0-100,
  "interactionMode": "Delegation" | "Iterative Debugging" | "Generation-then-Comprehension" | "Conceptual Inquiry",
  "qualitativeEvaluation": "학습자의 성장을 위한 구체적인 피드백...",
  "criteriaScores": [
    { "name": "메타인지적 참여도", "score": 0-100, "strengths": "...", "improvement": "..." },
    { "name": "문제 해결 주도성", "score": 0-100, "strengths": "...", "improvement": "..." },
    { "name": "기술적 정확성", "score": 0-100, "strengths": "...", "improvement": "..." }
  ],
  "characteristics": ["학습 태도 키워드"],
  "suggestions": ["구체적인 학습 가이드"],
  "studentRecordDraft": "생기부 초안..."
}
`;

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { prompt, provider = 'gemini', model, apiKey: singleApiKey, apiKeys: clientApiKeys = {} } = await req.json();

        // Helper for handling timeouts - return null instead of throwing to allow partial success
        const withTimeout = (promise, ms) => Promise.race([
            promise,
            new Promise((resolve) => setTimeout(() => resolve(null), ms))
        ]);

        const TIMEOUT_MS = 25000; // Increased to 25s for better analysis (Vercel max is 30s/60s depending on plan, but Edge is 30s)

        // 1. Ensemble Mode
        if (provider === 'ensemble') {
            const results = await Promise.allSettled([
                withTimeout(callProvider('gemini', prompt, clientApiKeys.gemini || SERVER_KEYS.gemini, 'gemini-2.5-flash'), TIMEOUT_MS),
                withTimeout(callProvider('openai', prompt, clientApiKeys.openai || SERVER_KEYS.openai, 'gpt-4o-mini'), TIMEOUT_MS),
                withTimeout(callProvider('claude', prompt, clientApiKeys.claude || SERVER_KEYS.claude, 'claude-haiku-4-5-20251001'), TIMEOUT_MS)
            ]);

            const successfulResults = results
                .filter(r => r.status === 'fulfilled' && r.value !== null)
                .map(r => r.value);

            if (successfulResults.length === 0) {
                throw new Error(`서버 평가 중 오류: 25초 내에 응답한 AI 모델이 없습니다.`);
            }

            const synthesizedText = synthesizeResults(successfulResults);

            return new Response(JSON.stringify({ text: synthesizedText }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Single Provider Mode
        const effectiveApiKey = singleApiKey || clientApiKeys[provider] || SERVER_KEYS[provider];

        if (!effectiveApiKey) {
            return new Response(JSON.stringify({ error: `API Key for ${provider} not configured.` }), { status: 500 });
        }

        const resultText = await withTimeout(
            callProvider(provider, prompt, effectiveApiKey, model),
            TIMEOUT_MS
        );

        return new Response(JSON.stringify({ text: resultText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

/**
 * Call individual provider API
 */
async function callProvider(provider, prompt, apiKey, model) {
    if (!apiKey) throw new Error(`Missing API Key for ${provider}`);

    let url, options;

    if (provider === 'gemini') {
        const targetModel = model || 'gemini-2.5-pro';
        url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
        options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: LEARNING_SYSTEM_PROMPT + "\n\nUser Chat Log:\n" + prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
            })
        };
    } else if (provider === 'openai') {
        const targetModel = model || 'gpt-4o';
        url = 'https://api.openai.com/v1/chat/completions';
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: targetModel,
                messages: [
                    { role: 'system', content: LEARNING_SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 8192
            })
        };
    } else if (provider === 'claude') {
        const targetModel = model || 'claude-haiku-4-5-20251001';
        url = 'https://api.anthropic.com/v1/messages';
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2024-06-01'
            },
            body: JSON.stringify({
                model: targetModel,
                max_tokens: 8192,
                system: LEARNING_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: prompt }]
            })
        };
    } else {
        throw new Error(`Unknown provider: ${provider}`);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`${provider} Error: ${errData.error?.message || response.status}`);
    }

    const data = await response.json();

    // Extract text based on provider
    if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (provider === 'openai') return data.choices?.[0]?.message?.content || '';
    if (provider === 'claude') return data.content?.[0]?.text || '';

    return '';
}

/**
 * Synthesize multiple JSON results into one
 */
function synthesizeResults(texts) {
    const validResults = [];

    // Parse each result
    texts.forEach(text => {
        try {
            // Extract JSON from markdown blocks if present
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
            const jsonStr = match[1].trim();
            const obj = JSON.parse(jsonStr);
            if (obj.totalScore !== undefined) {
                validResults.push(obj);
            }
        } catch (e) {
            console.warn('Failed to parse result in ensemble:', e);
        }
    });

    if (validResults.length === 0) {
        return texts[0] || "{}"; // Fallback if all parsing fails
    }

    // Average Scores
    const count = validResults.length;
    const base = validResults[0];

    const finalResult = {
        ...base,
        totalScore: Math.round(validResults.reduce((acc, r) => acc + (r.totalScore || 0), 0) / count),
        // Prefer the Mode from the highest rated result or simply the first one?
        // Let's take the mode that occurs most frequently? Too complex.
        // Just take the base. Or join them?
        // Let's just use base execution mode for simplicity, as specific qualitative synthesis is tricky.
        interactionMode: base.interactionMode,
        qualitativeEvaluation: validResults.map((r, i) => `[의견 ${i + 1}]\n${r.qualitativeEvaluation}`).join('\n\n---\n\n'),
        characteristics: [...new Set(validResults.flatMap(r => r.characteristics || []))],
        suggestions: [...new Set(validResults.flatMap(r => r.suggestions || []))],
        criteriaScores: base.criteriaScores.map((criterion, idx) => {
            // Average score for this criterion across all results
            const sum = validResults.reduce((acc, r) => {
                const c = r.criteriaScores[idx];
                return acc + (c ? (c.score || 0) : 0);
            }, 0);
            const avgScore = Math.round(sum / count);

            // Combine textual feedback
            const combinedStrengths = validResults.map(r => r.criteriaScores[idx]?.strengths).filter(Boolean).join(' / ');
            const combinedImprovement = validResults.map(r => r.criteriaScores[idx]?.improvement).filter(Boolean).join('\n');

            return {
                ...criterion,
                score: avgScore,
                strengths: combinedStrengths,
                improvement: combinedImprovement
            };
        })
    };

    return JSON.stringify(finalResult, null, 2);
}
