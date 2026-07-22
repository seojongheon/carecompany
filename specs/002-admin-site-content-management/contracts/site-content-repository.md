# Site Content Repository Contract

- `getSnapshot()`: 초안, 게시본, 버전을 반환한다.
- `subscribe(listener)`: 변경을 구독한다.
- `updateDraft(patch)`: 초안을 부분 수정하고 저장한다.
- `publish()`: 게시 검증 후 초안을 게시본으로 복사하고 버전을 추가한다.
- `restoreVersion(versionId)`: 선택한 게시 버전을 초안으로 복사한다.
- `resetToSeed()`: 목업 기본값으로 되돌린다.

모든 메서드는 실패 시 기존 게시본을 변경하지 않는다.
