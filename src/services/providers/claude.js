/**
 * Claude API 호출 모듈
 * CORS 제한으로 항상 서버 프록시(/api/evaluate) 경유
 */
import { fetchWithTimeout } from '../utils'

/**
 * Claude API 호출 (서버 프록시 경유)
 */
export async function callClaudeAPI(prompt, apiKey, model = 'claude-haiku-4-5-20251001') {
    const response = await fetchWithTimeout('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: 'claude', model })
    }, 60000)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `Claude API 오류: ${response.status}`)
    }

    const data = await response.json()
    return data.text || ''
}
