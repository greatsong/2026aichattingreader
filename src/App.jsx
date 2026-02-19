import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Home from './pages/Home'
import Admin from './pages/Admin'
import './App.css'

function App() {
  const location = useLocation()

  return (
    <AppProvider>
      <div className="app">
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo">
                <span className="logo-icon">🤖</span>
                <span className="logo-text">AI 채팅 평가</span>
              </Link>
              <nav className="nav">
                <Link
                  to="/"
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  평가하기
                </Link>
                {/* Admin page is accessible via /admin URL directly */}
              </nav>
            </div>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p className="footer-text">
              © 2026 AI 채팅 평가 시스템 · 개인정보는 서버에 저장되지 않습니다
            </p>
          </div>
        </footer>
      </div>
    </AppProvider>
  )
}

export default App
