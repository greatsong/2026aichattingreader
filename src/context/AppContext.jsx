/**
 * AppContext - Deprecated compatibility shim
 *
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 * 새 코드에서는 개별 Context를 사용하세요:
 *   - useAuth()       from './AuthContext'
 *   - useAPI()        from './APIContext'
 *   - useEvaluation() from './EvaluationContext'
 */

import { AuthProvider, useAuth } from './AuthContext'
import { APIProvider, useAPI } from './APIContext'
import { EvaluationProvider, useEvaluation } from './EvaluationContext'

// Re-export individual hooks for convenience
export { useAuth } from './AuthContext'
export { useAPI } from './APIContext'
export { useEvaluation } from './EvaluationContext'

/**
 * @deprecated useApp()을 개별 hook으로 대체하세요.
 * - useAuth() : 관리자 인증 관련
 * - useAPI() : API 설정 관련
 * - useEvaluation() : 루브릭/평가 관련
 */
export function useApp() {
    return { ...useAuth(), ...useAPI(), ...useEvaluation() }
}

/**
 * @deprecated AppProvider 대신 개별 Provider를 직접 사용하세요.
 * AuthProvider > APIProvider > EvaluationProvider
 */
export function AppProvider({ children }) {
    return (
        <AuthProvider>
            <APIProvider>
                <EvaluationProvider>
                    {children}
                </EvaluationProvider>
            </APIProvider>
        </AuthProvider>
    )
}
