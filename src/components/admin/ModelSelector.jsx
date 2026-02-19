/**
 * ModelSelector - AI 제공업체별 API 키 입력 + 모델 선택 컴포넌트
 *
 * Props:
 *   provider        - 'gemini' | 'openai' | 'claude'
 *   apiSettings     - 전역 API 설정 객체
 *   setApiSettings  - 설정 변경 함수
 *   label           - 표시 이름 (예: "Google Gemini")
 *   emoji           - 아이콘 이모지 (예: "🟦")
 *   borderColor     - 모델 선택 영역 왼쪽 테두리 색상
 *   apiKeyId        - input id (예: "geminiKey")
 *   apiKeyPlaceholder - API 키 플레이스홀더 (예: "AIza...")
 *   helpUrl         - API 키 발급 링크
 *   helpText        - 발급처 이름 (예: "Google AI Studio")
 *   defaultModels   - [{value, label}, ...] 드롭다운 기본 옵션 목록
 *   customModelPlaceholder - 직접 입력 시 플레이스홀더 (예: "예: gemini-pro-vision")
 */
function ModelSelector({
    provider,
    apiSettings,
    setApiSettings,
    label,
    emoji,
    borderColor,
    apiKeyId,
    apiKeyPlaceholder,
    helpUrl,
    helpText,
    defaultModels,
    customModelPlaceholder,
}) {
    const currentModel = apiSettings.models?.[provider] || defaultModels[0]?.value
    const defaultValues = defaultModels.map((m) => m.value)
    const isCustomModel =
        currentModel &&
        !defaultValues.includes(currentModel) &&
        currentModel !== 'custom'

    // 드롭다운 value: 사용자 지정 모델이면 그 값 그대로, 아니면 currentModel
    const selectValue = isCustomModel ? currentModel : currentModel

    const updateApiKey = (value) => {
        setApiSettings({
            ...apiSettings,
            apiKeys: { ...apiSettings.apiKeys, [provider]: value },
        })
    }

    const updateModel = (value) => {
        setApiSettings({
            ...apiSettings,
            models: { ...apiSettings.models, [provider]: value },
        })
    }

    return (
        <div className="form-group api-key-group">
            <label htmlFor={apiKeyId}>
                {emoji} {label}
                {apiSettings.apiKeys?.[provider] && (
                    <span className="key-status">✅ 설정됨</span>
                )}
            </label>
            <input
                type="password"
                id={apiKeyId}
                className="input"
                value={apiSettings.apiKeys?.[provider] || ''}
                onChange={(e) => updateApiKey(e.target.value)}
                placeholder={apiKeyPlaceholder}
            />
            <span className="form-hint">
                <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    {helpText}
                </a>
                에서 발급
            </span>

            {/* 모델 선택 */}
            <div
                className="model-select-group"
                style={{
                    marginTop: '12px',
                    paddingLeft: '8px',
                    borderLeft: `3px solid ${borderColor}`,
                }}
            >
                <label
                    className="sub-label"
                    style={{ fontSize: '0.9em', color: '#666' }}
                >
                    🔹 사용할 모델:
                </label>
                <div className="combo-box">
                    <select
                        className="input model-select"
                        value={selectValue}
                        onChange={(e) => updateModel(e.target.value)}
                        style={{ fontSize: '0.95em', padding: '8px' }}
                    >
                        {defaultModels.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                        {isCustomModel && (
                            <option value={currentModel}>
                                {currentModel} (사용자 지정)
                            </option>
                        )}
                        <option value="custom">📝 직접 입력 (새로 추가)</option>
                    </select>

                    {currentModel === 'custom' && (
                        <input
                            type="text"
                            className="input custom-model-input"
                            autoFocus
                            placeholder={customModelPlaceholder || '모델명 입력'}
                            onBlur={(e) => {
                                if (e.target.value.trim()) {
                                    updateModel(e.target.value.trim())
                                }
                            }}
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' &&
                                    e.currentTarget.value.trim()
                                ) {
                                    e.preventDefault()
                                    updateModel(e.currentTarget.value.trim())
                                }
                            }}
                            style={{ marginTop: '5px' }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default ModelSelector
