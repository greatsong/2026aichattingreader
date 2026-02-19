/**
 * Gemini API 호출 모듈
 */
import { fetchWithTimeout } from '../utils'

/**
 * Gemini API 호출
 */
export async function callGeminiAPI(prompt, apiKey, model = 'gemini-2.5-pro') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const response = await fetchWithTimeout(url, {
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
    }, 30000)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error?.message || `Gemini API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
