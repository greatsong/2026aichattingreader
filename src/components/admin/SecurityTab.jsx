import { useState } from 'react'

/**
 * SecurityTab - 비밀번호 관리 탭
 *
 * Props:
 *   hasAdminPassword    - 비밀번호 설정 여부
 *   setNewAdminPassword - 새 비밀번호 저장 함수 (password) => Promise
 *   showSaveMessage     - 저장 메시지 표시 함수 (msg) => void
 */
function SecurityTab({ hasAdminPassword, setNewAdminPassword, showSaveMessage }) {
    const [showPasswordChange, setShowPasswordChange] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setPasswordError('새 비밀번호가 일치하지 않습니다.')
            return
        }
        if (newPassword.length < 4) {
            setPasswordError('비밀번호는 4자 이상이어야 합니다.')
            return
        }
        await setNewAdminPassword(newPassword)
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordChange(false)
        setPasswordError('')
        showSaveMessage('비밀번호가 변경되었습니다.')
    }

    return (
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
    )
}

export default SecurityTab
