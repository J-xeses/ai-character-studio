# ✨ AI Character Studio v2

AI 캐릭터 대본 자동생성 + 다국어 번역 플랫폼

## 주요 기능

- **대본 자동 생성** — 주제 입력 → Claude AI가 캐릭터 페르소나에 맞게 자동 작성
- **5개국어 번역** — 한국어 → 영어/베트남어/태국어/러시아어 자동 번역
- **메타데이터 생성** — 언어별 제목, 해시태그, 썸네일 문구 자동 생성
- **캐릭터 관리** — 여러 AI 캐릭터 페르소나 관리
- **생성 기록** — 이전 대본 기록 보관 및 복사

## 배포 방법 (Vercel)

### 1단계: GitHub 저장소 생성
1. github.com → New repository
2. 이름: `ai-character-studio`
3. 이 폴더의 파일 전부 업로드

### 2단계: Vercel 배포
1. vercel.com → Add New Project
2. `ai-character-studio` 저장소 Import
3. Framework: Next.js 자동 감지
4. Deploy 클릭

### 3단계: 환경변수 설정 (선택사항)
Vercel 대시보드 → Settings → Environment Variables
- 필요 없음! API 키는 앱 내 설정 탭에서 직접 입력

## 사용 방법

1. **설정 탭** → Claude API 키 입력 (console.anthropic.com에서 발급)
2. **스튜디오 탭** → 캐릭터 선택 + 주제 입력
3. **언어 선택** → 한국어만 또는 다국어 선택
4. **대본 생성 시작** 클릭
5. **복사 버튼** → P-Video Avatar에 붙여넣기 → 영상 생성!

## 비용

| 작업 | 비용 |
|------|------|
| 한국어 대본 1편 | 약 $0.003~0.005 |
| 5개국어 번역 | 약 $0.01~0.02 |
| 월 100편 | 약 $1~2 (1,500원) |

## 파일 구조

```
ai-character-studio/
├── pages/
│   └── index.js    ← 메인 플랫폼 전체
├── package.json
├── next.config.js
└── README.md
```
