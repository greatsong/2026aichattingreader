import { createContext, useContext, useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../services/storage'

const AppContext = createContext()

// Default rubric template
const DEFAULT_RUBRIC = {
    id: 'default',
    name: 'AI 활용 역량 평가 (기본)',
    criteria: [
        {
            id: 'clarity',
            name: '질문의 명확성',
            description: '프롬프트가 명확하고 구체적인가',
            weight: 20,
            levels: [
                { score: 5, description: '매우 명확하고 구체적이며 맥락 정보가 충분함' },
                { score: 4, description: '대체로 명확하고 이해 가능함' },
                { score: 3, description: '기본적인 의도는 파악 가능하나 모호한 부분 있음' },
                { score: 2, description: '불분명하여 해석이 필요함' },
                { score: 1, description: '매우 모호하고 불분명함' }
            ]
        },
        {
            id: 'iteration',
            name: '반복적 개선',
            description: 'AI 응답을 바탕으로 질문을 개선하고 발전시켰는가',
            weight: 25,
            levels: [
                { score: 5, description: '응답을 분석하고 체계적으로 질문을 발전시킴' },
                { score: 4, description: '응답을 참고하여 후속 질문을 개선함' },
                { score: 3, description: '일부 개선 시도가 있음' },
                { score: 2, description: '개선 시도가 미흡함' },
                { score: 1, description: '반복적 개선이 없음' }
            ]
        },
        {
            id: 'critical',
            name: '비판적 사고',
            description: 'AI 응답을 비판적으로 검토하고 검증했는가',
            weight: 25,
            levels: [
                { score: 5, description: 'AI 응답의 한계를 인식하고 검증/수정함' },
                { score: 4, description: '응답의 정확성을 확인하려는 시도가 있음' },
                { score: 3, description: '일부 의문을 제기함' },
                { score: 2, description: '대부분 무비판적으로 수용' },
                { score: 1, description: '전혀 검증하지 않음' }
            ]
        },
        {
            id: 'application',
            name: '실제 적용',
            description: 'AI의 도움을 실제 문제 해결에 효과적으로 적용했는가',
            weight: 30,
            levels: [
                { score: 5, description: '창의적이고 효과적으로 문제를 해결함' },
                { score: 4, description: '문제 해결에 잘 활용함' },
                { score: 3, description: '어느 정도 활용함' },
                { score: 2, description: '활용이 미흡함' },
                { score: 1, description: '실제 적용이 없음' }
            ]
        }
    ]
}

export function AppProvider({ children }) {
    // Default admin password - from env or fallback
    const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

    // Secret PIN for API key auto-fill
    const SECRET_API_PIN = import.meta.env.VITE_SECRET_API_PIN || ''
    const PRESET_API_KEYS = {
        gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
        claude: import.meta.env.VITE_CLAUDE_API_KEY || '',
        openai: import.meta.env.VITE_OPENAI_API_KEY || ''
    }

    const [rubrics, setRubrics] = useState([])
    const [currentRubric, setCurrentRubric] = useState(null)
    // Store separate API keys for each provider
    const [apiSettings, setApiSettings] = useState({
        provider: 'gemini', // Reverted to 'gemini' as default based on user feedback
        apiKeys: {
            gemini: '',
            openai: '',
            claude: ''
        },
        model: ''
    })
    const [adminPassword, setAdminPassword] = useState(DEFAULT_ADMIN_PASSWORD)
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
    const [evaluationResult, setEvaluationResult] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Load local settings on mount, then fetch Global settings
    useEffect(() => {
        const initSettings = async () => {
            // 1. Load Local
            const savedRubrics = loadFromStorage('rubrics')
            const savedApiSettings = loadFromStorage('apiSettings')
            const savedAdminPassword = loadFromStorage('adminPassword')
            const savedCurrentRubricId = loadFromStorage('currentRubricId')

            if (savedRubrics && savedRubrics.length > 0) {
                setRubrics(savedRubrics)
            } else {
                setRubrics([DEFAULT_RUBRIC])
                saveToStorage('rubrics', [DEFAULT_RUBRIC])
            }

            let initialSettings = savedApiSettings || {
                provider: 'gemini',
                apiKeys: { gemini: '', openai: '', claude: '' },
                models: {
                    gemini: 'gemini-2.0-flash',
                    openai: 'gpt-4o',
                    claude: 'claude-3-5-sonnet-20240620'
                }
            }

            // Migration: Ensure models object exists
            if (!initialSettings.models) {
                initialSettings.models = {
                    gemini: initialSettings.ensembleModels?.gemini || 'gemini-2.0-flash',
                    openai: initialSettings.ensembleModels?.openai || 'gpt-4o',
                    claude: initialSettings.ensembleModels?.claude || 'claude-3-5-sonnet-20240620'
                }
                // If there was a single model selected for the current provider, preserve it
                if (initialSettings.model && initialSettings.provider !== 'ensemble') {
                    initialSettings.models[initialSettings.provider] = initialSettings.model
                }
            }

            // Migration
            if (!initialSettings.apiKeys) {
                initialSettings.apiKeys = {
                    gemini: initialSettings.apiKey || '',
                    openai: '',
                    claude: ''
                }
            }

            setApiSettings(initialSettings)

            if (savedAdminPassword) setAdminPassword(savedAdminPassword)
            if (savedCurrentRubricId) {
                const rubric = (savedRubrics || [DEFAULT_RUBRIC]).find(r => r.id === savedCurrentRubricId)
                if (rubric) setCurrentRubric(rubric)
            }

            // 2. Fetch Global Settings from Server (Admin's Truth)
            try {
                const res = await fetch('/api/config')
                if (res.ok) {
                    const globalConfig = await res.json()
                    // If global config provides specific provider/model/ensemble policies, use them.
                    // But keep local API Keys if user has them.
                    if (globalConfig.provider) {
                        setApiSettings(prev => ({
                            ...prev,
                            // Override structural settings
                            provider: globalConfig.provider,
                            model: globalConfig.model,
                            allowEnsemble: globalConfig.allowEnsemble,
                            ensembleModels: globalConfig.ensembleModels,
                            // KEEP local keys unless global has them (e.g. server keys?) 
                            // Actually, typically we DO NOT sync keys to client for security, 
                            // so we trust local key or fallback to server proxy.
                            apiKeys: prev.apiKeys
                        }))
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch global config:', err)
            }
        }
        initSettings()
    }, [])

    // Save rubrics when changed
    useEffect(() => {
        if (rubrics.length > 0) {
            saveToStorage('rubrics', rubrics)
        }
    }, [rubrics])

    // Save API settings when changed
    useEffect(() => {
        if (apiSettings.apiKey) {
            saveToStorage('apiSettings', apiSettings)
        }
    }, [apiSettings])

    // Set current rubric and save
    const selectRubric = (rubric) => {
        setCurrentRubric(rubric)
        saveToStorage('currentRubricId', rubric.id)
    }

    // Add new rubric
    const addRubric = (rubric) => {
        const newRubric = {
            ...rubric,
            id: Date.now().toString()
        }
        setRubrics(prev => [...prev, newRubric])
        return newRubric
    }

    // Update rubric
    const updateRubric = (id, updates) => {
        setRubrics(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
        if (currentRubric?.id === id) {
            setCurrentRubric(prev => ({ ...prev, ...updates }))
        }
    }

    // Delete rubric
    const deleteRubric = (id) => {
        setRubrics(prev => prev.filter(r => r.id !== id))
        if (currentRubric?.id === id) {
            setCurrentRubric(null)
            saveToStorage('currentRubricId', null)
        }
    }

    // Admin authentication
    const authenticateAdmin = (password) => {
        if (password === adminPassword) {
            setIsAdminAuthenticated(true)
            return true
        }
        return false
    }

    const setNewAdminPassword = (password) => {
        setAdminPassword(password)
        saveToStorage('adminPassword', password)
    }

    const logoutAdmin = () => {
        setIsAdminAuthenticated(false)
    }

    // Unlock all API keys with secret PIN
    const unlockApiWithPin = (pin) => {
        if (pin === SECRET_API_PIN) {
            const newSettings = {
                ...apiSettings,
                apiKeys: { ...PRESET_API_KEYS }
            }
            setApiSettings(newSettings)
            saveToStorage('apiSettings', newSettings)
            return true
        }
        return false
    }

    const value = {
        // Rubrics
        rubrics,
        currentRubric,
        selectRubric,
        addRubric,
        updateRubric,
        deleteRubric,
        DEFAULT_RUBRIC,

        // API Settings
        apiSettings,
        setApiSettings: (settings) => {
            setApiSettings(settings)
            saveToStorage('apiSettings', settings)
        },
        saveGlobalSettings: async (settings) => {
            // Save to Local
            setApiSettings(settings)
            saveToStorage('apiSettings', settings)
            // Save to Server (Global)
            try {
                await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings })
                })
            } catch (e) {
                console.error('Failed to save global config', e)
            }
        },
        unlockApiWithPin,

        // Admin
        isAdminAuthenticated,
        authenticateAdmin,
        setNewAdminPassword,
        logoutAdmin,
        hasAdminPassword: adminPassword !== '',

        // Evaluation
        evaluationResult,
        setEvaluationResult,
        isLoading,
        setIsLoading
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within AppProvider')
    }
    return context
}

export default AppContext
