# AI 채팅 평가 시스템 (AI Chat Evaluator)

AI(ChatGPT, Claude, Gemini 등)와의 채팅 기록을 **루브릭 기반**으로 분석하여 정량/정성적 피드백을 제공하는 교육용 웹 애플리케이션입니다.

## 주요 기능

### 학생용
- **AI 채팅 평가**: 채팅 내용을 붙여넣거나 파일 업로드하여 AI 기반 평가 수행
- **자기 평가**: AI 평가 전 자기 평가를 통해 메타인지 향상 (AI 평가와 비교)
- **성장 추적**: 평가 이력을 라인 차트로 시각화, 최고점/평균/변화량 표시
- **PDF 보고서**: 평가 결과를 PDF로 다운로드 (학번/이름 포함 가능)
- **근거 기반 피드백**: AI가 채팅 원문을 직접 인용(「」)하여 평가 근거 제시

### 교사용
- **루브릭 관리**: 커스텀 루브릭 생성/수정/삭제
- **교과별 템플릿**: 일반/글쓰기/과학탐구/코딩 4종 루브릭 템플릿 제공
- **JSON 불러오기**: 외부 루브릭을 JSON으로 가져오기
- **API 설정**: Gemini/OpenAI/Claude 모델 선택 및 K-run 평가 설정
- **생활기록부 초안**: AI가 생성한 생활기록부 문구 초안

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 19 + Vite 7 |
| 차트 | Chart.js + react-chartjs-2 |
| PDF | html2pdf.js |
| 라우팅 | React Router v7 |
| AI API | Gemini, OpenAI, Claude (클라이언트/서버 프록시) |
| 배포 | Vercel (Edge Functions) |
| 상태관리 | React Context (Auth/API/Evaluation 3분할) |

## 프로젝트 구조

```
src/
├── constants.js                     # 공통 상수 (등급 색상, 모델 목록 등)
├── context/
│   ├── AuthContext.jsx              # 관리자 인증 (SHA-256 해싱)
│   ├── APIContext.jsx               # API 설정 (프로바이더, 모델, K-run)
│   └── EvaluationContext.jsx        # 루브릭/평가 상태
├── components/
│   ├── admin/
│   │   ├── ApiSettingsTab.jsx       # API 설정 탭
│   │   ├── ModelSelector.jsx        # 재사용 모델 선택기
│   │   ├── RubricManageTab.jsx      # 루브릭 관리 탭
│   │   └── SecurityTab.jsx          # 보안 설정 탭
│   ├── evaluation/
│   │   ├── EvaluationResult.jsx     # 평가 결과 오케스트레이터
│   │   ├── ScoreOverview.jsx        # 점수 요약 + 특징
│   │   ├── RadarChart.jsx           # 레이더 차트
│   │   ├── CriteriaDetail.jsx       # 항목별 평가 상세
│   │   └── GrowthChart.jsx          # 성장 추적 라인 차트
│   ├── ChatInput.jsx                # 채팅 입력 (붙여넣기/파일)
│   ├── SelfEvaluation.jsx           # 자기 평가
│   ├── RubricEditor.jsx             # 루브릭 편집기
│   ├── RubricSelector.jsx           # 루브릭 선택기
│   ├── StudentGuide.jsx             # 학생 가이드
│   └── ErrorBoundary.jsx            # 에러 경계
├── services/
│   ├── providers/
│   │   ├── gemini.js                # Gemini API
│   │   ├── openai.js                # OpenAI API
│   │   ├── claude.js                # Claude API
│   │   └── index.js                 # 프로바이더 팩토리
│   ├── evaluator.js                 # 평가 오케스트레이터
│   ├── prompts.js                   # 평가 프롬프트
│   ├── responseParser.js            # 응답 파싱
│   ├── synthesis.js                 # K-run 결과 합성
│   ├── evaluationHistory.js         # 평가 이력 (localStorage)
│   ├── storage.js                   # 저장소 + 비밀번호 해싱
│   └── utils.js                     # fetchWithTimeout
├── data/
│   └── rubricTemplates.js           # 교과별 루브릭 템플릿 4종
└── pages/
    ├── Home.jsx                     # 메인 (평가 흐름)
    └── Admin.jsx                    # 관리자 설정
```

## 시작하기

### 설치

```bash
git clone https://github.com/greatsong/2026aichattingreader.git
cd 2026aichattingreader
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에서 필요한 값을 설정:

```env
# API 키 (서버 프록시용, 선택사항)
SECRET_GEMINI_API_KEY=your-key
SECRET_OPENAI_API_KEY=your-key
SECRET_CLAUDE_API_KEY=your-key

# PIN 잠금 (학생에게 API 키를 숨기고 PIN으로 해제)
SECRET_API_PIN=1234
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

## 배포

Vercel에 배포됩니다. `api/` 디렉토리의 Edge Functions가 서버 프록시로 동작합니다.

## 보안

- 관리자 비밀번호는 **SHA-256 해싱**으로 저장 (기존 평문은 자동 마이그레이션)
- API 키는 **서버 사이드에만** 저장 (클라이언트 번들에 미포함)
- API 호출에 **30초 타임아웃** 적용 (AbortController)
- Error Boundary로 런타임 에러 처리
- 학생 데이터는 **localStorage에만** 저장 (서버 전송 없음)

## 라이선스

MIT
