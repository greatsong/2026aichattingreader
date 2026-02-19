/**
 * 평가 응답 파싱 모듈
 */
import { calculateGrade } from '../constants'

/**
 * 평가 응답 파싱
 */
export function parseEvaluationResponse(response, rubric) {
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonStr = response

    // ```json ... ``` 형식 처리
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
        jsonStr = jsonMatch[1]
    }

    // 앞뒤 공백 제거
    jsonStr = jsonStr.trim()

    try {
        if (!jsonStr) throw new Error('Empty JSON string')
        const result = JSON.parse(jsonStr)

        // 필수 필드 검증 및 기본값 설정
        return {
            totalScore: result.totalScore || 0,
            grade: result.grade || 'N/A',
            criteriaScores: (result.criteriaScores || []).map((cs) => {
                // Percentage 자동 계산 (AI가 누락할 경우 대비)
                const safeScore = cs.score || 0
                const safeMax = cs.maxScore || 5
                const calculatedPercentage = Math.round((safeScore / safeMax) * 100)

                return {
                    criterionId: cs.criterionId || '',
                    name: cs.name || '',
                    score: safeScore,
                    maxScore: safeMax,
                    percentage: cs.percentage !== undefined ? cs.percentage : calculatedPercentage,
                    evidence: cs.evidence || cs.feedback || '근거가 제공되지 않았습니다.',
                    strengths: cs.strengths || '',
                    weaknesses: cs.weaknesses || '',
                    improvement: cs.improvement || '추가적인 개선 제안이 없습니다.',
                    nextSteps: cs.nextSteps || '',
                    feedback: cs.feedback || ''
                }
            }),
            characteristics: result.characteristics || [],
            qualitativeEvaluation: result.qualitativeEvaluation || '',
            suggestions: result.suggestions || [],
            studentRecordDraft: result.studentRecordDraft || ''
        }
    } catch (error) {
        console.error('JSON 파싱 오류:', error)

        // 파싱 실패 시 기본 응답 생성
        return {
            totalScore: 0,
            grade: 'N/A',
            criteriaScores: rubric.criteria.map(c => ({
                criterionId: c.id,
                name: c.name,
                score: 0,
                maxScore: 5,
                percentage: 0,
                feedback: '평가 결과를 파싱할 수 없습니다.'
            })),
            characteristics: ['평가 결과 파싱 오류'],
            qualitativeEvaluation: `AI 응답을 파싱하는 중 오류가 발생했습니다.\n\n원본 응답:\n${response.substring(0, 500)}...`,
            suggestions: ['다시 평가를 시도해 주세요.'],
            studentRecordDraft: ''
        }
    }
}
