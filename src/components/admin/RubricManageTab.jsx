/**
 * RubricManageTab - 평가 루브릭 관리 탭
 *
 * Props:
 *   rubrics     - 루브릭 배열
 *   onEdit      - 수정 클릭 콜백 (rubric) => void
 *   onDelete    - 삭제 클릭 콜백 (id) => void
 *   onCreateNew - 새 루브릭 생성 클릭 콜백 () => void
 */
function RubricManageTab({ rubrics, onEdit, onDelete, onCreateNew, onCreateFromTemplate }) {
    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <h2>평가 루브릭</h2>
                <button onClick={onCreateNew} className="btn btn-primary">
                    + 새 루브릭
                </button>
                {onCreateFromTemplate && (
                    <button onClick={onCreateFromTemplate} className="btn btn-secondary">
                        📚 템플릿에서 만들기
                    </button>
                )}
            </div>

            <div className="rubric-list">
                {rubrics.map((rubric) => (
                    <div key={rubric.id} className="rubric-card card">
                        <div className="rubric-info">
                            <h3>{rubric.name}</h3>
                            <p>{rubric.criteria.length}개 평가 항목</p>
                            <div className="rubric-criteria-preview">
                                {rubric.criteria.slice(0, 3).map((c) => (
                                    <span key={c.id} className="badge badge-primary">
                                        {c.name}
                                    </span>
                                ))}
                                {rubric.criteria.length > 3 && (
                                    <span className="badge">
                                        +{rubric.criteria.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="rubric-actions">
                            <button
                                onClick={() => onEdit(rubric)}
                                className="btn btn-secondary btn-sm"
                            >
                                수정
                            </button>
                            <button
                                onClick={() => onDelete(rubric.id)}
                                className="btn btn-ghost btn-sm"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                ))}

                {rubrics.length === 0 && (
                    <div className="empty-state">
                        <p>등록된 루브릭이 없습니다.</p>
                        <button onClick={onCreateNew} className="btn btn-primary">
                            첫 루브릭 만들기
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RubricManageTab
