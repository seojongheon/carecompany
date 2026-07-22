# 위생의 기술 포트폴리오 웹사이트
# Figma UI 제작 에이전트용 마스터 프롬프트

아래 내용을 그대로 Figma 작업 에이전트의 상위 프롬프트로 사용하라.

---

## 0. 기술 스택과 구현 환경

이 프로젝트의 UI는 아래 기술 스택으로 구현될 예정이다. Figma 디자인은 실제 구현 구조와 자연스럽게 대응해야 하며, 구현하기 어려운 장식 위주의 화면을 만들지 마라.

### 프론트엔드

- Next.js 16.2.x
- App Router
- React Server Components
- TypeScript strict mode
- Node.js 24 LTS
- pnpm
- Tailwind CSS 4
- shadcn/ui
- Radix UI
- Lucide React

### 백엔드 및 데이터

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- `supabase-js`
- `@supabase/ssr`
- Supabase Row Level Security
- Supabase SQL migrations
- Supabase Database generated TypeScript types

### 폼, 업로드, 미디어

- Zod
- React Hook Form
- Uppy
- TUS resumable upload
- Next.js Image
- Yet Another React Lightbox 또는 동급의 접근 가능한 경량 라이트박스
- YouTube URL 기반 lazy embed
- 영상 파일 직접 업로드는 하지 않음

### 배포 및 품질

- Vercel
- Vitest
- React Testing Library
- Playwright
- Sentry
- Vercel Analytics
- Google Search Console
- 네이버 검색 등록

### 기술 스택이 디자인에 주는 제약

1. UI 컴포넌트는 shadcn/ui와 Radix UI로 구현 가능한 구조를 우선한다.
2. Dialog, Sheet, Tabs, Accordion, Dropdown, Select, Toast, Alert Dialog 등은 Radix 계열의 접근 가능한 상호작용 패턴과 맞춰라.
3. 간격, 색상, radius, typography는 Tailwind 토큰으로 옮기기 쉽게 일관된 변수 체계를 사용하라.
4. 공개 페이지의 본문은 서버 렌더링될 예정이므로 핵심 설명을 이미지나 hover 상태 안에 숨기지 마라.
5. 빠른보기 모달은 Next.js Intercepting Routes와 Parallel Routes로 구현한다. 모달과 독립 상세페이지가 같은 사례 URL을 사용한다.
6. 사진은 Next.js Image로 최적화하므로 고정된 비율, width/height 확보, object-fit cover를 전제로 디자인하라.
7. 관리자 사진 업로드는 브라우저에서 Supabase Storage로 직접 전송하며, 모바일 네트워크 중단을 고려한 진행률·실패·재시도 UI가 필요하다.
8. 고객용 UI에는 비공개 데이터가 전달되지 않는다. 비공개 카드나 잠금 슬롯을 디자인하지 마라.
9. YouTube iframe은 최초 로딩하지 않는다. 썸네일과 재생 버튼을 먼저 보여주는 lazy embed 컴포넌트를 디자인하라.
10. 고객 견적 폼은 현재 MVP 범위가 아니다. 우측 하단의 원형 `+` 플로팅 버튼만 디자인하고, 폼·패널·바텀시트는 만들지 마라.

---

## 1. 에이전트 역할과 작업 목표

당신은 Figma MCP를 사용하는 시니어 프로덕트 디자이너이자 디자인 시스템 엔지니어다.

아래 요구사항을 설명으로만 정리하지 말고, 실제 Figma 파일에 다음 결과물을 만들어라.

- 고객용 반응형 웹사이트
- 모바일 우선 관리자 화면
- 공통 디자인 시스템
- 재사용 가능한 컴포넌트와 variants
- 주요 interaction state
- 핵심 화면 간 prototype 연결
- 개발자가 바로 구현에 참고할 수 있는 레이어 구조와 명명
- 모바일과 데스크톱 화면
- 오류, 빈 상태, 로딩, 업로드 제한 상태
- 접근성과 반응형 규칙이 반영된 UI

대상 Figma 파일이나 file key가 제공되면 해당 파일을 사용하라. 대상 파일이 없다면 다음 이름으로 새 Figma 파일을 만들어라.

`위생의 기술 — 청소 포트폴리오 Web & Admin`

기존 파일에 디자인 시스템이나 라이브러리가 있으면 먼저 조사하고 재사용하라. 적절한 시스템이 없다면 이 프롬프트에 맞는 로컬 variables, text styles, effect styles, components를 만든다.

작업 중 불필요한 확인 질문으로 멈추지 말고 합리적인 기본값으로 진행하라. 확정되지 않은 실제 가격, 연락처, 사업자번호, 로고 파일은 교체 가능한 placeholder로 배치하고 `99_Notes` 페이지에 명확히 기록하라.

---

## 2. 프로젝트 이해를 위한 핵심 컨텍스트

### 2.1 브랜드

- 브랜드명: `위생의 기술`
- 기존 로고가 있지만 현재 Figma 작업에는 파일이 제공되지 않았다.
- 로고는 파란색 계열이며 아이코닉한 인상을 가진다.
- 헤더와 푸터에 실제 로고가 나중에 교체될 수 있는 가변 너비 logo slot을 만들어라.
- 임시 로고는 간단한 파란색 아이콘 placeholder와 `위생의 기술` 텍스트 조합으로 표현하라.
- 로고 자체를 새롭게 브랜딩하거나 확정하지 마라.

### 2.2 제품의 목적

이 웹사이트는 단순 회사 소개나 사진 보관함이 아니다.

고객에게는 다음 질문에 빠르게 답하는 영업형 포트폴리오다.

- 이 업체가 내가 필요한 청소를 하는가?
- 나와 비슷한 현장을 작업한 경험이 있는가?
- 실제 전후 결과를 믿을 수 있는가?
- 작업 범위와 가격 정책을 이해할 수 있는가?

관리자에게는 현장에서 휴대전화로 사진을 올리고, 나중에 정리해 공개하는 모바일 우선 콘텐츠 관리 도구다.

### 2.3 주요 서비스

홈에서 아래 네 서비스를 각각 독립 카드로 바로 선택한다.

1. 화장실 청소
2. 에어컨 청소
3. 아파트 유리창 청소
4. 상가 유리창 청소

유리창 청소를 먼저 누르고 다시 아파트·상가를 선택하는 중간 화면은 만들지 마라.

### 2.4 주요 지역

- 천안
- 아산

다른 지역용 랜딩페이지나 필터는 MVP에서 고려하지 않는다. 다만 화면 문구와 데이터 구조는 향후 지역 확장을 막지 않아야 한다.

### 2.5 포트폴리오 탐색 구조

고객 흐름은 다음과 같다.

`홈 → 서비스 상세페이지 → 여러 현장 사례 그리드 → 빠른보기 모달 → 개별 현장 상세페이지 → 사진 라이트박스`

화장실 청소는 예시일 뿐이며 같은 구조를 네 서비스 모두에 적용한다.

### 2.6 사례 수

- 사례가 이미 많고 계속 쌓인다고 가정한다.
- 서비스 페이지는 사진 중심의 여러 사례를 효율적으로 탐색해야 한다.
- 무한 스크롤은 사용하지 않는다.
- 최초 사례 묶음 뒤에는 명확한 `사례 더 보기` 버튼을 둔다.
- 목록은 Pinterest식 masonry가 아니라 일정한 비율의 정돈된 grid다.

### 2.7 공개와 비공개

- 새 사례 기본 상태는 비공개다.
- 관리자가 공개해야 고객에게 노출된다.
- 비공개 사례는 고객 화면에서 완전히 존재하지 않는 것처럼 처리한다.
- 고객 UI에 빈 슬롯, 자물쇠, `비공개`, 숨겨진 개수, 번호 누락을 표시하지 마라.
- 비공개 URL은 일반 404와 동일하게 처리한다.
- 사례 전체는 공개하면서 일부 사진만 비공개로 둘 수 있다.
- 고객용 사진 개수와 번호는 공개 사진만 기준으로 다시 계산한다.

### 2.8 사진 업로드

관리자는 휴대전화로 사용한다.

- 한 번의 파일 선택: 최대 20장
- 한 사례 전체: 최대 69장
- 여러 차례 나누어 추가 가능
- 사진은 작업 전, 작업 과정, 작업 후, 세부 사진으로 분류
- 대표 사진 지정
- 사진별 공개·비공개
- 다중 선택과 일괄 단계 변경
- 그룹 안에서 순서 변경
- 업로드 완료 사진 자동 보존
- 일부 실패 시 성공 파일 유지
- 실패 파일만 재시도

### 2.9 영상

- 영상 파일을 직접 업로드하지 않는다.
- 관리자가 YouTube 링크를 입력한다.
- 사례당 최대 3개
- 일반 영상, youtu.be, Shorts URL을 지원한다.
- 고객 화면에서는 썸네일과 재생 버튼을 먼저 보여주고 클릭 후 iframe을 로딩한다.
- 자동 재생하지 않는다.

### 2.10 가격

- 개별 포트폴리오 사례에는 당시 작업 비용을 표시하지 않는다.
- 독립적인 `가격 안내` 페이지를 둔다.
- 각 서비스 페이지 하단에는 해당 서비스의 짧은 가격 요약과 `전체 가격표 보기` 버튼을 둔다.
- 실제 가격 값은 아직 확정되지 않았다.
- Figma에는 현실적인 길이의 샘플 가격 텍스트를 사용하되, `99_Notes` 페이지에 반드시 `샘플 가격이며 구현 전 실제 값으로 교체`라고 기록한다.
- 고객 화면에는 `샘플`이라는 배지를 넣지 마라.

### 2.11 견적 플로팅 버튼

- 고객 화면 우측 하단에 원형 `+` 버튼을 고정한다.
- 미래의 사진 첨부 견적 폼 진입점이다.
- 지금은 버튼만 만든다.
- 클릭 후 열리는 폼, 메뉴, 바텀시트, 팝오버를 디자인하지 마라.
- desktop hover에서는 작은 tooltip `사진 견적`을 보여줘도 된다.
- 모달과 라이트박스가 열린 동안 버튼은 숨긴다.

---

## 3. 전체 디자인 방향

### 3.1 인상

다음 인상을 동시에 만들어라.

- 청결함
- 정돈됨
- 전문성
- 친근함
- 실제 현장감
- 사진에 대한 신뢰
- 과장되지 않은 자신감

다음 인상은 피하라.

- 병원·제약 회사처럼 차갑고 무거움
- 저가 전단지처럼 색이 많고 산만함
- 테크 스타트업처럼 네온 gradient가 강함
- 고급 호텔처럼 사진보다 장식이 앞섬
- SNS 복제품처럼 좋아요·댓글 중심
- 건설 현장처럼 지나치게 거칠고 어두움

### 3.2 색상 variables

실제 로고 교체를 고려해 모든 색을 variables로 만들어라. 아래는 초기 기준이며 logo 색상에 맞춰 한 번에 교체 가능해야 한다.

#### Brand

- `Brand/50`: #EFF6FF
- `Brand/100`: #DBEAFE
- `Brand/500`: #2F75E8
- `Brand/600`: #1F63D6
- `Brand/700`: #174EAD
- `Brand/900`: #16315F

#### Neutral

- `Neutral/0`: #FFFFFF
- `Neutral/50`: #F8FAFC
- `Neutral/100`: #F1F5F9
- `Neutral/200`: #E2E8F0
- `Neutral/400`: #94A3B8
- `Neutral/500`: #64748B
- `Neutral/700`: #334155
- `Neutral/900`: #0F172A

#### Semantic

- `Success/600`: #15803D
- `Warning/600`: #B45309
- `Danger/600`: #DC2626
- `Focus`: Brand/500
- `Overlay`: rgba(15, 23, 42, 0.68)

강한 cyan, 보라색, 빨간색을 브랜드 장식으로 사용하지 마라. Success와 Danger는 관리자 상태와 오류에만 제한적으로 사용한다.

### 3.3 Typography

선호 글꼴:

1. Pretendard
2. Pretendard가 없으면 Noto Sans KR

Inter를 기본 한글 폰트로 사용하지 마라.

텍스트 styles를 만들고 모든 화면에서 재사용하라.

#### Desktop type scale

- Display: 56/68, Bold
- H1: 48/60, Bold
- H2: 36/46, Bold
- H3: 26/36, SemiBold
- H4: 20/30, SemiBold
- Body Large: 18/30, Regular
- Body: 16/26, Regular
- Body Strong: 16/26, SemiBold
- Small: 14/22, Regular
- Caption: 12/18, Medium
- Button: 15/20, SemiBold

#### Mobile type scale

- H1: 34/43, Bold
- H2: 28/37, Bold
- H3: 22/31, SemiBold
- H4: 18/27, SemiBold
- Body Large: 17/28
- Body: 16/26
- Small: 14/21
- Caption: 12/18

본문을 16px보다 작게 만들지 마라. 보조 정보가 많아도 지나치게 연한 회색을 사용하지 마라.

### 3.4 Spacing variables

다음 간격 체계를 기본으로 사용한다.

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48
- 64
- 80
- 96
- 120

기본 page section vertical spacing:

- Desktop: 88~104
- Tablet: 64~80
- Mobile: 48~64

### 3.5 Radius

- Small control: 8
- Button/Input: 10~12
- Card: 16
- Large media card: 20
- Modal: 24
- Pill/Chip/FAB: Full

### 3.6 Shadow

그림자는 작고 부드럽게 사용한다.

- `Shadow/Card`: 매우 약한 y 4~12 blur
- `Shadow/Floating`: FAB와 modal에만 중간 강도
- 대부분의 카드 구분은 border와 surface 차이로 해결한다.

### 3.7 Grid와 frame

#### Customer desktop

- Frame width: 1440
- Main content max width: 1200
- 12-column grid
- Gutter: 24
- 좌우 최소 margin: 80, 일반적으로 120
- Header height: 72

#### Customer mobile

- Frame width: 390
- 4-column grid
- 좌우 margin: 16
- Gutter: 12
- Header height: 60
- 기준 viewport height: 844

#### Tablet reference

- Frame width: 768
- 8-column grid
- margin: 32
- full screen을 모두 만들 필요는 없지만 핵심 component responsive behavior를 Notes에 기록하라.

#### Admin desktop

- Frame width: 1440
- Sidebar: 240
- Top bar: 64
- Main padding: 32
- Main content max width: 1180

#### Admin mobile

- Frame width: 390
- App bar: 56
- 좌우 margin: 16
- sticky bottom action area: 72 + safe area

### 3.8 이미지 비율

- 서비스 카드: 4:3
- 포트폴리오 카드: 4:3
- 히어로 대표 이미지: desktop 5:4 또는 4:3
- 대표 전후 비교: desktop 16:10, mobile 4:3
- 상세 갤러리: 주로 4:3
- YouTube 썸네일: 16:9
- 사진은 `Fill`로 배치하고 중요한 부분이 잘리지 않도록 focal point를 고려한다.

실제 청소 사진이 제공되지 않으면 무리해서 저작권 불명확한 이미지를 사용하지 마라. 파란색·중립색 기반의 photo placeholder를 사용하고 각 frame 이름과 overlay label로 다음을 명확히 구분하라.

- 화장실 작업 전
- 화장실 작업 후
- 에어컨 분해 과정
- 아파트 유리창 작업 후
- 상가 쇼윈도 작업 전

사진 placeholder는 나중에 실제 사진으로 한 번에 교체하기 쉽게 component property 또는 image fill frame으로 구성한다.

---

## 4. Figma 파일 구조

다음 Figma pages를 만들어라.

1. `00_Cover`
2. `01_Foundations`
3. `02_Components`
4. `10_Customer_Desktop`
5. `11_Customer_Mobile`
6. `20_Admin_Desktop`
7. `21_Admin_Mobile`
8. `30_Prototype_Flows`
9. `99_Notes`

### 4.1 `00_Cover`

- 프로젝트명
- 한 줄 설명
- 버전
- 주요 기술 스택 요약
- 고객용 UI와 관리자 UI의 대표 thumbnail
- `MVP UI / 실제 로고·가격·연락처 추후 교체` 표시

### 4.2 `01_Foundations`

- color variables
- typography styles
- spacing scale
- radius scale
- shadow styles
- desktop/mobile grids
- icon size 규칙
- image ratio 규칙
- 접근성 contrast 예시

### 4.3 `02_Components`

재사용 component와 variant를 만든다. flat한 one-off frame을 반복해서 만들지 마라.

### 4.4 화면 page

각 화면 frame 이름은 다음 형식을 사용한다.

`C-Web/D/Home`
`C-Web/M/Home`
`C-Web/D/Service-Bathroom`
`C-Web/M/Service-Bathroom`
`A-Admin/D/Portfolio-List`
`A-Admin/M/Portfolio-Upload-Progress`

C는 Customer, A는 Admin, D는 Desktop, M은 Mobile을 의미한다.

---

## 5. 공통 컴포넌트

### 5.1 고객용 컴포넌트

- `Web/Header`
- `Web/MobileMenu`
- `Web/Footer`
- `Web/LogoSlot`
- `Web/Button`
- `Web/IconButton`
- `Web/FAB-Estimate`
- `Web/Breadcrumb`
- `Web/SectionHeader`
- `Web/StickySectionTabs`
- `Web/ServiceCard`
- `Portfolio/Card`
- `Portfolio/CardMedia`
- `Portfolio/BeforeAfter`
- `Portfolio/FilterChip`
- `Portfolio/FilterGroup`
- `Portfolio/QuickView`
- `Portfolio/GalleryGrid`
- `Portfolio/GalleryImage`
- `Portfolio/Lightbox`
- `Portfolio/MetadataItem`
- `Portfolio/RelatedCard`
- `Media/YouTubeLazy`
- `Pricing/PriceCard`
- `Pricing/PriceTableRow`
- `Web/ProcessStep`
- `Web/TrustItem`
- `Web/FAQItem`
- `Web/EmptyState`
- `Web/ErrorState`
- `Web/SkeletonCard`
- `Web/Toast`

### 5.2 관리자 컴포넌트

- `Admin/Sidebar`
- `Admin/AppBar`
- `Admin/MobileNavigation`
- `Admin/PageHeader`
- `Admin/StatCard`
- `Admin/PortfolioRow`
- `Admin/PortfolioMobileCard`
- `Admin/StatusBadge`
- `Admin/FilterChip`
- `Admin/FormField`
- `Admin/Select`
- `Admin/Textarea`
- `Admin/UploadDropzone`
- `Admin/UploadCounter`
- `Admin/UploadItem`
- `Admin/UploadProgress`
- `Admin/PhotoTile`
- `Admin/PhotoSelectionBar`
- `Admin/PhotoStageTabs`
- `Admin/YouTubeCard`
- `Admin/StickyActionBar`
- `Admin/PrivacyChecklist`
- `Admin/ConfirmDialog`
- `Admin/ContentStatusBanner`
- `Admin/DraftPublishedBadge`
- `Admin/PageSectionEditor`
- `Admin/ContentItemRow`
- `Admin/ReorderHandle`
- `Admin/SiteMediaPicker`
- `Admin/MediaUsageList`
- `Admin/PreviewViewportSwitch`
- `Admin/PublishValidationSummary`
- `Admin/VersionHistoryItem`
- `Admin/EmptyState`
- `Admin/ErrorState`
- `Admin/Toast`

### 5.3 필수 variants와 states

해당되는 컴포넌트에는 아래 상태를 variants 또는 properties로 만든다.

- Default
- Hover
- Focus
- Pressed
- Active
- Disabled
- Loading
- Error
- Selected
- Public
- Private
- Uploading
- Uploaded
- Failed

Button variants:

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Icon only

Button sizes:

- Small
- Medium
- Large

Portfolio card properties:

- Service category
- Has before/after
- Has video
- Image count visibility
- Hover
- Loading

---

# 6. 전역 고객용 레이아웃

## 6.1 데스크톱 헤더

높이 72, 흰색 surface, 아래 얇은 border.

### 왼쪽

- 가변 너비 logo slot
- 임시 아이콘 + `위생의 기술`

### 중앙 또는 오른쪽 nav

- 홈
- 청소 서비스
- 전체 사례
- 가격 안내
- 작업 과정
- 업체 소개

`청소 서비스`는 dropdown을 사용한다.

Dropdown 항목:

- 화장실 청소
- 에어컨 청소
- 아파트 유리창 청소
- 상가 유리창 청소

현재 페이지 active 상태를 굵기와 파란색 underline 또는 text color로 표시한다.

헤더에는 별도의 큰 견적 CTA를 넣지 마라. 견적 진입은 우측 하단 `+` 버튼으로 통일한다.

## 6.2 모바일 헤더

높이 60.

### 왼쪽

- logo slot

### 오른쪽

- 44×44 menu icon button
- Lucide `Menu`
- 접근 가능한 label `메뉴 열기`

모바일 메뉴는 오른쪽 Sheet 또는 전체 높이 navigation panel로 디자인한다.

메뉴 순서:

- 홈
- 화장실 청소
- 에어컨 청소
- 아파트 유리창 청소
- 상가 유리창 청소
- 전체 사례
- 가격 안내
- 작업 과정
- 업체 소개

하단에는 사업 지역 문구:

`천안·아산 중심 청소 서비스`

## 6.3 플로팅 `+` 버튼

### Desktop

- 크기 64×64
- 우측 32
- 하단 32
- Brand/600 background
- 흰색 Lucide Plus 28
- 중간 정도 shadow
- hover 시 약간 위로 이동하거나 배경이 Brand/700
- hover tooltip `사진 견적`
- focus ring
- 클릭 후 패널 디자인 없음

### Mobile

- 크기 56×56
- 우측 16
- 하단 safe area 포함 20~24
- modal, lightbox, mobile menu가 열리면 숨김
- 사진과 중요한 버튼을 가리지 않도록 배치

## 6.4 푸터

Desktop은 4열, mobile은 세로 stack.

### 상단/왼쪽

- logo slot
- 짧은 브랜드 문구:
  `실제 작업 결과로 신뢰를 보여주는 천안·아산 청소 서비스`

### 링크 그룹 1: 청소 서비스

- 화장실 청소
- 에어컨 청소
- 아파트 유리창 청소
- 상가 유리창 청소

### 링크 그룹 2: 안내

- 전체 사례
- 가격 안내
- 작업 과정
- 업체 소개
- 개인정보처리방침

### 사업 정보

교체 가능한 placeholder:

- 대표자: `{{대표자명}}`
- 사업자등록번호: `{{사업자등록번호}}`
- 연락처: `{{연락처}}`
- 활동 지역: 천안·아산

### 최하단

- Copyright
- 개인정보처리방침 링크
- 매우 연한 Neutral/50 배경 또는 흰색과 border

---

# 7. 고객용 화면 상세 설계

# 7.1 홈 — Desktop

Frame: `C-Web/D/Home`, width 1440

## 상단

### 1. Header

전역 desktop header 사용.

### 2. Hero

높이를 과도하게 크게 만들지 말고, 첫 viewport 안에서 서비스 영역 일부가 보이도록 한다.

2-column layout:

- 왼쪽 5 columns
- 오른쪽 7 columns
- gap 56~64

#### 왼쪽 상단 eyebrow

작은 blue pill 또는 plain label:

`천안·아산 청소 포트폴리오`

#### H1

`청소 결과를 말이 아닌 실제 현장으로 보여드립니다.`

2~3줄, H1 style.

#### 본문

`화장실, 에어컨, 아파트 유리창, 상가 유리창까지. 작업 전·과정·후 사진을 현장별로 확인하세요.`

#### 버튼 row

- Primary: `작업 사례 보기`
- Secondary outline: `가격 안내`

Primary는 전체 사례 section anchor 또는 전체 사례 페이지와 연결한다.
Secondary는 가격 안내 페이지와 연결한다.

#### 짧은 신뢰 문구

아이콘 2~3개를 한 줄에 너무 많이 쓰지 말고 작은 text list로 표시:

- 실제 작업 사진
- 천안·아산 중심
- 현장별 상세 기록

#### 오른쪽 이미지

- 큰 4:3 또는 5:4 photo frame
- 대표 작업 후 사진
- 우측 하단 또는 좌측 하단에 작은 before thumbnail을 겹쳐 전후 변화를 암시
- 과한 collage 금지
- 이미지 위에 긴 카피 금지

## 중단

### 3. 서비스 선택 section

Section label:
`청소 서비스`

H2:
`필요한 청소를 바로 선택하세요`

보조 문구:
`서비스별 실제 현장 사례와 작업 범위를 확인할 수 있습니다.`

4-column service card.

각 카드:

1. `화장실 청소`
   - 설명: `물때·곰팡이·요석부터 타일과 줄눈까지`
2. `에어컨 청소`
   - 설명: `벽걸이·스탠드·시스템형 분해 세척`
3. `아파트 유리창 청소`
   - 설명: `베란다 유리·창틀·방충망을 한눈에`
4. `상가 유리창 청소`
   - 설명: `쇼윈도·출입문·외부 유리 관리`

카드 구조:

- 4:3 이미지
- 서비스명
- 한 줄 설명
- 우측 arrow icon
- 카드 전체 click
- hover 시 image scale은 매우 작게, border 또는 shadow 강조
- 카드 높이 통일

### 4. 대표 전후 section

좌우 layout.

왼쪽:

- eyebrow `대표 작업 전후`
- H2 `사진 한 장보다 전후를 함께 보세요`
- 설명
- 서비스 filter tabs 4개

오른쪽:

- 큰 before/after component
- 좌측 `청소 전`, 우측 `청소 후`
- draggable handle을 암시하는 중앙 control
- 아래에 사례명과 지역:
  `천안시 서북구 상가 화장실 청소`
- text link `전체 사례 보기`

### 5. 최근·추천 사례 section

상단 row:

- H2 `최근 작업 사례`
- 오른쪽 text button `전체 사례 보기`

3-column grid, 6 cards.

샘플 제목:

- `천안 아파트 화장실 물때·곰팡이 청소`
- `아산 시스템 에어컨 분해 세척`
- `천안 아파트 베란다 유리창·창틀 청소`
- `아산 카페 쇼윈도 유리 청소`
- `천안 상가 화장실 요석 집중 청소`
- `아산 아파트 방충망·유리창 청소`

각 카드 하단:

- service label
- title 최대 2줄
- `천안시 서북구 · 아파트`
- optional icons `사진 18`, `영상`
- 실제 가격 없음

## 하단

### 6. 작업 과정 요약

Neutral/50 또는 Brand/50의 넓은 surface.

H2:
`문의부터 결과 확인까지 간단하게`

4개 process steps:

1. `현장 정보 확인`
2. `작업 범위 안내`
3. `방문 청소`
4. `결과 확인`

각 step은 숫자, 간단한 line icon, 한 문장 설명을 가진다.

버튼:
`작업 과정 자세히 보기`

### 7. 가격 안내 preview

2-column layout.

왼쪽:

- eyebrow `가격 안내`
- H2 `서비스별 기준 가격을 미리 확인하세요`
- 본문:
  `실제 비용은 공간 크기, 오염도, 작업 범위에 따라 달라질 수 있습니다. 개별 사례에는 당시 작업비를 표시하지 않습니다.`
- Primary 또는 outline button `전체 가격표 보기`

오른쪽:

서비스별 작은 가격 summary cards 4개.
샘플 값 사용:

- 화장실 청소 `80,000원부터`
- 에어컨 청소 `가격 유형별 안내`
- 아파트 유리창 `현장 조건별 안내`
- 상가 유리창 `면적 확인 후 안내`

이 값은 시각 샘플이며 Notes에 교체 필요를 기록한다.

### 8. 신뢰 요소 section

H2:
`작업 사진을 안심하고 공개하는 기준`

3개의 trust item:

- `실제 현장 중심`
- `작업 범위 사전 안내`
- `공개 전 개인정보 확인`

허위 후기 숫자, 별점, 인증 badge, 경력 수치를 만들지 마라.

### 9. Footer

전역 footer 사용.

---

# 7.2 홈 — Mobile

Frame: `C-Web/M/Home`, width 390

## 상단

- mobile header
- hero는 세로 stack
- eyebrow
- H1
- 본문
- 버튼 2개를 세로 또는 첫 버튼 full width, 둘째 outline full width
- 대표 이미지는 텍스트 아래
- 이미지 위에 작은 전후 label만 사용

## 중단

### 서비스

- 2×2 grid
- card image 4:3
- 설명은 2줄 이내
- 카드 padding 12~16

### 대표 전후

- filter chips는 가로 scroll
- compare component 4:3
- 아래 사례명과 link

### 최근 사례

- 2-column grid
- title 2줄
- location small
- 카드 사이 gap 12
- 사진 세부가 너무 작아지면 1-column 전환을 고려하되 기본 시안은 2열

## 하단

- process step은 세로 timeline 또는 2×2
- price preview는 세로 카드
- trust item 세로 stack
- footer accordion 또는 간결한 세로 링크
- FAB 56×56

---

# 7.3 서비스 상세 공통 템플릿 — Desktop

아래 템플릿으로 네 서비스 frame을 모두 만든다.

- `C-Web/D/Service-Bathroom`
- `C-Web/D/Service-Aircon`
- `C-Web/D/Service-ApartmentWindow`
- `C-Web/D/Service-CommercialWindow`

공통 layout은 component와 instance로 재사용하고 콘텐츠만 교체한다.

## 상단

### 1. Header

전역 header.

### 2. Breadcrumb

예:
`홈 / 청소 서비스 / 화장실 청소`

### 3. Service hero

2-column.

왼쪽:

- service eyebrow
- H1
- 2~3문장 설명
- Primary button `사례부터 보기`
- Secondary button `가격 확인`

오른쪽:

- 대표 작업 사진
- service-specific 작은 detail image 1개

서비스별 copy:

#### 화장실 청소

H1:
`화장실 청소`

본문:
`물때, 곰팡이, 요석, 석회, 타일과 줄눈까지 공간 상태에 맞는 범위로 청소합니다. 실제 주거지와 상가 현장을 비교해보세요.`

#### 에어컨 청소

H1:
`에어컨 청소`

본문:
`벽걸이형, 스탠드형, 시스템형 에어컨의 내부 오염과 필터를 분해 세척합니다. 겉으로 보이지 않는 작업 과정까지 확인하세요.`

#### 아파트 유리창 청소

H1:
`아파트 유리창 청소`

본문:
`베란다 유리, 창틀, 방충망의 먼지와 물때를 공간 구조에 맞춰 청소합니다. 시야와 창틀 상태의 변화를 실제 사례로 확인하세요.`

#### 상가 유리창 청소

H1:
`상가 유리창 청소`

본문:
`쇼윈도, 출입문, 외부 유리를 매장 운영과 작업 환경에 맞춰 관리합니다. 매장 전체 인상이 달라지는 전후 결과를 확인하세요.`

### 4. Sticky section tabs

Header 아래에 sticky.

- 서비스 소개
- 작업 범위
- 시공 사례
- 작업 과정
- 가격
- FAQ

현재 section active state를 보여준다.

## 중단

### 5. 서비스 요약과 대표 전후

왼쪽 설명, 오른쪽 before/after 또는 반대로 배치.

서비스별로 주요 문제 3개를 작은 bullet 또는 metadata list로 제공한다.

예: 화장실

- 물때와 석회
- 곰팡이와 줄눈
- 변기·세면대·샤워부스

### 6. 작업 범위

H2:
`어디까지 청소하나요?`

4~6개의 scope cards.

화장실 예:

- 변기
- 세면대
- 샤워부스
- 바닥과 벽면
- 타일·줄눈
- 환풍구 주변

에어컨 예:

- 필터
- 열교환기
- 송풍부
- 커버와 부품
- 배수부
- 외관

아파트 유리창:

- 유리
- 창틀
- 방충망
- 베란다
- 손잡이 주변
- 가능한 외부면

상가 유리창:

- 쇼윈도
- 출입문
- 외부 유리
- 프레임
- 매장 전면
- 정기 관리 범위

각 card는 line icon, 제목, 1줄 설명으로 구성한다.

### 7. 현장 사례 section

상단:

- eyebrow `실제 작업 사례`
- H2 `비슷한 현장을 찾아보세요`
- 공개 사례 수는 실제 데이터가 있을 때만 표시한다. 고정된 과장 숫자를 만들지 마라.

Filter area:

- 1행 service-specific chip
- desktop에서 wrap 가능
- 선택 chip은 Brand/600 background 또는 Brand/50 + border
- `전체`가 첫 항목

Filter examples는 PRD의 태그를 사용한다.

Grid:

- 3 columns, wide desktop 4 columns 가능
- 첫 화면 12~16 cards를 가정
- Figma frame에는 최소 8~12 card를 배치해 밀도를 보여라.
- 같은 component instance 사용
- 4:3 image
- title 2줄
- location 1줄
- max 2 visible tags
- `+2`처럼 나머지 태그 수 표현 가능
- card click은 quick view modal prototype으로 연결

Load more:

- grid 아래 중앙
- outline large button
- text `사례 더 보기`
- 우측 또는 내부에 아래 chevron
- 무한 스크롤 표현 금지

## 하단

### 8. 작업 과정

H2:
`이 서비스는 이렇게 진행합니다`

5~6단계 horizontal timeline 또는 cards.

예:

1. 현장 사진 확인
2. 작업 범위 안내
3. 일정 확정
4. 현장 보호
5. 청소 작업
6. 결과 확인

### 9. 서비스 가격 요약

Brand/50 또는 Neutral/50 surface.

왼쪽:

- H2 `[서비스명] 가격 안내`
- 가격은 작업 범위와 상태에 따라 달라질 수 있다는 설명
- 사례 당시 비용과 연결되지 않는다는 짧은 안내

오른쪽:

- 2~3개의 price summary card
- 샘플 가격 및 포함 범위
- button `전체 가격표 보기`

### 10. FAQ

6개 이하 accordion.

예시 공통 질문:

- 사진만으로 작업 가능 여부를 확인할 수 있나요?
- 작업 시간은 얼마나 걸리나요?
- 현장에서 추가 비용이 발생할 수 있나요?
- 청소 전에 준비해야 할 것이 있나요?
- 주말 작업이 가능한가요?
- 작업 범위는 어떻게 확정하나요?

### 11. 다른 서비스

H2:
`다른 청소 서비스도 확인하세요`

현재 서비스를 제외한 3개 compact service cards.

### 12. Footer

전역 footer.

### 13. FAB

전역 `+` button.

---

# 7.4 서비스 상세 — Mobile

네 서비스 mobile frame도 모두 만든다.

- `C-Web/M/Service-Bathroom`
- `C-Web/M/Service-Aircon`
- `C-Web/M/Service-ApartmentWindow`
- `C-Web/M/Service-CommercialWindow`

## 상단

- mobile header
- breadcrumb는 한 줄 축약 또는 뒤로가기 + 현재 서비스명
- hero text first
- buttons full width 또는 2열
- image below
- sticky tabs는 header 아래 가로 스크롤

## 중단

- service summary 세로
- before/after 4:3
- scope cards 2열
- filter chips 가로 scroll 또는 줄바꿈
- portfolio grid 2열
- load more full width 또는 중앙 wide button

## 하단

- process는 세로 timeline
- price cards 세로
- FAQ accordion full width
- 다른 서비스 1열 또는 horizontal cards
- footer
- FAB

---

# 7.5 전체 사례 페이지 — Desktop

Frame: `C-Web/D/Portfolio-All`

## 상단

- header
- breadcrumb
- H1 `전체 작업 사례`
- 설명:
  `화장실, 에어컨, 아파트 유리창, 상가 유리창의 공개된 작업 사례를 한곳에서 확인하세요.`

Category chips:

- 전체
- 화장실
- 에어컨
- 아파트 유리창
- 상가 유리창

## 중단

- 선택된 category 아래 optional secondary filters
- 3~4 column portfolio grid
- 최소 12 cards
- service label이 card에서 명확해야 한다.
- filter state를 보여주는 active chip
- loading skeleton 예시 frame을 별도로 만든다.
- no-result state frame도 별도로 만든다.

## 하단

- `사례 더 보기`
- 간단한 service navigation
- footer
- FAB

---

# 7.6 전체 사례 페이지 — Mobile

Frame: `C-Web/M/Portfolio-All`

- header
- H1
- category chip horizontal scroll
- optional filters
- 2-column grid
- load more
- footer
- FAB

No-result state:

- 단순한 image/icon
- `선택한 조건에 공개된 사례가 아직 없습니다.`
- button `필터 초기화`
- 숨겨진 사례 개수나 비공개 문구 없음

---

# 7.7 사례 빠른보기 모달 — Desktop

Frame 또는 overlay component:
`C-Web/D/Portfolio-QuickView`

크기 기준:

- 약 1120×760
- viewport 안 여백 최소 32
- radius 24
- overlay dark 68%
- background scroll lock을 가정

## 모달 상단

- 우측 상단 44×44 close icon
- screen reader title을 고려한 명확한 modal title
- 좌측 상단에 작은 current count:
  `4 / 27`

## 모달 왼쪽 60~65%

- 큰 main image
- `청소 전` 또는 `청소 후` label
- 아래 horizontal thumbnail row 5~7개
- 선택 thumbnail border
- 좌우 image arrow
- 모달 안에서 다시 lightbox를 열지 않는다.

## 모달 오른쪽 35~40%

상단:

- service label
- H2 사례 제목
- `천안시 서북구 · 아파트`
- optional `사진 18장`, `YouTube 영상 있음`

중단 metadata:

- 주요 오염
- 작업 범위
- 작업 시기
- 공간 유형

짧은 설명 2~3문장.

하단:

- Primary full width button `전체 사례 보기`
- Secondary text link `서비스 페이지로 돌아가기`
- 사례 가격 없음
- 견적 폼 없음
- FAB 숨김

## 모달 좌우 외부 또는 하단

- 이전 사례
- 다음 사례
- keyboard arrow를 암시하는 prototype note

---

# 7.8 사례 빠른보기 모달 — Mobile

Frame:
`C-Web/M/Portfolio-QuickView`

전체 화면 390×844.

## 상단 fixed app bar

- left close/back icon
- title `화장실 청소 사례`
- right count `4 / 27`

## 이미지

- 큰 4:3 또는 viewport 폭 image
- swipe carousel
- 작은 dot 또는 thumbnail strip 중 하나만 사용
- 너무 많은 pagination dot 금지

## 정보

- service label
- H2 제목
- location
- metadata 2-column compact list
- 2~3문장 설명

## 하단 sticky action

- Primary button `전체 사례 보기`
- 이전·다음은 swipe와 작은 text navigation으로 처리
- FAB 숨김

---

# 7.9 개별 사례 상세페이지 — Desktop

Frame:
`C-Web/D/Portfolio-Detail`

샘플 사례는 화장실 청소를 사용하되 template은 모든 서비스에 재사용 가능하게 설계한다.

샘플 제목:
`천안시 서북구 아파트 화장실 물때·곰팡이 청소 사례`

## 상단

### Header
전역 header.

### Breadcrumb
`홈 / 화장실 청소 / 천안 아파트 화장실 청소`

### Title area

- service label
- H1
- 짧은 summary
- metadata row:
  - 천안시 서북구
  - 아파트
  - 작업 시기 2026년 7월
  - 주요 오염 물때·곰팡이
- 공유 button은 MVP 요구가 아니므로 추가하지 마라.

### 대표 전후 비교

큰 16:10 before/after component.
아래 caption:
`샤워부스와 타일 벽면의 작업 전후`

## 중단

### 현장 상태

2-column.

왼쪽 H2:
`작업 전 현장 상태`

본문 예:
`샤워부스와 타일 벽면에 물때가 넓게 남아 있었고, 줄눈과 모서리에는 곰팡이 오염이 집중되어 있었습니다.`

오른쪽 close-up photo 2개 또는 metadata panel.

### 작업 범위

H2:
`이번 현장에서 청소한 범위`

check list 또는 chips:

- 샤워부스
- 변기
- 세면대
- 바닥
- 벽면
- 타일·줄눈

### 작업 과정

H2:
`작업은 이렇게 진행했습니다`

6-step process cards 또는 vertical sequence.

### 갤러리 1: 작업 전

- H2 `작업 전`
- 설명
- 3-column photo grid
- 최소 4~6 images

### 갤러리 2: 작업 과정

- H2 `작업 과정`
- 3-column photo grid
- 최소 3~4 images

### 갤러리 3: 작업 후

- H2 `작업 후`
- 3-column grid
- 최소 5~6 images
- 가장 품질 좋은 사진을 넓은 featured tile로 배치해도 되지만 masonry는 사용하지 않는다.

### 세부 사진

내용이 있는 경우에만.
빈 section을 디자인상 남기지 않는다.

### YouTube

H2:
`작업 결과 영상`

- 16:9 thumbnail
- 중앙 play button
- 하단 title과 1줄 설명
- `YouTube에서 재생`처럼 외부 링크 느낌을 과하게 강조하지 않는다.
- click 후 iframe으로 바뀌는 prototype state를 component variant로 만든다.
- 영상이 없을 때 section 전체가 사라지는 것을 Notes에 명시한다.

## 하단

### 결과 요약

Brand/50 강조 panel.

H2:
`작업 결과`

2~3문장.
과장된 표현 금지.

### 관련 사례

H2:
`비슷한 화장실 청소 사례`

3 cards, 현재 사례 제외.

### 다음 행동

간단한 2-column navigation panel.

- `화장실 청소 서비스로 돌아가기`
- `전체 가격표 보기`

견적 폼을 만들지 않는다. 우측 하단 FAB만 유지한다.

### Footer
전역 footer.

---

# 7.10 개별 사례 상세페이지 — Mobile

Frame:
`C-Web/M/Portfolio-Detail`

## 상단

- mobile header
- compact breadcrumb
- service label
- H1
- summary
- metadata chips는 가로 scroll 또는 2×2
- before/after 4:3

## 중단

- 현장 상태 세로
- 작업 범위 2열
- 작업 과정 세로
- 각 gallery는 2열
- 한 장을 눌렀을 때 lightbox prototype 연결
- image caption은 필요할 때만
- YouTube 16:9

## 하단

- 결과 panel
- 관련 사례 horizontal cards 또는 1열
- service/price navigation
- footer
- FAB

---

# 7.11 사진 라이트박스 — Desktop

Frame/component:
`C-Web/D/Lightbox`

- overlay 전체 화면
- 사진을 최대한 크게
- top left `5 / 18`
- top right close
- 좌우 navigation arrows
- 하단 caption
- optional thumbnail strip
- keyboard focus state
- FAB 숨김
- 빠른보기 modal 위에 중첩해서 열지 않는다. 상세페이지에서만 사용한다.

# 7.12 사진 라이트박스 — Mobile

Frame:
`C-Web/M/Lightbox`

- full screen black 또는 dark neutral
- top app bar transparent
- count
- close
- swipe
- bottom caption sheet
- zoom gesture note
- safe area 고려

---

# 7.13 가격 안내 — Desktop

Frame:
`C-Web/D/Pricing`

## 상단

- header
- breadcrumb
- eyebrow `서비스 가격`
- H1 `가격 안내`
- 본문:
  `아래 가격은 서비스별 기준 안내입니다. 공간 크기, 오염도, 작업 범위와 현장 조건에 따라 달라질 수 있습니다.`
- 안내 callout:
  `포트폴리오 사례에는 당시 작업 비용을 표시하지 않습니다.`

## 중단

서비스 tab 또는 anchor navigation:

- 화장실
- 에어컨
- 아파트 유리창
- 상가 유리창

각 service section:

- service title
- 2~4 price cards 또는 table
- price
- 포함 범위
- 추가 확인 조건
- recommended label은 실제 정책이 없으므로 만들지 마라.

샘플 시각 값 예:

- `80,000원부터`
- `130,000원부터`
- `현장 확인 후 안내`

이 값은 최종 값이 아니며 Notes에 기록한다.

### 가격 변동 조건

H2:
`가격이 달라질 수 있는 조건`

4 cards:

- 공간 크기
- 오염 상태
- 작업 범위
- 접근과 안전 조건

### 사진 확인이 필요한 이유

2-column text + image/illustration.

H2:
`사진을 보내주시면 범위를 더 정확히 확인할 수 있습니다`

현재는 견적 폼을 만들지 않는다. 문구와 미래 FAB만 유지한다.

## 하단

- 가격 FAQ accordion
- service page links
- footer
- FAB

---

# 7.14 가격 안내 — Mobile

Frame:
`C-Web/M/Pricing`

- mobile header
- title and callout
- service tabs horizontal scroll
- price cards vertical
- 가로 scroll table 금지
- price conditions 2×2 또는 stack
- FAQ
- footer
- FAB

---

# 7.15 작업 과정 페이지

Desktop:
`C-Web/D/Process`

Mobile:
`C-Web/M/Process`

## 상단

- H1 `작업 과정`
- 설명
- 대표 현장 이미지

## 중단

7단계 process:

1. 사진 또는 전화 상담
2. 현장 조건 확인
3. 견적 안내
4. 일정 확정
5. 방문 및 청소
6. 작업 결과 확인
7. 결제 및 관리 안내

Desktop은 alternating timeline 또는 3~4 column cards.
Mobile은 세로 timeline.

각 단계에 번호, icon, 제목, 1~2문장.

서비스별 차이를 보여주는 compact section:

- 에어컨: 분해 범위 확인
- 유리창: 구조와 외부면 가능 여부 확인
- 화장실: 오염도와 청소 범위 확인

## 하단

- FAQ 일부
- 전체 사례 link
- 가격 안내 link
- footer
- FAB

---

# 7.16 업체 소개 페이지

Desktop:
`C-Web/D/About`

Mobile:
`C-Web/M/About`

## 상단

- H1 `위생의 기술`
- 브랜드 설명
- 실제 작업 이미지
- 지역 label `천안·아산 중심`

## 중단

### 작업 기준 3개

- 실제 현장 결과를 투명하게 기록
- 작업 범위를 사전에 안내
- 공개 전 개인정보 확인

### 작업팀 영역

- 대표 또는 작업자 사진 placeholder
- 실제 이름과 경력 값은 placeholder
- 허위 경력·인증·수치 금지

### 장비와 현장

- actual photo grid placeholder
- 장비 설명 3개

## 하단

- 주요 서비스 4개
- 작업 과정
- 가격 안내
- footer
- FAB

---

# 7.17 개인정보처리방침 기본 템플릿

Desktop과 Mobile의 간단한 long-form text template을 만든다.

- header
- breadcrumb
- H1
- updated date placeholder
- left sticky TOC는 desktop에서만 선택적으로 사용
- body text
- footer
- FAB는 법률 텍스트 읽기를 방해하면 숨겨도 된다.

---

# 7.18 404 페이지

Desktop:
`C-Web/D/404`

Mobile:
`C-Web/M/404`

중앙 정렬.

- 작은 illustration 또는 icon
- H1 `페이지를 찾을 수 없습니다`
- 본문:
  `주소가 변경되었거나 존재하지 않는 페이지입니다.`
- Primary `홈으로`
- Secondary `전체 사례 보기`
- 4 service text links
- `비공개`, `권한 없음`, `삭제됨` 표현 금지
- FAB는 숨겨도 된다.

---

# 7.19 고객 인증 화면

Desktop와 Mobile에서 아래 화면을 만든다.

- `C-Web/D/Login`, `C-Web/M/Login`
- `C-Web/D/Signup`, `C-Web/M/Signup`
- `C-Web/D/ForgotPassword`, `C-Web/M/ForgotPassword`
- `C-Web/D/Account`, `C-Web/M/Account`

고객 사이트의 Header, blue/neutral foundation, FormField와 Button을 재사용한다. Desktop은 중앙 440~480px card, Mobile은 page padding 20과 full-width action을 사용한다.

고객 로그인:

- 이메일, 비밀번호, 비밀번호 표시 toggle
- Primary `로그인`
- `비밀번호를 잊으셨나요?`
- `처음이신가요? 회원가입`
- 계정 존재 여부를 구분하지 않는 오류 state

고객 회원가입:

- 이메일, 비밀번호, 비밀번호 확인
- 개인정보처리방침 동의
- 비밀번호 조건 helper와 field error
- Primary `회원가입`

관리자 회원가입으로 오해할 수 있는 문구를 넣지 마라.

---

## 8. 관리자 전역 레이아웃

관리자는 모바일 사용을 최우선으로 설계하되 desktop에서도 효율적이어야 한다.

### 8.1 Admin desktop

왼쪽 sidebar 240.

Sidebar:

- logo + `관리자`
- 대시보드
- 홈페이지 관리
  - 홈
  - 서비스
  - 가격 안내
  - 작업 과정
  - 업체 소개
  - 개인정보처리방침
- 사례 관리
- 미디어 보관함
- 사이트 설정
- 로그아웃

하위 메뉴는 접기·펼치기 가능하게 하되 현재 위치를 항상 표시한다. 분석, 마케팅 자동화, 페이지 빌더처럼 범위를 벗어난 menu를 추가하지 마라.

Top bar:

- current page title 또는 breadcrumb
- 관리자 profile compact
- help나 notification center는 만들지 마라.

### 8.2 Admin mobile

- top app bar 56
- left back/menu
- title
- optional more icon
- main content
- 주요 save/publish action은 sticky bottom bar
- mobile bottom navigation을 만들 필요는 없다. menu Sheet로 dashboard, 홈페이지 관리, 사례 관리, 미디어 보관함, 사이트 설정을 이동한다.

### 8.3 관리자 시각 스타일

- 고객용 브랜드와 같은 blue/neutral foundation
- 고객용보다 정보 밀도가 높음
- 사진 썸네일과 status를 우선
- 장식 최소화
- success green은 공개 상태
- neutral gray는 비공개 상태
- danger red는 삭제·오류에만 사용

---

# 9. 관리자 화면 상세 설계

# 9.1 관리자 로그인

Desktop:
`A-Admin/D/Login`

Mobile:
`A-Admin/M/Login`

## 상단

- logo slot
- 작은 label `관리자`

## 중앙 card

- H1 `관리자 로그인`
- 설명 `포트폴리오와 작업 사진을 관리합니다.`
- 이메일 field
- 비밀번호 field 또는 구현 방식에 따라 magic link field
- Primary full-width button `로그인`
- loading state
- error message
- 비밀번호 찾기는 보조 link로 제공한다.
- 관리자 회원가입 link와 관리자 계정 생성 UI는 만들지 않는다.

Mobile은 card가 화면 전체에 자연스럽게 배치되도록 border를 줄이고 full-width form으로 만든다.

---

# 9.1.1 관리자 권한 관리 잠금 상태

Desktop: `A-Admin/D/UserRolesLocked`

Mobile: `A-Admin/M/UserRolesLocked`

- H1 `관리자 권한 관리`
- lock icon과 안내 `Supabase 연동 후 슈퍼 관리자만 사용할 수 있습니다.`
- 슈퍼 관리자 계정, 이메일, 비밀번호 placeholder를 만들지 않는다.
- 사용자 목록과 역할 변경 control을 비활성 mock으로도 노출하지 않는다.
- 관리자 회원가입 action을 제공하지 않는다.

향후 연동용 정상 화면은 `super_admin` 전용으로 설계하며 사용자 검색, 현재 역할, 관리자 권한 부여·회수 확인 dialog, 감사 기록 진입점을 포함한다.

---

# 9.2 관리자 대시보드

Desktop:
`A-Admin/D/Dashboard`

Mobile:
`A-Admin/M/Dashboard`

## 상단

- page title `대시보드`
- Primary button `새 포트폴리오`
- mobile은 top 또는 첫 content block에 full-width/large button

## 중단

3 stat cards:

- 전체 사례
- 공개
- 비공개

샘플 숫자는 사용 가능하나 Notes에 demo data임을 기록한다.

최근 수정 사례:

- thumbnail
- title
- service
- status
- updated time
- edit link

그래프, 매출, 방문자 분석은 만들지 마라.

## 하단

- `모든 포트폴리오 보기`
- 최근 업로드 실패가 있을 경우 compact alert state example

---

# 9.3 포트폴리오 목록 — Desktop

Frame:
`A-Admin/D/Portfolio-List`

## 상단

- H1 `포트폴리오`
- 설명
- Primary `새 포트폴리오`

Filter row:

- 전체
- 공개
- 비공개
- service select 또는 chips

관리자 내부 검색창은 MVP 필수가 아니므로 만들지 마라.

## 중단

Table/list:

Columns:

- 대표 사진
- 제목
- 서비스
- 지역
- 상태
- 수정일
- 더보기 menu

Row click은 edit page.

Status:

- 공개: green subtle badge
- 비공개: neutral badge

Empty state:

- title `아직 등록된 포트폴리오가 없습니다`
- button `첫 포트폴리오 만들기`

## 하단

- cursor pagination 또는 `더 보기`
- 페이지 번호를 복잡하게 만들 필요 없음

---

# 9.4 포트폴리오 목록 — Mobile

Frame:
`A-Admin/M/Portfolio-List`

## 상단

- app bar
- H1 또는 app bar title `포트폴리오`
- large button `새 포트폴리오`
- status chips horizontal scroll

## 중단

Card list.

각 card:

- 96×72 thumbnail
- title 2줄
- service
- location
- status
- updated time
- chevron 또는 more
- card 전체 click

## 하단

- load more
- safe area

---

# 9.5 새 포트폴리오 — Mobile Quick Create

Frame:
`A-Admin/M/Portfolio-New`

현장에서 빠르게 저장하는 화면이다. 복잡한 wizard를 만들지 마라.

## 상단

- app bar
- back
- title `새 포트폴리오`
- 자동 저장 상태 text:
  - `저장 중…`
  - `임시 저장됨`

## 중단

### 서비스 선택

4개의 selectable tiles 또는 2×2 segmented cards:

- 화장실
- 에어컨
- 아파트 유리창
- 상가 유리창

### 최소 정보

- 현장 제목
- 표시 지역
- 작업 날짜

placeholder:

- `예: 천안 아파트 화장실 물때 청소`
- `예: 천안시 서북구`

### 사진 업로드

Upload counter:
`현재 0 / 69장`

안내:
`한 번에 최대 20장까지 선택할 수 있습니다.`

큰 upload tile:

- Plus 또는 image icon
- `사진 추가`
- `휴대전화에서 최대 20장 선택`

보조:
`업로드가 완료된 사진은 자동 저장됩니다.`

## 하단 sticky action

- Secondary `나중에 정리`
- Primary `임시 저장`

사진이 업로드되면 다음 화면 또는 같은 화면에 progress list가 나타난다.

---

# 9.6 모바일 업로드 진행 상태

Frame:
`A-Admin/M/Portfolio-Upload-Progress`

## 상단

- `현재 18 / 69장`
- `이번 업로드 12 / 18 완료`

## 리스트

각 `UploadItem`:

- thumbnail placeholder
- filename
- size
- progress bar
- percent
- status

States:

- uploading
- uploaded
- failed

Failed item:

- red error icon
- 짧은 이유
- button `다시 시도`
- delete icon

성공한 파일은 실패로 인해 사라지지 않는 것을 visual state로 보여라.

하단:

- `사진 더 추가`
- `사진 정리하기`

---

# 9.7 업로드 제한 상태

별도 mobile frame을 만든다.

### 한 번에 20장 초과

Dialog:

- title `한 번에 최대 20장까지 선택할 수 있습니다`
- body `선택한 사진 중 20장만 업로드하거나 다시 선택해주세요.`
- button `다시 선택`

### 전체 69장 도달

Counter:
`현재 69 / 69장`

Upload tile disabled.

Text:
`이 사례에는 사진을 더 추가할 수 없습니다.`

기존 사진 삭제 후 추가할 수 있다는 안내.

### 70번째 서버 검증 실패

Toast 또는 inline error:
`사진은 한 사례에 최대 69장까지 저장할 수 있습니다.`

---

# 9.8 사례 편집 — Desktop

Frame:
`A-Admin/D/Portfolio-Edit`

## 상단

- breadcrumb
- H1 사례 제목
- status badge
- actions:
  - `미리보기`
  - `저장`
  - `공개하기` 또는 `비공개로 전환`
  - more menu 안에 삭제

## 중단

Main 8 columns, settings 4 columns 또는 tab layout.

추천 tabs:

- 기본 정보
- 사진
- 영상
- 공개 설정

### 기본 정보

- 서비스 select
- 제목
- slug
- 요약
- 지역
- 공간 유형
- 작업 날짜
- 태그
- 현장 상태 설명
- 작업 범위
- 작업 설명
- 결과 설명
- SEO 제목
- SEO 설명

SEO는 collapsible advanced section으로 둘 수 있다.

### 우측 settings

- status
- representative toggle/rank
- cover image preview
- last saved
- public URL preview when published

## 하단

- sticky save bar가 필요하면 사용
- destructive delete는 하단 또는 more menu
- 자동 저장 상태

---

# 9.9 사례 편집 — Mobile

Frame:
`A-Admin/M/Portfolio-Edit`

## 상단

- back
- title
- status badge
- more

## 중단

Accordion 또는 section cards:

1. 기본 정보
2. 사진
3. YouTube 영상
4. SEO와 공개 설정

모든 필드를 한 화면에 펼쳐 과도하게 길게 만들지 말되, 복잡한 multi-step wizard도 만들지 마라.

Text area에는 character count가 필요한 경우 표시한다.

## 하단 sticky action

비공개 상태:

- Secondary `미리보기`
- Primary `저장`

공개 준비가 되었을 때:

- `공개하기`

공개 상태:

- `저장`
- secondary action `비공개로 전환`

---

# 9.10 사진 관리 — Desktop

Frame:
`A-Admin/D/Photo-Manager`

## 상단

- H2 `사진`
- counter `38 / 69장`
- button `사진 추가`
- 안내 `한 번에 최대 20장`

Stage tabs:

- 전체
- 작업 전
- 작업 과정
- 작업 후
- 세부
- 비공개

## 중단

5~6 column photo grid.

Photo tile:

- image
- top-left checkbox
- top-right more menu
- bottom stage label
- cover badge if selected
- public/private icon
- drag handle
- hover actions

Selection mode:

- selected border
- top or bottom bulk action bar:
  - 작업 전
  - 작업 과정
  - 작업 후
  - 세부
  - 비공개
  - 삭제

Drag sorting is within current stage.

## 하단

- auto-save status
- no separate heavy save action for every reorder if autosave is used

---

# 9.11 사진 관리 — Mobile

Frame:
`A-Admin/M/Photo-Manager`

## 상단

- app bar
- title `사진 관리`
- counter `38 / 69`
- button `추가`

## 탭

가로 scroll:

- 전체
- 작업 전
- 과정
- 작업 후
- 세부
- 비공개

## grid

3-column square thumbnails 또는 2-column 4:3 중 실제 조작성을 고려해 선택하라.
추천은 3-column square for management, 고객용 카드와 다르게 빠른 분류 중심이다.

Tile:

- checkbox
- stage dot/label
- cover star
- private icon
- drag handle는 sort mode에서만

## selection bottom bar

`8장 선택됨`

Actions는 horizontal scroll 또는 2행:

- 작업 전
- 과정
- 작업 후
- 세부
- 비공개
- 삭제

삭제는 danger 분리.

---

# 9.12 YouTube 관리

Desktop:
`A-Admin/D/YouTube-Manage`

Mobile:
`A-Admin/M/YouTube-Manage`

## 상단

- H2 `YouTube 영상`
- counter `1 / 3개`
- button `영상 추가`

## 입력

- YouTube URL
- title
- caption
- 공개 여부
- `링크 확인` 또는 자동 validation

Valid preview:

- thumbnail
- video title
- URL
- drag order
- delete

Invalid state:

- input error
- `지원되는 YouTube 링크를 입력해주세요.`
- watch, youtu.be, Shorts 지원 안내

3개 도달 시 추가 button disabled.

---

# 9.13 공개 체크리스트

Desktop dialog:
`A-Admin/D/Publish-Checklist`

Mobile full-screen sheet/dialog:
`A-Admin/M/Publish-Checklist`

## 상단

- title `공개 전 확인`
- 설명:
  `고객에게 공개하기 전에 사진과 정보를 다시 확인해주세요.`

## 체크 항목

- 얼굴이나 식별 가능한 신체가 노출되지 않습니다.
- 차량번호가 노출되지 않습니다.
- 주소, 동·호수, 연락처가 노출되지 않습니다.
- 개인 문서와 민감한 고객 물품이 노출되지 않습니다.
- 공개 가능한 사진만 선택했습니다.
- 제목, 서비스, 지역, 대표 이미지가 설정됐습니다.
- 공개 사진이 최소 1장 있습니다.

## 하단

- Secondary `취소`
- Primary disabled `공개하기`
- 모든 checkbox 완료 시 active

Success toast:
`포트폴리오를 공개했습니다.`

비공개 전환 confirm:

- title `이 포트폴리오를 비공개로 전환할까요?`
- body `고객 목록과 검색 대상에서 즉시 사라집니다.`
- buttons `취소`, `비공개로 전환`

---

# 9.14 삭제 확인

Dialog:

- title `포트폴리오를 삭제할까요?`
- body:
  `고객 화면에서는 즉시 사라집니다. 파일 영구 삭제는 별도 운영 절차로 처리됩니다.`
- Secondary `취소`
- Destructive `삭제`

복잡한 휴지통 UI는 만들지 마라.

---

# 9.15 홈페이지 관리 허브

Desktop: `A-Admin/D/SiteContent`

Mobile: `A-Admin/M/SiteContent`

목적:

- 전체 홈페이지의 콘텐츠 상태를 한눈에 확인한다.
- 레이아웃을 바꾸는 페이지 빌더가 아니라, 고정된 페이지별 편집 화면으로 이동한다.

상단:

- eyebrow `홈페이지 관리`
- H1 `고객 화면 콘텐츠`
- 설명 `문구, 이미지, 가격과 노출 설정을 관리합니다. 페이지 구조와 디자인은 고정되어 있습니다.`
- Primary `변경 사항 게시`
- Secondary `고객 화면 미리보기`

페이지 cards:

- 홈
- 서비스
- 가격 안내
- 작업 과정
- 업체 소개
- 개인정보처리방침
- 사이트 설정

각 card:

- 페이지명
- 게시됨 / 초안 있음 / 검토 필요 badge
- 최근 수정 시각
- 수정한 관리자
- `편집` action

미게시 변경이 있으면 상단에 `게시되지 않은 변경 3건` status banner를 보여준다.

---

# 9.16 홈 콘텐츠 편집

Desktop: `A-Admin/D/HomeEdit`

Mobile: `A-Admin/M/HomeEdit`

고정된 섹션 구조 안에서 콘텐츠만 편집한다.

편집 대상:

- 히어로 eyebrow, H1, 본문
- Primary·Secondary CTA 라벨과 내부 링크
- 대표 이미지, alt, caption, focal point
- 서비스, 대표 전후, 최근 사례, 작업 과정, 가격 안내, 신뢰 요소 section의 제목·설명
- section 공개 여부와 허용된 순서
- 홈 대표 사례 선택

Desktop:

- 왼쪽 58~62% 편집 폼
- 오른쪽 38~42% sticky preview
- preview 상단에 Desktop / Mobile switch
- 저장되지 않은 변경이 있으면 `저장되지 않음` badge

Mobile:

- 한 번에 하나의 section accordion을 편집
- `미리보기`는 full-screen
- sticky bottom bar: `초안 저장`, `검토 및 게시`

이미지 필드:

- 현재 이미지 thumbnail
- `교체`, `미디어에서 선택`, `삭제`
- alt text 필수
- focal point 선택 control
- 삭제 시 해당 slot이 필수라면 삭제 대신 교체를 요구

---

# 9.17 서비스 콘텐츠 관리

Desktop: `A-Admin/D/Services`

Mobile: `A-Admin/M/Services`

목록:

- 화장실 청소
- 에어컨 청소
- 아파트 유리창 청소
- 상가 유리창 청소

각 row/card:

- 대표 이미지
- 서비스명
- 활성 / 비활성
- 연결된 공개 사례 수
- 최근 수정
- 편집

편집 drawer 또는 page:

- 서비스명, 요약, 본문
- 대표 이미지와 alt
- 작업 범위 반복 항목
- 가격 요약
- FAQ 반복 항목
- 노출 순서
- 활성 상태

내부 service key는 read-only로 표시하거나 숨긴다. 비활성화 시 연결된 공개 사례와 고객 화면 영향을 confirm dialog에 표시한다.

---

# 9.18 가격 관리

Desktop: `A-Admin/D/Pricing`

Mobile: `A-Admin/M/Pricing`

상단:

- H1 `가격 안내 관리`
- 설명 `서비스별 기준과 범위를 관리합니다. 개별 사례의 당시 작업비와 연결되지 않습니다.`
- Primary `가격 항목 추가`

서비스 tabs 4개.

가격 item row/card:

- 항목명
- 표시 가격 또는 `현장 확인 후 안내`
- 단위·범위
- 공개 / 숨김
- drag handle
- 편집
- 삭제

편집 fields:

- 항목명
- 가격 표시 문자열
- 단위·범위
- 포함 사항
- 제외 사항
- 가격 변동 조건
- 주의 문구
- 공개 여부

추가로 가격 페이지 상단 안내 문구, 공통 주의 문구, FAQ를 편집한다. 마지막 공개 가격 항목을 숨기거나 삭제해 필수 section이 비면 게시 검증에서 막는다.

---

# 9.19 작업 과정·업체 소개·개인정보처리방침 편집

Desktop와 Mobile 각각 준비한다.

작업 과정:

- 단계 추가·수정·삭제·정렬
- 단계 번호는 순서에 따라 자동 표시
- icon은 제한된 목록에서 선택
- 제목, 설명, 공개 여부

업체 소개:

- hero 문구
- 가치 항목 반복 list
- 작업팀·장비·현장 이미지
- CTA 라벨과 링크

개인정보처리방침:

- 제한된 rich text editor
- 임의 HTML과 script 입력 없음
- 마지막 게시 시각
- checkbox `법률 검토된 문안임을 확인했습니다`
- 확인 전 게시 disabled

---

# 9.20 사이트 미디어 보관함

Desktop: `A-Admin/D/Media`

Mobile: `A-Admin/M/Media`

기능:

- 이미지 업로드
- 이름·사용 위치 검색과 사용 중 / 미사용 filter
- grid/list view
- thumbnail, 파일명, 크기, 비율, 사용 횟수
- alt, caption, focal point 편집
- 교체와 삭제

사용 중인 이미지를 삭제하면 `이 이미지는 홈 히어로와 업체 소개에서 사용 중입니다`처럼 정확한 사용 위치를 보여준다. `사용 위치 보기`, `교체`, `취소`를 제공하고 즉시 삭제 action은 disabled다.

업로드 진행, 일부 실패, 재시도와 세션 미리보기 소실 상태도 포함한다.

---

# 9.21 사이트 설정

Desktop: `A-Admin/D/Settings`

Mobile: `A-Admin/M/Settings`

sections:

- 브랜드: 로고, 상호
- 연락: 대표 연락처 라벨과 링크
- 운영 정보: 지역, 사업자 정보
- 외부 링크: SNS와 허용된 URL
- 기본 SEO: 기본 title, description, OG 이미지
- 공통 콘텐츠: 푸터 소개 문구

페이지마다 중복 입력하지 않도록 공통 정보의 사용 위치를 helper text로 알린다.

---

# 9.22 초안·미리보기·게시·버전 복원

공통 상태:

- 게시됨
- 초안 있음
- 저장 중
- 저장 실패
- 검토 필요
- 게시 중
- 게시 실패

게시 검토 drawer/modal:

- 변경된 페이지와 field 요약
- 필수값, alt, link, 빈 필수 section 검증
- Desktop / Mobile preview link
- `게시` action

Version history:

- 게시 시각
- 게시한 관리자
- 변경된 page 요약
- `이 버전으로 복원`

복원은 즉시 공개하지 않고 새 초안으로 만든다. `미리보기 후 다시 게시해야 합니다`를 명시한다.

페이지 구조, grid, 색상, typography, 임의 component 추가 control은 어느 화면에도 만들지 마라.

---

## 10. 상호작용과 prototype 연결

`30_Prototype_Flows` page에서 아래 흐름을 복제하거나 연결해 시연 가능하게 만들어라.

### 고객 흐름 A

`Home → 화장실 청소 서비스 → 사례 카드 → Quick View Modal → 전체 사례 보기 → Portfolio Detail → 이미지 클릭 → Lightbox`

### 고객 흐름 B

`Service Page → 필터 선택 → 카드 선택 → Modal → Close → 같은 필터와 스크롤 위치`

Figma prototype에서는 실제 scroll 복원이 제한될 수 있으므로 note와 overlay close behavior로 의도를 명확히 보여라.

### 고객 흐름 C

`Header 가격 안내 → Pricing → 서비스 탭 전환`

### 모바일 고객 흐름

`Home → Service → Full-screen Quick View → Detail → Lightbox`

### 관리자 흐름 A

`Login → Dashboard → 새 포트폴리오 → 기본 정보 → 사진 업로드 → 업로드 진행 → 사진 정리 → 공개 체크리스트 → 공개 성공`

### 관리자 흐름 B

`Portfolio List → 공개 사례 편집 → 비공개 전환 confirm → List`

### 관리자 흐름 C

`Photo Manager → 다중 선택 → 작업 후로 이동 → 저장 완료 toast`

### 관리자 흐름 D

`Dashboard → 홈페이지 관리 → 홈 편집 → 대표 이미지 교체 → Mobile preview → 초안 저장 → 게시 검토 → 게시 성공 → 고객 Home`

### 관리자 흐름 E

`가격 안내 관리 → 서비스 tab → 가격 항목 추가 → 순서 변경 → 검증 오류 수정 → 게시 → 고객 Pricing`

### 관리자 흐름 F

`미디어 보관함 → 사용 중 이미지 삭제 시도 → 사용 위치 확인 → 이미지 교체 → 삭제 가능 상태`

### 관리자 흐름 G

`홈 편집 → 버전 기록 → 이전 버전 복원 → 초안 미리보기 → 다시 게시`

Prototype behavior:

- Modal은 overlay
- Mobile quick view는 full-screen transition
- Sheet는 edge에서 slide
- Accordion은 smart animate를 과도하게 사용하지 않음
- FAB는 click target만 있고 열리는 UI 없음
- reduced motion을 고려한 간단한 transitions

---

## 11. 상태 화면과 예외 화면

아래 상태를 component page 또는 각 화면 옆에 별도 frame으로 보여라.

### 고객

- portfolio loading skeleton
- filter no results
- image load failure
- YouTube load failure
- general network error
- 404
- modal open
- lightbox open
- mobile menu open

### 관리자

- login error
- empty portfolio
- upload in progress
- upload partial failure
- 20-file selection limit
- 69-file total limit
- save in progress
- save failed
- YouTube invalid
- publish checklist incomplete
- published success
- private success
- delete confirm
- site content draft saved
- unpublished changes
- publish validation failed
- site content published
- version restored to draft
- media upload partial failure
- media in-use delete blocked
- concurrent edit conflict

오류 문구는 문제와 다음 행동을 명확히 알려야 한다. 기술 오류 코드를 고객에게 보여주지 마라.

---

## 12. 접근성 요구사항

모든 화면에서 다음을 지켜라.

1. 본문 대비 WCAG AA 수준을 목표로 한다.
2. interactive target은 최소 44×44.
3. focus ring이 분명해야 한다.
4. color만으로 public/private, error/success, before/after를 구분하지 않는다.
5. icon-only button에는 tooltip 또는 accessible name을 고려한 디자인 note를 남긴다.
6. Dialog title과 description 구조가 명확해야 한다.
7. keyboard focus order가 시각적 순서와 맞아야 한다.
8. accordion과 tabs의 active 상태가 명확해야 한다.
9. 사진 alt 텍스트가 들어갈 데이터 구조를 고려한다.
10. motion 감소 설정을 고려한다.
11. 모바일 safe area를 고려한다.
12. 긴 한글 텍스트가 잘리거나 button 안에서 넘치지 않게 한다.

---

## 13. 콘텐츠와 카피 규칙

- 모든 주요 UI는 한국어 실제 문장으로 채워라.
- Lorem ipsum을 사용하지 마라.
- 고객에게 보이는 사례 제목은 구체적으로 작성한다.
- 정확한 고객 주소, 동·호수, 이름, 연락처를 예시에 사용하지 마라.
- 천안·아산은 자연스럽게 사용하되 키워드를 반복하지 마라.
- 허위 후기, 별점, 수상, 경력, 고객 수, 작업 건수를 만들지 마라.
- 카드 제목은 최대 2줄.
- location은 한 줄.
- 설명은 짧은 문단과 명확한 section heading으로 나눈다.
- 서비스마다 완전히 다른 UI를 만들지 말고 동일한 template과 component를 사용한다.
- 가격 샘플은 실제 값으로 오해되지 않도록 Notes에 교체 대상으로 기록한다.
- 비공개 상태 문구는 고객 UI에 절대 사용하지 않는다.

---

## 14. 만들지 말아야 할 것

다음 요소를 추가하지 마라.

- 공개 관리자 회원가입
- 예약 캘린더
- 결제
- 견적 폼 또는 사진 첨부 폼
- FAB 클릭 후 panel
- 고객 리뷰 작성
- 좋아요·댓글·팔로우
- 조회수 경쟁 UI
- 실시간 채팅
- chatbot
- 무한 스크롤
- masonry grid
- full-screen autoplay hero video
- carousel hero
- 과도한 parallax
- 큰 floating sidebar
- 고객용 화면의 private card
- 비공개 포트폴리오 안내
- 자유형 페이지 빌더
- 관리자 레이아웃·색상·글꼴 편집
- 임의 HTML·script·외부 embed 입력
- 관리자 분석 dashboard graph
- 여러 관리자 권한 UI
- 자체 영상 업로드
- AI 기능
- 타 지역 랜딩페이지
- 허위 신뢰 지표
- 불필요한 glassmorphism
- neon gradient
- 서비스별 서로 충돌하는 강한 색상

---

## 15. Figma 제작 방식

1. 기존 component, variables, text styles, effect styles가 있으면 먼저 조사하고 재사용한다.
2. 없다면 foundation을 먼저 만든다.
3. 반복 UI는 반드시 component로 만들고 instance를 사용한다.
4. 모든 주요 container는 Auto Layout을 사용한다.
5. desktop과 mobile에서 constraints와 resizing behavior를 설정한다.
6. hardcoded one-off spacing을 반복하지 말고 variables를 사용한다.
7. icon은 Lucide 스타일의 일관된 outline icon을 사용한다.
8. layer 이름을 `Frame 123`, `Rectangle 88`처럼 남기지 마라.
9. photo placeholder layer에는 교체 목적이 드러나는 이름을 사용한다.
10. 각 화면은 상단, 중단, 하단 section이 명확하게 구분된 layer tree를 가진다.
11. 한 번에 전체 파일을 무리하게 만들지 말고 section 단위로 작성·검수한다.
12. 각 주요 section을 만든 뒤 screenshot으로 잘림, 겹침, 잘못된 font, placeholder 미교체를 확인한다.
13. mobile 390과 desktop 1440에서 텍스트가 잘리지 않는지 검증한다.
14. component properties를 사용해 제목, label, icon, state를 교체할 수 있게 한다.
15. 실제 구현 시 Tailwind와 shadcn component로 옮기기 쉬운 구조를 유지한다.

---

## 16. 최종 납품 조건

작업 완료 전 아래 항목을 모두 확인하라.

### Foundations

- color variables 완료
- typography styles 완료
- spacing/radius/shadow 완료
- desktop/mobile grid 완료

### Components

- 고객용 공통 components 완료
- 관리자 공통 components 완료
- 필요한 variants와 states 완료
- 반복 카드가 instance로 사용됨

### Customer

- Home desktop/mobile
- 4개 service desktop/mobile
- Portfolio all desktop/mobile
- Quick view desktop/mobile
- Detail desktop/mobile
- Lightbox desktop/mobile
- Pricing desktop/mobile
- Process desktop/mobile
- About desktop/mobile
- Privacy template
- 404 desktop/mobile

### Admin

- Login desktop/mobile
- Dashboard desktop/mobile
- Portfolio list desktop/mobile
- New portfolio mobile
- Upload progress mobile
- Upload limit states
- Edit desktop/mobile
- Photo manager desktop/mobile
- YouTube manager desktop/mobile
- Publish checklist desktop/mobile
- Delete/private confirmation
- Site content hub desktop/mobile
- Home content editor desktop/mobile with viewport preview
- Service content list and editor desktop/mobile
- Pricing item manager desktop/mobile
- Process, About, Privacy editors desktop/mobile
- Site media library desktop/mobile with usage protection
- Site settings desktop/mobile
- Publish validation and version history desktop/mobile

### Prototype

- 고객 핵심 흐름 연결
- 관리자 핵심 흐름 연결
- overlay와 full-screen transition 확인
- FAB는 열리는 화면 없이 존재

### Quality

- Pretendard 또는 Noto Sans KR 사용 확인
- text clipping 없음
- layer overlap 없음
- accessible contrast
- focus states
- photo placeholder 명확
- private content customer UI에 없음
- fake metrics 없음
- 실제 가격·로고·연락처 교체 사항이 Notes에 정리됨

---

## 17. 최종 작업 보고 형식

Figma 작업이 끝나면 다음 형식으로 간단히 보고하라.

1. 생성하거나 수정한 Figma 파일
2. 생성한 pages 목록
3. 완성한 desktop/mobile frames
4. 만든 핵심 components 및 variants
5. 연결한 prototype flows
6. 실제 로고·가격·연락처 등 교체가 필요한 placeholder 목록
7. 구현 시 주의할 interaction
8. 미완성 또는 도구 제약으로 구현하지 못한 항목

완료했다고 주장하기 전에 각 주요 frame과 component page를 screenshot으로 검수하고, 잘림·겹침·잘못된 한글 font·placeholder 잔존 여부를 수정하라.
