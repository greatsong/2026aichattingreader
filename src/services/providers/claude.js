/**
 * Claude API 호출 모듈
 */
import { fetchWithTimeout } from '../utils'

/**
 * Claude API 호출
 */
export async function callClaudeAPI(prompt, apiKey, model = 'claude-3-5-sonnet-20241022') {
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2024-06-01'
        },
        body: JSON.stringify({
            model,
            max_tokens: 8192,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    }, 30000)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `Claude API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ''
}
