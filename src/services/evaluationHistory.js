/**
 * 평가 히스토리 관리 (localStorage 기반)
 */
import { loadFromStorage, saveToStorage } from './storage'

const HISTORY_KEY = 'evaluationHistory'
const MAX_HISTORY = 50

/**
 * 평가 결과를 히스토리에 저장
 */
export function saveEvaluationToHistory(result, rubricName) {
    const history = getEvaluationHistory()

    const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        rubricName,
        totalScore: result.totalScore,
        grade: result.grade,
        criteriaScores: result.criteriaScores.map(cs => ({
            name: cs.name,
            score: cs.score,
            maxScore: cs.maxScore,
            percentage: cs.percentage
        }))
    }

    history.unshift(entry) // newest first

    // Limit to MAX_HISTORY
    if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY
    }

    saveToStorage(HISTORY_KEY, history)
    return entry
}

/**
 * 전체 히스토리 반환
 */
export function getEvaluationHistory() {
    return loadFromStorage(HISTORY_KEY) || []
}

/**
 * 히스토리 전체 삭제
 */
export function clearEvaluationHistory() {
    saveToStorage(HISTORY_KEY, [])
}
