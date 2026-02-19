import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ChatInput from '../components/ChatInput'
import EvaluationResult from '../components/EvaluationResult'
import RubricSelector from '../components/RubricSelector'
import StudentGuide from '../components/StudentGuide'
import { evaluateChat } from '../services/evaluator'
import './Home.css'

function Home() {
    const {
        currentRubric,
        apiSettings,
        evaluationResult,
        setEvaluationResult,
        isLoading,
        setIsLoading,
        rubrics
    } = useApp()

    const [chatContent, setChatContent] = useState('')
    const [error, setError] = useState('')
    const [step, setStep] = useState(1) // 1: 입력, 2: 결과
    const [loadingMessage, setLoadingMessage] = useState('')

    // Cycle loading messages
    useEffect(() => {
        if (!isLoading) return

        setLoadingMessage('채팅 기록을 읽어오는 중입니다... (Reading)')

        const timers = []

        timers.push(setTimeout(() => {
            setLoadingMessage('AI가 내용을 심층 분석 중입니다... (Analyzing)')
        }, 2000))

        timers.push(setTimeout(() => {
            setLoadingMessage('평가 보고서를 작성하고 있습니다... (Writing)')
        }, 8000))

        timers.push(setTimeout(() => {
            setLoadingMessage('마무리 정리 중입니다... (Finalizing)')
        }, 20000))

        return () => timers.forEach(clearTimeout)
    }, [isLoading])

    const handleChatSubmit = async (content, reflection) => {
        setChatContent(content)
        setError('')

        // Validate requirements
        if (!content.trim()) {
            setError('채팅 내용을 입력해주세요.')
            return
        }

        if (!currentRubric) {
            setError('평가 루브릭을 선택해주세요.')
            return
        }

        // API Key check removed - fallback to server proxy

        setIsLoading(true)

        try {
            const result = await evaluateChat({
                chatContent: content,
                reflection,
                rubric: currentRubric,
                apiSettings: {
                    ...apiSettings,
                    useServerSide: !apiSettings.apiKey
                }
            })

            setEvaluationResult(result)
            setStep(2)
        } catch (err) {
            console.error('Evaluation error:', err)
            setError(err.message || '평가 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        setChatContent('')
        setEvaluationResult(null)
        setError('')
        setStep(1)
    }

    const isReady = !!currentRubric

    return (
        <div className="home">
            <div className="container">
                {/* Hero Section */}
                <section className="hero">
                    <h1 className="hero-title">
                        <span className="gradient-text">AI 채팅 기록</span>을 평가하세요
                    </h1>
                    <p className="hero-subtitle">
                        ChatGPT, Claude, Gemini 등 AI 채팅 기록을 루브릭 기반으로 분석하여
                        <br />정량/정성적 피드백을 제공합니다.
                    </p>
                </section>

                {/* Status Indicators */}
                <div className="status-bar">
                    <div className={`status-item ${currentRubric ? 'active' : ''}`}>
                        <span className="status-icon">{currentRubric ? '✓' : '○'}</span>
                        <span className="status-text">
                            {currentRubric ? `루브릭: ${currentRubric.name}` : '루브릭 미선택'}
                        </span>
                    </div>
                    <div className="status-item active">
                        <span className="status-icon">✓</span>
                        <span className="status-text">
                            {apiSettings.apiKey
                                ? `API: ${apiSettings.provider.toUpperCase()} (사용자 지정)`
                                : `API: ${apiSettings.provider.toUpperCase()} (기본 내장)`}
                        </span>
                    </div>
                </div>

                {/* Student Guide */}
                <StudentGuide />

                {/* Rubric Selector */}
                {rubrics.length > 0 && (
                    <RubricSelector />
                )}

                {/* Error Display */}
                {error && (
                    <div className="error-message animate-slideUp">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}


                {/* Main Content */}
                {step === 1 && (
                    <div className="input-section animate-fadeIn">
                        <ChatInput
                            onSubmit={handleChatSubmit}
                            isLoading={isLoading}
                            disabled={!isReady}
                        />

                        {!isReady && (
                            <div className="setup-notice">
                                <p>평가를 시작하려면 먼저 설정이 필요합니다:</p>
                                <ul>
                                    {!currentRubric && <li>평가에 사용할 루브릭을 선택해주세요</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && evaluationResult && (
                    <div className="result-section animate-slideUp">
                        <EvaluationResult
                            result={evaluationResult}
                            rubric={currentRubric}
                            onReset={handleReset}
                            apiSettings={{
                                provider: apiSettings.provider === 'ensemble' ? 'ensemble' : apiSettings.provider,
                                models: apiSettings.models
                            }}
                        />
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <div className="spinner"></div>
                            <p className="loading-text">{loadingMessage}</p>
                            <p className="loading-hint">약 10-30초 정도 소요됩니다</p>
                        </div>
                    </div>
                )}

                {/* Privacy Notice */}
                <section className="privacy-notice">
                    <div className="privacy-icon">🔒</div>
                    <div className="privacy-content">
                        <strong>개인정보 보호</strong>
                        <p>입력하신 채팅 내용은 서버에 저장되지 않습니다. 평가는 실시간으로 처리되며, 페이지를 닫으면 모든 데이터가 삭제됩니다.</p>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Home
