import { create } from 'zustand'
import { Rubric, SimulationState, EvaluationLog } from '../types'

interface RubricStore {
    // Rubric State
    rubrics: Rubric[]
    activeRubricId: string | null

    // Actions
    addRubric: (rubric: Rubric) => void
    setActiveRubric: (id: string) => void
    updateRubric: (id: string, updates: Partial<Rubric>) => void
    deleteRubric: (id: string) => void

    // Legacy support (computed via hook/selector usually, but here we'll use a getter helper if possible, or just force components to find it)
    getActiveRubric: () => Rubric | undefined
    updateCriterion: (rubricId: string, criterionId: string, updates: Partial<Rubric['criteria'][0]>) => void

    // App Mode State
    mode: 'learning' | 'evaluation' | 'deployment' | 'management'
    setMode: (mode: 'learning' | 'evaluation' | 'deployment' | 'management') => void

    // Simulation State
    simulation: SimulationState
    setSimulation: (simulation: Partial<SimulationState>) => void
    addChatMessage: (role: 'user' | 'assistant', content: string) => void
    resetSimulation: () => void

    // History
    history: EvaluationLog[]
    saveLog: (log: Omit<EvaluationLog, 'id' | 'timestamp'>) => void
}

// Initial Default Rubric
const defaultRubric: Rubric = {
    id: "default-creative-problem-solving",
    meta: {
        title: "창의적 문제 해결 프로젝트",
        teacherIntent: "과정 중심 평가",
        targetGrade: "High School",
        version: 1
    },
    criteria: [
        {
            id: "critical_thinking",
            name: "비판적 사고",
            description: "AI의 응답을 그대로 수용하지 않고 검증하려 노력했는가?",
            weight: 30,
            levels: [
                { score: 5, description: "적극적으로 오류를 검증하고 비판적 질문을 던짐" },
                { score: 3, description: "일부 내용에 의문을 제기함" },
                { score: 1, description: "무비판적으로 수용함" }
            ],
            tuning_instructions: [
                "LLM의 환각을 지적하면 높은 점수 부여"
            ]
        },
        {
            id: "problem_solving",
            name: "문제 해결력",
            description: "AI를 도구로 활용하여 실질적인 문제를 해결했는가?",
            weight: 70,
            levels: [
                { score: 5, description: "AI 제안을 바탕으로 창의적 해결책 도출" },
                { score: 3, description: "AI 제안을 그대로 적용" },
                { score: 1, description: "문제 해결 실패" }
            ]
        }
    ]
}

export const useRubricStore = create<RubricStore>((set, get) => ({
    rubrics: [defaultRubric],
    activeRubricId: defaultRubric.id,

    addRubric: (rubric) => set((state) => ({
        rubrics: [...state.rubrics, rubric],
        activeRubricId: rubric.id // Auto-select new rubric? Maybe optional.
    })),

    setActiveRubric: (id) => set({ activeRubricId: id }),

    updateRubric: (id, updates) => set((state) => ({
        rubrics: state.rubrics.map(r => r.id === id ? { ...r, ...updates } : r)
    })),

    deleteRubric: (id) => set((state) => ({
        rubrics: state.rubrics.filter(r => r.id !== id),
        activeRubricId: state.activeRubricId === id ? (state.rubrics.find(r => r.id !== id)?.id || null) : state.activeRubricId
    })),

    getActiveRubric: () => {
        const state = get()
        return state.rubrics.find(r => r.id === state.activeRubricId)
    },

    updateCriterion: (rubricId, criterionId, updates) => set((state) => ({
        rubrics: state.rubrics.map(r => {
            if (r.id !== rubricId) return r;
            return {
                ...r,
                criteria: r.criteria.map(c =>
                    c.id === criterionId ? { ...c, ...updates } : c
                )
            }
        })
    })),

    mode: 'evaluation',
    setMode: (mode) => set({ mode }),

    simulation: {
        chatLog: [],
        report: null,
        isSimulating: false
    },
    setSimulation: (updates) => set((state) => ({
        simulation: { ...state.simulation, ...updates }
    })),
    addChatMessage: (role, content) => set((state) => ({
        simulation: {
            ...state.simulation,
            chatLog: [
                ...state.simulation.chatLog,
                {
                    id: Date.now().toString(),
                    role,
                    content,
                    timestamp: new Date().toISOString()
                }
            ]
        }
    })),
    resetSimulation: () => set((state) => ({
        simulation: {
            chatLog: [],
            report: null,
            isSimulating: false
        }
    })),

    history: [],
    saveLog: (logData) => set((state) => ({
        history: [
            {
                ...logData,
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString()
            },
            ...state.history
        ]
    }))
}))
