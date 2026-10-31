# 키 노출 대응 상태

GitHub Secret Scanning 경고 #1은 `team.js`에 포함된 기존 Firebase 웹 API 키를 가리킵니다. 프로젝트 관리자는 **새 키 발급 대신 기존 키를 유지하고 웹사이트·API 사용을 제한하는 방식**을 선택했고, 설정 적용을 알렸습니다. 기존 키는 브라우저 설정값으로 코드에 남아 있으며 폐기되지 않았습니다. 경고를 폐기 완료(`revoked`)로 처리하지 않습니다.

Firebase 웹 설정의 API 키는 브라우저에서 보이는 값입니다. 환경변수나 GitHub Actions Secrets로 옮겨도 브라우저에 전달하면 공개됩니다. 서비스 계정 키, 관리자 토큰 등 실제 비밀은 브라우저 코드·공개 설정에 넣으면 안 됩니다. 팀 자료 접근은 Firebase Authentication과 서버의 Firestore Security Rules로 통제해야 합니다. 클라이언트의 팀원 확인만으로는 서버 접근을 보호할 수 없습니다.

## 확인된 상태 — 2026-10-31

읽기 전용 Firebase Authentication 프로젝트 설정 조회로 다음을 확인했습니다. 요청 URL과 응답에 포함된 키 값은 로그나 문서에 기록하지 않았습니다.

| 검사 | 결과 |
| --- | --- |
| 운영 사이트 리퍼러 `https://grint2000.github.io/coffee-sensory-wheel/` | HTTP 200 · 설정 조회 정상 |
| 허용하지 않은 출처 `https://example.com/` | HTTP 403 · `API_KEY_HTTP_REFERRER_BLOCKED` |
| 리퍼러 없는 요청 | HTTP 403 · `API_KEY_HTTP_REFERRER_BLOCKED` |
| Firebase Authentication 승인 도메인 | `grint2000.github.io` 등록 확인 |
| 운영 리퍼러에서 관계없는 Generative Language API의 모델 목록 조회 | HTTP 403 · `SERVICE_DISABLED` |

마지막 결과는 해당 API가 비활성화됐다는 뜻이며 **키의 API 허용 목록이 올바르다는 증거는 아닙니다.** 전체 API 제한 설정은 관리자 화면에서 직접 확인해야 합니다. 실제 Google 계정 로그인, 승인된 팀 저장, 권한 없는 계정의 데이터 접근 거부, 운영 Firestore Rules는 이번 검사에서 검증하지 않았습니다. HTTP 리퍼러 제한은 사용자 인증이나 데이터 접근 제어를 대신하지 않습니다.

## 기존 키 유지 시 관리 항목

1. [Google Cloud 사용자 인증 정보](https://console.cloud.google.com/apis/credentials?project=coffee-sensory-app)에서 기존 키의 애플리케이션 제한을 **웹사이트(HTTP 리퍼러)**로 유지합니다. 운영 사이트인 `https://grint2000.github.io/*`와 로그인 흐름에서 실제 사용하는 Firebase 인증 도메인만 허용합니다. 개발용 localhost는 별도 키를 사용합니다. 키 제한은 같은 GitHub Pages 출처의 다른 저장소와 격리되지 않습니다.
2. API 제한은 이 앱에 필요한 Firebase API에만 설정합니다. Identity Toolkit API, Token Service API, Cloud Firestore API 등 실제 호출을 확인해 최소 범위를 정하고 관계없는 Google 유료 API는 허용하지 않습니다. 사용량·할당량과 이상 요청도 확인합니다.
3. 실제 Google 로그인, 승인된 팀 조회·저장, 권한 없는 계정의 접근 거부를 확인합니다. Firebase Authentication 승인 도메인과 서버의 Firestore Rules를 함께 관리합니다. 현재 연결에는 Google Cloud 관리자 권한이 없어 전체 설정을 조회하거나 변경할 수 없습니다.
4. 오용·비정상 과금이 발견되거나 비밀용 키로도 사용된 경우에는 새 키로 교체하고 기존 키를 폐기해야 합니다. 기존 키는 Git 이력에도 있어 현재 파일 삭제만으로 회수되지 않습니다. 새 키나 관리자 인증 정보를 채팅·이슈·PR에 붙여 넣지 않습니다.

## 재등록 방지

`python3 scripts/check-secrets.py`는 Git 추적 파일과 무시되지 않은 신규 파일의 Google API 키, GitHub 토큰, AWS 액세스 키, 개인키를 검사하며 값은 로그에 출력하지 않습니다. 커밋 전에 실행합니다. GitHub Actions도 같은 검사를 실행합니다. CI는 푸시 후 실행되므로 유출을 완전히 예방하지 못합니다. 저장소 관리자는 GitHub Secret Scanning의 Push Protection을 활성화하고, 가능하면 검사 성공을 병합 필수 조건으로 설정합니다. 현재 연결은 경고 조회와 Actions Secrets 관리에서 HTTP 403을 반환했습니다.

기존 공개 브라우저 설정값의 검사 예외는 **기존 키의 SHA-256 지문과 `team.js` 경로 하나**에만 적용됩니다. 다른 키나 같은 키의 다른 파일 복사는 실패합니다. 이 예외는 Cloud 설정을 검사하지 않으며, 제한 설정의 검증 근거는 위 표에 별도로 기록합니다. 키 교체 시 예외도 재검토합니다.

`.gitignore`는 `.env`, 서비스 계정 JSON, 개인키 파일의 실수 등록을 줄입니다. 탐지 패턴은 모든 비밀 형식을 포괄하지 않으므로 커밋 전 변경 내용도 검토합니다.
