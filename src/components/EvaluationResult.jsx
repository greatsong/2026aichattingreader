import { useState, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import './EvaluationResult.css'

// Register Chart.js components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
)

function EvaluationResult({ result, rubric, onReset, apiSettings }) {
    const [studentId, setStudentId] = useState('')
    const [studentName, setStudentName] = useState('')
    const resultsRef = useRef(null)

    if (!result) return null

    // Helper to get descriptive model name
    const getModelDisplay = () => {
        if (!apiSettings) return 'N/A'
        const { provider, models = {} } = apiSettings
        if (provider === 'ensemble') return 'Ensemble (Triple AI)'
        const modelName = models[provider] || 'Default'
        return `${provider.toUpperCase()}: ${modelName} `
    }

    const {
        totalScore,
        grade,
        criteriaScores,
        characteristics,
        qualitativeEvaluation,
        suggestions,
        studentRecordDraft,
        evaluationMeta // K-run metadata
    } = result

    const getGradeColor = (grade) => {
        switch (grade) {
            case 'A+':
            case 'A': return { color: 'var(--color-success-500)', glow: 'rgba(16, 185, 129, 0.3)' }
            case 'B+':
            case 'B': return { color: 'var(--color-primary-500)', glow: 'rgba(99, 102, 241, 0.3)' }
            case 'C+':
            case 'C': return { color: 'var(--color-warning-500)', glow: 'rgba(245, 158, 11, 0.3)' }
            default: return { color: 'var(--color-error-500)', glow: 'rgba(239, 68, 68, 0.3)' }
        }
    }

    const getScoreBarWidth = (score, maxScore = 5) => {
        return `${(score / maxScore) * 100}% `
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        alert('클립보드에 복사되었습니다!')
    }

    const downloadReport = async () => {
        try {
            // 1. Element to capture
            const element = resultsRef.current
            if (!element) {
                console.error('Evaluation result element not found for PDF generation.')
                return
            }

            // 2. Add class to apply PDF-specific styles (hide buttons, fix width)
            document.body.classList.add('is-pdf-rendering')

            // 3. Generate filename
            const fileNameParts = ['AI채팅평가']
            const firstId = studentId.split(/[,\s]/)[0]
            const firstName = studentName.split(/[,\s]/)[0]
            if (firstId) fileNameParts.push(firstId)
            if (firstName) fileNameParts.push(firstName)
            fileNameParts.push(new Date().toISOString().slice(0, 10))

            const opt = {
                margin: 10,
                filename: `${fileNameParts.join('_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    scrollY: 0,
                    windowWidth: 794,
                    width: 794,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            }

            // 4. Wait for styles to apply
            await new Promise(resolve => setTimeout(resolve, 500))

            // 5. Generate and Save
            await html2pdf().set(opt).from(element).save()

        } catch (err) {
            console.error('PDF generation failed:', err)
            alert(`PDF 생성 실패: ${err.message} `)
        } finally {
            // 6. Cleanup
            document.body.classList.remove('is-pdf-rendering')
        }
    }

    const gradeColors = getGradeColor(grade)

    return (
        <div className="evaluation-result" ref={resultsRef}>
            {/* 1. PDF Summary Page (Page 1) */}
            <div className="pdf-summary-page">
                {/* PDF Only Header - Visible only during generation */}
                <div className="pdf-only-header">
                    <h1>AI 채팅 평가 보고서</h1>
                    <div className="pdf-info-row">
                        <div className="pdf-student-info">
                            <div className="pdf-info-group">
                                <span className="info-label">학번</span>
                                <span className="info-value">{studentId || '-'}</span>
                            </div>
                            <div className="pdf-info-group">
                                <span className="info-label">이름</span>
                                <span className="info-value">{studentName || '-'}</span>
                            </div>
                            <div className="pdf-info-group">
                                <span className="info-label">평가 도우미</span>
                                <span className="info-value">{getModelDisplay()}</span>
                            </div>
                        </div>
                        <div className="pdf-date">
                            발급일시: {new Date().toLocaleString('ko-KR')}
                        </div>
                    </div>
                </div>

                {/* Header (Web Only) */}
                <div className="result-header">
                    <h2>📊 평가 결과</h2>
                    <div className="result-actions">
                        <button onClick={downloadReport} className="btn btn-secondary btn-sm">
                            📥 다운로드
                        </button>
                        <button onClick={onReset} className="btn btn-ghost btn-sm">
                            🔄 다시 평가
                        </button>
                    </div>
                </div>

                {/* Student Info (Optional - Web Only) */}
                <div className="student-info-input card">
                    <h3>👤 학생 정보 (선택)</h3>
                    <p className="info-hint">
                        다운로드할 파일에 포함됩니다. 서버에 저장되지 않습니다.
                    </p>
                    <div className="student-info-fields">
                        <div className="form-group">
                            <label htmlFor="studentId">학번</label>
                            <input
                                type="text"
                                id="studentId"
                                className="input"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                placeholder="예: 20101"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="studentName">이름</label>
                            <input
                                type="text"
                                id="studentName"
                                className="input"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="예: 홍길동"
                            />
                        </div>
                    </div>
                </div>

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

                    {/* Interaction Mode Badge */}
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

                    {/* K-Run Reliability Badge */}
                    {evaluationMeta && evaluationMeta.runs > 1 && (
                        <div className="reliability-badge">
                            <span className="reliability-icon">🎯</span>
                            <span className="reliability-text">
                                {evaluationMeta.runs}회 평가 평균 (점수 범위: {evaluationMeta.scoreRange.min}~{evaluationMeta.scoreRange.max})
                            </span>
                        </div>
                    )}
                </div>

                {/* Characteristics - Follows score summary */}
                <div className="characteristics card">
                    <h3>✨ 주요 특징 (Overview)</h3>
                    <ul className="characteristic-list">
                        {characteristics.map((char, index) => (
                            <li key={index}>{char}</li>
                        ))}
                    </ul>
                </div>

                {/* Radar Chart - Skill Distribution */}
                {criteriaScores && criteriaScores.length >= 3 && (
                    <div className="radar-chart-section card">
                        <h3>🕸️ 역량 분포도</h3>
                        <div className="radar-chart-container">
                            <Radar
                                data={{
                                    labels: criteriaScores.map(c => c.name.length > 8 ? c.name.slice(0, 8) + '...' : c.name),
                                    datasets: [{
                                        label: '역량 점수 (%)',
                                        data: criteriaScores.map(c => (c.score / c.maxScore) * 100),
                                        backgroundColor: 'rgba(121, 80, 242, 0.2)',
                                        borderColor: 'rgba(121, 80, 242, 1)',
                                        borderWidth: 2,
                                        pointBackgroundColor: 'rgba(121, 80, 242, 1)',
                                        pointBorderColor: '#fff',
                                        pointHoverBackgroundColor: '#fff',
                                        pointHoverBorderColor: 'rgba(121, 80, 242, 1)'
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    scales: {
                                        r: {
                                            beginAtZero: true,
                                            max: 100,
                                            ticks: {
                                                stepSize: 20,
                                                font: { size: 10 }
                                            },
                                            pointLabels: {
                                                font: { size: 11, weight: 'bold' }
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => `${context.raw.toFixed(0)}%`
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Highlight Sections: Best & Growth Points */}
                {criteriaScores && criteriaScores.length > 0 && (() => {
                    const sortedByScore = [...criteriaScores].sort((a, b) =>
                        (b.score / b.maxScore) - (a.score / a.maxScore)
                    )
                    const bestCriteria = sortedByScore[0]
                    const growthCriteria = sortedByScore[sortedByScore.length - 1]

                    return (
                        <div className="highlight-sections">
                            {/* Best Point */}
                            <div className="highlight-card best-point">
                                <div className="highlight-icon">✅</div>
                                <div className="highlight-content">
                                    <h4>가장 잘한 점</h4>
                                    <p className="highlight-title">
                                        {bestCriteria.name} ({bestCriteria.score}/{bestCriteria.maxScore})
                                    </p>
                                    <p className="highlight-text">
                                        {bestCriteria.details?.strengths?.[0]
                                            || (bestCriteria.details?.evidence ? bestCriteria.details.evidence.slice(0, 80) + '...' : null)
                                            || '우수한 성취를 보였습니다.'}
                                    </p>
                                </div>
                            </div>

                            {/* Growth Point */}
                            <div className="highlight-card growth-point">
                                <div className="highlight-icon">💡</div>
                                <div className="highlight-content">
                                    <h4>성장 포인트</h4>
                                    <p className="highlight-title">
                                        {growthCriteria.name} ({growthCriteria.score}/{growthCriteria.maxScore})
                                    </p>
                                    <p className="highlight-text">
                                        {growthCriteria.details?.improvements?.[0]
                                            || growthCriteria.details?.tip
                                            || '조금 더 노력하면 크게 성장할 수 있습니다.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>

            {/* Guaranteed Page Break for html2pdf */}
            <div className="html2pdf__page-break"></div>

            {/* 2. Detailed Evaluation Sections (Page 2+) */}
            <div className="pdf-details-page">
                {/* Criteria Scores */}
                <div className="criteria-scores card">
                    <h3>📋 항목별 평가</h3>
                    <div className="score-bars">
                        {criteriaScores.map((cs, index) => (
                            <div key={index} className="score-bar-item">
                                <div className="score-bar-header">
                                    <span className="score-bar-name">{cs.name}</span>
                                    <span className="score-bar-value">
                                        {cs.score} / {cs.maxScore} ({cs.percentage}%)
                                    </span>
                                </div>
                                <div className="score-bar-track">
                                    <div
                                        className="score-bar-fill"
                                        style={{ width: getScoreBarWidth(cs.score, cs.maxScore) }}
                                    />
                                </div>

                                {/* Detailed Feedback */}
                                <div className="score-detail">
                                    {cs.evidence && (
                                        <div className="detail-item evidence">
                                            <span className="detail-label">📌 평가 근거</span>
                                            <p>{cs.evidence}</p>
                                        </div>
                                    )}
                                    {cs.strengths && (
                                        <div className="detail-item strengths">
                                            <span className="detail-label">✅ 잘한 점</span>
                                            <p>{cs.strengths}</p>
                                        </div>
                                    )}
                                    {cs.weaknesses && (
                                        <div className="detail-item weaknesses">
                                            <span className="detail-label">⚠️ 미흡한 점</span>
                                            <p>{cs.weaknesses}</p>
                                        </div>
                                    )}
                                    {cs.improvement && (
                                        <div className="detail-item improvement">
                                            <span className="detail-label">💡 개선 팁</span>
                                            <p>{cs.improvement}</p>
                                        </div>
                                    )}
                                    {/* Fallback to old feedback field */}
                                    {!cs.evidence && cs.feedback && (
                                        <p className="score-bar-feedback">{cs.feedback}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Qualitative Evaluation */}
                <div className="qualitative card">
                    <h3>📝 정성적 평가</h3>
                    <div className="qualitative-content">
                        {qualitativeEvaluation}
                    </div>
                </div>

                {/* Suggestions */}
                <div className="suggestions card">
                    <h3>💡 개선 제안</h3>
                    <ul className="suggestion-list">
                        {suggestions.map((sugg, index) => (
                            <li key={index}>{sugg}</li>
                        ))}
                    </ul>
                </div>

                {/* Student Record Draft */}
                {studentRecordDraft && (
                    <div className="student-record card">
                        <div className="record-header">
                            <h3>📄 프로젝트 과정 기록에 대한 평가(초안)</h3>
                            <button
                                onClick={() => copyToClipboard(studentRecordDraft)}
                                className="btn btn-secondary btn-sm"
                            >
                                📋 복사
                            </button>
                        </div>
                        <div className="record-content">
                            {studentRecordDraft}
                        </div>
                        <p className="record-notice">
                            ⚠️ 이 초안은 참고용이며, 실제 생활기록부 작성 시 교사의 검토와 수정이 필요합니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EvaluationResult
