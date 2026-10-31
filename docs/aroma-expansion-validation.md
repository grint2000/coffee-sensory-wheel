# 향기 성분 확장 검증 결과

검증일: 2026-10-31. 운영 배포·main 병합·원격 push는 수행하지 않았다.

## 결과

- 기존 수록 8개 → 총 수록 130개, **신규 내용 보강 122개**
- 순위 확인 총 12개(신규 11개), 대표 향기 성분만 118개
- 업데이트 예정 290개. 이 항목들의 개별 문헌 수집은 아직 완료되지 않았다.
- 기존 일괄 제외 항목 중 6개에 문헌 연결. 43개 고유 DOI 사용.
- 원문 전체 대신 공개 초록만 채택한 4개 문헌은 출처에 검토 범위를 표시했다.

## 실행한 검사

| 검사 | 결과 |
| --- | --- |
| `node tests/food-aroma.test.js` | 45개 통과: 원본 420행 SHA, 오렌지 원자료, 수치 없는 원문 순위, 대표 1~3성분, OAV·FD, 동률·결측·동의어·혼합명, 정확한 키 매핑·위치별 출처 |
| `node tests/report-profiles.test.js` | SNS 출력 모델 3개 통과 |
| `python -m unittest discover -s tests -p test_secret_scan.py` | 보안 스캐너 회귀 3개 통과 |
| `python scripts/check-secrets.py` | 새 자격증명 리터럴 없음; 기존 검토된 Firebase 브라우저 설정만 허용 |
| `python tests/food-aroma-browser.py` | 실제 Chromium의 10개 검증 묶음 통과, 페이지 JS 오류 0개 |
| `python tests/food-aroma-cache.py` | v19 캐시 제거·v20 설치, 새 로컬 자산 4개 200, 오프라인 재로딩 후 420개 결과 동일 |
| `node --check` 데이터 JS 2개, `git diff --check` | 통과 |
| 기준 커밋과 범위 대조 | `index.html`은 새 script 로딩과 팝업 서식/열기 함수만 변경. 범위 밖 기존 추적 파일 40개 바이트 동일 |

브라우저 검증은 390×844 모바일에서 420개 팝업 모두 가로 넘침 없음, 터치 열기·성분별 재료/문헌 접기·분석 조건·내부 스크롤·닫기·길게 누르기·선택값 보존을 확인했다. 데스크톱 Tab/Shift+Tab 순환과 Escape 후 포커스 복원도 확인했다. 선택 → 저장 → 새로고침 후 같은 원본 오렌지 키를 재열람했고, 출력 전 필드 검토를 거쳐 카드 배지와 제목을 확인한 뒤 실제 PNG를 다운로드했다. PNG를 열어 카드 형태와 색상 배지도 시각적으로 확인했다.

원본 420행 JSON SHA-256: `80df1b444271f6387b77a4aab50c887624651599e6dbff62420b01e3f0dda936`.

## 실제 검증 파일

작업 디렉터리 밖 `/workspace/aroma-expansion-validation`에 보존했다.

- `coverage.json`, `coverage-summary.json`: 전수 상태·신규 보강 건수
- `catalog-audit.json`: 채택한 키·분자·원문 위치·검토 구간 해시
- `sources/`: 검토한 원문 XML 및 공개 초록 메타데이터
- `model-results.txt`, `browser-results.json`, `cache-results.json`, `scope-check.json`
- `rose-mobile-default.png`, `shiitake-mobile-default.png`, `oolong-mobile-default.png`, `cedar-mobile-default.png`
- `orange-desktop.png`, `orange-mobile.png` 및 성분별 문헌을 펼친 화면들
- `sns-regression.png`: 앱에서 실제 다운로드한 PNG

## 변경 파일

- `aroma-literature-data.js`: 재료별 문헌 데이터·성분 설명·확인 위치·원문 순서
- `food-aroma-data.js`: 대표 성분/순위/업데이트 예정 해석, 기준·시료·단위 검증
- `index.html`, `food-aroma.css`: 성분 설명, 성분별 참고 재료·문헌 접기, 수치 없는 표시
- `service-worker.js`: 새 데이터 자산 및 v20 캐시
- `README.md`, `docs/reference-food-aroma.md`, `docs/aroma-source-audit.md`, `docs/aroma-coverage.csv`, 이 검증 문서
- `tests/food-aroma.test.js`, `tests/food-aroma-browser.py`, `tests/food-aroma-cache.py`

`flavor-evidence.js`의 기존 resolver 어댑터는 그대로 사용한다. 저장 스키마·선택값·점수·로트·재커핑·팀/Firebase·SNS 카드/필드 검토 구현은 보존했다. 마이그레이션은 추가하지 않았다.

백업 위치·복구 명령·시작 브랜치와 HEAD는 [백업 및 데이터 규칙](reference-food-aroma.md)에 기록했다. 배포는 별도 승인 후 진행한다.
