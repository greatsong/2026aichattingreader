import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { loadFromStorage, saveToStorage } from '../services/storage'

const EvaluationContext = createContext()

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

export function EvaluationProvider({ children }) {
    const [rubrics, setRubrics] = useState([])
    const [currentRubric, setCurrentRubric] = useState(null)
    const [evaluationResult, setEvaluationResult] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    // Load rubrics on mount
    useEffect(() => {
        const savedRubrics = loadFromStorage('rubrics')
        const savedCurrentRubricId = loadFromStorage('currentRubricId')

        if (savedRubrics && savedRubrics.length > 0) {
            setRubrics(savedRubrics)
        } else {
            setRubrics([DEFAULT_RUBRIC])
            saveToStorage('rubrics', [DEFAULT_RUBRIC])
        }

        if (savedCurrentRubricId) {
            const rubric = (savedRubrics || [DEFAULT_RUBRIC]).find(r => r.id === savedCurrentRubricId)
            if (rubric) setCurrentRubric(rubric)
        }
    }, [])

    // Save rubrics when changed
    useEffect(() => {
        if (rubrics.length > 0) {
            saveToStorage('rubrics', rubrics)
        }
    }, [rubrics])

    // Set current rubric and save
    const selectRubric = useCallback((rubric) => {
        setCurrentRubric(rubric)
        saveToStorage('currentRubricId', rubric.id)
    }, [])

    // Add new rubric
    const addRubric = useCallback((rubric) => {
        const newRubric = {
            ...rubric,
            id: Date.now().toString()
        }
        setRubrics(prev => [...prev, newRubric])
        return newRubric
    }, [])

    // Update rubric
    const updateRubric = useCallback((id, updates) => {
        setRubrics(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
        setCurrentRubric(prev => {
            if (prev?.id === id) {
                return { ...prev, ...updates }
            }
            return prev
        })
    }, [])

    // Delete rubric
    const deleteRubric = useCallback((id) => {
        setRubrics(prev => prev.filter(r => r.id !== id))
        setCurrentRubric(prev => {
            if (prev?.id === id) {
                saveToStorage('currentRubricId', null)
                return null
            }
            return prev
        })
    }, [])

    const value = useMemo(() => ({
        rubrics,
        currentRubric,
        selectRubric,
        addRubric,
        updateRubric,
        deleteRubric,
        DEFAULT_RUBRIC,
        evaluationResult,
        setEvaluationResult,
        isLoading,
        setIsLoading
    }), [rubrics, currentRubric, selectRubric, addRubric, updateRubric, deleteRubric, evaluationResult, isLoading])

    return (
        <EvaluationContext.Provider value={value}>
            {children}
        </EvaluationContext.Provider>
    )
}

export function useEvaluation() {
    const context = useContext(EvaluationContext)
    if (!context) {
        throw new Error('useEvaluation must be used within EvaluationProvider')
    }
    return context
}

export default EvaluationContext
