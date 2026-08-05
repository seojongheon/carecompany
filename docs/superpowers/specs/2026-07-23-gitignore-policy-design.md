# Git 추적 제외 정책 설계

**작성일:** 2026-07-23  
**상태:** 사용자 승인 반영

## 목표

애플리케이션 소스, 제품 문서, 기능 명세, 테스트와 Supabase 마이그레이션은 Git으로 관리한다. 개인 환경정보, 생성 산출물, 로컬 Supabase 상태와 AI 에이전트·스킬·규칙 파일은 Git에 포함하지 않는다.

## 제외 대상

- `.env*` 비밀정보. 공유 가능한 `.env.example`만 허용한다.
- 의존성, 빌드, 테스트 보고서, 로그, 캐시와 운영체제 임시 파일
- `supabase/.temp/` 등 로컬 프로젝트 연결 상태
- `AGENTS.md`, `.agents/`, `agent-library/`, `.codex/`, `.claude/`, `.cursor/`, `.windsurf/`
- Spec Kit 실행 도구와 에이전트 설정이 포함된 `.specify/`
- 저장소 어디에 있든 `SKILL.md`, `CLAUDE.md`, `GEMINI.md` 같은 AI 도구 지침 파일
- `figma-ui-agent-master-prompt-ko.md` 같은 에이전트 프롬프트

## 유지 대상

- 애플리케이션 소스와 테스트
- `README.md`, PRD와 일반 프로젝트 문서
- `specs/` 기능 명세와 `docs/` 설계·검증 문서
- Supabase 설정, migrations, seed, RLS 테스트와 생성 타입
- 공유 가능한 환경변수 키만 포함한 `.env.example`

## 안전 기준

- 광범위한 `*.md` 규칙은 사용하지 않는다. 제품 문서까지 제외되는 것을 방지한다.
- 실제 비밀값이 포함된 환경 파일은 파일명과 관계없이 추적하지 않는다.
- Git 초기화 후 `git status --ignored`와 `git check-ignore`로 대표 경로를 검증한다.
