# 키 노출 대응 상태

GitHub Secret Scanning 경고 #1은 `team.js`에 포함된 기존 Firebase 웹 API 키를 가리킵니다. **기존 키의 교체·폐기·사용 제한은 아직 확인되지 않았습니다.** 팀 로그인을 유지하기 위해 현재 키는 코드에 남아 있습니다. 경고를 해결됨으로 처리하지 않습니다.

Firebase 웹 설정의 API 키는 브라우저에서 보이는 값입니다. 환경변수나 GitHub Actions Secrets로 옮겨도 브라우저에 전달하면 공개됩니다. 서비스 계정 키, 관리자 토큰 등 실제 비밀은 브라우저 코드·공개 설정에 넣으면 안 됩니다. 팀 자료 접근은 Firebase Authentication과 서버의 Firestore Security Rules로 통제해야 합니다. 클라이언트의 팀원 확인만으로는 서버 접근을 보호할 수 없습니다.

## 프로젝트 관리자가 해야 할 작업

1. [Google Cloud 사용자 인증 정보](https://console.cloud.google.com/apis/credentials?project=coffee-sensory-app)에서 경고에 해당하는 키를 확인하고 새 브라우저용 키를 만듭니다. 키를 채팅·이슈·PR에 붙여 넣지 않습니다.
2. 새 키의 애플리케이션 제한을 **웹사이트(HTTP 리퍼러)**로 지정합니다. 운영 사이트인 `https://grint2000.github.io/*`와 로그인 흐름에서 실제 사용하는 Firebase 인증 도메인만 허용합니다. 개발용 localhost는 별도 키를 사용합니다. 키 제한은 도메인 단위이므로 같은 GitHub Pages 출처의 다른 저장소와는 격리되지 않습니다.
3. API 제한은 이 앱에 필요한 Firebase API에만 설정합니다. Identity Toolkit API, Token Service API, Cloud Firestore API 등 실제 호출을 확인해 최소 범위를 정하고, 관련 없는 Google 유료 API 사용은 허용하지 않습니다. 사용량·할당량과 이상 요청도 확인합니다.
4. 새 키를 적용한 앱에서 Google 로그인, 승인된 팀 조회·저장, 권한 없는 계정의 접근 거부를 검증한 뒤 기존 키를 폐기합니다. Firestore Rules와 Firebase Authentication의 승인 도메인도 확인합니다. 현재 연결에는 Google Cloud 관리자 권한이 없어 이 설정을 확인하거나 변경하지 못했습니다.
5. 기존 키는 Git 이력에서도 노출됐으므로 현재 파일 삭제만으로 회수되지 않습니다. 폐기 확인 후 GitHub 경고를 `revoked` 사유로 해결하고, 아래 검사기의 임시 예외를 제거합니다. 이력 재작성은 별도 협의가 필요합니다.

## 재등록 방지

`python3 scripts/check-secrets.py`는 Git 추적 파일과 무시되지 않은 신규 파일의 Google API 키, GitHub 토큰, AWS 액세스 키, 개인키를 검사하며 값은 로그에 출력하지 않습니다. 커밋 전에 실행합니다. GitHub Actions도 같은 검사를 실행합니다. CI는 푸시 후 실행되므로 유출을 완전히 예방하지 못합니다. 저장소 관리자는 GitHub Secret Scanning의 Push Protection을 활성화하고, 가능하면 검사 성공을 병합 필수 조건으로 설정합니다. 현재 연결은 경고 조회와 Actions Secrets 관리에서 HTTP 403을 반환했습니다.

팀 기능 유지를 위한 임시 예외는 **기존 키의 SHA-256 지문과 `team.js` 경로 하나**에만 적용됩니다. 다른 키나 같은 키의 다른 파일 복사는 실패합니다. 이는 키가 안전하다는 판정이나 사용 제한 적용 증거가 아닙니다.

`.gitignore`는 `.env`, 서비스 계정 JSON, 개인키 파일의 실수 등록을 줄입니다. 탐지 패턴은 모든 비밀 형식을 포괄하지 않으므로 커밋 전 변경 내용도 검토합니다.
