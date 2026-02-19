import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { loadFromStorage, saveToStorage, hashPassword, verifyPassword, isHashed } from '../services/storage'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    // Default admin password - from env or fallback
    const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

    const [adminPassword, setAdminPassword] = useState(DEFAULT_ADMIN_PASSWORD)
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

    // Load saved admin password on mount
    useEffect(() => {
        const savedAdminPassword = loadFromStorage('adminPassword')
        if (savedAdminPassword) setAdminPassword(savedAdminPassword)
    }, [])

    // Admin authentication (async - supports hash migration)
    const authenticateAdmin = useCallback(async (password) => {
        // 비밀번호가 설정되지 않은 경우 빈 문자열로 통과
        if (!adminPassword && !password) {
            setIsAdminAuthenticated(true)
            return true
        }
        // 해시된 비밀번호 검증
        if (isHashed(adminPassword)) {
            const isValid = await verifyPassword(password, adminPassword)
            if (isValid) {
                setIsAdminAuthenticated(true)
                return true
            }
            return false
        }
        // 평문 비밀번호 마이그레이션: 일치하면 해시로 자동 전환
        if (password === adminPassword) {
            const hashed = await hashPassword(password)
            setAdminPassword(hashed)
            saveToStorage('adminPassword', hashed)
            setIsAdminAuthenticated(true)
            return true
        }
        return false
    }, [adminPassword])

    const setNewAdminPassword = useCallback(async (password) => {
        const hashed = await hashPassword(password)
        setAdminPassword(hashed)
        saveToStorage('adminPassword', hashed)
    }, [])

    const logoutAdmin = useCallback(() => {
        setIsAdminAuthenticated(false)
    }, [])

    const value = useMemo(() => ({
        adminPassword,
        isAdminAuthenticated,
        authenticateAdmin,
        setNewAdminPassword,
        logoutAdmin,
        hasAdminPassword: adminPassword !== ''
    }), [adminPassword, isAdminAuthenticated, authenticateAdmin, setNewAdminPassword, logoutAdmin])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export default AuthContext
