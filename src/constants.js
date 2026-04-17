/**
 * 공통 상수 정의
 * 매직 넘버, 모델 목록, 타이밍 값, 등급 색상 등
 */

// API 설정
export const API_TIMEOUT_MS = 30000
export const MAX_RETRIES = 2

// 등급 색상
export const GRADE_COLORS = {
    'A+': { color: 'var(--color-success-500)', glow: 'rgba(16, 185, 129, 0.3)' },
    'A':  { color: 'var(--color-success-500)', glow: 'rgba(16, 185, 129, 0.3)' },
    'B+': { color: 'var(--color-primary-500)', glow: 'rgba(99, 102, 241, 0.3)' },
    'B':  { color: 'var(--color-primary-500)', glow: 'rgba(99, 102, 241, 0.3)' },
    'C+': { color: 'var(--color-warning-500)', glow: 'rgba(245, 158, 11, 0.3)' },
    'C':  { color: 'var(--color-warning-500)', glow: 'rgba(245, 158, 11, 0.3)' },
}
export const GRADE_COLOR_DEFAULT = { color: 'var(--color-error-500)', glow: 'rgba(239, 68, 68, 0.3)' }

export function getGradeColor(grade) {
    return GRADE_COLORS[grade] || GRADE_COLOR_DEFAULT
}

// 등급 기준 (점수 → 등급)
export const GRADE_THRESHOLDS = [
    { min: 95, grade: 'A+' },
    { min: 90, grade: 'A' },
    { min: 85, grade: 'B+' },
    { min: 80, grade: 'B' },
    { min: 75, grade: 'C+' },
    { min: 70, grade: 'C' },
    { min: 65, grade: 'D+' },
    { min: 60, grade: 'D' },
    { min: 0, grade: 'F' }
]

export function calculateGrade(score) {
    const entry = GRADE_THRESHOLDS.find(t => score >= t.min)
    return entry ? entry.grade : 'F'
}

// AI 제공업체별 모델 목록
export const PROVIDER_MODELS = {
    gemini: {
        defaults: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro-exp-02-05'],
        labels: {
            'gemini-2.5-flash': 'Gemini 2.5 Flash',
            'gemini-2.5-pro': 'Gemini 2.5 Pro',
            'gemini-2.0-flash': 'Gemini 2.0 Flash',
            'gemini-2.0-pro-exp-02-05': 'Gemini 2.0 Pro Exp'
        },
        borderColor: '#e1f5fe',
        emoji: '🟦',
        label: 'Google Gemini',
        placeholder: 'AIza...',
        helpUrl: 'https://aistudio.google.com/apikey',
        helpLabel: 'Google AI Studio'
    },
    openai: {
        defaults: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini'],
        labels: {
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'o1-preview': 'o1-preview (Reasoning)',
            'o3-mini': 'o3-mini (Advanced Reasoning)'
        },
        borderColor: '#e8f5e9',
        emoji: '🟩',
        label: 'OpenAI GPT',
        placeholder: 'sk-proj-...',
        helpUrl: 'https://platform.openai.com/api-keys',
        helpLabel: 'OpenAI Platform'
    },
    claude: {
        defaults: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-7'],
        labels: {
            'claude-haiku-4-5-20251001': 'Claude Haiku 4.5 (추천)',
            'claude-sonnet-4-6': 'Claude Sonnet 4.6',
            'claude-opus-4-7': 'Claude Opus 4.7 (최신)'
        },
        borderColor: '#fff3e0',
        emoji: '🟧',
        label: 'Anthropic Claude',
        placeholder: 'sk-ant-...',
        helpUrl: 'https://console.anthropic.com/',
        helpLabel: 'Anthropic Console'
    }
}

// 로딩 메시지 (타이밍 포함)
export const LOADING_MESSAGES = [
    { delay: 0, text: '채팅 기록을 읽어오는 중입니다... (Reading)' },
    { delay: 2000, text: 'AI가 내용을 심층 분석 중입니다... (Analyzing)' },
    { delay: 8000, text: '평가 보고서를 작성하고 있습니다... (Writing)' },
    { delay: 20000, text: '마무리 정리 중입니다... (Finalizing)' }
]

// 평가 횟수 옵션
export const EVALUATION_RUNS_OPTIONS = [
    { value: 1, label: '1회 (기본, 빠른 평가)' },
    { value: 2, label: '2회 (평균 종합)' },
    { value: 3, label: '3회 (권장, 신뢰도 높음)' },
    { value: 5, label: '5회 (고신뢰도, 비용 5배)' }
]

// 비밀번호 최소 길이
export const MIN_PASSWORD_LENGTH = 4
