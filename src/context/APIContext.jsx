import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { loadFromStorage, saveToStorage } from '../services/storage'

const APIContext = createContext()

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

            setApiSettingsState(initialSettings)

            // 2. Fetch Global Settings from Server (Admin's Truth)
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

    // PIN으로 서버 키 사용 권한 획득 (API 키가 클라이언트에 전송되지 않음)
    const unlockApiWithPin = useCallback(async (pin) => {
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unlock', pin })
            })
            const data = await res.json()
            if (data.unlocked) {
                const newSettings = {
                    ...apiSettings,
                    useServerSide: true,
                    serverKeysUnlocked: true
                }
                setApiSettingsState(newSettings)
                saveToStorage('apiSettings', newSettings)
                return true
            }
            return false
        } catch {
            return false
        }
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
