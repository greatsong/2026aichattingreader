export interface RubricLevel {
    score: number
    description: string
}

export interface RubricCriterion {
    id: string
    name: string
    description: string
    weight: number
    levels: RubricLevel[]
    // AI Tuning Instructions (New in v2)
    tuning_instructions?: string[]
}

export interface Rubric {
    id: string
    meta: {
        title: string
        teacherIntent: string
        targetGrade: string
        version: number
    }
    criteria: RubricCriterion[]
    // Optional custom system prompt for the evaluator
    evaluation_system_prompt?: string
}

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

export interface EvaluationResult {
    grade: string
    totalScore: number
    overallFeedback: string
    criteriaScores: {
        criterionId: string
        score: number
        maxScore: number
        evidence?: string
        reasoning?: string
        feedback: string
    }[]
}

export interface SimulationState {
    chatLog: ChatMessage[]
    report: EvaluationResult | null
    isSimulating: boolean
}

export interface EvaluationLog {
    id: string
    timestamp: string

    // Context snapshot
    rubricVersion: number
    rubricSnapshot: Rubric // Deep copy of the rubric at that time

    // Input
    chatContent: ChatMessage[]

    // Output
    evaluationResult: EvaluationResult

    // AI Reasoning (The "Why") - Optional for now
    coachReasoning?: string

    // Teacher Feedback (RLHF)
    teacherRating?: 'good' | 'bad'
    teacherComment?: string
}
