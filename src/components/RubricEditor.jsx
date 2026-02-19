import { useState } from 'react'
import { useApp } from '../context/AppContext'
import './RubricEditor.css'

function RubricEditor({ rubric, onSave, onCancel }) {
    const { DEFAULT_RUBRIC } = useApp()

    const [name, setName] = useState(rubric?.name || '')
    const [criteria, setCriteria] = useState(
        rubric?.criteria || []
    )
    const [importText, setImportText] = useState('')
    const [showImport, setShowImport] = useState(false)
    const [error, setError] = useState('')

    const addCriterion = () => {
        setCriteria([
            ...criteria,
            {
                id: Date.now().toString(),
                name: '',
                description: '',
                weight: 20,
                levels: [
                    { score: 5, description: '매우 우수' },
                    { score: 3, description: '보통' },
                    { score: 1, description: '미흡' }
                ]
            }
        ])
    }

    const updateCriterion = (index, updates) => {
        setCriteria(prev => prev.map((c, i) =>
            i === index ? { ...c, ...updates } : c
        ))
    }

    const removeCriterion = (index) => {
        setCriteria(prev => prev.filter((_, i) => i !== index))
    }

    const updateLevel = (criterionIndex, levelIndex, updates) => {
        setCriteria(prev => prev.map((c, i) => {
            if (i !== criterionIndex) return c
            return {
                ...c,
                levels: c.levels.map((l, li) =>
                    li === levelIndex ? { ...l, ...updates } : l
                )
            }
        }))
    }

    const addLevel = (criterionIndex) => {
        setCriteria(prev => prev.map((c, i) => {
            if (i !== criterionIndex) return c
            return {
                ...c,
                levels: [...c.levels, { score: 1, description: '' }]
            }
        }))
    }

    const removeLevel = (criterionIndex, levelIndex) => {
        setCriteria(prev => prev.map((c, i) => {
            if (i !== criterionIndex) return c
            return {
                ...c,
                levels: c.levels.filter((_, li) => li !== levelIndex)
            }
        }))
    }

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importText)


            // Format name from title and teacherIntent if available
            let newName = parsed.name || ''
            if (parsed.title) {
                newName = parsed.title
                if (parsed.teacherIntent) {
                    newName = `${newName}(${parsed.teacherIntent})`
                }
            }

            if (newName) setName(newName)
            if (parsed.criteria && Array.isArray(parsed.criteria)) {
                setCriteria(parsed.criteria.map((c, i) => ({
                    id: c.id || Date.now().toString() + i,
                    name: c.name || '',
                    description: c.description || '',
                    weight: c.weight || 20,
                    levels: c.levels || [
                        { score: 5, description: '매우 우수' },
                        { score: 3, description: '보통' },
                        { score: 1, description: '미흡' }
                    ]
                })))
            }
            setShowImport(false)
            setImportText('')
            setError('')
        } catch (err) {
            setError('JSON 형식이 올바르지 않습니다.')
        }
    }

    const loadDefaultTemplate = () => {
        setName(DEFAULT_RUBRIC.name)
        setCriteria(DEFAULT_RUBRIC.criteria.map(c => ({ ...c })))
    }

    const handleSave = () => {
        if (!name.trim()) {
            setError('루브릭 이름을 입력해주세요.')
            return
        }
        if (criteria.length === 0) {
            setError('최소 1개 이상의 평가 항목이 필요합니다.')
            return
        }
        if (criteria.some(c => !c.name.trim())) {
            setError('모든 평가 항목의 이름을 입력해주세요.')
            return
        }

        // Validate total weight = 100
        const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0)
        if (totalWeight !== 100) {
            setError(`가중치 합계가 100이어야 합니다. (현재: ${totalWeight})`)
            return
        }

        onSave({ name, criteria })
    }

    return (
        <div className="rubric-editor card">
            <div className="editor-header">
                <h2>{rubric ? '루브릭 수정' : '새 루브릭 만들기'}</h2>
                <div className="editor-actions-top">
                    <button
                        type="button"
                        onClick={() => setShowImport(!showImport)}
                        className="btn btn-ghost btn-sm"
                    >
                        📥 JSON 불러오기
                    </button>
                    <button
                        type="button"
                        onClick={loadDefaultTemplate}
                        className="btn btn-ghost btn-sm"
                    >
                        📋 기본 템플릿
                    </button>
                </div>
            </div>

            {/* Import Section */}
            {showImport && (
                <div className="import-section">
                    <label>JSON으로 루브릭 불러오기</label>
                    <textarea
                        className="input textarea"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder='{"name": "루브릭 이름", "criteria": [...]}'
                    />
                    <div className="import-actions">
                        <button
                            type="button"
                            onClick={handleImport}
                            className="btn btn-primary btn-sm"
                        >
                            불러오기
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowImport(false)
                                setImportText('')
                            }}
                            className="btn btn-ghost btn-sm"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="editor-error">
                    ⚠️ {error}
                </div>
            )}

            {/* Name Input */}
            <div className="form-group">
                <label htmlFor="rubricName">루브릭 이름</label>
                <input
                    type="text"
                    id="rubricName"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: AI 활용 역량 평가"
                />
            </div>

            {/* Criteria List */}
            <div className="criteria-section">
                <div className="section-header">
                    <h3>평가 항목</h3>
                    <span className="weight-sum">
                        가중치 합계: {criteria.reduce((sum, c) => sum + (c.weight || 0), 0)}%
                        {criteria.reduce((sum, c) => sum + (c.weight || 0), 0) !== 100 && (
                            <span className="weight-warning"> (100% 필요)</span>
                        )}
                    </span>
                </div>

                {criteria.map((criterion, index) => (
                    <div key={criterion.id} className="criterion-card">
                        <div className="criterion-header">
                            <span className="criterion-number">{index + 1}</span>
                            <button
                                type="button"
                                onClick={() => removeCriterion(index)}
                                className="btn btn-ghost btn-sm remove-btn"
                                title="항목 삭제"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="criterion-fields">
                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label>항목명</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={criterion.name}
                                        onChange={(e) => updateCriterion(index, { name: e.target.value })}
                                        placeholder="예: 질문의 명확성"
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>가중치 (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={criterion.weight}
                                        onChange={(e) => updateCriterion(index, { weight: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>설명</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={criterion.description}
                                    onChange={(e) => updateCriterion(index, { description: e.target.value })}
                                    placeholder="예: 프롬프트가 명확하고 구체적인가"
                                />
                            </div>

                            {/* Levels */}
                            <div className="levels-section">
                                <label>평가 수준</label>
                                <div className="levels-list">
                                    {criterion.levels.map((level, levelIndex) => (
                                        <div key={levelIndex} className="level-row">
                                            <input
                                                type="number"
                                                className="input level-score"
                                                value={level.score}
                                                onChange={(e) => updateLevel(index, levelIndex, { score: parseInt(e.target.value) || 0 })}
                                                min="0"
                                                max="5"
                                                title="점수"
                                            />
                                            <input
                                                type="text"
                                                className="input level-description"
                                                value={level.description}
                                                onChange={(e) => updateLevel(index, levelIndex, { description: e.target.value })}
                                                placeholder="수준 설명"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeLevel(index, levelIndex)}
                                                className="btn btn-ghost btn-sm"
                                                disabled={criterion.levels.length <= 1}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addLevel(index)}
                                    className="btn btn-ghost btn-sm add-level-btn"
                                >
                                    + 수준 추가
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addCriterion}
                    className="btn btn-secondary add-criterion-btn"
                >
                    + 평가 항목 추가
                </button>
            </div>

            {/* Actions */}
            <div className="editor-actions">
                <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-primary"
                >
                    저장
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-ghost"
                >
                    취소
                </button>
            </div>
        </div>
    )
}

export default RubricEditor
