# 모바일 청첩장 (ezzzz34.github.io)

GitHub Pages로 배포되는 정적 모바일 청첩장입니다. 빌드 도구·프레임워크 없이 HTML/CSS/JS만 사용합니다.

## 폴더 구조

```
index.html                섹션 구조(뼈대)만 담당 — 순서 변경/섹션 추가 시 수정
assets/
  css/style.css           디자인. 맨 위 :root 변수에서 색·폰트·폭 일괄 변경
  js/config.js            ★ 내용(이름·날짜·장소·연락처·사진 목록) — 대부분의 수정은 여기서
  js/main.js              화면 렌더링 로직 (달력·D-day·갤러리·복사 등)
  img/main.jpg            커버(봉투 속) 사진 — 1050×1580
  img/gallery/            갤러리 사진 — 001.jpg(긴 변 1600px) + 001-thumb.jpg(480px 정사각)
  audio/bg.mp3            배경음악 (128kbps)
```

## 수정 방법

| 하고 싶은 것 | 고칠 파일 |
|---|---|
| 이름, 예식 일시, 장소, 연락처, 인사말 | `assets/js/config.js` |
| 색상, 폰트, 여백, 최대 폭 | `assets/css/style.css` 의 `:root` |
| 섹션 순서 변경 / 새 섹션 추가 | `index.html` |
| 갤러리 사진 추가/교체 | `assets/img/gallery/`에 원본·썸네일을 넣고 `config.js`의 `gallery.images` 번호 목록 수정 |

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

- [ ] 마음 전하실 곳 (계좌번호 + 복사 버튼)
- [ ] 참석 여부(RSVP) 폼, 방명록
- [ ] 카카오톡 공유 SDK 연동 (미리보기 카드)
- [ ] og:image 절대경로 갱신 (카카오톡 미리보기)
