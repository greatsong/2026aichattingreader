/**
 * RadarChart - Chart.js 레이더 차트 (역량 분포도)
 */
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

// Chart.js 컴포넌트 등록
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
)

function getRadarInsight(criteriaScores) {
    const percentages = criteriaScores.map(c => (c.score / c.maxScore) * 100)
    const max = Math.max(...percentages)
    const min = Math.min(...percentages)
    const range = max - min
    const avgPct = percentages.reduce((a, b) => a + b, 0) / percentages.length

    const bestIdx = percentages.indexOf(max)
    const weakIdx = percentages.indexOf(min)
    const bestName = criteriaScores[bestIdx].name
    const weakName = criteriaScores[weakIdx].name

    if (range <= 15) {
        return `전체적으로 균형 잡힌 역량을 보여주고 있어요. (평균 ${Math.round(avgPct)}%)`
    }
    return `'${bestName}'이(가) 가장 강하고, '${weakName}'에 더 집중하면 균형 잡힌 성장이 가능해요.`
}

function RadarChart({ criteriaScores }) {
    if (!criteriaScores || criteriaScores.length < 3) return null

    const data = {
        labels: criteriaScores.map(c =>
            c.name.length > 8 ? c.name.slice(0, 8) + '...' : c.name
        ),
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
    }

    const options = {
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
    }

    return (
        <div className="radar-chart-section card">
            <h3>🕸️ 역량 분포도</h3>
            <div className="radar-chart-container">
                <Radar data={data} options={options} />
            </div>
            <p className="radar-insight">{getRadarInsight(criteriaScores)}</p>
        </div>
    )
}

export default RadarChart
