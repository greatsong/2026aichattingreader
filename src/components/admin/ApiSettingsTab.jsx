import ModelSelector from './ModelSelector'

const GEMINI_MODELS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.0-pro-exp-02-05', label: 'Gemini 2.0 Pro Exp' },
]

const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o1-preview', label: 'o1-preview (Reasoning)' },
    { value: 'o3-mini', label: 'o3-mini (Advanced Reasoning)' },
]

const CLAUDE_MODELS = [
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (추천)' },
    { value: 'claude-sonnet-4-6-20250514', label: 'Claude Sonnet 4.6' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
]

/**
 * ApiSettingsTab - AI API 설정 탭
 *
 * Props:
 *   apiSettings      - 전역 API 설정 객체
 *   setApiSettings   - 설정 변경 함수
 *   saveGlobalSettings - 저장 함수
 *   unlockApiWithPin - PIN 잠금 해제 함수
 *   showSaveMessage  - 저장 메시지 표시 함수
 */
function ApiSettingsTab({
    apiSettings,
    setApiSettings,
    saveGlobalSettings,
    unlockApiWithPin,
    showSaveMessage,
}) {
    const handleApiSave = () => {
        saveGlobalSettings(apiSettings)
        showSaveMessage('API 설정이 전 세계(서버 및 로컬)에 저장되었습니다.')
    }

    return (
        <div className="card animate-fadeIn">
            <h2 className="card-title">AI API 설정</h2>
            <p className="card-description">
                평가에 사용할 AI API를 설정하세요. API 키는 브라우저에만 저장됩니다.
            </p>

            {/* AI 제공업체 선택 */}
            <div className="form-group">
                <label htmlFor="provider">사용할 AI 제공업체</label>
                <select
                    id="provider"
                    className="input"
                    value={apiSettings.provider}
                    onChange={(e) =>
                        setApiSettings({ ...apiSettings, provider: e.target.value })
                    }
                >
                    <option value="gemini">
                        Google Gemini {apiSettings.apiKeys?.gemini ? '✅' : '⚠️'}
                    </option>
                    <option value="openai">
                        OpenAI GPT {apiSettings.apiKeys?.openai ? '✅' : '⚠️'}
                    </option>
                    <option value="claude">
                        Anthropic Claude {apiSettings.apiKeys?.claude ? '✅' : '⚠️'}
                    </option>
                </select>
            </div>

            {/* K-Run 평가 신뢰도 설정 */}
            <div className="form-group evaluation-runs-group">
                <label className="section-label">🔄 평가 신뢰도 설정</label>
                <p className="form-hint" style={{ marginBottom: '12px' }}>
                    같은 모델로 여러 번 평가하여 결과를 종합합니다. 횟수가 많을수록
                    신뢰도가 높아지지만 비용도 증가합니다.
                </p>
                <div className="runs-selector">
                    <select
                        value={apiSettings.evaluationRuns || 1}
                        onChange={(e) =>
                            setApiSettings({
                                ...apiSettings,
                                evaluationRuns: parseInt(e.target.value),
                            })
                        }
                        className="input"
                    >
                        <option value={1}>1회 (기본, 빠른 평가)</option>
                        <option value={2}>2회 (평균 종합)</option>
                        <option value={3}>3회 (권장, 신뢰도 ⭐⭐⭐)</option>
                        <option value={5}>5회 (고신뢰도, 비용 5배)</option>
                    </select>
                </div>
                {(apiSettings.evaluationRuns || 1) > 1 && (
                    <p
                        className="form-hint"
                        style={{ marginTop: '8px', color: '#f59e0b' }}
                    >
                        ⚠️ {apiSettings.evaluationRuns}회 평가 = API 비용{' '}
                        {apiSettings.evaluationRuns}배
                    </p>
                )}
            </div>

            <h3 className="api-keys-title">API 키 설정</h3>

            {/* Gemini */}
            <ModelSelector
                provider="gemini"
                apiSettings={apiSettings}
                setApiSettings={setApiSettings}
                label="Google Gemini"
                emoji="🟦"
                borderColor="#e1f5fe"
                apiKeyId="geminiKey"
                apiKeyPlaceholder="AIza..."
                helpUrl="https://aistudio.google.com/apikey"
                helpText="Google AI Studio"
                defaultModels={GEMINI_MODELS}
                customModelPlaceholder="예: gemini-pro-vision"
            />

            {/* OpenAI */}
            <ModelSelector
                provider="openai"
                apiSettings={apiSettings}
                setApiSettings={setApiSettings}
                label="OpenAI GPT"
                emoji="🟩"
                borderColor="#e8f5e9"
                apiKeyId="openaiKey"
                apiKeyPlaceholder="sk-proj-..."
                helpUrl="https://platform.openai.com/api-keys"
                helpText="OpenAI Platform"
                defaultModels={OPENAI_MODELS}
                customModelPlaceholder="예: gpt-3.5-turbo"
            />

            {/* Claude */}
            <ModelSelector
                provider="claude"
                apiSettings={apiSettings}
                setApiSettings={setApiSettings}
                label="Anthropic Claude"
                emoji="🟧"
                borderColor="#fff3e0"
                apiKeyId="claudeKey"
                apiKeyPlaceholder="sk-ant-..."
                helpUrl="https://console.anthropic.com/"
                helpText="Anthropic Console"
                defaultModels={CLAUDE_MODELS}
                customModelPlaceholder="예: claude-2.1"
            />

            {/* PIN 잠금 해제 */}
            <div className="form-group pin-unlock-group">
                <label htmlFor="apiPin">
                    📌 PIN을 입력하면 서버의 API 키로 평가할 수 있습니다
                </label>
                {apiSettings.useServerKeys && (
                    <p style={{ color: '#22c55e', fontWeight: 600, margin: '4px 0 8px' }}>
                        ✅ 서버 API 키가 활성화되어 있습니다
                    </p>
                )}
                <div className="pin-input-wrapper">
                    <input
                        type="password"
                        id="apiPin"
                        className="input pin-input"
                        placeholder="PIN"
                        maxLength={10}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter' && e.target.value.length >= 4) {
                                const success = await unlockApiWithPin(e.target.value)
                                if (success) {
                                    showSaveMessage('서버 API 키가 활성화되었습니다!')
                                    e.target.value = ''
                                } else {
                                    showSaveMessage('PIN이 올바르지 않습니다.')
                                }
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                            const pinInput = document.getElementById('apiPin')
                            if (pinInput.value.length >= 4) {
                                const success = await unlockApiWithPin(pinInput.value)
                                if (success) {
                                    showSaveMessage('서버 API 키가 활성화되었습니다!')
                                    pinInput.value = ''
                                } else {
                                    showSaveMessage('PIN이 올바르지 않습니다.')
                                }
                            }
                        }}
                    >
                        🔓 활성화
                    </button>
                </div>
            </div>

            <button onClick={handleApiSave} className="btn btn-primary">
                설정 저장
            </button>
        </div>
    )
}

export default ApiSettingsTab
