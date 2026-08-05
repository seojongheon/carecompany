# Data Model: 운영 이미지 Storage 활성화

## Case media reference

- `case_media.storage_path`: `case-reviewed-public`의 WebP 경로
- `case_media.original_storage_path`: `case-originals`의 원본 경로
- `case_media.is_public`: 고객 공개 승인 여부
- `case_media.upload_status`: `ready`일 때만 공개 조회 가능
- `case_media.case_id`: 사례 게시 상태와 연결

검증 규칙:

- 두 경로는 동일 사례 ID 폴더 아래 생성한다.
- 검토본은 WebP이며 원본 경로와 달라야 한다.
- 공개 조회는 `is_public=true`, `upload_status=ready`, 사례 `status=published`를 모두 만족해야 한다.

## Landing hero reference

- `site_content.draft.home.heroImageStoragePath`: 관리자 초안이 참조하는 경로
- `site_content.published.home.heroImageStoragePath`: 현재 공개된 경로
- `site_content_versions.content`: 복원 가능한 과거 참조
- `home.heroImageAlt`: 게시에 필요한 대체 텍스트

검증 규칙:

- 랜딩 대표 이미지 경로는 `landing-hero` 버킷의 WebP 객체를 가리킨다.
- 익명 읽기는 현재 `published` 경로와 일치할 때만 허용한다.
- 초안 전용 경로는 활성 관리자만 조회할 수 있다.
- 어떤 콘텐츠 버전에서도 참조되지 않는 경로만 정리할 수 있다.

## Storage object states

```text
selected -> validated -> original_uploaded -> reviewed_uploaded -> referenced
                      \-> rejected
original_uploaded + reviewed_failed -> original_removed -> failed
reviewed_uploaded + reference_failed -> both_removed -> failed
referenced -> unpublished (object retained, public read denied)
referenced -> individually_deleted -> both_removed
```
