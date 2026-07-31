# CAT 근태관리 Google 로그인 연결

이 버전은 **Guest 로그인**과 **Google 로그인**을 모두 지원하도록 작성되어 있습니다.
Guest는 기존처럼 현재 기기의 브라우저 저장소만 사용합니다. Google 로그인은 같은 Google 계정으로 로그인한 휴대폰과 컴퓨터 사이에서 근무기록, 연차, 급여 설정, 상여·보너스, 달력 시작 요일을 동기화합니다.

## 1. Firebase 프로젝트 만들기

1. Firebase Console에서 새 프로젝트를 만듭니다.
2. 프로젝트 개요에서 **웹 앱(</>)**을 추가합니다.
3. 표시되는 `firebaseConfig` 값을 `src/firebase-config.js`에 입력합니다.

## 2. Google 로그인 켜기

1. Firebase Console에서 **Authentication**을 엽니다.
2. **Sign-in method**에서 **Google**을 사용 설정합니다.
3. Authentication의 **Settings > Authorized domains**에 아래 주소를 추가합니다.

```text
idonutyou.github.io
```

## 3. Firestore 만들기

1. Firebase Console에서 **Firestore Database**를 만듭니다.
2. Firestore의 **Rules** 탭에 이 프로젝트의 `firestore.rules` 내용을 붙여넣고 게시합니다.

규칙은 로그인한 사용자가 자신의 UID 경로만 읽고 쓸 수 있도록 제한합니다.

## 4. GitHub에 올리기

설정값 입력과 규칙 적용을 마친 뒤 프로젝트를 GitHub에 올립니다.

```bash
git add .
git commit -m "Guest 및 Google 로그인 동기화 추가"
git push
# 명령어 입력 완료
```

## 동작 방식

- **Guest 로그인**: 현재 기기에만 저장
- **Google 로그인 첫 사용**: 클라우드에 데이터가 없으면 현재 기기의 기존 기록을 처음 데이터로 업로드
- **다른 기기에서 같은 Google 계정 로그인**: 클라우드 기록을 불러오고 이후 변경사항을 실시간 반영
- **다른 Google 계정**: 서로 다른 UID 경로를 사용하므로 기록이 섞이지 않음
- 메뉴의 계정 영역에서 로그아웃하거나 계정을 전환할 수 있음
