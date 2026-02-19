/**
 * AI 제공업체 팩토리
 */
import { callGeminiAPI } from './gemini'
import { callOpenAIAPI } from './openai'
import { callClaudeAPI } from './claude'

const providers = {
    gemini: callGeminiAPI,
    openai: callOpenAIAPI,
    claude: callClaudeAPI
}

/**
 * 제공업체 이름으로 API 호출 함수 반환
 * @param {string} name - 제공업체 이름 ('gemini' | 'openai' | 'claude')
 * @returns {Function} API 호출 함수
 */
export function getProvider(name) {
    const provider = providers[name]
    if (!provider) {
        throw new Error(`지원하지 않는 AI 제공업체입니다: ${name}`)
    }
    return provider
}

export { callGeminiAPI, callOpenAIAPI, callClaudeAPI }
