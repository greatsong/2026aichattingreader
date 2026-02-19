/**
 * ScoreOverview - 점수 요약, 학습 모드 배지, K-run 신뢰도, 특징, 하이라이트
 */

function getGradeMessage(grade, totalScore) {
    if (totalScore >= 95) return { emoji: '🌟', message: '탁월한 AI 활용 역량을 보여주었습니다!', description: 'AI와의 소통에서 깊이 있는 사고력을 발휘했어요.' }
    if (totalScore >= 90) return { emoji: '✨', message: '우수한 역량입니다!', description: '비판적 사고와 창의적 활용이 돋보여요.' }
    if (totalScore >= 85) return { emoji: '👏', message: '잘하고 있어요!', description: '몇 가지 부분만 보완하면 더 좋은 결과를 얻을 수 있어요.' }
    if (totalScore >= 80) return { emoji: '👍', message: '양호한 수준이에요.', description: '개선 제안을 참고해서 다음에 도전해보세요.' }
    if (totalScore >= 75) return { emoji: '💡', message: '성장 가능성이 있어요!', description: '아래 피드백을 잘 읽고 하나씩 개선해보세요.' }
    if (totalScore >= 70) return { emoji: '🌱', message: '기초를 다지는 단계예요.', description: 'AI와 대화하는 방법을 연습해보세요.' }
    if (totalScore >= 60) return { emoji: '📚', message: '더 많은 연습이 필요해요.', description: '사용 가이드를 참고하고 다시 시도해보세요.' }
    return { emoji: '🔄', message: '다시 도전해보세요!', description: 'AI와 충분한 대화를 나누고 다시 평가해보세요.' }
}

function ScoreOverview({ result, gradeColors }) {
    const {
        totalScore,
        grade,
        criteriaScores,
        characteristics,
        evaluationMeta
    } = result

    // 가장 잘한 점 / 성장 포인트 계산
    const highlights = (() => {
        if (!criteriaScores || criteriaScores.length === 0) return null
        const sorted = [...criteriaScores].sort((a, b) =>
            (b.score / b.maxScore) - (a.score / a.maxScore)
        )
        return {
            best: sorted[0],
            growth: sorted[sorted.length - 1]
        }
    })()

    return (
        <>
            {/* 종합 점수 + 등급 + 배지 */}
            <div className="score-summary">
                <div className="total-score">
                    <div
                        className="grade-circle"
                        style={{
                            '--grade-color': gradeColors.color,
                            '--grade-glow-color': gradeColors.glow
                        }}
                    >
                        <span className="grade">{grade}</span>
                    </div>
                    <div className="score-info">
                        <div className="score-value">{totalScore}<span className="score-max">/100</span></div>
                        <div className="score-label">종합 점수</div>
                    </div>
                </div>

                {/* 학습 모드 배지 */}
                {result.interactionMode && (
                    <div className={`interaction-badge mode-${result.interactionMode.toLowerCase().replace(/\s+/g, '-')}`}>
                        <span className="badge-icon">
                            {result.interactionMode.includes('Delegation') ? '🔴' :
                                result.interactionMode.includes('Iterative') ? '🟠' :
                                    result.interactionMode.includes('Comprehension') ? '🟢' : '🔵'}
                        </span>
                        <div className="badge-content">
                            <span className="badge-label">학습 모드</span>
                            <span className="badge-value">
                                {result.interactionMode === 'Delegation' && '위임형 (부정적)'}
                                {result.interactionMode === 'Iterative Debugging' && '수동적 디버깅'}
                                {result.interactionMode === 'Generation-then-Comprehension' && '생성 후 이해'}
                                {result.interactionMode === 'Conceptual Inquiry' && '개념적 탐구 (최우수)'}
                                {!['Delegation', 'Iterative Debugging', 'Generation-then-Comprehension', 'Conceptual Inquiry'].includes(result.interactionMode) && result.interactionMode}
                            </span>
                        </div>
                    </div>
                )}

                {/* K-Run 신뢰도 배지 */}
                {evaluationMeta && evaluationMeta.runs > 1 && (
                    <div className="reliability-badge">
                        <span className="reliability-icon">🎯</span>
                        <span className="reliability-text">
                            {evaluationMeta.runs}회 평가 평균 (점수 범위: {evaluationMeta.scoreRange.min}~{evaluationMeta.scoreRange.max})
                        </span>
                    </div>
                )}
            </div>

            {/* 등급별 메시지 */}
            {(() => {
                const gradeMsg = getGradeMessage(grade, totalScore)
                return (
                    <div className={`grade-message-card grade-${grade.replace('+', 'plus').toLowerCase()}`}>
                        <span className="grade-message-emoji">{gradeMsg.emoji}</span>
                        <div className="grade-message-content">
                            <strong>{gradeMsg.message}</strong>
                            <p>{gradeMsg.description}</p>
                        </div>
                    </div>
                )
            })()}

            {/* 주요 특징 */}
            <div className="characteristics card">
                <h3>✨ 주요 특징 (Overview)</h3>
                <ul className="characteristic-list">
                    {characteristics.map((char, index) => (
                        <li key={index}>{char}</li>
                    ))}
                </ul>
            </div>

            {/* 가장 잘한 점 & 성장 포인트 */}
            {highlights && (
                <div className="highlight-sections">
                    <div className="highlight-card best-point">
                        <div className="highlight-icon">✅</div>
                        <div className="highlight-content">
                            <h4>가장 잘한 점</h4>
                            <p className="highlight-title">
                                {highlights.best.name} ({highlights.best.score}/{highlights.best.maxScore})
                            </p>
                            <p className="highlight-text">
                                {highlights.best.details?.strengths?.[0]
                                    || (highlights.best.details?.evidence ? highlights.best.details.evidence.slice(0, 80) + '...' : null)
                                    || '우수한 성취를 보였습니다.'}
                            </p>
                        </div>
                    </div>

                    <div className="highlight-card growth-point">
                        <div className="highlight-icon">💡</div>
                        <div className="highlight-content">
                            <h4>성장 포인트</h4>
                            <p className="highlight-title">
                                {highlights.growth.name} ({highlights.growth.score}/{highlights.growth.maxScore})
                            </p>
                            <p className="highlight-text">
                                {highlights.growth.details?.improvements?.[0]
                                    || highlights.growth.details?.tip
                                    || '조금 더 노력하면 크게 성장할 수 있습니다.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ScoreOverview
