import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { loadFromStorage, saveToStorage } from '../services/storage'

const APIContext = createContext()

const ENV_API_KEYS = {
    gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    claude: import.meta.env.VITE_CLAUDE_API_KEY || ''
}
const SECRET_API_PIN = import.meta.env.VITE_SECRET_API_PIN || ''

export function APIProvider({ children }) {
    const [apiSettings, setApiSettingsState] = useState({
        provider: 'gemini',
        apiKeys: {
            gemini: '',
            openai: '',
            claude: ''
        },
        model: ''
    })

    // Load local settings on mount, then fetch global settings
    useEffect(() => {
        const initSettings = async () => {
            // 1. Load Local
            const savedApiSettings = loadFromStorage('apiSettings')

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

            // Migration: Ensure apiKeys object exists
            if (!initialSettings.apiKeys) {
                initialSettings.apiKeys = {
                    gemini: initialSettings.apiKey || '',
                    openai: '',
                    claude: ''
                }
            }

            // env에 API 키가 있으면 빈 키를 env 값으로 채움
            const keys = initialSettings.apiKeys
            if (!keys.gemini && ENV_API_KEYS.gemini) keys.gemini = ENV_API_KEYS.gemini
            if (!keys.openai && ENV_API_KEYS.openai) keys.openai = ENV_API_KEYS.openai
            if (!keys.claude && ENV_API_KEYS.claude) keys.claude = ENV_API_KEYS.claude

            setApiSettingsState(initialSettings)

            // 2. Fetch Global Settings from Server (only in production with server API)
            if (import.meta.env.PROD) {
                try {
                    const res = await fetch('/api/config')
                    if (res.ok) {
                        const globalConfig = await res.json()
                        if (globalConfig.provider) {
                            setApiSettingsState(prev => ({
                                ...prev,
                                provider: globalConfig.provider,
                                model: globalConfig.model,
                                allowEnsemble: globalConfig.allowEnsemble,
                                ensembleModels: globalConfig.ensembleModels,
                                apiKeys: prev.apiKeys
                            }))
                        }
                    }
                } catch (err) {
                    console.warn('Failed to fetch global config:', err)
                }
            }
        }
        initSettings()
    }, [])

    // Save API settings when changed
    useEffect(() => {
        if (apiSettings.provider) {
            saveToStorage('apiSettings', apiSettings)
        }
    }, [apiSettings])

    const setApiSettings = useCallback((settings) => {
        setApiSettingsState(settings)
        saveToStorage('apiSettings', settings)
    }, [])

    const saveGlobalSettings = useCallback(async (settings) => {
        // Save to Local
        setApiSettingsState(settings)
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
    }, [])

    // PIN으로 환경변수 API 키 잠금 해제
    const unlockApiWithPin = useCallback((pin) => {
        if (pin === SECRET_API_PIN && SECRET_API_PIN) {
            const newSettings = {
                ...apiSettings,
                apiKeys: { ...ENV_API_KEYS }
            }
            setApiSettingsState(newSettings)
            saveToStorage('apiSettings', newSettings)
            return true
        }
        return false
    }, [apiSettings])

    const value = useMemo(() => ({
        apiSettings,
        setApiSettings,
        saveGlobalSettings,
        unlockApiWithPin
    }), [apiSettings, setApiSettings, saveGlobalSettings, unlockApiWithPin])

    return (
        <APIContext.Provider value={value}>
            {children}
        </APIContext.Provider>
    )
}

export function useAPI() {
    const context = useContext(APIContext)
    if (!context) {
        throw new Error('useAPI must be used within APIProvider')
    }
    return context
}

export default APIContext
