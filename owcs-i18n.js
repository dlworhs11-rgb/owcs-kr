// Site-wide language (한국어 / 日本語 / EN). The pages are written in Korean; in ja/en this walks the page text
// (and keeps watching it, since the pages re-render every second) and swaps every Korean string for its translation.
// Until a language is picked it follows the browser's language. The choice is kept in this browser (localStorage 'owcs-lang') so every page opens in the same language.
// ?lang=ja|en|ko also sets it.
(function () {
  var KEY = 'owcs-lang';
  var q = new URLSearchParams(location.search).get('lang');
  var lang = 'ko';
  // first visit: follow the browser language (Japanese -> 日本語, Korean -> 한국어, anything else -> EN); a choice made on the site wins
  var nav = (navigator.languages && navigator.languages[0] || navigator.language || 'ko').toLowerCase();
  var guess = /^ja/.test(nav) ? 'ja' : /^ko/.test(nav) ? 'ko' : 'en';
  try { if (/^(ko|ja|en)$/.test(q)) localStorage.setItem(KEY, q); lang = localStorage.getItem(KEY) || guess; } catch (e) { lang = q || guess; }
  if (!/^(ko|ja|en)$/.test(lang)) lang = 'ko';

  // [korean, japanese, english]
  var T = [
    // navigation / common
    ['일정', '日程', 'Schedule'], ['결과', '結果', 'Results'], ['순위', '順位', 'Standings'], ['직관', '観戦', 'Tickets'], ['선수', '選手', 'Players'], ['방송', '配信', 'Live'],
    ['홈', 'ホーム', 'Home'], ['팀', 'チーム', 'Team'], ['한국어', '한국어', '한국어'],
    ['스포일러 방지', 'ネタバレ防止', 'No spoilers'], ['다크 모드', 'ダークモード', 'Dark mode'], ['내 팀', 'マイチーム', 'My team'],
    ['☆ 내 팀으로 설정', '☆ マイチームに設定', '☆ Set as my team'], ['★ 내 팀', '★ マイチーム', '★ My team'],
    ['탱커', 'タンク', 'Tank'], ['딜러', 'ダメージ', 'Damage'], ['힐러', 'サポート', 'Support'], ['탱', 'タ', 'T'], ['딜', 'ダ', 'D'], ['힐', 'サ', 'S'],
    ['승', '勝', 'W'], ['패', '敗', 'L'], ['세트', 'セット', 'Maps'], ['세트 득실', 'セット得失', 'Map diff'], ['득실', '得失', 'Diff'], ['승률', '勝率', 'Win rate'],
    ['종료', '終了', 'Final'], ['예정', '予定', 'Upcoming'], ['경기', '試合', 'matches'], ['경기 중', '試合中', 'Live now'], ['기록 중', '記録中', 'Recording'],
    ['승리', '勝利', 'Won'], ['발표 전', '未発表', 'TBA'], ['중계', '実況', 'Casters'], ['현재', '現在', 'Now'], ['사진', '写真', 'Photo'],
    ['디자인: 기본 → Wise로', 'デザイン: 標準 → Wise', 'Design: default → Wise'], ['디자인: Wise → 기본으로', 'デザイン: Wise → 標準', 'Design: Wise → default'],
    ['비공식 팬 사이트입니다. Blizzard Entertainment 및 OWCS 공식 운영과 관련이 없습니다.', '非公式ファンサイトです。Blizzard Entertainment および OWCS 公式運営とは関係ありません。', 'Unofficial fan site. Not affiliated with Blizzard Entertainment or the official OWCS operation.'],
    ['경기·순위: Liquipedia (CC-BY-SA 3.0)', '試合・順位: Liquipedia (CC-BY-SA 3.0)', 'Matches & standings: Liquipedia (CC-BY-SA 3.0)'],
    ['실시간 맵 승패: SOOP 공식 중계 캡처', 'リアルタイムのマップ勝敗: SOOP公式中継のキャプチャ', 'Live map results: captured from the official SOOP stream'],
    ['선수 방송/디스코드: 커뮤니티 시트', '選手配信/Discord: コミュニティシート', 'Player streams/Discord: community sheet'], ['인스타/X: Liquipedia', 'Instagram/X: Liquipedia', 'Instagram/X: Liquipedia'],
    ['업데이트', '更新', 'Updated'], ['테스트 모드:', 'テストモード:', 'Test mode:'], ['결과는 임의로 넣은 값', 'の結果は仮の値', 'results are made up'], ['TEST · 임의 결과', 'TEST · 仮の結果', 'TEST · fake results'],
    ['OWCS 한국 경기의 일정, 결과, 선수 정보를 한국 팬을 위해 한곳에 모았어요.', 'OWCS韓国リーグの日程・結果・選手情報をひとつにまとめました。', 'OWCS Korea schedule, results and players, all in one place.'],
    ['문의', 'お問い合わせ', 'Contact'],
    // ticket banner
    ['직관 안내 · OWCS ASIA : KOREA STAGE 3', '観戦案内 · OWCS ASIA : KOREA STAGE 3', 'Tickets · OWCS ASIA : KOREA STAGE 3'], ['직관 안내 · KOREA STAGE 3', '観戦案内 · KOREA STAGE 3', 'Tickets · KOREA STAGE 3'],
    ['WDG STUDIO HONGDAE에서 직관!', 'WDG STUDIO HONGDAEで観戦しよう!', 'Watch live at WDG STUDIO HONGDAE!'], ['예매 안내 →', 'チケット案内 →', 'Ticket info →'], ['눌러서 예매 안내 보기 →', 'タップしてチケット案内 →', 'Tap for ticket info →'], ['직관 예매 QR', '観戦チケットQR', 'Ticket QR'],
    // today
    ['오늘의 경기', '今日の試合', "Today's match"], ['오늘은 경기가 없어요', '今日は試合がありません', 'No match today'], ['다음 경기', '次の試合', 'Next match'], ['다음 일정', '次の日程', 'Up next'],
    ['방송 예정', '配信予定', 'Starting soon'], ['경기 종료', '試合終了', 'Finished'], ['오늘 경기 종료', '本日の試合終了', "Today's matches are over"],
    ['방송이 시작되면 이곳에 자동으로 표시돼요', '配信が始まるとここに自動で表示されます', 'The stream appears here automatically when it starts'],
    ['오늘 경기가 모두 끝났어요', '本日の試合はすべて終了しました', "All of today's matches are over"], ['다시보기는 SOOP owesports 방송국에서 볼 수 있어요', 'アーカイブはSOOP owesportsで見られます', 'Replays are on SOOP owesports'],
    ['정규 리그 일정이 끝났어요', 'レギュラーシーズンは終了しました', 'The regular season is over'],
    ['세트별 상세 접기', 'セット詳細を閉じる', 'Hide map details'], ['스코어를 눌러 세트별 맵 · 밴 · 승리 팀 보기', 'スコアを押すとマップ・BAN・勝者を表示', 'Tap the score for maps, bans and winners'],
    ['SOOP · 공식 중계', 'SOOP · 公式中継', 'SOOP · official stream'], ['SOOP owesports 방송국 ↗', 'SOOP owesports ↗', 'SOOP owesports channel ↗'],
    ['선벤', '先BAN', '1st ban'], ['후벤', '後BAN', '2nd ban'], ['쟁탈', '制圧', 'Control'], ['플래시포인트', 'フラッシュポイント', 'Flashpoint'], ['밀기', 'プッシュ', 'Push'], ['혼합', 'ハイブリッド', 'Hybrid'], ['호위', 'エスコート', 'Escort'], ['점령', '占領', 'Assault'], ['격돌', 'クラッシュ', 'Clash'],
    ['기록 중이에요. 세트가 끝나면 양 팀 조합이 올라와요.', '記録中です。セット終了後に両チームの構成が表示されます。', 'Recording. Both comps appear when the map ends.'],
    ['이 세트의 첫 조합 기록이 아직 없어요.', 'このセットの初期構成はまだ記録がありません。', 'No starting comp recorded for this map yet.'], ['세트가 끝나면 조합이 올라와요.', 'セット終了後に構成が表示されます。', 'Comps appear when the map ends.'], ['첫 조합 기록 없음', '初期構成なし', 'No starting comp'],
    ['시간', '時間', 'hrs'], ['분', '分', 'min'], ['초', '秒', 'sec'],
    // schedule
    ['경기 일정', '試合日程', 'Schedule'], ['일정 공유', '日程を共有', 'Share schedule'], ['최근 · 다가오는 경기', '最近 · 今後の試合', 'Recent · Upcoming'], ['모든 시간 KST', '時間はすべてKST', 'All times KST'], ['전체 일정 보기 →', 'すべての日程 →', 'Full schedule →'],
    ['구글 캘린더', 'Googleカレンダー', 'Google Calendar'], ['링크 복사', 'リンクをコピー', 'Copy link'], ['복사됨', 'コピー済み', 'Copied'], ['링크를 복사했어요', 'リンクをコピーしました', 'Link copied'],
    ['링크 복사됨 ✓', 'リンクをコピーしました ✓', 'Link copied ✓'], ['일정 링크 복사', '日程リンクをコピー', 'Copy schedule link'],
    ['전체 경기 캘린더에 추가', '全試合をカレンダーに追加', 'Add all matches to calendar'], ['남은 경기만 캘린더에 추가', '残りの試合をカレンダーに追加', 'Add remaining matches to calendar'],
    ['좋아하는 팀 경기만 캘린더에 추가', '好きなチームの試合だけ追加', "Add only your team's matches"],
    ['ICS 파일을 받았어요 · 구글 캘린더 > 설정 > 가져오기에서 올리면 돼요', 'ICSファイルを保存しました · Googleカレンダー > 設定 > インポートで追加できます', 'ICS saved · import it in Google Calendar > Settings > Import'],
    ['다음 경기를 구글 캘린더에 추가하는 창을 열었어요', '次の試合をGoogleカレンダーに追加する画面を開きました', 'Opened Google Calendar for the next match'],
    // standings
    ['팀별 순위', 'チーム順位', 'Standings'], ['플레이오프 진출선', 'プレーオフ圏', 'Playoff line'], ['라스트 찬스 진출선', 'ラストチャンス圏', 'Last chance line'], ['플레이오프', 'プレーオフ', 'Playoffs'],
    ['전체 순위 · 경우의 수 보기', '全順位・プレーオフ条件を見る', 'Full standings & scenarios'], ['전체 순위 보기', '全順位を見る', 'Full standings'],
    ['플레이오프 시드 결정전', 'プレーオフシード決定戦', 'playoff seeding'], ['라스트 찬스 예선', 'ラストチャンス予選', 'last chance qualifier'], ['전 경기 3선승제', '全試合3本先取', 'all matches first to 3'],
    // teams
    ['팀 & 선수 라인업', 'チーム & 選手', 'Teams & Rosters'], ['팀 & 선수', 'チーム & 選手', 'Teams & Players'], ['한글 이름', '韓国語名', 'Korean name'], ['최근 경기', '最近の試合', 'Last match'],
    ['로스터', 'ロスター', 'Roster'], ['공식 X', '公式X', 'Official X'], ['인스타그램', 'Instagram', 'Instagram'], ['지금 방송 중인 선수 없음', '配信中の選手はいません', 'No players live'],
    // results
    ['이번 시즌 결과', '今シーズンの結果', 'This season'], ['지난 시즌 · 대진표', '過去シーズン · トーナメント表', 'Past seasons · Brackets'], ['대진표', 'トーナメント表', 'Bracket'], ['경우의 수', 'プレーオフ条件', 'Scenarios'],
    ['팀별 승률', 'チーム別勝率', 'Win rates'], ['지난 경기 검색', '過去の試合を検索', 'Search past matches'], ['팀 약칭·이름으로 검색 · 두 팀은 쉼표로 구분', 'チーム略称・名前で検索 · 2チームはカンマ区切り', 'Search by team · separate two teams with a comma'],
    ['예: PF,CR 또는 CR', '例: PF,CR または CR', 'e.g. PF,CR or CR'], ['지난 경기 · PF,CR', '過去の試合 · PF,CR', 'Past matches · PF,CR'], ['다시보기 ↗', 'アーカイブ ↗', 'Replay ↗'], ['맵 상세 ▾', 'マップ詳細 ▾', 'Map details ▾'], ['맵 상세 ▴', 'マップ詳細 ▴', 'Map details ▴'],
    ['팀을 찾을 수 없어요', 'チームが見つかりません', 'Team not found'], ['플레이오프 확정', 'プレーオフ確定', 'Playoffs clinched'], ['탈락', '敗退', 'Eliminated'], ['플레이오프 경쟁', 'プレーオフ争い', 'In the playoff race'],
    ['LCQ 확정', 'LCQ確定', 'LCQ clinched'], ['LCQ 경쟁', 'LCQ争い', 'In the LCQ race'], ['순위 싸움', '順位争い', 'Race'],
    ['다른 팀 결과와 세트 득실에 따라 플레이오프가 갈려요.', '他チームの結果とセット得失でプレーオフが決まります。', 'Playoffs depend on other results and map differential.'],
    ['플레이오프 직행은 어렵지만 라스트 찬스 예선은 확정이에요.', 'プレーオフ直行は難しいですが、ラストチャンス予選は確定です。', 'Direct playoffs are out of reach, but the LCQ is secured.'],
    ['최소 라스트 찬스 예선은 확정이에요.', '少なくともラストチャンス予選は確定です。', 'At least the LCQ is secured.'],
    ['경기 기준', '試合基準', 'matches'],
    // player
    ['지금 방송 중', '配信中', 'Live now'], ['개인 방송', '個人配信', 'Stream'], ['등록된 방송 없음', '登録された配信なし', 'No stream listed'], ['방송 보러가기 →', '配信を見る →', 'Watch stream →'], ['방송국 가기 →', 'チャンネルへ →', 'Go to channel →'],
    ['보러가기 →', '見る →', 'Watch →'], ['치지직 채널', 'CHZZKチャンネル', 'CHZZK channel'], ['SOOP 방송국', 'SOOPチャンネル', 'SOOP channel'], ['디스코드 서버', 'Discordサーバー', 'Discord server'], ['선수 문서', '選手ページ', 'Player page'],
    ['SOOP 생방송', 'SOOP 配信中', 'SOOP live'], ['CHZZK 생방송', 'CHZZK 配信中', 'CHZZK live'], ['SOOP 방송국', 'SOOPチャンネル', 'SOOP channel'], ['CHZZK 방송국', 'CHZZKチャンネル', 'CHZZK channel'],
    ['포지션', 'ポジション', 'Role'], ['소속', '所属', 'Team'], ['대회 업적', '大会実績', 'Achievements'], ['팀 페이지 →', 'チームページ →', 'Team page →'], ['사진 준비 중', '写真準備中', 'Photo coming soon'],
    ['OWCS 코리아·아시아·월드 파이널·EWC 4위 이내 · Liquipedia', 'OWCS コリア・アジア・ワールドファイナル・EWC 4位以内 · Liquipedia', 'Top-4 finishes at OWCS Korea, Asia, World Finals and EWC · Liquipedia'],
    ['구글 캘린더로 남은 경기 구독', 'Googleカレンダーで残りの試合を購読', 'Subscribe in Google Calendar'], ['캘린더에 추가', 'カレンダーに追加', 'Add to calendar'], ['이 경기를 구글 캘린더에 추가', 'この試合をGoogleカレンダーに追加', 'Add this match to Google Calendar'],
    ['우승', '優勝', 'Champion'], ['준우승', '準優勝', 'Runner-up'], ['대회 기록이 아직 없어요', '大会実績はまだありません', 'No major results yet'],
    // streams
    ['선수 개인 방송 · CHZZK / SOOP', '選手の個人配信 · CHZZK / SOOP', 'Player streams · CHZZK / SOOP'], ['지금 방송 중인 선수', '配信中の選手', 'players live now'], ['방송 중 없음', '配信なし', 'Nobody live'],
    ['채널 없음', 'チャンネルなし', 'No channel'], ['마지막 확인', '最終確認', 'Last checked'], ['방송 상태는 CHZZK·SOOP에서 몇 분마다 확인해요.', '配信状況はCHZZK・SOOPで数分ごとに確認しています。', 'Live status is checked on CHZZK and SOOP every few minutes.'],
    ['방송 상태 확인이 꺼져 있으면 모두 꺼짐으로 보여요', '確認が止まっているとすべてオフライン表示になります', 'everyone shows offline while checking is off'],
    // ticket page
    ['직관 안내 · 2026 OWCS ASIA KOREA STAGE 3', '観戦案内 · 2026 OWCS ASIA KOREA STAGE 3', 'Tickets · 2026 OWCS ASIA KOREA STAGE 3'],
    ['서울 마포구 상수동 72-1, 홍익대학교 잔다리홀 B1. 정규 리그부터 플레이오프까지 모든 경기를 현장에서 볼 수 있어요.', 'ソウル市麻浦区上水洞72-1 弘益大学チャンダリホールB1。レギュラーシーズンからプレーオフまで全試合を会場で観戦できます。', '72-1 Sangsu-dong, Mapo-gu, Seoul (Hongik Univ. Jandari Hall B1). Every match from the regular season to the playoffs is played here in front of fans.'],
    ['기간', '期間', 'Dates'], ['토·일', '土・日', 'Sat–Sun'], ['만 15세 이상', '15歳以上', 'Ages 15+'], ['다음 직관 가능 경기일', '次に観戦できる試合日', 'Next match day with tickets'],
    ['판매 중', '販売中', 'On sale'], ['오픈 예정', '販売予定', 'Coming soon'], ['마감', '締切', 'Closed'], ['판매 오픈', '販売開始', 'Sale opens'], ['판매 마감', '販売締切', 'Sale closes'], ['상태', '状態', 'Status'], ['경기일', '試合日', 'Match day'],
    ['티켓링크에서 예매 ↗', 'TicketLinkで購入 ↗', 'Buy on TicketLink ↗'], ['예매 일정 보기', '販売日程を見る', 'Sale schedule'], ['대회 정보', '大会情報', 'Event info'], ['대회 기간', '大会期間', 'Dates'], ['대회 시간', '試合時間', 'Times'],
    ['토, 일', '土, 日', 'Sat, Sun'], ['대회 장소', '会場', 'Venue'], ['서울 마포구 상수동 72-1, 홍익대학교 잔다리홀 B1', 'ソウル市麻浦区上水洞72-1 弘益大学チャンダリホールB1', '72-1 Sangsu-dong, Mapo-gu, Seoul · Hongik Univ. Jandari Hall B1'],
    ['관람 시간', '観覧時間', 'Running time'], ['360분', '360分', '360 min'], ['관람 등급', '年齢制限', 'Age rating'], ['만 15세 미만은 보호자 동반 시 입장 가능', '15歳未満は保護者同伴で入場可', 'Under 15 with a guardian'],
    ['티켓 가격', 'チケット価格', 'Prices'], ['R석', 'R席', 'R seat'], ['A석', 'A席', 'A seat'], ['B석', 'B席', 'B seat'], ['30,000원', '30,000ウォン', '₩30,000'], ['25,000원', '25,000ウォン', '₩25,000'], ['20,000원', '20,000ウォン', '₩20,000'],
    ['1인당 4매까지 · 예매수수료 장당 1,000원', '1人4枚まで · 手数料1枚1,000ウォン', 'Max 4 per person · ₩1,000 fee per ticket'], ['예매는 경기 당일 오후 9시까지', '購入は試合当日21時まで', 'Sales close at 9 PM on match day'],
    ['취소는 예매처(티켓링크) 규정에 따라요', 'キャンセルはTicketLinkの規定に従います', "Cancellations follow TicketLink's rules"],
    ['티켓 가격에 기념품은 포함되지 않아요. 현장 기념품은 주최측 무료 제공이라 교환·환불·재지급이 안 돼요', 'チケットに記念品は含まれません。会場の記念品は無料配布のため交換・返金・再配布はできません', 'Merch is not included. On-site gifts are free, so no exchanges, refunds or reissues'],
    ['오시는 길', 'アクセス', 'Getting there'], ['지하철 2·6호선', '地下鉄2・6号線', 'Subway lines 2 & 6'], ['지도를 불러오는 중이에요', '地図を読み込み中', 'Loading map'], ['안 보이면 오른쪽 네이버 지도 · 카카오맵 버튼을 눌러 주세요', '表示されない場合は右のNAVER地図・KakaoMapを押してください', 'If it does not load, use the NAVER Map or KakaoMap buttons'],
    ['주소', '住所', 'Address'], ['서울 마포구 상수동 72-1', 'ソウル市麻浦区上水洞72-1', '72-1 Sangsu-dong, Mapo-gu, Seoul'], ['홍익대학교 잔다리홀 B1 · WDG STUDIO HONGDAE', '弘益大学チャンダリホールB1 · WDG STUDIO HONGDAE', 'Hongik Univ. Jandari Hall B1 · WDG STUDIO HONGDAE'],
    ['홍대입구역', '弘大入口駅', 'Hongik Univ. Stn'], ['홍익대학교 방면', '弘益大学方面', 'toward Hongik Univ.'], ['상수역', '上水駅', 'Sangsu Stn'], ['가장 가까운 역', '最寄り駅', 'closest station'], ['합정역', '合井駅', 'Hapjeong Stn'], ['2·6호선 환승', '2・6号線乗換', 'Lines 2 & 6 transfer'],
    ['네이버 지도 ↗', 'NAVER地図 ↗', 'NAVER Map ↗'], ['카카오맵 ↗', 'KakaoMap ↗', 'KakaoMap ↗'], ['예매 정보', 'チケット情報', 'Ticket sales'], ['모든 시간 KST · 상태는 지금 시각 기준', '時間はすべてKST · 状態は現在時刻基準', 'All times KST · status as of now'],
    ['만 15세 이상 관람가예요.', '15歳以上が観覧できます。', 'Ages 15 and up.'], ['2011년 이전 출생자', '2011年以前生まれ', 'Born before 2011'],
    ['까지 입장할 수 있고, 2011년 출생자는 생일이 지난 날부터 만 15세가 적용돼요. 생년월일을 가장 먼저 확인하니 증빙 서류를 챙겨 주세요. 만 15세 미만은 보호자와 함께 입장할 수 있어요.', 'まで入場でき、2011年生まれは誕生日以降に15歳として扱われます。生年月日を最初に確認するので証明書類をお持ちください。15歳未満は保護者同伴で入場できます。', 'can enter; if born in 2011 you count as 15 from your birthday. Birth dates are checked first, so bring ID. Under 15 may enter with a guardian.'],
    ['티켓 수령 · 관람 안내', 'チケット受取 · 観覧案内', 'Pick-up & house rules'], ['티켓 수령', 'チケット受取', 'Ticket pick-up'], ['경기 관람', '観覧', 'At the venue'],
    ['배송 없이 당일 경기 1시간 전부터 현장 키오스크에서 발권해요', '配送はなく、当日試合1時間前から会場のキオスクで発券します', 'No delivery: print at the venue kiosk from 1 hour before the match'],
    ['운영 시간은 현장 상황에 따라 바뀔 수 있어요', '運営時間は会場の状況により変わる場合があります', 'Hours may change on the day'], ['부분 출력은 안 되고, 예매한 전체 건만 출력돼요', '一部のみの発券はできず、購入分すべてが発券されます', 'Only whole bookings can be printed'],
    ['1인 1매 티켓을 가진 관객만 입장할 수 있어요', '1人1枚のチケットを持つ方のみ入場できます', 'One ticket per person to enter'], ['수령한 티켓을 잃어버리면 어떤 이유로도 재발권이 안 돼요. 실물 티켓이 있어야 입장할 수 있어요', '受け取ったチケットを紛失しても再発券できません。実物のチケットが必要です', 'Lost tickets cannot be reissued. You need the printed ticket to enter'],
    ['입장은 경기 시작 1시간 전부터 (티켓 미소지 시 입장 불가)', '入場は試合開始1時間前から(チケットがないと入場不可)', 'Doors open 1 hour before (ticket required)'], ['예매한 좌석에서만 관람하고, 좌석 이동은 안 돼요', '購入した席でのみ観覧でき、席の移動はできません', 'Stay in your booked seat'],
    ['티켓은 앞면에 적힌 일시에만 유효하고, 현장 판매는 없어요', 'チケットは記載の日時のみ有効で、当日販売はありません', 'Tickets are valid only for the printed date; no door sales'],
    ['스낵·음료는 괜찮지만 주류와 관람을 방해하는 음식물은 반입할 수 없어요', 'スナック・飲み物は可、酒類と観覧の妨げになる飲食物は持ち込めません', 'Snacks and drinks are fine; no alcohol or disruptive food'],
    ['동영상 촬영, 음성·영상 스트리밍 등 저작권 침해 행위는 금지예요. 적발 시 자료 삭제 후 퇴장해요', '動画撮影・音声/映像の配信など著作権侵害行為は禁止です。発覚時はデータ削除のうえ退場となります', 'No video recording or streaming. Offenders delete the footage and are removed'],
    ['온라인 중계가 있어서 관객 목소리와 얼굴이 방송에 나올 수 있어요', 'オンライン中継があるため観客の声や顔が映る場合があります', 'The event is streamed, so you may appear on the broadcast'],
    ['비방·정치·종교·상업 목적의 배너, 현수막 등은 반입·게시할 수 없어요', '誹謗・政治・宗教・商業目的のバナー等は持ち込み・掲示できません', 'No defamatory, political, religious or commercial banners'],
    ['금지 행위나 진행 방해 시 경고 없이 퇴장될 수 있고, 티켓은 환불되지 않아요', '禁止行為や進行妨害は警告なしで退場となり、返金されません', 'Banned behaviour means removal without warning or refund'],
    ['본인 확인 · 지정 유효 신분증', '本人確認 · 有効な身分証', 'ID check · accepted ID'],
    ['암표와 불법 양도를 막기 위해 현장 매표소에서 티켓 수령 전에 본인확인을 해요. 시간이 걸리니 미리 와 주세요', '転売防止のため受取前に本人確認を行います。時間がかかるので早めにお越しください', 'ID is checked before pick-up to stop scalping. Please come early'],
    ['예매자와 신분증이 일치하지 않으면 입장이 제한돼요', '購入者と身分証が一致しない場合は入場できません', 'Entry is refused if the ID does not match the buyer'], ['유효기간이 지나지 않은', '有効期限内の', 'Unexpired'], ['실물', '実物の', 'physical'],
    ['신분증만 인정돼요. 모바일 신분증, 사본, 사진은 안 돼요', '身分証のみ有効です。モバイル身分証・コピー・写真は不可', 'ID only. No mobile ID, copies or photos'], ['구분', '区分', 'Type'], ['미성년', '未成年', 'Minors'], ['성년', '成人', 'Adults'],
    ['학생증 + 재학(적) 증명서', '学生証 + 在学証明書', 'Student ID + enrolment certificate'], ['사진이 있는 학생증과 기관장 관인이 찍힌 재학(적)증명서를 함께 지참', '写真付き学生証と公印のある在学証明書を一緒に持参', 'Photo student ID plus a stamped enrolment certificate'],
    ['주민등록증 / 운전면허증', '住民登録証 / 運転免許証', 'Resident card / driving licence'], ['사진, 주민등록번호, 성명이 명확하게 기재', '写真・登録番号・氏名がはっきり記載されたもの', 'Photo, ID number and name clearly shown'], ['여권', 'パスポート', 'Passport'],
    ['기관장 관인으로 간인하고 사진을 포함한 인적사항 · 발급번호 · 유효기간이 있는 투명스티커가 붙은 상태', '公印で割印され、写真付きの個人情報・発行番号・有効期限の透明シールが貼られたもの', 'Stamped, with a clear sticker showing photo, details, number and expiry'],
    ['주민등록증 발급신청 확인서', '住民登録証発行申請確認書', 'Resident card application receipt'], ['청소년증', '青少年証', 'Youth ID'], ['불가', '不可', 'Not accepted'], ['기타 인정 범위', 'その他の有効な身分証', 'Also accepted'],
    ['공무원증, 선원수첩, 교육 자격증, 국가기술자격증, 장애인복지카드, 전역증(전역 후 1년 이내), 외국인등록증, 외국국적동포국내거소신고증, 재외국민국내거소신고증', '公務員証、船員手帳、教育資格証、国家技術資格証、障害者福祉カード、除隊証(除隊後1年以内)、外国人登録証、在外同胞居所申告証、在外国民居所申告証', 'Civil-servant ID, seaman’s book, teaching or national technical licence, disability card, discharge card (within 1 year), alien registration card, overseas Korean residence cards'],
    ['티켓 · 예매 문의', 'チケットのお問い合わせ', 'Ticket enquiries'], ['티켓링크 1588-7890', 'TicketLink 1588-7890', 'TicketLink 1588-7890'], ['전화 걸기', '電話する', 'Call'],
    ['비공식 팬 사이트입니다. Blizzard Entertainment 및 OWCS 공식 운영과 관련이 없습니다. 직관 정보는 2026 OWCS ASIA KOREA STAGE 3 공식 예매 안내를 옮긴 것이라, 바뀐 내용은 티켓링크 공지를 확인해 주세요.', '非公式ファンサイトです。観戦情報は2026 OWCS ASIA KOREA STAGE 3の公式案内を転載したものです。変更はTicketLinkのお知らせをご確認ください。', 'Unofficial fan site. Ticket info is copied from the official 2026 OWCS ASIA KOREA STAGE 3 notice; check TicketLink for changes.'],
    ['WDG STUDIO HONGDAE 지도', 'WDG STUDIO HONGDAE 地図', 'WDG STUDIO HONGDAE map'],
    ['정규 리그 판매가 끝났어요. 시드 결정전·LCQ는 10.28, 플레이오프는 11.04 오픈이에요.', 'レギュラーシーズンの販売は終了しました。シード決定戦・LCQは10.28、プレーオフは11.04に販売開始です。', 'Regular-season sales are over. Seeding/LCQ open 10.28, playoffs 11.04.'],
    ['스테이지 3', 'ステージ3', 'Stage 3'], ['정규 리그', 'レギュラーシーズン', 'regular season'], ['기준', '時点', 'as of'], ['주 남음', '週残り', 'weeks left'],
  ];
  var DOW = { '일': ['日', 'Sun'], '월': ['月', 'Mon'], '화': ['火', 'Tue'], '수': ['水', 'Wed'], '목': ['木', 'Thu'], '금': ['金', 'Fri'], '토': ['土', 'Sat'] };
  var DOWL = { '일요일': ['日曜日', 'Sunday'], '월요일': ['月曜日', 'Monday'], '화요일': ['火曜日', 'Tuesday'], '수요일': ['水曜日', 'Wednesday'], '목요일': ['木曜日', 'Thursday'], '금요일': ['金曜日', 'Friday'], '토요일': ['土曜日', 'Saturday'] };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var col = lang === 'ja' ? 1 : 2;
  var DICT = {};
  T.forEach(function (r) { DICT[r[0]] = r[col]; });
  Object.keys(DOW).forEach(function (k) { DICT[k] = DOW[k][col - 1]; });
  Object.keys(DOWL).forEach(function (k) { DICT[k] = DOWL[k][col - 1]; });
  var J = lang === 'ja';
  // number patterns (order matters)
  var RULES = [
    [/^(\d+)승 (\d+)패$/, J ? '$1勝 $2敗' : '$1W $2L'],
    [/^(\d+)주차$/, J ? '第$1週' : 'Week $1'],
    [/(\d+)주차/g, J ? '第$1週' : 'week $1'],
    [/\((월|화|수|목|금|토|일)\)/g, function (m, d) { return '(' + DOW[d][col - 1] + ')'; }],
    [/^(\d+)월 (\d+)일 ?\((월|화|수|목|금|토|일)\)/, function (m, mo, d, w) { return J ? mo + '月' + d + '日(' + DOW[w][0] + ')' : MON[mo - 1] + ' ' + d + ' (' + DOW[w][1] + ')'; }],
    [/(\d+)월 (\d+)일/g, function (m, mo, d) { return J ? mo + '月' + d + '日' : MON[mo - 1] + ' ' + d; }],
    [/오후 ([\d /]+)시 오픈/g, J ? '午後$1時 販売開始' : 'on sale $1 PM'],
    [/^(월|화|수|목|금|토|일) · (\d\d:\d\d)$/, function (m, d, t) { return DOW[d][col - 1] + ' · ' + t; }],
    [/^오늘 (\d\d:\d\d)$/, J ? '今日 $1' : 'Today $1'],
    [/^LIVE · (\d+)세트$/, J ? 'LIVE · 第$1セット' : 'LIVE · Map $1'],
    [/^(\d\d:\d\d) 시작$/, J ? '$1 開始' : 'Starts $1'],
    [/^(\d\d:\d\d) KST 시작$/, J ? '$1 KST 開始' : 'Starts $1 KST'],
    [/^(\d+)위$/, J ? '$1位' : '#$1'],
    [/^현재 (\d+)위$/, J ? '現在$1位' : 'currently #$1'],
    [/^(\d+)–(\d+)위 플레이오프 시드 결정전$/, J ? '$1–$2位 プレーオフシード決定戦' : '#$1–$2 playoff seeding'],
    [/^(\d+)–(\d+)위 라스트 찬스 예선$/, J ? '$1–$2位 ラストチャンス予選' : '#$1–$2 last chance qualifier'],
    [/^(\d+)회$/, J ? '$1回' : '$1×'],
    [/^(\d+)명$/, J ? '$1人' : '$1'],
    [/^로스터 (\d+)명$/, J ? 'ロスター $1人' : 'Roster · $1'],
    [/^● 방송 중 (\d+)명$/, J ? '● 配信中 $1人' : '● $1 live'],
    [/^지금 방송 중인 선수 (\d+)명$/, J ? '配信中の選手 $1人' : '$1 players live now'],
    [/^(SOOP|CHZZK) 방송 중 ↗$/, J ? '$1 配信中 ↗' : '$1 live ↗'],
    [/^(\d+)경기$/, J ? '$1試合' : '$1 matches'],
    [/^(.+) 라인업 · (\d+)명$/, J ? '$1 ロスター · $2人' : '$1 roster · $2'],
    [/^경우의 수 공개 중 · 정규 리그 종료까지 (\d+)주$/, J ? 'プレーオフ条件を公開中 · レギュラーシーズン終了まで$1週' : 'Scenarios live · $1 weeks left in the regular season'],
    [/^경우의 수는 정규 리그 종료 (\d)주 전부터 공개돼요 · 현재 (\d+)주 남음$/, J ? 'プレーオフ条件は終了$1週前から公開 · 残り$2週' : 'Scenarios open $1 weeks before the end · $2 weeks left'],
    [/^(.*) 지난 경기 (\d+)건$/, J ? '$1 過去の試合 $2件' : '$1 · $2 past matches'],
    [/^(\d+)경기 · 모든 시간 KST$/, J ? '$1試合 · 時間はすべてKST' : '$1 matches · all times KST'],
    [/^판매 (오픈|마감) /, function (m, k) { return (k === '오픈' ? (J ? '販売開始 ' : 'Sale opens ') : (J ? '販売締切 ' : 'Sale closes ')); }],
    [/^마지막 확인 /, J ? '最終確認 ' : 'Last checked '],
    [/^(\d+)승 (\d+)패 · /, J ? '$1勝 $2敗 · ' : '$1W $2L · '],
    [/ 정규 리그 (\d+)주차$/, J ? ' レギュラーシーズン 第$1週' : ' regular season · week $1'],
    [/^2026 OWCS KR 스테이지 (\d)/, '2026 OWCS KR STAGE $1'],
    [/코리아 스테이지 (\d)/g, J ? 'コリア ステージ$1' : 'Korea Stage $1'],
    [/아시아 스테이지 (\d)/g, J ? 'アジア ステージ$1' : 'Asia Stage $1'],
    [/챔피언스 클래시/g, 'Champions Clash'], [/미드시즌 챔피언십/g, 'Midseason Championship'], [/월드 파이널/g, 'World Finals'], [/댈러스 메이저/g, 'Dallas Major'],
    [/^(\d)–(\d)위$/, J ? '$1–$2位' : '#$1–$2'],
    [/스테이지 (\d)/g, J ? 'ステージ$1' : 'Stage $1'],
  ];
  var KO_NAMES = null;   // players' Korean nicknames: dropped in ja/en ("탱커 · 베르나르" -> "Tank")
  function koNames() {
    if (!KO_NAMES) { KO_NAMES = {}; ((window.OWCS || {}).players || []).forEach(function (p) { if (p.ko) KO_NAMES[p.ko] = 1; }); }
    return KO_NAMES;
  }
  var HANGUL = /[가-힣]/;
  function seg(s) {
    if (!HANGUL.test(s)) return s;
    if (DICT.hasOwnProperty(s)) return DICT[s];
    var o = s;
    for (var i = 0; i < RULES.length; i++) o = o.replace(RULES[i][0], RULES[i][1]);
    return o;
  }
  var cache = {};
  function tr(s) {
    if (cache.hasOwnProperty(s)) return cache[s];
    var lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0], core = s.trim(), out;
    if (DICT.hasOwnProperty(core)) out = DICT[core];
    else {
      var whole = seg(core);
      if (!HANGUL.test(whole)) out = whole;
      else {
        var names = koNames();
        var parts = core.split(/( · | – | \/ |, |: )/), res = [];
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          if (i % 2) { res.push(p); continue; }
          if (names[p.trim()]) { if (res.length) res.pop(); continue; }
          var t = seg(p.trim());
          if (HANGUL.test(t)) {   // last resort: known words inside the segment
            t = t.replace(/[가-힣]+(?: [가-힣]+)*/g, function (w) { return DICT.hasOwnProperty(w) ? DICT[w] : w; });
          }
          res.push(p.replace(p.trim(), t));
        }
        out = res.join('');
      }
    }
    return (cache[s] = lead + out + tail);
  }

  var ORIG = new WeakMap(), busy = false;
  function doNode(n) {
    var cur = n.data;
    if (lang === 'ko') { if (ORIG.has(n) && ORIG.get(n).t === cur) n.data = ORIG.get(n).o; return; }
    if (!HANGUL.test(cur)) return;
    var t = tr(cur);
    if (t !== cur) { ORIG.set(n, { o: cur, t: t }); n.data = t; }
  }
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  function doEl(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (v && HANGUL.test(v) && lang !== 'ko') el.setAttribute(ATTRS[i], tr(v));
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doNode(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(root.tagName)) return;
    doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { var pe = n.parentNode; if (pe && /^(SCRIPT|STYLE|TEMPLATE)$/.test(pe.tagName)) continue; doNode(n); }
      else doEl(n);
    }
  }
  function run() { if (busy) return; busy = true; try { walk(document.body); } finally { busy = false; } }

  // language switch, for pages that do not have their own (the home page does)
  function switcher() {
    if (document.querySelector('[data-owcs-lang]')) return;
    var hasOwn = Array.prototype.some.call(document.querySelectorAll('button'), function (b) { return b.textContent.trim() === '日本語'; });
    if (hasOwn) return;
    var box = document.createElement('div');
    box.setAttribute('data-owcs-lang', '');
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:60;display:flex;padding:3px;border-radius:999px;background:rgba(255,255,255,.94);border:1px solid #E6E6E1;box-shadow:0 4px 18px rgba(0,0,0,.08);font:600 13px/1 Pretendard,system-ui,sans-serif';
    [['ko', '한국어'], ['ja', '日本語'], ['en', 'EN']].forEach(function (x) {
      var b = document.createElement('button');
      b.textContent = x[1];
      b.style.cssText = 'height:28px;padding:0 10px;border:0;border-radius:999px;cursor:pointer;font:inherit;' + (lang === x[0] ? 'background:#0B0B0F;color:#fff' : 'background:transparent;color:#0B0B0F');
      b.onclick = function () { set(x[0]); };
      box.appendChild(b);
    });
    document.body.appendChild(box);
  }
  function set(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    if (l !== lang) location.reload();
  }
  window.OWCSi18n = { lang: lang, set: set, t: function (s) { return lang === 'ko' ? s : tr(s); } };
  document.documentElement.lang = lang;

  function start() {
    // the home page renders its own 한국어/日本語/EN buttons a moment after load
    if (!/Home/.test(decodeURIComponent(location.pathname))) setTimeout(switcher, 600);
    if (lang === 'ko') return;
    var st = document.createElement('style');   // upright Korean role letters read sideways in other scripts
    st.textContent = '[style*="text-orientation: upright"]{text-orientation:mixed !important;transform:rotate(180deg)}';
    document.head.appendChild(st);
    run();
    new MutationObserver(function (muts) {
      if (busy) return;
      busy = true;
      try {
        muts.forEach(function (m) {
          if (m.type === 'characterData') doNode(m.target);
          else if (m.type === 'attributes') doEl(m.target);
          else m.addedNodes.forEach(walk);
        });
      } finally { busy = false; }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
