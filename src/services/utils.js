/**
 * 공통 유틸리티 함수
 */

/**
 * 타임아웃이 적용된 fetch 래퍼
 * @param {string} url - 요청 URL
 * @param {RequestInit} options - fetch 옵션
 * @param {number} timeoutMs - 타임아웃 (밀리초, 기본 30초)
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options, timeoutMs = 30000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        })
        return response
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`API 요청 시간 초과 (${timeoutMs / 1000}초). 네트워크를 확인하거나 다시 시도해주세요.`)
        }
        throw error
    } finally {
        clearTimeout(timeoutId)
    }
}
