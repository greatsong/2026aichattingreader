import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import '../EvaluationResult.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function getTrendMessage(scores) {
    if (!scores || scores.length < 2) return null

    const latest = scores[scores.length - 1]
    const previous = scores[scores.length - 2]
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const maxScore = Math.max(...scores)

    if (scores.length === 2) {
        if (latest > previous) return { icon: '📈', message: '다시 상승세예요! 이 흐름을 유지해보세요.', type: 'positive' }
        if (latest < previous) return { icon: '🌱', message: '점수가 내려갔지만 괜찮아요. 피드백을 확인하고 다시 도전해보세요!', type: 'neutral' }
        return { icon: '🎯', message: '안정적인 수준을 유지하고 있어요. 한 단계 도약을 시도해볼까요?', type: 'neutral' }
    }

    // 3+ scores
    const last3 = scores.slice(-3)
    const isConsistentlyImproving = last3.every((s, i) => i === 0 || s >= last3[i - 1])
    const isFlat = last3.every((s, i) => i === 0 || Math.abs(s - last3[i - 1]) <= 2)

    if (isConsistentlyImproving && !isFlat) {
        return { icon: '🚀', message: '꾸준히 성장하고 있어요! 지금처럼 계속해보세요.', type: 'positive' }
    }

    if (latest === maxScore) {
        return { icon: '🏆', message: '최고 점수를 달성했어요! 대단한 발전입니다.', type: 'positive' }
    }

    if (latest > previous && !isConsistentlyImproving) {
        return { icon: '📈', message: '다시 상승세예요! 이 흐름을 유지해보세요.', type: 'positive' }
    }

    if (isFlat) {
        return { icon: '🎯', message: '안정적인 수준을 유지하고 있어요. 한 단계 도약을 시도해볼까요?', type: 'neutral' }
    }

    if (latest < previous && latest >= avg) {
        return { icon: '💪', message: '조금 주춤했지만 평균 이상이에요. 힘내세요!', type: 'neutral' }
    }

    if (latest < previous) {
        return { icon: '🌱', message: '점수가 내려갔지만 괜찮아요. 피드백을 확인하고 다시 도전해보세요!', type: 'neutral' }
    }

    return null
}

function GrowthChart({ history, onClear }) {
    if (!history || history.length === 0) {
        return (
            <div className="growth-chart card">
                <h3>📈 성장 추적</h3>
                <p className="empty-state-text">아직 평가 기록이 없습니다. 평가를 완료하면 여기에 성장 그래프가 표시됩니다.</p>
            </div>
        )
    }

    // Reverse for chronological order (history is newest-first)
    const chronological = [...history].reverse()

    const labels = chronological.map(h => {
        const d = new Date(h.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
    })

    const scores = chronological.map(h => h.totalScore)

    // Stats
    const maxScore = Math.max(...scores)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const lastChange = scores.length >= 2
        ? scores[scores.length - 1] - scores[scores.length - 2]
        : 0

    const trendMessage = getTrendMessage(scores)

    const data = {
        labels,
        datasets: [{
            label: '종합 점수',
            data: scores,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#6366f1'
        }]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => {
                        const idx = items[0].dataIndex
                        return chronological[idx].rubricName
                    },
                    label: (item) => `점수: ${item.raw}점`
                }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: { stepSize: 20 }
            }
        }
    }

    return (
        <div className="growth-chart card">
            <div className="growth-chart-header">
                <h3>📈 성장 추적</h3>
                <div className="growth-chart-actions">
                    <span className="growth-count">{history.length}회 평가</span>
                    {onClear && (
                        <button onClick={onClear} className="btn btn-ghost btn-sm">
                            기록 삭제
                        </button>
                    )}
                </div>
            </div>

            {history.length === 1 ? (
                <div className="growth-single">
                    <p>첫 번째 평가: <strong>{history[0].totalScore}점</strong> ({history[0].grade})</p>
                    <p className="growth-hint">더 많이 평가하면 성장 그래프를 볼 수 있어요!</p>
                </div>
            ) : (
                <>
                    <div className="growth-chart-container">
                        <Line data={data} options={options} />
                    </div>
                    <div className="growth-stats">
                        <div className="growth-stat">
                            <span className="stat-label">최고점</span>
                            <span className="stat-value">{maxScore}점</span>
                        </div>
                        <div className="growth-stat">
                            <span className="stat-label">평균</span>
                            <span className="stat-value">{avgScore}점</span>
                        </div>
                        <div className="growth-stat">
                            <span className="stat-label">최근 변화</span>
                            <span className={`stat-value ${lastChange > 0 ? 'positive' : lastChange < 0 ? 'negative' : ''}`}>
                                {lastChange > 0 ? '+' : ''}{lastChange}점
                            </span>
                        </div>
                    </div>
                    {trendMessage && (
                        <div className={`growth-insight ${trendMessage.type}`}>
                            <span className="insight-icon">{trendMessage.icon}</span>
                            <p className="insight-text">{trendMessage.message}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default GrowthChart
