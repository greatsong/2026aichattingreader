/**
 * LocalStorage 유틸리티
 * 모든 데이터는 클라이언트에만 저장되며 서버로 전송되지 않습니다.
 */

const STORAGE_PREFIX = 'ai-chat-eval-'

/**
 * LocalStorage에서 데이터 로드
 */
export function loadFromStorage(key) {
    try {
        const item = localStorage.getItem(STORAGE_PREFIX + key)
        if (item === null) return null
        return JSON.parse(item)
    } catch (error) {
        console.error(`Error loading ${key} from storage:`, error)
        return null
    }
}

/**
 * LocalStorage에 데이터 저장
 */
export function saveToStorage(key, data) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
        return true
    } catch (error) {
        console.error(`Error saving ${key} to storage:`, error)
        return false
    }
}

/**
 * LocalStorage에서 데이터 삭제
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(STORAGE_PREFIX + key)
        return true
    } catch (error) {
        console.error(`Error removing ${key} from storage:`, error)
        return false
    }
}

/**
 * 모든 앱 데이터 초기화
 */
export function clearAllStorage() {
    try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key)
            }
        })
        return true
    } catch (error) {
        console.error('Error clearing storage:', error)
        return false
    }
}

/**
 * API 키 안전한 저장 (간단한 인코딩)
 * 주의: 이것은 보안용이 아니라 단순히 평문 노출 방지용입니다.
 */
export function encodeApiKey(apiKey) {
    if (!apiKey) return ''
    return btoa(apiKey)
}

export function decodeApiKey(encoded) {
    if (!encoded) return ''
    try {
        return atob(encoded)
    } catch {
        return encoded
    }
}

/**
 * SHA-256 비밀번호 해싱 (Web Crypto API)
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 해시된 비밀번호 검증
 */
export async function verifyPassword(password, storedHash) {
    const hash = await hashPassword(password)
    return hash === storedHash
}

/**
 * 저장된 값이 SHA-256 해시인지 확인 (64자 hex)
 */
export function isHashed(value) {
    return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}
