import { useState } from 'react'
import { useApp } from '../context/AppContext'
import RubricEditor from '../components/RubricEditor'
import './Admin.css'

function Admin() {
    const {
        isAdminAuthenticated,
        authenticateAdmin,
        logoutAdmin,
        hasAdminPassword,
        setNewAdminPassword,
        apiSettings,
        setApiSettings,
        saveGlobalSettings,
        unlockApiWithPin,
        rubrics,
        addRubric,
        updateRubric,
        deleteRubric
    } = useApp()

    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswordChange, setShowPasswordChange] = useState(false)
    const [activeTab, setActiveTab] = useState('api')
    const [editingRubric, setEditingRubric] = useState(null)
    const [showRubricEditor, setShowRubricEditor] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    const handleLogin = (e) => {
        e.preventDefault()
        if (authenticateAdmin(password)) {
            setPassword('')
            setPasswordError('')
        } else {
            setPasswordError('비밀번호가 일치하지 않습니다.')
        }
    }

    const handlePasswordChange = (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setPasswordError('새 비밀번호가 일치하지 않습니다.')
            return
        }
        if (newPassword.length < 4) {
            setPasswordError('비밀번호는 4자 이상이어야 합니다.')
            return
        }
        setNewAdminPassword(newPassword)
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordChange(false)
        setPasswordError('')
        showSaveMessage('비밀번호가 변경되었습니다.')
    }

    const handleApiSave = () => {
        saveGlobalSettings(apiSettings)
        showSaveMessage('API 설정이 전 세계(서버 및 로컬)에 저장되었습니다.')
    }

    const showSaveMessage = (msg) => {
        setSaveMessage(msg)
        setTimeout(() => setSaveMessage(''), 3000)
    }

    const handleRubricSave = (rubric) => {
        if (editingRubric) {
            updateRubric(editingRubric.id, rubric)
            showSaveMessage('루브릭이 수정되었습니다.')
        } else {
            addRubric(rubric)
            showSaveMessage('새 루브릭이 추가되었습니다.')
        }
        setEditingRubric(null)
        setShowRubricEditor(false)
    }

    const handleRubricDelete = (id) => {
        if (confirm('이 루브릭을 삭제하시겠습니까?')) {
            deleteRubric(id)
            showSaveMessage('루브릭이 삭제되었습니다.')
        }
    }

    // Login Screen
    if (!isAdminAuthenticated) {
        return (
            <div className="admin">
                <div className="container">
                    <div className="login-card card">
                        <div className="login-header">
                            <span className="login-icon">🔐</span>
                            <h1>관리자 로그인</h1>
                            {!hasAdminPassword && (
                                <p className="login-hint">처음 접속시 비밀번호 없이 입장 가능합니다</p>
                            )}
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="password">비밀번호</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={hasAdminPassword ? '비밀번호를 입력하세요' : '비어있으면 그냥 입장'}
                                />
                            </div>

                            {passwordError && (
                                <div className="form-error">{passwordError}</div>
                            )}

                            <button type="submit" className="btn btn-primary btn-lg">
                                로그인
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // Rubric Editor Modal
    if (showRubricEditor) {
        return (
            <div className="admin">
                <div className="container">
                    <RubricEditor
                        rubric={editingRubric}
                        onSave={handleRubricSave}
                        onCancel={() => {
                            setEditingRubric(null)
                            setShowRubricEditor(false)
                        }}
                    />
                </div>
            </div>
        )
    }

    // Main Admin Panel
    return (
        <div className="admin">
            <div className="container">
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <h1>관리자 설정</h1>
                        <p className="admin-subtitle">API 키, 루브릭, 비밀번호 관리</p>
                    </div>
                    <button onClick={logoutAdmin} className="btn btn-ghost">
                        로그아웃
                    </button>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div className="save-message animate-slideUp">
                        ✓ {saveMessage}
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'api' ? 'active' : ''}`}
                        onClick={() => setActiveTab('api')}
                    >
                        🔑 API 설정
                    </button>
                    <button
                        className={`tab ${activeTab === 'rubrics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rubrics')}
                    >
                        📋 루브릭 관리
                    </button>
                    <button
                        className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        🔒 보안
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* API Settings Tab */}
                    {activeTab === 'api' && (
                        <div className="card animate-fadeIn">
                            <h2 className="card-title">AI API 설정</h2>
                            <p className="card-description">
                                평가에 사용할 AI API를 설정하세요. API 키는 브라우저에만 저장됩니다.
                            </p>

                            <div className="form-group">
                                <label htmlFor="provider">사용할 AI 제공업체</label>
                                <select
                                    id="provider"
                                    className="input"
                                    value={apiSettings.provider}
                                    onChange={(e) => setApiSettings({ ...apiSettings, provider: e.target.value })}
                                >
                                    <option value="gemini">Google Gemini {apiSettings.apiKeys?.gemini ? '✅' : '⚠️'}</option>
                                    <option value="openai">OpenAI GPT {apiSettings.apiKeys?.openai ? '✅' : '⚠️'}</option>
                                    <option value="claude">Anthropic Claude {apiSettings.apiKeys?.claude ? '✅' : '⚠️'}</option>
                                </select>
                            </div>

                            {/* K-Run Evaluation Setting */}
                            <div className="form-group evaluation-runs-group">
                                <label className="section-label">🔄 평가 신뢰도 설정</label>
                                <p className="form-hint" style={{ marginBottom: '12px' }}>
                                    같은 모델로 여러 번 평가하여 결과를 종합합니다. 횟수가 많을수록 신뢰도가 높아지지만 비용도 증가합니다.
                                </p>
                                <div className="runs-selector">
                                    <select
                                        value={apiSettings.evaluationRuns || 1}
                                        onChange={(e) => setApiSettings({ ...apiSettings, evaluationRuns: parseInt(e.target.value) })}
                                        className="input"
                                    >
                                        <option value={1}>1회 (기본, 빠른 평가)</option>
                                        <option value={2}>2회 (평균 종합)</option>
                                        <option value={3}>3회 (권장, 신뢰도 ⭐⭐⭐)</option>
                                        <option value={5}>5회 (고신뢰도, 비용 5배)</option>
                                    </select>
                                </div>
                                {(apiSettings.evaluationRuns || 1) > 1 && (
                                    <p className="form-hint" style={{ marginTop: '8px', color: '#f59e0b' }}>
                                        ⚠️ {apiSettings.evaluationRuns}회 평가 = API 비용 {apiSettings.evaluationRuns}배
                                    </p>
                                )}
                            </div>

                            <h3 className="api-keys-title">API 키 설정</h3>

                            {/* Gemini API Key & Model */}
                            <div className="form-group api-key-group">
                                <label htmlFor="geminiKey">
                                    🟦 Google Gemini
                                    {apiSettings.apiKeys?.gemini && <span className="key-status">✅ 설정됨</span>}
                                </label>
                                <input
                                    type="password"
                                    id="geminiKey"
                                    className="input"
                                    value={apiSettings.apiKeys?.gemini || ''}
                                    onChange={(e) => setApiSettings({
                                        ...apiSettings,
                                        apiKeys: { ...apiSettings.apiKeys, gemini: e.target.value }
                                    })}
                                    placeholder="AIza..."
                                />
                                <span className="form-hint">
                                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>에서 발급
                                </span>

                                {/* Gemini Model Selector */}
                                <div className="model-select-group" style={{ marginTop: '12px', paddingLeft: '8px', borderLeft: '3px solid #e1f5fe' }}>
                                    <label className="sub-label" style={{ fontSize: '0.9em', color: '#666' }}>🔹 사용할 모델:</label>
                                    <div className="combo-box">
                                        <select
                                            className="input model-select"
                                            value={apiSettings.models?.gemini && !['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'].includes(apiSettings.models?.gemini) && apiSettings.models?.gemini !== 'custom' ? apiSettings.models?.gemini : (apiSettings.models?.gemini || 'gemini-2.5-flash')}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setApiSettings({
                                                    ...apiSettings,
                                                    models: { ...apiSettings.models, gemini: val }
                                                })
                                            }}
                                            style={{ fontSize: '0.95em', padding: '8px' }}
                                        >
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                            <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Exp</option>
                                            {/* Show current custom model as an option if it exists and is not one of the defaults */}
                                            {apiSettings.models?.gemini && !['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro-exp-02-05', 'custom'].includes(apiSettings.models?.gemini) && (
                                                <option value={apiSettings.models?.gemini}>
                                                    {apiSettings.models?.gemini} (사용자 지정)
                                                </option>
                                            )}
                                            <option value="custom">📝 직접 입력 (새로 추가)</option>
                                        </select>
                                        {(apiSettings.models?.gemini === 'custom') && (
                                            <input
                                                type="text"
                                                className="input custom-model-input"
                                                autoFocus
                                                placeholder="예: gemini-pro-vision"
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        setApiSettings({
                                                            ...apiSettings,
                                                            models: { ...apiSettings.models, gemini: e.target.value.trim() }
                                                        })
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        e.preventDefault() // prevent form submission if any
                                                        setApiSettings({
                                                            ...apiSettings,
                                                            models: { ...apiSettings.models, gemini: e.currentTarget.value.trim() }
                                                        })
                                                    }
                                                }}
                                                style={{ marginTop: '5px' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* OpenAI API Key & Model */}
                            <div className="form-group api-key-group">
                                <label htmlFor="openaiKey">
                                    🟩 OpenAI GPT
                                    {apiSettings.apiKeys?.openai && <span className="key-status">✅ 설정됨</span>}
                                </label>
                                <input
                                    type="password"
                                    id="openaiKey"
                                    className="input"
                                    value={apiSettings.apiKeys?.openai || ''}
                                    onChange={(e) => setApiSettings({
                                        ...apiSettings,
                                        apiKeys: { ...apiSettings.apiKeys, openai: e.target.value }
                                    })}
                                    placeholder="sk-proj-..."
                                />
                                <span className="form-hint">
                                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>에서 발급
                                </span>

                                {/* OpenAI Model Selector */}
                                <div className="model-select-group" style={{ marginTop: '12px', paddingLeft: '8px', borderLeft: '3px solid #e8f5e9' }}>
                                    <label className="sub-label" style={{ fontSize: '0.9em', color: '#666' }}>🔹 사용할 모델:</label>
                                    <div className="combo-box">
                                        <select
                                            className="input model-select"
                                            value={apiSettings.models?.openai && !['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'].includes(apiSettings.models?.openai) && apiSettings.models?.openai !== 'custom' ? apiSettings.models?.openai : (apiSettings.models?.openai || 'gpt-4o')}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setApiSettings({
                                                    ...apiSettings,
                                                    models: { ...apiSettings.models, openai: val }
                                                })
                                            }}
                                            style={{ fontSize: '0.95em', padding: '8px' }}
                                        >
                                            <option value="gpt-4o">GPT-4o</option>
                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                                            <option value="o1-preview">o1-preview (Reasoning)</option>
                                            <option value="o3-mini">o3-mini (Advanced Reasoning)</option>
                                            {/* Custom Model Option */}
                                            {apiSettings.models?.openai && !['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini', 'custom'].includes(apiSettings.models?.openai) && (
                                                <option value={apiSettings.models.openai}>{apiSettings.models.openai} (사용자 지정)</option>
                                            )}
                                            <option value="custom">📝 직접 입력 (새로 추가)</option>
                                        </select>

                                        {apiSettings.models?.openai === 'custom' && (
                                            <input
                                                type="text"
                                                className="input custom-model-input"
                                                autoFocus
                                                placeholder="예: gpt-3.5-turbo"
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        setApiSettings({
                                                            ...apiSettings,
                                                            models: { ...apiSettings.models, openai: e.target.value.trim() }
                                                        })
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        e.preventDefault()
                                                        setApiSettings({
                                                            ...apiSettings,
                                                            models: { ...apiSettings.models, openai: e.currentTarget.value.trim() }
                                                        })
                                                    }
                                                }}
                                                style={{ marginTop: '5px' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Claude API Key & Model */}
                            <div className="form-group api-key-group">
                                <label htmlFor="claudeKey">
                                    🟧 Anthropic Claude
                                    {apiSettings.apiKeys?.claude && <span className="key-status">✅ 설정됨</span>}
                                </label>
                                <input
                                    type="password"
                                    id="claudeKey"
                                    className="input"
                                    value={apiSettings.apiKeys?.claude || ''}
                                    onChange={(e) => setApiSettings({
                                        ...apiSettings,
                                        apiKeys: { ...apiSettings.apiKeys, claude: e.target.value }
                                    })}
                                    placeholder="sk-ant-..."
                                />
                                <span className="form-hint">
                                    <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a>에서 발급
                                </span>

                                {/* Claude Model Selector */}
                                <div className="model-select-group" style={{ marginTop: '12px', paddingLeft: '8px', borderLeft: '3px solid #fff3e0' }}>
                                    <label className="sub-label" style={{ fontSize: '0.9em', color: '#666' }}>🔹 사용할 모델:</label>
                                    <div className="combo-box">
                                        <select
                                            className="input model-select"
                                            value={apiSettings.models?.claude && !['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'].includes(apiSettings.models?.claude) && apiSettings.models?.claude !== 'custom' ? apiSettings.models?.claude : (apiSettings.models?.claude || 'claude-3-5-sonnet-20240620')}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setApiSettings({
                                                    ...apiSettings,
                                                    models: { ...apiSettings.models, claude: val }
                                                })
                                            }}
                                            style={{ fontSize: '0.95em', padding: '8px' }}
                                        >
                                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (v2)</option>
                                            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                                            {/* Custom Model Option */}
                                            {apiSettings.models?.claude && !['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307', 'custom'].includes(apiSettings.models?.claude) && (
                                                <option value={apiSettings.models.claude}>{apiSettings.models.claude} (사용자 지정)</option>
                                            )}
                                            <option value="custom">📝 직접 입력 (새로 추가)</option>
                                        </select>

                                        {apiSettings.models?.claude === 'custom' && (
                                            <input
                                                type="text"
                                                className="input custom-model-input"
                                                autoFocus
                                                placeholder="예: claude-2.1"
                                                onBlur={(e) => {
                                                    if (e.target.value.trim()) {
                                                        setApiSettings({
                                                            ...apiSettings,
                                                            models: { ...apiSettings.models, claude: e.target.value.trim() }
                                                        })
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        e.preventDefault()
                                                        setApiSettings({
                                                            ...apiSettings,
                                                            models: { ...apiSettings.models, claude: e.currentTarget.value.trim() }
                                                        })
                                                    }
                                                }}
                                                style={{ marginTop: '5px' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Secret PIN unlock */}
                            <div className="form-group pin-unlock-group">
                                <label htmlFor="apiPin">📌 PIN을 입력하면 내장된 API 키가 자동으로 로드됩니다</label>
                                <div className="pin-input-wrapper">
                                    <input
                                        type="password"
                                        id="apiPin"
                                        className="input pin-input"
                                        placeholder="2081"
                                        maxLength={4}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.length === 4) {
                                                const success = unlockApiWithPin(e.target.value)
                                                if (success) {
                                                    showSaveMessage('API 키가 자동 입력되었습니다!')
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
                                        onClick={(e) => {
                                            const pinInput = document.getElementById('apiPin')
                                            if (pinInput.value.length === 4) {
                                                const success = unlockApiWithPin(pinInput.value)
                                                if (success) {
                                                    showSaveMessage('API 키가 자동 입력되었습니다!')
                                                    pinInput.value = ''
                                                } else {
                                                    showSaveMessage('PIN이 올바르지 않습니다.')
                                                }
                                            }
                                        }}
                                    >
                                        🔓 자동입력
                                    </button>
                                </div>
                            </div>



                            <button onClick={handleApiSave} className="btn btn-primary">
                                설정 저장
                            </button>
                        </div>
                    )}

                    {/* Rubrics Tab */}
                    {activeTab === 'rubrics' && (
                        <div className="animate-fadeIn">
                            <div className="section-header">
                                <h2>평가 루브릭</h2>
                                <button
                                    onClick={() => {
                                        setEditingRubric(null)
                                        setShowRubricEditor(true)
                                    }}
                                    className="btn btn-primary"
                                >
                                    + 새 루브릭
                                </button>
                            </div>

                            <div className="rubric-list">
                                {rubrics.map(rubric => (
                                    <div key={rubric.id} className="rubric-card card">
                                        <div className="rubric-info">
                                            <h3>{rubric.name}</h3>
                                            <p>{rubric.criteria.length}개 평가 항목</p>
                                            <div className="rubric-criteria-preview">
                                                {rubric.criteria.slice(0, 3).map(c => (
                                                    <span key={c.id} className="badge badge-primary">{c.name}</span>
                                                ))}
                                                {rubric.criteria.length > 3 && (
                                                    <span className="badge">+{rubric.criteria.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rubric-actions">
                                            <button
                                                onClick={() => {
                                                    setEditingRubric(rubric)
                                                    setShowRubricEditor(true)
                                                }}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => handleRubricDelete(rubric.id)}
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
                                        <button
                                            onClick={() => setShowRubricEditor(true)}
                                            className="btn btn-primary"
                                        >
                                            첫 루브릭 만들기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="card animate-fadeIn">
                            <h2 className="card-title">비밀번호 관리</h2>
                            <p className="card-description">
                                관리자 페이지 접근을 위한 비밀번호를 설정하세요.
                            </p>

                            {showPasswordChange ? (
                                <form onSubmit={handlePasswordChange}>
                                    <div className="form-group">
                                        <label htmlFor="newPassword">새 비밀번호</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            className="input"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="4자 이상"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            className="input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="다시 입력"
                                            required
                                        />
                                    </div>

                                    {passwordError && (
                                        <div className="form-error">{passwordError}</div>
                                    )}

                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary">
                                            비밀번호 변경
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordChange(false)
                                                setPasswordError('')
                                            }}
                                            className="btn btn-ghost"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowPasswordChange(true)}
                                    className="btn btn-secondary"
                                >
                                    {hasAdminPassword ? '비밀번호 변경' : '비밀번호 설정'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}

export default Admin
