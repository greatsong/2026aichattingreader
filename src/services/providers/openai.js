/**
 * OpenAI API 호출 모듈
 */
import { fetchWithTimeout } from '../utils'

/**
 * OpenAI API 호출
 */
export async function callOpenAIAPI(prompt, apiKey, model = 'gpt-4o') {
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
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
    }, 30000)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `OpenAI API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}
