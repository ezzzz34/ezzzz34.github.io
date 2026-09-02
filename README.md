# 모바일 청첩장 (ezzzz34.github.io)

GitHub Pages로 배포되는 정적 모바일 청첩장입니다. 빌드 도구·프레임워크 없이 HTML/CSS/JS만 사용합니다.

## 폴더 구조

```
index.html                섹션 구조(뼈대)만 담당 — 순서 변경/섹션 추가 시 수정
assets/
  css/style.css           디자인. 맨 위 :root 변수에서 색·폰트·폭 일괄 변경
  js/config.js            ★ 내용(이름·날짜·장소·연락처·사진 목록) — 대부분의 수정은 여기서
  js/main.js              화면 렌더링 로직 (달력·D-day·갤러리·복사 등)
  img/                    사진 폴더 (아직 비어 있음 — 파일이 없으면 자리표시 이미지가 표시됨)
```

## 수정 방법

| 하고 싶은 것 | 고칠 파일 |
|---|---|
| 이름, 예식 일시, 장소, 연락처, 인사말 | `assets/js/config.js` |
| 색상, 폰트, 여백, 최대 폭 | `assets/css/style.css` 의 `:root` |
| 섹션 순서 변경 / 새 섹션 추가 | `index.html` |
| 사진 추가/교체 | GitHub 저장소 화면에서 `assets/img/` 폴더로 사진을 드래그해 업로드 (파일명은 `main.jpg`, `gallery-01.jpg` … 로 맞추면 코드 수정 불필요) |

`config.js`의 값은 `index.html`의 `data-bind="경로"` 속성과 연결됩니다.
예: `data-bind="couple.groom.name"` → `INVITATION.couple.groom.name` 값이 들어갑니다.

## 로컬에서 미리보기

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 배포

`main` 브랜치에 push하면 GitHub Pages가 자동으로 반영합니다 (보통 1분 이내).
주소: https://ezzzz34.github.io

## 다음 단계 후보

- [ ] 카카오맵 / 네이버지도 약도 삽입 (오시는 길)
- [ ] 마음 전하실 곳 (계좌번호 + 복사 버튼)
- [ ] 참석 여부(RSVP) 폼, 방명록
- [ ] 카카오톡 공유 SDK 연동 (미리보기 카드)
- [ ] 배경음악, 첫 진입 인트로 애니메이션
- [ ] 실제 사진 업로드 및 og:image 갱신
