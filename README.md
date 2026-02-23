# AI 채팅 평가 시스템 (AI Chat Evaluator)

> AI(ChatGPT, Claude, Gemini 등)와의 채팅 기록을 **루브릭 기반**으로 분석하여 정량·정성적 피드백을 제공하는 교육용 웹 애플리케이션

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/greatsong/2026aichattingreader)

---

## 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [데모 / 배포 URL](#데모--배포-url)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [로컬 개발 환경 설정](#로컬-개발-환경-설정)
- [환경 변수 설정](#환경-변수-설정)
- [평가 흐름](#평가-흐름)
- [루브릭 시스템](#루브릭-시스템)
- [Rubric Studio (별도 앱)](#rubric-studio-별도-앱)
- [배포 가이드](#배포-가이드)
- [보안](#보안)
- [라이선스](#라이선스)

---

## 개요

학생들이 AI와 대화하며 프로젝트를 진행하는 과정에서, **"결과물만으로는 보이지 않는 성장 과정"**을 평가하기 위해 만들어졌습니다.

핵심 철학: **"과정의 증명 (Proof of Process)"**

- 학생이 AI에게 **어떤 질문**을 했는지
- AI 응답을 **어떻게 개선**했는지
- 정보를 **비판적으로 검토**했는지
- 최종적으로 **실제 문제 해결**에 적용했는지

이 모든 과정을 채팅 기록에서 자동으로 분석하고, 교사가 설계한 루브릭에 따라 정량·정성 평가를 수행합니다.

---

## 주요 기능

### 학생용

| 기능 | 설명 |
|------|------|
| **AI 채팅 평가** | 채팅 내용을 붙여넣기 또는 파일(.txt, .json, .md, .html, .csv) 업로드하여 평가 |
| **자기 평가 비교** | AI 평가 전 자기 평가 → AI 평가와 나란히 비교하여 메타인지 향상 |
| **성장 추적** | 평가 이력을 라인 차트로 시각화, 최고점·평균·변화량·추세 분석 |
| **역량 분포도** | 레이더 차트로 루브릭 항목별 강약점 시각화 |
| **근거 기반 피드백** | AI가 채팅 원문을 「」 직접 인용하여 평가 근거 제시 |
| **PDF 보고서** | 학번·이름 포함 가능한 PDF 다운로드 |
| **사용 가이드** | AI와 효과적으로 대화하는 방법, 채팅 추출법, 루브릭 이해 안내 |

### 교사용

| 기능 | 설명 |
|------|------|
| **루브릭 관리** | 커스텀 루브릭 생성/수정/삭제 (항목별 가중치·5점 척도) |
| **교과별 템플릿** | 일반 / 글쓰기 / 과학탐구 / 코딩 — 4종 루브릭 템플릿 즉시 사용 |
| **JSON 불러오기** | 외부에서 설계한 루브릭을 JSON으로 가져오기 |
| **고도화된 API 설정** | <ul><li>**Gemini**: gemini-2.5-pro, gemini-2.5-flash 등 최신 파라미터 지원</li><li>**OpenAI**: gpt-4o, gpt-4o-mini, o1-preview 등 강력한 추론 모델 선택 가능</li><li>**Claude**: claude-3-5-sonnet-20241022 등 지원</li><li>**K-run 지원**: 평가 1회부터 신뢰도를 위한 다수회(3회 권장) 평가 지원</li></ul> |
| **앙상블 모드** | 3개 AI 모델을 동시 호출하여 결과 합성 |
| **생활기록부 초안** | AI가 생성한 생활기록부 문구 초안 (복사 버튼) |
| **PIN 잠금** | 학생에게 API 키를 숨기고 PIN으로 사용 권한 부여 |

---

## 데모 / 배포 URL

| 환경 | URL |
|------|-----|
| 프로덕션 | Vercel 배포 (자체 도메인 설정 가능) |
| 로컬 개발 | `http://localhost:5173` |

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| **프레임워크** | React + Vite | 19.2 + 7.2 |
| **라우팅** | React Router | v7 |
| **상태관리** | React Context | Auth / API / Evaluation 3분할 |
| **차트** | Chart.js + react-chartjs-2 | 4.5 + 5.3 |
| **PDF** | html2pdf.js | 0.14 |
| **AI API** | Gemini, OpenAI, Claude | 클라이언트 + 서버 프록시 |
| **서버리스** | Vercel Edge Functions | api/ 디렉토리 |
| **KV 스토어** | Vercel KV (@vercel/kv) | 글로벌 설정 저장 |
| **클라이언트 저장소** | localStorage | 루브릭, 평가 이력 |
| **폰트** | Inter + Noto Sans KR | Google Fonts |

---

## 프로젝트 구조

```
2026aichattingreader/
├── index.html                       # SPA 진입점 (lang="ko", SEO 메타태그)
├── package.json                     # 의존성 및 스크립트
├── vite.config.js                   # Vite 설정 + 로컬 API mock 플러그인
├── vercel.json                      # Vercel 라우팅 (SPA fallback + API rewrite)
├── .env.example                     # 환경 변수 템플릿
├── RUBRIC_GUIDE.md                  # 루브릭 설계 철학 문서
│
├── api/                             # Vercel Edge Functions (서버리스)
│   ├── evaluate.js                  # AI 평가 엔드포인트 (25초 타임아웃)
│   └── config.js                    # PIN 검증 + 글로벌 설정 API
│
├── rubric-studio/                   # 루브릭 디자인 스튜디오 (별도 Next.js 앱)
│   └── (상세 구조는 아래 참조)
│
└── src/
    ├── main.jsx                     # React 19 앱 진입점
    ├── App.jsx                      # Provider 스택 + 라우터
    ├── constants.js                 # 공통 상수 (등급 색상, 모델 목록, 타임아웃)
    │
    ├── context/                     # React Context (3분할)
    │   ├── AuthContext.jsx          #   관리자 인증 (SHA-256 해싱)
    │   ├── APIContext.jsx           #   API 설정 (프로바이더, 모델, K-run)
    │   └── EvaluationContext.jsx    #   루브릭 + 평가 상태
    │
    ├── pages/
    │   ├── Home.jsx                 # 메인 평가 흐름 오케스트레이터
    │   └── Admin.jsx                # 관리자 설정 (3개 탭)
    │
    ├── components/
    │   ├── ChatInput.jsx            # 채팅 입력 (붙여넣기 / 파일 업로드)
    │   ├── RubricSelector.jsx       # 루브릭 선택 드롭다운
    │   ├── RubricEditor.jsx         # 루브릭 편집기
    │   ├── SelfEvaluation.jsx       # 자기 평가 폼
    │   ├── StudentGuide.jsx         # 학생 사용 가이드
    │   ├── ErrorBoundary.jsx        # 에러 경계 모듈 (런타임 에러 격리 및 안내)
    │   │
    │   ├── admin/                   # 관리자 탭 컴포넌트
    │   │   ├── ApiSettingsTab.jsx   #   API 설정 탭
    │   │   ├── ModelSelector.jsx    #   재사용 모델 선택기
    │   │   ├── RubricManageTab.jsx  #   루브릭 관리 탭
    │   │   └── SecurityTab.jsx      #   보안 설정 탭
    │   │
    │   └── evaluation/              # 평가 결과 컴포넌트
    │       ├── EvaluationResult.jsx #   결과 오케스트레이터 (PDF 다운로드 포함)
    │       ├── ScoreOverview.jsx    #   점수 요약 + 등급 메시지 + 특징
    │       ├── CriteriaDetail.jsx   #   항목별 평가 (근거 인용 + 점수 배지)
    │       ├── RadarChart.jsx       #   레이더 차트 + 역량 균형 분석
    │       └── GrowthChart.jsx      #   성장 추적 라인 차트 + 추세 분석
    │
    ├── services/
    │   ├── evaluator.js             # 평가 오케스트레이터 (K-run, 재시도, 서버 폴백)
    │   ├── prompts.js               # 평가 프롬프트 빌더
    │   ├── responseParser.js        # AI 응답 JSON 파싱 + 등급 계산
    │   ├── synthesis.js             # K-run 결과 합성 (점수 평균, 피드백 결합)
    │   ├── evaluationHistory.js     # 평가 이력 CRUD (localStorage)
    │   ├── storage.js               # 저장소 유틸 + SHA-256 비밀번호 해싱
    │   ├── utils.js                 # fetchWithTimeout (AbortController)
    │   └── providers/               # AI 프로바이더 구현
    │       ├── index.js             #   프로바이더 팩토리
    │       ├── gemini.js            #   Google Gemini API
    │       ├── openai.js            #   OpenAI GPT API
    │       └── claude.js            #   Anthropic Claude API
    │
    └── data/
        └── rubricTemplates.js       # 교과별 루브릭 템플릿 4종
```

---

## 로컬 개발 환경 설정

### 사전 요구사항

- **Node.js** 18.0 이상 (20.x 권장)
- **npm** 9.0 이상
- AI API 키 1개 이상 (Gemini, OpenAI, Claude 중 택)

### 1단계: 저장소 클론

```bash
git clone https://github.com/greatsong/2026aichattingreader.git
cd 2026aichattingreader
```

### 2단계: 의존성 설치

```bash
npm install
```

### 3단계: 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 설정합니다:

```env
# === 서버사이드 (Vercel Edge Functions / 로컬에서는 미사용) ===
# AI 평가용 API 키 — 사용할 프로바이더의 키만 입력하면 됩니다
GEMINI_API_KEY=your_gemini_api_key
CLAUDE_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# PIN 잠금 — 학생이 PIN 입력 시 서버 키 사용 권한 부여
SECRET_API_PIN=your_secret_pin

# === 클라이언트사이드 (Vite — VITE_ 접두사) ===
# 관리자 비밀번호 초기값 (첫 로그인 시 사용, 이후 변경 가능)
VITE_ADMIN_PASSWORD=your_admin_password
```

> **참고**: 로컬 개발 시에는 관리자 페이지(`/admin`)에서 직접 API 키를 입력할 수 있습니다. 서버사이드 환경 변수는 Vercel 배포 시에만 필요합니다.

### 4단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 5단계: API 키 설정 (브라우저에서)

1. 우측 상단 **관리자** 클릭
2. 비밀번호 입력 (`.env`에서 설정한 `VITE_ADMIN_PASSWORD`)
3. **API 설정** 탭에서:
   - AI 프로바이더 선택 (Gemini / OpenAI / Claude)
   - 해당 프로바이더의 API 키 입력
   - 모델 선택 (각 프로바이더별 구체적인 최신 모델들을 제공합니다)
   - K-run 횟수 설정 (1회 = 빠름, 3회 = 정확)

### 로컬 개발 시 제한 사항

| 기능 | 로컬 | Vercel 배포 |
|------|------|-------------|
| 채팅 붙여넣기 평가 | O | O |
| 파일 업로드 평가 | O | O |
| 서버사이드 API 키 | X | O |
| PIN 잠금 | X | O |
| Vercel KV (글로벌 설정) | X | O |

> 로컬에서는 **관리자 페이지에서 직접 입력한 API 키**가 브라우저의 localStorage에 저장되어 사용됩니다. 서버 프록시 없이 클라이언트에서 직접 AI API를 호출합니다.

---

## 환경 변수 설정

### 환경 변수 상세

| 변수명 | 위치 | 필수 | 설명 |
|--------|------|------|------|
| `GEMINI_API_KEY` | 서버 | 선택 | Google AI Studio에서 발급 |
| `OPENAI_API_KEY` | 서버 | 선택 | OpenAI Platform에서 발급 |
| `CLAUDE_API_KEY` | 서버 | 선택 | Anthropic Console에서 발급 |
| `SECRET_API_PIN` | 서버 | 선택 | 학생 PIN 잠금용 (4자리 숫자 권장) |
| `VITE_ADMIN_PASSWORD` | 클라이언트 | 선택 | 관리자 페이지 초기 비밀번호 |

### API 키 발급 방법

| 프로바이더 | 발급 링크 | 무료 티어 |
|-----------|----------|-----------|
| **Google Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) | O (분당 15회) |
| **OpenAI** | [OpenAI Platform](https://platform.openai.com/api-keys) | X (유료) |
| **Anthropic Claude** | [Anthropic Console](https://console.anthropic.com/) | X (유료) |

> 교육용으로 사용 시 **Gemini**가 무료 티어를 제공하므로 가장 접근성이 좋습니다.

---

## 평가 흐름

```
┌─────────────────────────────────────────────────────┐
│  1. 입력 단계                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ 루브릭   │  │ 채팅 입력 │  │ 자기 평가 (선택) │   │
│  │ 선택     │  │ 붙여넣기/ │  │ 항목별 자기 점수 │   │
│  │          │  │ 파일 업로드│  │ + 이유 작성     │   │
│  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘   │
│       └──────────────┼─────────────────┘             │
└──────────────────────┼───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│  2. AI 평가 처리                                      │
│                                                       │
│  prompts.js → 루브릭 + 채팅 + 성찰 결합               │
│       ▼                                               │
│  evaluator.js → 프로바이더 호출                        │
│   ├── 단일 모델: Gemini / OpenAI / Claude              │
│   ├── K-run: 같은 모델 N번 병렬 호출 → 점수 평균       │
│   └── 앙상블: 3개 모델 동시 호출 → 결과 합성           │
│       ▼                                               │
│  responseParser.js → JSON 파싱 + 등급 계산             │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│  3. 결과 표시                                         │
│                                                       │
│  ScoreOverview  → 종합 점수 + 등급 + 학습 모드 배지    │
│  RadarChart     → 역량 분포 레이더 차트 + 균형 분석    │
│  CriteriaDetail → 항목별 점수 바 + 근거 인용 + 개선 팁 │
│  GrowthChart    → 성장 추적 라인 차트 + 추세 분석      │
│                                                       │
│  [자기 평가 vs AI 평가 비교] (자기 평가 시)            │
│  [PDF 다운로드] [생활기록부 초안 복사]                  │
└──────────────────────────────────────────────────────┘
```

### 등급 체계

| 점수 | 등급 | 메시지 |
|------|------|--------|
| 95+ | A+ | 탁월한 AI 활용 역량을 보여주었습니다! |
| 90+ | A | 우수한 역량입니다! |
| 85+ | B+ | 잘하고 있어요! |
| 80+ | B | 양호한 수준이에요 |
| 75+ | C+ | 성장 가능성이 있어요! |
| 70+ | C | 기초를 다지는 단계예요 |
| 60+ | D | 더 많은 연습이 필요해요 |
| 60 미만 | F | 다시 도전해보세요! |

### 항목별 수준 배지

| 달성률 | 배지 | 색상 |
|--------|------|------|
| 90%+ | 우수 | 초록 |
| 70%+ | 양호 | 보라 |
| 50%+ | 보통 | 노랑 |
| 30%+ | 미흡 | 빨강 |
| 30% 미만 | 부족 | 진빨강 |

---

## 루브릭 시스템

### 기본 제공 템플릿 (4종)

| 템플릿 | 평가 항목 | 용도 |
|--------|----------|------|
| **일반** | 질문의 명확성(20%), 반복적 개선(25%), 비판적 사고(25%), 실제 적용(30%) | 범교과 AI 활용 |
| **글쓰기** | 주제 설정 과정, 자료 조사 활용, 구조/논리 개선, 표현 다듬기, 최종 점검 | 국어/사회 교과 |
| **과학탐구** | 탐구 설계, 데이터 분석, 과학적 검증, 결론 도출, 한계 인식 | 과학 교과 |
| **코딩** | 문제 분석, 알고리즘 설계, 코드 구현, 디버깅 과정, 코드 개선 | 정보/SW 교과 |

### 커스텀 루브릭 JSON 형식

```json
{
  "name": "나의 루브릭",
  "description": "설명",
  "criteria": [
    {
      "name": "항목명",
      "weight": 25,
      "levels": {
        "5": "매우 우수 — 구체적 설명",
        "4": "우수 — 구체적 설명",
        "3": "보통 — 구체적 설명",
        "2": "미흡 — 구체적 설명",
        "1": "부족 — 구체적 설명"
      }
    }
  ]
}
```

> 모든 항목의 `weight` 합은 100이어야 합니다.

---

## Rubric Studio (별도 앱)

`rubric-studio/` 디렉토리에는 AI 기반 루브릭 설계 도구가 별도의 Next.js 앱으로 포함되어 있습니다.

### 주요 기능

| 모드 | 설명 |
|------|------|
| **평가 모드** | 전체 화면 채팅 평가 인터페이스 |
| **학습/스튜디오 모드** | AI 코치(좌측) + 시뮬레이터(우측) 듀얼 패널 |
| **관리 모드** | 루브릭 CRUD 및 버전 관리 |

### 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Vercel AI SDK (스트리밍 대화)
- Zustand (상태 관리)

### 실행 방법

```bash
cd rubric-studio
npm install
npm run dev
# http://localhost:3000
```

---

## 배포 가이드

### Vercel 배포 (권장)

#### 방법 1: Git 연동 (자동 배포)

1. GitHub에 저장소를 push
2. [Vercel](https://vercel.com)에서 **New Project** → GitHub 저장소 연결
3. **Framework Preset**: `Vite` 자동 감지
4. **Environment Variables**에 다음 추가:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY` (선택)
   - `CLAUDE_API_KEY` (선택)
   - `SECRET_API_PIN`
5. **Deploy** 클릭

> 이후 `main` 브랜치에 push하면 자동 배포됩니다.

#### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 배포 시 동작하는 서버리스 함수

| 엔드포인트 | 파일 | 역할 |
|-----------|------|------|
| `POST /api/evaluate` | `api/evaluate.js` | AI 평가 수행 (25초 타임아웃) |
| `GET/POST /api/config` | `api/config.js` | PIN 검증 + 글로벌 설정 관리 |

### 정적 호스팅 (서버리스 없이)

서버리스 함수 없이 정적 사이트로만 배포할 수도 있습니다:

```bash
npm run build
# dist/ 폴더를 정적 호스팅 서비스에 업로드
# (Netlify, GitHub Pages, S3 등)
```

> 이 경우 서버 프록시, PIN 잠금 등 서버 자원이 제한되며, 사용자가 관리자 페이지에서 직접 API 키를 입력하여 클라이언트에서 직접 호출하는 방식으로 동작합니다.

---

## 보안 및 안정성

| 영역 | 구현 방식 |
|------|----------|
| **관리자 비밀번호** | SHA-256 해싱 저장 (Web Crypto API), 기존 평문 자동 마이그레이션 |
| **API 키** | 서버사이드 환경 변수에만 저장, 클라이언트 번들에 미포함 |
| **API 호출** | AbortController 기반 30초 타임아웃 |
| **에러 처리** | React Error Boundary를 통한 런타임 에러 격리 및 안내 |
| **학생 데이터** | 브라우저 localStorage에만 저장, 서버 전송 없음 |
| **PIN 잠금** | 서버사이드 PIN 검증으로 API 키 접근 제어 |

---

## NPM 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (HMR, http://localhost:5173) |
| `npm run build` | 프로덕션 빌드 (dist/ 출력) |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run lint` | ESLint 코드 검사 |

---

## 라이선스

MIT License

---

> **"AI를 얼마나 잘 썼는가"가 아니라 "AI와 함께 얼마나 깊이 고민했는가"를 평가합니다.**
