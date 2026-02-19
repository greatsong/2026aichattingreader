import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAPI } from '../context/APIContext'
import { useEvaluation } from '../context/EvaluationContext'
import RubricEditor from '../components/RubricEditor'
import ApiSettingsTab from '../components/admin/ApiSettingsTab'
import RubricManageTab from '../components/admin/RubricManageTab'
import SecurityTab from '../components/admin/SecurityTab'
import './Admin.css'

function Admin() {
    const { isAdminAuthenticated, authenticateAdmin, logoutAdmin, hasAdminPassword, setNewAdminPassword } = useAuth()
    const { apiSettings, setApiSettings, saveGlobalSettings, unlockApiWithPin } = useAPI()
    const { rubrics, addRubric, updateRubric, deleteRubric } = useEvaluation()

    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [activeTab, setActiveTab] = useState('api')
    const [editingRubric, setEditingRubric] = useState(null)
    const [showRubricEditor, setShowRubricEditor] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    const showSaveMessage = (msg) => {
        setSaveMessage(msg)
        setTimeout(() => setSaveMessage(''), 3000)
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        const success = await authenticateAdmin(password)
        if (success) { setPassword(''); setPasswordError('') }
        else { setPasswordError('비밀번호가 일치하지 않습니다.') }
    }

    const handleRubricSave = (rubric) => {
        if (editingRubric) { updateRubric(editingRubric.id, rubric); showSaveMessage('루브릭이 수정되었습니다.') }
        else { addRubric(rubric); showSaveMessage('새 루브릭이 추가되었습니다.') }
        setEditingRubric(null)
        setShowRubricEditor(false)
    }

    const handleRubricDelete = (id) => {
        if (confirm('이 루브릭을 삭제하시겠습니까?')) { deleteRubric(id); showSaveMessage('루브릭이 삭제되었습니다.') }
    }

    // 로그인 화면
    if (!isAdminAuthenticated) {
        return (
            <div className="admin">
                <div className="container">
                    <div className="login-card card">
                        <div className="login-header">
                            <span className="login-icon">🔐</span>
                            <h1>관리자 로그인</h1>
                            {!hasAdminPassword && <p className="login-hint">처음 접속시 비밀번호 없이 입장 가능합니다</p>}
                        </div>
                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="password">비밀번호</label>
                                <input type="password" id="password" className="input" value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={hasAdminPassword ? '비밀번호를 입력하세요' : '비어있으면 그냥 입장'} />
                            </div>
                            {passwordError && <div className="form-error">{passwordError}</div>}
                            <button type="submit" className="btn btn-primary btn-lg">로그인</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // 루브릭 편집 모달
    if (showRubricEditor) {
        return (
            <div className="admin">
                <div className="container">
                    <RubricEditor rubric={editingRubric} onSave={handleRubricSave}
                        onCancel={() => { setEditingRubric(null); setShowRubricEditor(false) }} />
                </div>
            </div>
        )
    }

    // 메인 관리 패널
    return (
        <div className="admin">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1>관리자 설정</h1>
                        <p className="admin-subtitle">API 키, 루브릭, 비밀번호 관리</p>
                    </div>
                    <button onClick={logoutAdmin} className="btn btn-ghost">로그아웃</button>
                </div>

                {saveMessage && <div className="save-message animate-slideUp">✓ {saveMessage}</div>}

                <div className="tabs" role="tablist">
                    <button className={`tab ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')} role="tab" aria-selected={activeTab === 'api'}>🔑 API 설정</button>
                    <button className={`tab ${activeTab === 'rubrics' ? 'active' : ''}`} onClick={() => setActiveTab('rubrics')} role="tab" aria-selected={activeTab === 'rubrics'}>📋 루브릭 관리</button>
                    <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')} role="tab" aria-selected={activeTab === 'security'}>🔒 보안</button>
                </div>

                <div className="tab-content">
                    {activeTab === 'api' && (
                        <ApiSettingsTab apiSettings={apiSettings} setApiSettings={setApiSettings}
                            saveGlobalSettings={saveGlobalSettings} unlockApiWithPin={unlockApiWithPin}
                            showSaveMessage={showSaveMessage} />
                    )}
                    {activeTab === 'rubrics' && (
                        <RubricManageTab rubrics={rubrics}
                            onEdit={(rubric) => { setEditingRubric(rubric); setShowRubricEditor(true) }}
                            onDelete={handleRubricDelete}
                            onCreateNew={() => { setEditingRubric(null); setShowRubricEditor(true) }} />
                    )}
                    {activeTab === 'security' && (
                        <SecurityTab hasAdminPassword={hasAdminPassword}
                            setNewAdminPassword={setNewAdminPassword} showSaveMessage={showSaveMessage} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default Admin
