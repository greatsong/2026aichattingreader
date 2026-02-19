import { useState } from 'react'
import './StudentGuide.css'

function StudentGuide() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeSection, setActiveSection] = useState(null)

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section)
    }

    const sections = [
        {
            id: 'purpose',
            icon: '🎯',
            title: '이 시스템은 왜 만들어졌나요?',
            content: (
                <>
                    <p className="guide-intro">
                        이 시스템은 <strong>여러분의 "성장 과정"을 평가</strong>하기 위해 만들어졌습니다.
                    </p>
                    <div className="guide-highlight">
                        <p>기존 프로젝트 평가의 문제점:</p>
                        <ul>
                            <li>결과물만 보면 누가 열심히 고민했는지 알 수 없음</li>
                            <li>AI가 다 해준 건지, 본인이 노력한 건지 구분 불가</li>
                            <li>시행착오와 성장의 흔적이 사라짐</li>
                        </ul>
                    </div>
                    <p>
                        AI와의 채팅 기록은 여러분이 <strong>어떤 질문을 했고, 어떻게 개선했고,
                            무엇을 비판적으로 검토했는지</strong> 보여주는 "성장의 증거"입니다.
                    </p>
                    <div className="guide-tip">
                        <span className="tip-icon">💡</span>
                        <p>이 평가는 "AI를 얼마나 잘 썼는가"가 아니라 <strong>"AI와 함께 얼마나 깊이 고민했는가"</strong>를 봅니다.</p>
                    </div>
                </>
            )
        },
        {
            id: 'how-to-ai',
            icon: '💬',
            title: 'AI와 효과적으로 대화하는 방법',
            content: (
                <>
                    <p className="guide-intro">
                        AI와의 대화도 "기술"입니다. 좋은 질문이 좋은 답변을 이끌어냅니다.
                    </p>

                    <h4>🔹 1단계: 명확하게 질문하기</h4>
                    <div className="guide-compare">
                        <div className="compare-bad">
                            <span className="compare-label">❌ 모호한 질문</span>
                            <p>"환경오염에 대해 알려줘"</p>
                        </div>
                        <div className="compare-good">
                            <span className="compare-label">✅ 구체적인 질문</span>
                            <p>"고등학생이 일상에서 실천할 수 있는 플라스틱 사용 줄이기 방법 5가지를 예시와 함께 알려줘"</p>
                        </div>
                    </div>

                    <h4>🔹 2단계: 반복적으로 개선하기</h4>
                    <p>첫 답변이 마음에 들지 않으면 <strong>더 구체적인 조건</strong>을 추가해서 다시 물어보세요:</p>
                    <ul>
                        <li>"좀 더 쉽게 설명해줘"</li>
                        <li>"고등학생 수준에 맞게 다시 작성해줘"</li>
                        <li>"이 부분을 예시를 들어 설명해줘"</li>
                        <li>"3문장으로 요약해줘"</li>
                    </ul>

                    <h4>🔹 3단계: 비판적으로 검토하기</h4>
                    <div className="guide-warning">
                        <span className="warning-icon">⚠️</span>
                        <p><strong>AI는 틀릴 수 있습니다!</strong> 특히 숫자, 날짜, 인용문은 반드시 확인하세요.</p>
                    </div>
                    <p>검증하는 방법:</p>
                    <ul>
                        <li>"이 정보의 출처가 뭐야?"라고 물어보기</li>
                        <li>인터넷 검색으로 사실 확인하기</li>
                        <li>"혹시 이게 틀렸을 가능성이 있어?"라고 물어보기</li>
                    </ul>

                    <h4>🔹 4단계: 나만의 것으로 만들기</h4>
                    <p>AI의 답변을 <strong>그대로 복사하지 마세요</strong>. 대신:</p>
                    <ul>
                        <li>내 프로젝트 상황에 맞게 수정하기</li>
                        <li>내 말투로 다시 쓰기</li>
                        <li>부족한 부분은 내가 직접 채우기</li>
                    </ul>
                </>
            )
        },
        {
            id: 'extract',
            icon: '📋',
            title: '채팅 기록 추출하는 방법',
            content: (
                <>
                    <p className="guide-intro">
                        각 AI 서비스에서 채팅 기록을 복사하는 방법입니다.
                    </p>

                    <div className="extract-guide">
                        <h4>🤖 ChatGPT</h4>
                        <ol>
                            <li>채팅 화면에서 <strong>전체 대화 내용 선택</strong> (Ctrl+A 또는 Cmd+A)</li>
                            <li><strong>복사</strong> (Ctrl+C 또는 Cmd+C)</li>
                            <li>이 사이트의 입력창에 <strong>붙여넣기</strong></li>
                        </ol>
                        <div className="guide-tip small">
                            <span className="tip-icon">💡</span>
                            <p>또는 채팅 화면 우측 상단의 공유 버튼 → "Copy Link"로 링크를 복사할 수도 있어요!</p>
                        </div>
                    </div>

                    <div className="extract-guide">
                        <h4>🧠 Claude</h4>
                        <ol>
                            <li>채팅 화면에서 <strong>전체 선택</strong> (Ctrl+A 또는 Cmd+A)</li>
                            <li><strong>복사</strong>하여 입력창에 <strong>붙여넣기</strong></li>
                        </ol>
                    </div>

                    <div className="extract-guide">
                        <h4>✨ Gemini</h4>
                        <ol>
                            <li>채팅 화면에서 <strong>전체 선택 후 복사</strong></li>
                            <li>입력창에 <strong>붙여넣기</strong></li>
                        </ol>
                    </div>

                    <div className="guide-warning">
                        <span className="warning-icon">📝</span>
                        <p>가능하면 <strong>처음부터 끝까지 전체 대화</strong>를 복사해주세요. 일부만 있으면 정확한 평가가 어려워요.</p>
                    </div>
                </>
            )
        },
        {
            id: 'rubric',
            icon: '📊',
            title: '평가 기준(루브릭) 이해하기',
            content: (
                <>
                    <p className="guide-intro">
                        기본 루브릭은 4가지 영역에서 여러분의 AI 활용 역량을 평가합니다.
                    </p>

                    <div className="rubric-card">
                        <div className="rubric-header">
                            <span className="rubric-weight">20%</span>
                            <h4>질문의 명확성</h4>
                        </div>
                        <p>프롬프트가 명확하고 구체적인가?</p>
                        <div className="rubric-scale">
                            <span className="scale-high">5점: 매우 명확하고 맥락 정보 충분</span>
                            <span className="scale-low">1점: 매우 모호하고 불분명</span>
                        </div>
                    </div>

                    <div className="rubric-card">
                        <div className="rubric-header">
                            <span className="rubric-weight">25%</span>
                            <h4>반복적 개선</h4>
                        </div>
                        <p>AI 응답을 바탕으로 질문을 발전시켰는가?</p>
                        <div className="rubric-scale">
                            <span className="scale-high">5점: 체계적으로 질문을 발전시킴</span>
                            <span className="scale-low">1점: 개선 시도 없음</span>
                        </div>
                    </div>

                    <div className="rubric-card">
                        <div className="rubric-header">
                            <span className="rubric-weight">25%</span>
                            <h4>비판적 사고</h4>
                        </div>
                        <p>AI 응답을 비판적으로 검토하고 검증했는가?</p>
                        <div className="rubric-scale">
                            <span className="scale-high">5점: AI 한계 인식하고 검증/수정</span>
                            <span className="scale-low">1점: 전혀 검증하지 않음</span>
                        </div>
                    </div>

                    <div className="rubric-card">
                        <div className="rubric-header">
                            <span className="rubric-weight">30%</span>
                            <h4>실제 적용</h4>
                        </div>
                        <p>AI의 도움을 실제 문제 해결에 효과적으로 적용했는가?</p>
                        <div className="rubric-scale">
                            <span className="scale-high">5점: 창의적으로 문제 해결</span>
                            <span className="scale-low">1점: 실제 적용 없음</span>
                        </div>
                    </div>

                    <div className="guide-tip">
                        <span className="tip-icon">💡</span>
                        <p>선생님이 다른 루브릭을 설정하셨다면 그 기준으로 평가됩니다. 평가 전에 어떤 루브릭이 적용되는지 확인하세요!</p>
                    </div>
                </>
            )
        },
        {
            id: 'usage',
            icon: '🚀',
            title: '평가 결과 활용하는 방법',
            content: (
                <>
                    <p className="guide-intro">
                        평가 보고서는 <strong>점수를 받기 위한 것이 아니라 성장을 위한 도구</strong>입니다.
                    </p>

                    <h4>📌 자기 성찰용으로 활용하기</h4>
                    <ul>
                        <li><strong>강점 확인</strong>: "내가 잘한 부분이 뭐지?" → 계속 유지하기</li>
                        <li><strong>개선점 파악</strong>: "어느 영역이 부족하지?" → 다음에 집중하기</li>
                        <li><strong>구체적 피드백 읽기</strong>: AI가 제시한 "개선 제안"을 참고하기</li>
                    </ul>

                    <h4>📌 선생님과의 피드백 대화에 활용하기</h4>
                    <div className="usage-scenario">
                        <p className="scenario-title">중간/기말 프로젝트 평가 시:</p>
                        <ol>
                            <li>평가 보고서를 <strong>PDF로 다운로드</strong>하거나 화면을 캡처</li>
                            <li>선생님께 보고서를 보여드리며 <strong>대화 시작</strong></li>
                            <li>AI 평가에서 지적된 부분에 대해 <strong>본인의 생각 설명</strong></li>
                            <li>선생님의 추가 피드백을 받고 <strong>다음 목표 설정</strong></li>
                        </ol>
                    </div>

                    <div className="guide-highlight">
                        <p><strong>💬 대화 예시:</strong></p>
                        <p className="quote">"AI 평가에서 '비판적 사고' 점수가 낮게 나왔는데, 사실 제가 AI 답변을 검증하려고 구글에서 따로 검색은 했거든요. 근데 채팅에는 그 과정이 안 남아서..."</p>
                        <p>→ 이렇게 <strong>보이지 않는 노력</strong>을 선생님께 직접 설명할 수 있어요!</p>
                    </div>

                    <h4>📌 성장 추적하기</h4>
                    <p>여러 번 평가를 받으면서 <strong>점수 변화</strong>를 관찰해보세요:</p>
                    <ul>
                        <li>첫 번째 프로젝트: "질문의 명확성" 3점</li>
                        <li>두 번째 프로젝트: "질문의 명확성" 4점 ✨</li>
                        <li>→ 성장의 증거!</li>
                    </ul>

                    <div className="guide-tip">
                        <span className="tip-icon">🎯</span>
                        <p>평가 결과가 낮아도 괜찮아요. 중요한 건 <strong>"다음에 어떻게 개선할까?"</strong>를 고민하는 것입니다.</p>
                    </div>
                </>
            )
        }
    ]

    return (
        <div className="student-guide">
            <button
                className={`guide-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="toggle-icon">📚</span>
                <span className="toggle-text">사용 가이드</span>
                <span className={`toggle-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="guide-panel">
                    <div className="guide-header">
                        <h2>🎓 AI 채팅 평가 시스템 사용 가이드</h2>
                        <p>고등학생을 위한 완벽 가이드</p>
                    </div>

                    <div className="guide-sections">
                        {sections.map((section) => (
                            <div key={section.id} className="guide-section">
                                <button
                                    className={`section-header ${activeSection === section.id ? 'active' : ''}`}
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <span className="section-icon">{section.icon}</span>
                                    <span className="section-title">{section.title}</span>
                                    <span className={`section-arrow ${activeSection === section.id ? 'open' : ''}`}>
                                        ▶
                                    </span>
                                </button>
                                {activeSection === section.id && (
                                    <div className="section-content">
                                        {section.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="guide-footer">
                        <p>궁금한 점이 있으면 선생님께 문의하세요! 🙋‍♂️</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StudentGuide
