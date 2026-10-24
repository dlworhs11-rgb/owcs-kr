# OWticker (owticker.com)

OWCS 코리아 비공식 팬 사이트. 일정, 실시간 결과, 순위·대진표, 선수 방송, 직관 안내를 모았다.
정적 사이트이고 GitHub Actions(`pages.yml`)가 빌드 요청이 올 때마다(보통 5분마다, 아래 "빌드는 누가 일으키나"), 그리고 push마다 데이터를 새로 빌드해서 GitHub Pages에 올린다.

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
```
python build_check.py
```
데이터 빌드가 수집기(OWCSKR)와 맞춘 약속을 작은 가짜 입력으로 확인한다(네트워크·수집기 체크아웃 없음): `run-lp` 실패 판정, `_missing.json` 값, active 목록 규칙, 방송 mapstats 거르기, POTM 로스터 확인, 위키 `{{Match}}` 번호, 빌드 실패 때 `dataBuilt`·`buildFails`, 위키 사본 보관 기간(6시간/7일). `check.yml`이 이것도 돌린다.

## 빌드는 누가 일으키나
`pages.yml`(사이트 빌드·배포)을 일으키는 것은 아래 다섯 가지다. 같은 빌드가 여러 번 요청돼도 `concurrency: pages`가 하나씩만 돌린다.

| 트리거 | 무엇 | 상태 (2026-10-24 기준) |
|---|---|---|
| cron-job.org | 5분마다 GitHub API로 `workflow_dispatch`를 보낸다. 실제 빌드의 대부분(300회 중 211회)이 이것이다. 원작자(`dlworhs11-rgb`)의 개인 토큰(PAT)으로 인증된다 | 켜짐. 토큰 종류·범위·만료일은 저장소에 기록이 없다. cron-job.org 작업 설정에서 확인하고 여기에 적어 둘 것 |
| `pages.yml`의 `schedule: */10` | GitHub 자체 스케줄 | GitHub가 하루 5~6번만 돌린다. 믿지 않는다 |
| `refresh-loop.yml` | 9분 넘게 빌드가 없으면 빌드를 요청하는 백업 루프 | GitHub 설정에서 손으로 꺼져 있다(`disabled_manually`). 끈 이유는 기록이 없다. 코드로는 다시 켤 수 없고, Actions 탭 → Refresh loop → Enable workflow로 켠다. cron-job.org와 같이 켜면 요청이 겹치지만 9분 규칙 때문에 빌드가 두 배가 되지는 않는다 |
| `matchday-watch.yml` | 매일 14:20/17:20/20:20 KST에 깨어나, 오늘 경기가 있으면 결과·POTM이 다 들어올 때까지(한 번에 최대 3시간) 10분마다 Liquipedia를 다시 읽는 빌드(`force_lp`)를 요청한다 | 켜짐. GitHub 스케줄이라 2~5시간 늦게 시작하기도 한다 |
| 수집기 서버 (선택) | 수집기(OWCSKR)의 `.env`에 `OWCSKR_SITE_DISPATCH=1`이면 경기일 캡처 시간 동안 10분마다 `tools/dispatch_site.py`가 `gh workflow run pages.yml -R dlworhs11-rgb/owcs-kr`를 부른다 | 기본은 꺼짐. 서버에 이 저장소의 Actions 쓰기 권한이 있는 토큰(`GH_TOKEN`)이 있어야 한다. 3번 연속 실패하면 수집기가 알린다 |

PC의 실시간 데이터 push(`data/live_*`)도 `push` 트리거로 빌드를 일으킨다(빠른 경로 `--fast`).

### 빌드가 멈췄을 때 확인할 것
1. Actions 탭에서 `Deploy site`의 마지막 실행 시각. 20분 넘게 없으면 트리거 문제다: cron-job.org 작업이 켜져 있는지(실패가 이어지면 그 서비스가 스스로 끈다), 토큰이 만료되거나 폐기되지 않았는지, `refresh-loop.yml`을 켤지.
2. 실행은 있는데 데이터가 오래됐으면 빌드 step 로그와 실행 요약의 노란 경고(`::warning`)를 본다. Liquipedia 실패는 `ERR`/`MISSING`/`SHRINK`/`MOVED`/`STOP` 줄이 그대로 찍히고, 실패한 페이지가 있으면 다음 실행이 다시 읽는다(429면 평소 간격을 기다린다).
3. `owcs-ver.json`의 `dataBuilt`는 데이터 빌드가 마지막으로 성공한 시각이다(실패하면 바뀌지 않고, `checked`는 계속 바뀐다). 방송 페이지는 이것이 경기 시간대에 30분, 그 밖에 6시간보다 오래되면 "마지막 확인" 옆에 표시한다. 수집기의 `tools/healthcheck.py`도 이 값을 본다.
4. 데이터 빌드가 3번 연속 실패하면 배포는 하고 실행이 빨간색으로 끝나서 GitHub 실패 메일이 간다. 그 뒤로는 12번째 실패마다 다시 빨간색이 된다(5분 간격이면 한 시간에 한 번, `cloud_live.build_alarm`). 연속 횟수는 배포된 `owcs-data.js`의 `buildFails`에 있다(매 실행이 이전 배포본을 읽으므로 따로 저장할 곳이 없다).
5. Actions 캐시에는 Liquipedia 원본(`OWCSKR/data/lp-cache`, 마지막 재읽기 시각 `_fetched.txt`와 없는 페이지 기록 `_missing.json` 포함)과 `data/lp/_status.json`만 들어간다. 이번 실행이 Liquipedia에서 무언가 읽었을 때만 저장한다. `data/lp`는 매번 수집기 커밋에서 시작하고, active 페이지만 원본에서 다시 만든다. 캐시를 처음부터 다시 받게 하려면 `pages.yml`의 키(`owcskr-wiki1-`)를 바꾼다.
