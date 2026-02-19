import { useState } from 'react'
import './SelfEvaluation.css'

/**
 * SelfEvaluation - 학생 자기 평가 컴포넌트
 *
 * AI 평가 전에 학생이 스스로 자신의 AI 채팅 활용을 평가하는 단계.
 * 선택적이며, 결과는 AI 평가와 나란히 비교하여 메타인지 향상에 도움.
 */
function SelfEvaluation({ rubric, onComplete, onSkip }) {
    const [selfScores, setSelfScores] = useState(
        rubric.criteria.map(c => ({
            criterionId: c.id,
            name: c.name,
            score: 0, // 0 = not rated yet
            maxScore: Math.max(...c.levels.map(l => l.score)),
            reason: ''
        }))
    )

    const updateScore = (index, score) => {
        setSelfScores(prev => prev.map((s, i) =>
            i === index ? { ...s, score } : s
        ))
    }

    const updateReason = (index, reason) => {
        setSelfScores(prev => prev.map((s, i) =>
            i === index ? { ...s, reason } : s
        ))
    }

    const allRated = selfScores.every(s => s.score > 0)

    const handleSubmit = () => {
        onComplete(selfScores)
    }

    return (
        <div className="self-evaluation card">
            <div className="self-eval-header">
                <div>
                    <h3>🪞 자기 평가</h3>
                    <p className="self-eval-desc">
                        AI 평가 전에 스스로 채팅 활용을 돌아봅니다.
                        AI 평가와 비교하면 메타인지 향상에 도움이 됩니다.
                    </p>
                </div>
                <button onClick={onSkip} className="btn btn-ghost btn-sm">
                    건너뛰기 →
                </button>
            </div>

            <div className="self-eval-criteria">
                {rubric.criteria.map((criterion, index) => (
                    <div key={criterion.id} className="self-eval-criterion">
                        <div className="criterion-info">
                            <h4>{criterion.name}</h4>
                            <p className="criterion-desc">{criterion.description}</p>
                        </div>

                        <div className="score-buttons">
                            {criterion.levels
                                .sort((a, b) => a.score - b.score)
                                .map(level => (
                                    <button
                                        key={level.score}
                                        type="button"
                                        className={`score-btn ${selfScores[index].score === level.score ? 'selected' : ''}`}
                                        onClick={() => updateScore(index, level.score)}
                                        title={level.description}
                                    >
                                        <span className="score-num">{level.score}</span>
                                        <span className="score-desc">{level.description}</span>
                                    </button>
                                ))
                            }
                        </div>

                        <div className="reason-input">
                            <input
                                type="text"
                                className="input"
                                value={selfScores[index].reason}
                                onChange={(e) => updateReason(index, e.target.value)}
                                placeholder="왜 이 점수를 줬나요? (선택)"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="self-eval-actions">
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    disabled={!allRated}
                >
                    {allRated ? '자기 평가 완료 → AI 평가 시작' : `${selfScores.filter(s => s.score > 0).length}/${selfScores.length} 항목 평가됨`}
                </button>
                <button
                    type="button"
                    onClick={onSkip}
                    className="btn btn-ghost"
                >
                    건너뛰고 바로 평가
                </button>
            </div>
        </div>
    )
}

export default SelfEvaluation
