# OWticker (owticker.com)

OWCS 코리아 비공식 팬 사이트. 일정, 실시간 결과, 순위·대진표, 선수 방송, 직관 안내를 모았다.
정적 사이트이고 GitHub Actions가 10분마다, 그리고 push마다 데이터를 새로 빌드해서 GitHub Pages에 올린다.

## 어디에 무엇이 있나

| 무엇 | 파일 |
|---|---|
| 페이지 (원본 이름 → 사이트 주소) | `OWCS KR Home v6.dc.html` → `/` · `OWCS KR 일정.html` → `/schedule` · `OWCS KR Results.dc.html` → `/results` · `OWCS KR Player.dc.html` → `/player` · `OWCS KR 방송.html` → `/streams` · `OWCS KR 직관.html` → `/tickets` |
| 홈의 다른 보기 | `/standings`, `/players` = 홈 페이지 복사본 (`?view=standings`, `?view=teams`) |
| 배포할 파일 목록, 짧은 주소 | `site_urls.py` (`PAGES`, `SITE_FILES`) — 새 페이지는 여기 + `owcs-nav.js` 메뉴(`HREFS`) |
| 공통 스크립트 | `owcs-nav.js` 상단 메뉴·언어·설정 · `owcs-i18n.js` 일/영/중 번역 · `owcs-maps.js` 세트(맵) 줄 · `owcs-bracket.js` 대진표 · `owcs-phase.js` 토너먼트 모드 · `owcs-dark.js` 다크 모드 · `owcs-theme.js` 화면 선택·배경 · `owcs-datapoll.js` 새 데이터 확인 · `owcs-intl.js` 국제대회 · `owcs-cases.js` 경우의 수 |
| dc 런타임 | `support.js` (생성된 파일, 직접 고치지 않음). `*.dc.html`의 `<sc-if>`, `<sc-for>`, `{{ }}`를 그린다 |
| 데이터 빌드 | `owcs_build.py` (일정·결과·순위·대진표·선수 → `owcs-data.js`), `owcs_cloud.py` (방송 상태, SOOP 다시보기, 캘린더 .ics), `cloud_live.py` (Actions에서 전체 실행) |
| 관리자 페이지 | `admin/index.html`, `admin_server.py` |
| 사이트에 쓰는 데이터 | `data/` (허용 목록만 공개, `.gitignore` 참고). `data/live_*`는 경기일에 PC 기록기가 올린다 |
| 이미지 | `assets/` (heroes, maps, teams, players, players-sm …) |
| 배포·검사 | `.github/workflows/pages.yml` 배포 · `check.yml` 검사 · `refresh-loop.yml`, `matchday-watch.yml` 갱신 요청 · `keepalive.yml` |

`owcs-data.js`는 배포 때 만들어지는 파일이라 저장소에 없다.

## 고치기 전에 알아 둘 것
- **dc 페이지(`*.dc.html`)에는 화면이 2개 있다:** `data-screen-label="…Desktop"`(900px 이상)과 `"…Mobile"`(900px 미만). 화면에 보이는 걸 바꾸면 **두 곳 다** 고친다.
- **한국어 문구를 바꾸면 `owcs-i18n.js`의 같은 줄도 바꾼다.** 번역은 화면 글자를 사전으로 바꾸는 방식이라, 사전에 없는 문장은 경고 없이 한국어로 남는다.
- **스크립트 태그는 `<script src="./x.js"></script>` 모양으로.** 배포가 이 모양에만 `?v=`를 붙인다.
- **페이지 파일 이름, `owcs-data.js`의 칸 이름, `assets/` 경로, localStorage 키는 바꾸지 않는다.** 공유 링크, 캘린더 구독, 경기일 기록기가 이 이름들을 쓴다.
- 템플릿 바인딩은 `{{ x }}` (중괄호 2개). `onClick="{{ fn }}"`만 쓰고 `{{ !x }}` 같은 식은 쓰지 않는다.

## 검사
```
python site_check.py
```
배포 목록·메뉴 링크·스크립트 순서·템플릿 바인딩·관리자 목록이 서로 맞는지 1초 안에 본다. push와 PR마다 `check.yml`이 이것과 Python·JS 문법 검사를 돌린다(배포를 막지는 않는다).
