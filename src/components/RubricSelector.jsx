import { useEvaluation } from '../context/EvaluationContext'
import './RubricSelector.css'

function RubricSelector() {
    const { rubrics, currentRubric, selectRubric } = useEvaluation()

    if (rubrics.length === 0) return null

    return (
        <div className="rubric-selector">
            <label className="selector-label">평가 루브릭 선택</label>
            <div className="rubric-options">
                {rubrics.map(rubric => (
                    <button
                        key={rubric.id}
                        className={`rubric-option ${currentRubric?.id === rubric.id ? 'selected' : ''}`}
                        onClick={() => selectRubric(rubric)}
                    >
                        <div className="rubric-option-header">
                            <span className="rubric-option-icon">
                                {currentRubric?.id === rubric.id ? '✓' : '○'}
                            </span>
                            <span className="rubric-option-name">{rubric.name}</span>
                        </div>
                        <div className="rubric-option-meta">
                            {rubric.criteria.length}개 평가 항목
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default RubricSelector
