import { Component } from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <span className="error-boundary-icon">&#x26A0;&#xFE0F;</span>
                        <h2>오류가 발생했습니다</h2>
                        <p className="error-boundary-message">
                            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
                        </p>
                        <button onClick={this.handleReset} className="btn btn-primary">
                            다시 시도
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
