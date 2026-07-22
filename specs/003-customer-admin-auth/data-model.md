# Data Model

## MockCustomerAccount

- 정규화 이메일
- 임의 salt
- 비밀번호 digest
- 생성 시각
- 역할은 항상 `customer`

## AuthSession

- 사용자 이메일
- 역할
- 만료 시각

## RoleAssignment (future)

- 대상 사용자
- 역할 `customer`, `admin`, `super_admin`
- 부여·회수 수행자와 시각
- 활성 상태

현재 목업에는 `admin` 또는 `super_admin` 계정·역할 할당을 생성하지 않는다.

