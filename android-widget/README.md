# CAT Android 달력 위젯

- 상단 왼쪽: `일 >` / `월 >` 주 시작 요일 전환
- 가운데: 이전 달 / 연월 / 다음 달
- 상단 오른쪽: `CAT` — 설치된 CAT PWA를 우선 실행
- 날짜 터치: 근무형태 선택
- CAT 버튼으로 앱을 열면 위젯 입력을 앱에 반영하고, 앱의 현재 근태/주 시작 설정을 다시 위젯으로 가져옵니다.
- 처음 위젯을 추가한 뒤 CAT을 한 번 누르면 기존 앱 근태기록이 위젯에 채워집니다.
- GitHub Actions가 저장소 주소를 자동으로 GitHub Pages 주소로 넣어 debug APK를 빌드합니다.


## 고정 APK 서명

GitHub Actions는 저장소 Secret의 동일한 keystore를 매번 복원해 release APK를 서명합니다.

최초 1회:
1. Windows PowerShell에서 `scripts/setup-widget-signing.ps1` 실행
2. GitHub Actions repository secrets에 아래 두 값이 등록되어 있어야 합니다.
   - `CAT_WIDGET_KEYSTORE_BASE64`
   - `CAT_WIDGET_KEYSTORE_PASSWORD`
3. 이후 Actions artifact `CAT-widget-signed-apk`의 `app-release.apk`를 사용합니다.

`.cat-signing/cat-widget-release.jks`는 절대 삭제하지 말고 안전한 별도 위치에 백업해야 합니다.
고정 서명으로 전환하는 첫 설치만 기존 debug APK 삭제가 필요할 수 있으며,
그 이후부터는 같은 applicationId + 같은 signing key + 더 높은 versionCode로 덮어쓰기 업데이트가 가능합니다.
