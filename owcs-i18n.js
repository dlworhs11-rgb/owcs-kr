// Site-wide language (한국어 / 日本語 / EN / 中文). The pages are written in Korean; in ja/en/zh this walks the page text
// (and keeps watching it, since the pages re-render every second) and swaps every Korean string for its translation.
// Until a language is picked it follows the browser's language. The choice is kept in this browser (localStorage 'owcs-lang') so every page opens in the same language.
// ?lang=ja|en|zh|ko also sets it.
(function () {
  var KEY = 'owcs-lang';
  var LANGS = /^(ko|ja|en|zh)$/;
  var q = new URLSearchParams(location.search).get('lang');
  var lang = 'ko';
  // first visit: follow the browser language (Japanese -> 日本語, Korean -> 한국어, Chinese -> 中文, anything else -> EN); a choice made on the site wins
  var nav = (navigator.languages && navigator.languages[0] || navigator.language || 'ko').toLowerCase();
  var guess = /^ja/.test(nav) ? 'ja' : /^ko/.test(nav) ? 'ko' : /^zh/.test(nav) ? 'zh' : 'en';
  try { if (LANGS.test(q)) localStorage.setItem(KEY, q); lang = localStorage.getItem(KEY) || guess; } catch (e) { lang = q || guess; }
  if (!LANGS.test(lang)) lang = 'ko';

  // Times: the data holds KST. ko stays KST; ja shows Japan time (same clock, label JST), zh Beijing time (1 h earlier),
  // en this device's own zone. Pages call OWCSi18n.hm(iso) for a match time; every "KST" on the page becomes ZONE.
  var TZ = lang === 'ja' ? 'Asia/Tokyo' : lang === 'zh' ? 'Asia/Shanghai' : lang === 'en' ? (function () {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } })() : 'Asia/Seoul';
  if (/^Asia\/Seoul$/.test(TZ)) TZ = 'Asia/Seoul';
  var ZONE = TZ === 'Asia/Seoul' ? 'KST' : lang === 'ja' ? 'JST' : lang === 'zh' ? '北京时间' : (function () {
    var z = function (o) { try { var p = new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: TZ }, o)).formatToParts(new Date()); for (var i = 0; i < p.length; i++) if (p[i].type === 'timeZoneName') return p[i].value; } catch (e) {} return ''; };
    var g = z({ timeZoneName: 'shortGeneric' });   // "PT", "ET"; long names ("United Kingdom Time") -> "GMT+1"
    return g && g.length <= 4 ? g : z({ timeZoneName: 'short' }) || TZ;
  })();
  var ZONE_LONG = lang === 'ja' ? '日本時間 (JST)' : lang === 'zh' ? '北京时间 (UTC+8)' : ZONE;
  var hmFmt = null, dayFmt = null;
  // iso = '2026-10-23T17:00:00+09:00' (or day + 'T' + 'HH:MM'); returns 'HH:MM' in TZ, with a note when the date moves
  function hm(iso, t) {
    if (t && !/T/.test(iso)) iso = iso + 'T' + t + ':00+09:00';
    if (TZ === 'Asia/Seoul') return t || iso.slice(11, 16);
    var ms = new Date(iso).getTime();
    if (isNaN(ms)) return t || '';
    try {
      hmFmt = hmFmt || new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      dayFmt = dayFmt || new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
      var out = hmFmt.format(ms), d = dayFmt.format(ms), k = new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
      if (d < k) out += P(' (前日)', ' (prev day)', ' (前一天)');
      else if (d > k) out += P(' (翌日)', ' (next day)', ' (次日)');
      return out;
    } catch (e) { return t || iso.slice(11, 16); }
  }

  // [korean, japanese, english, chinese (simplified)]
  var T = [
    // left in Korean until 2026-10-23: the home results box, the ticket ID table, and the bracket (its shadow root was not walked)
    ['오늘 결과', '今日の結果', "Today's results", '今日结果'], ['오늘', '今日', 'today', '今天'],
    ['결과를 누르면 위에서 세트별 맵 · 밴 · 첫 조합을 볼 수 있어요', '結果をタップすると、上にセットごとのマップ · BAN · 初期構成が表示されます', 'Tap a result to see each map, the bans and the opening comps above', '点击结果，即可在上方查看每局的地图 · 禁用 · 首发阵容'],
    ['스포일러 방지 중 · 점수는 숨겨요', 'ネタバレ防止中 · スコアは非表示', 'Spoiler-free mode · scores hidden', '防剧透模式 · 隐藏比分'],
    ['인정 조건', '有効な条件', 'What counts', '有效条件'], ['인정', '有効', 'accepted', '有效'], ['미성년만', '未成年のみ', 'Minors only', '仅限未成年'], ['(성년은 불가)', '(成人は不可)', '(not for adults)', '(成人不可)'],
    ['라스트 찬스', 'ラストチャンス', 'Last Chance', '最后机会赛'], ['4팀 중 2팀만 플레이오프에 올라가요', '4チーム中2チームだけがプレーオフへ', 'Only 2 of the 4 teams reach the playoffs', '4支队伍中只有2支进入季后赛'],
    ['5·6위는 두 번, 7·8위는 한 번 지면 탈락 · 올라가면 8강', '5·6位は2敗、7·8位は1敗で敗退 · 勝ち上がれば準々決勝', '5th–6th are out after two losses, 7th–8th after one · winners reach the quarter-finals', '5·6名输两场、7·8名输一场即淘汰 · 晋级者进入八强'],
    ['2팀 8강 진출', '2チーム準々決勝へ', '2 teams to the quarter-finals', '2队晋级八强'], ['2팀 탈락', '2チーム敗退', '2 teams out', '2队淘汰'],
    ['첫 경기', '1試合目', 'First match', '首场比赛'], ['이기면 바로 진출', '勝てば即進出', 'Win and you are in', '获胜直接晋级'], ['마지막 한 자리', '最後の1枠', 'The last spot', '最后一个名额'], ['이기면 진출', '勝てば進出', 'Win to go through', '获胜即晋级'],
    ['5·6위전 패자', '5·6位戦の敗者', 'Loser of 5th v 6th', '5·6名之战败者'], ['7·8위전 승자', '7·8位戦の勝者', 'Winner of 7th v 8th', '7·8名之战胜者'],
    ['결정전', '決定戦', 'Decider', '决定战'], ['합산', '合計', 'Total', '合计'], ['4강 직행', '準決勝へ直行', 'Straight to the semis', '直通四强'],
    ['1–4위는 모두 플레이오프 진출 · 자리만 정해요', '1–4位は全員プレーオフ進出 · 順位だけを決めます', '1st–4th all make the playoffs · this only sets the seeds', '第1–4名全部晋级季后赛 · 只决定种子顺位'],
    ['서로 한 번씩 더 붙고, 정규 리그 승패도 합쳐서 순위 계산', '総当たりでもう1回ずつ対戦し、レギュラーシーズンの勝敗と合算して順位を決定', 'They play each other once more; regular-season wins and losses count too', '彼此再交手一次，并与常规赛胜负合并计算排名'],
    ['1·2위 4강 직행', '1·2位は準決勝へ直行', '1st–2nd straight to the semis', '第1·2名直通四强'], ['3·4위 8강부터', '3·4位は準々決勝から', '3rd–4th start in the quarter-finals', '第3·4名从八强开始'],
    ['정규 리그 진행 중 · 지금 순위라 바뀔 수 있어요', 'レギュラーシーズン進行中 · 現在の順位のため変わる可能性があります', 'Regular season still on · current standings, may change', '常规赛进行中 · 当前排名，可能变化'],
    ['결정전 전 · 정규 리그 최종 순위', '決定戦前 · レギュラーシーズン最終順位', 'Before the deciders · final regular-season standings', '决定战前 · 常规赛最终排名'],
    ['플레이오프 본선', 'プレーオフ本戦', 'Playoffs', '季后赛正赛'], ['CHAMPION · 우승', 'CHAMPION · 優勝', 'CHAMPION', 'CHAMPION · 冠军'], ['이번 시즌', '今シーズン', 'This season', '本赛季'],
    // international mode (owcs-intl, from 3 days after the stage final)
    ['국제 대회', '国際大会', 'International', '国际赛事'], ['참가 팀', '参加チーム', 'Teams', '参赛队伍'], ['한국 시간', '韓国時間', 'Korea time', '韩国时间'],
    ['A조', 'Aグループ', 'Group A', 'A组'], ['B조', 'Bグループ', 'Group B', 'B组'], ['C조', 'Cグループ', 'Group C', 'C组'], ['D조', 'Dグループ', 'Group D', 'D组'],
    ['광저우', '広州', 'Guangzhou', '广州'], ['파리', 'パリ', 'Paris', '巴黎'], ['도쿄', '東京', 'Tokyo', '东京'], ['스톡홀름', 'ストックホルム', 'Stockholm', '斯德哥尔摩'], ['리야드', 'リヤド', 'Riyadh', '利雅得'], ['서울', 'ソウル', 'Seoul', '首尔'],
    ['날짜 미정', '日程未定', 'Date TBD', '日期待定'], ['이날은 경기가 없어요.', 'この日は試合がありません。', 'No matches this day.', '当天没有比赛。'],
    ['참가 팀이 정해지면 여기에 나와요.', '参加チームが決まるとここに表示されます。', 'Teams appear here once they are set.', '参赛队伍确定后会显示在这里。'], ['세트 정보가 아직 없어요.', 'セット情報はまだありません。', 'No map details yet.', '暂无小局信息。'],
    ['승자조', '勝者側', 'Upper bracket', '胜者组'], ['패자조', '敗者側', 'Lower bracket', '败者组'],
    ['토너먼트', 'トーナメント', 'Tournament', '淘汰赛'],
    ['대진은 정규 리그가 끝나면 채워져요', '組み合わせはレギュラーシーズン終了後に決まります', 'Matchups fill in when the regular season ends', '对阵将在常规赛结束后确定'],
    // left in Korean until 2026-10-20 (found by opening every page in ja / en / zh)
    ['지난 시즌', '前シーズン', 'last season', '上赛季'], ['다음 글', '次へ', 'Next', '下一篇'], ['이전 글', '前へ', 'Previous', '上一篇'], ['메뉴', 'メニュー', 'Menu', '菜单'],
    ['다음 경기일', '次の試合日', 'Next match day', '下一个比赛日'], ['이전 경기일', '前の試合日', 'Previous match day', '上一个比赛日'], ['지금', '今', 'Now', '现在'],
    ['오버워치 이스포츠 공식 유튜브 쇼츠', 'オーバーウォッチ eスポーツ公式 YouTube ショート', 'Overwatch Esports official YouTube Shorts', '守望先锋电竞官方 YouTube Shorts'],
    ['티켓링크에서 예매', 'Ticketlinkで購入', 'Buy on Ticketlink', '在 Ticketlink 购票'], ['전체 경기 일정', '全試合日程', 'Full schedule', '全部赛程'], ['OWCS 공식 채널', 'OWCS公式チャンネル', 'Official OWCS channels', 'OWCS 官方频道'],
    ['결과를 누르면 아래에서 세트별 맵 · 밴 · 첫 조합을 볼 수 있어요', '結果をタップすると、下にセットごとのマップ · BAN · 初期構成が表示されます', 'Tap a result to see each map, the bans and the opening comps below', '点击结果，即可在下方查看每局的地图 · 禁用 · 首发阵容'],
    ['경기 승률', '試合勝率', 'Match win rate', '比赛胜率'], ['구글 캘린더 구독', 'Googleカレンダーで購読', 'Subscribe in Google Calendar', '在 Google 日历中订阅'],
    ['구글 캘린더에 전체 일정 추가', 'Googleカレンダーに全日程を追加', 'Add the full schedule to Google Calendar', '将全部赛程添加到 Google 日历'], ['날짜별 경기', '日付別の試合', 'Matches by date', '按日期查看比赛'],
    ['남은 경기', '残りの試合', 'Remaining matches', '剩余比赛'], ['남은 경기만 추가', '残りの試合だけ追加', 'Add remaining matches only', '仅添加剩余比赛'], ['다시보기', 'リプレイ', 'Replay', '回放'],
    ['단장', 'GM', 'General manager', '领队'], ['대진 발표 전', '対戦カード未発表', 'Matchups TBA', '对阵待公布'], ['스태프진', 'スタッフ', 'Staff', '教练组'], ['시즌 일정', 'シーズン日程', 'Season schedule', '赛季赛程'],
    ['두 팀을 쉼표로 검색하면(예: PF,CR) 결과 탭 위쪽에 상대 전적이 나와요.', '2チームをカンマ区切りで検索すると(例: PF,CR)、結果タブの上に対戦成績が表示されます。', 'Search two teams with a comma (e.g. PF,CR) to see their head-to-head above the results tab.', '用逗号搜索两支战队（例: PF,CR），结果标签上方会显示交手战绩。'],
    ['승수가 같으면 세트 득실 → 맞대결 성적 순으로 순위를 정해요.', '勝数が同じ場合は、セット得失 → 直接対決の成績の順で順位を決めます。', 'Teams level on wins are ranked by map differential, then head-to-head.', '胜场相同时，依次按地图净胜 → 交手战绩排名。'],
    ['오늘로', '今日へ', 'Today', '回到今天'], ['이날 결과', 'この日の結果', 'Results of the day', '当日结果'], ['이번 스테이지', '今ステージ', 'This stage', '本阶段'], ['전체 팀', '全チーム', 'All teams', '全部战队'],
    ['지난 경기', '前回の試合', 'Last match day', '上一比赛日'], ['직관 안내 ·', '観戦案内 ·', 'Tickets ·', '现场观赛 ·'], ['팀 고르기 ▾', 'チームを選ぶ ▾', 'Pick a team ▾', '选择战队 ▾'],
    ['팀별 경우의 수', 'チーム別プレーオフ条件', 'Scenarios by team', '各队晋级形势'],
    ['이 경기에 걸린 것', 'この試合で決まること', 'What rides on each match', '这场比赛关系到什么'], ['조건에 맞는 경기가 없어요.', '条件に合う試合はありません。', 'No matches fit these filters.', '没有符合条件的比赛。'],
    // player search box (placeholder: '선수 검색 · LIP, 이재원'; Korean names drop out) and the reels buttons' hover text
    ['선수 검색', '選手検索', 'Search players', '搜索选手'], ['이전 릴스', '前のリール', 'Previous reel', '上一个短视频'], ['다음 릴스', '次のリール', 'Next reel', '下一个短视频'],
    ['오버워치 이스포츠 공식 인스타그램 릴스', 'Overwatch Esports 公式Instagramリール', 'Overwatch Esports Instagram reels', 'Overwatch Esports 官方 Instagram 短视频'],
    ['정규 리그 경기가 모두 끝났어요.', 'レギュラーシーズンの試合はすべて終了しました。', 'The regular season is over.', '常规赛已全部结束。'], ['시즌 결과 보기', 'シーズン結果を見る', 'See season results', '查看赛季结果'],
    // navigation / common
    ['일정', '日程', 'Schedule', '赛程'], ['결과', '結果', 'Results', '结果'], ['순위', '順位', 'Standings', '排名'], ['직관', '観戦', 'Tickets', '现场观赛'], ['선수', '選手', 'Players', '选手'], ['방송', '配信', 'Live', '直播'],
    ['홈', 'ホーム', 'Home', '首页'], ['팀', 'チーム', 'Team', '战队'], ['한국어', '한국어', '한국어', '한국어'],
    ['스포일러 방지', 'ネタバレ防止', 'No spoilers', '防剧透'], ['다크 모드', 'ダークモード', 'Dark mode', '深色模式'], ['내 팀', 'マイチーム', 'My team', '我的战队'],
    ['☆ 내 팀으로 설정', '☆ マイチームに設定', '☆ Set as my team', '☆ 设为我的战队'], ['★ 내 팀', '★ マイチーム', '★ My team', '★ 我的战队'],
    ['탱커', 'タンク', 'Tank', '重装'], ['딜러', 'ダメージ', 'Damage', '输出'], ['힐러', 'サポート', 'Support', '支援'], ['탱', 'タ', 'T', '重'], ['딜', 'ダ', 'D', '输'], ['힐', 'サ', 'S', '支'],
    ['승', '勝', 'W', '胜'], ['패', '敗', 'L', '负'], ['세트', 'セット', 'Maps', '地图'], ['세트 득실', 'セット得失', 'Map diff', '地图净胜'], ['득실', '得失', 'Diff', '净胜'], ['승률', '勝率', 'Win rate', '胜率'],
    ['종료', '終了', 'Final', '已结束'], ['예정', '予定', 'Upcoming', '未开始'], ['경기', '試合', 'matches', '比赛'], ['경기 중', '試合中', 'Live now', '比赛中'], ['기록 중', '記録中', 'Recording', '记录中'],
    ['승리', '勝利', 'Won', '胜利'], ['발표 전', '未発表', 'TBA', '待公布'], ['중계', '実況', 'Casters', '解说'], ['현재', '現在', 'Now', '当前'], ['사진', '写真', 'Photo', '照片'],
    ['디자인: 기본 → Wise로', 'デザイン: 標準 → Wise', 'Design: default → Wise', '设计: 默认 → Wise'], ['디자인: Wise → 기본으로', 'デザイン: Wise → 標準', 'Design: Wise → default', '设计: Wise → 默认'],
    ['비공식 팬 사이트입니다. Blizzard Entertainment, WDG, 각 팀과 제휴하거나 승인받지 않았습니다. Overwatch®와 영웅 이미지는 Blizzard Entertainment, Inc.의 상표·저작물이고, 팀 로고와 선수 사진의 권리는 각 소유자에게 있으며 요청하면 바로 내립니다.', '非公式ファンサイトです。Blizzard Entertainment、WDG、各チームとの提携・承認はありません。Overwatch®およびヒーロー画像はBlizzard Entertainment, Inc.の商標・著作物です。チームロゴと選手写真の権利は各所有者にあり、ご要望があればすぐに削除します。', 'Unofficial, non-commercial fan site. Not affiliated with, sponsored or endorsed by Blizzard Entertainment, WDG or any team. Overwatch is a trademark of Blizzard Entertainment, Inc., in the U.S. and/or other countries; hero art © Blizzard Entertainment, Inc. Team logos and player photos belong to their owners and are removed on request.', '非官方粉丝网站。与 Blizzard Entertainment、WDG 及各战队无合作或授权关系。Overwatch® 及英雄图片为 Blizzard Entertainment, Inc. 的商标或作品，战队标志和选手照片的权利归各自所有者，如有要求将立即删除。'],
    // footer = disclaimer + sources as one text node, so the whole line is a dictionary entry
    ['비공식 팬 사이트입니다. Blizzard Entertainment, WDG, 각 팀과 제휴하거나 승인받지 않았습니다. Overwatch®와 영웅 이미지는 Blizzard Entertainment, Inc.의 상표·저작물이고, 팀 로고와 선수 사진의 권리는 각 소유자에게 있으며 요청하면 바로 내립니다. 데이터: Liquipedia (CC-BY-SA 3.0)', '非公式ファンサイトです。Blizzard Entertainment、WDG、各チームとの提携・承認はありません。Overwatch®およびヒーロー画像はBlizzard Entertainment, Inc.の商標・著作物です。チームロゴと選手写真の権利は各所有者にあり、ご要望があればすぐに削除します。 データ: Liquipedia (CC-BY-SA 3.0)', 'Unofficial, non-commercial fan site. Not affiliated with, sponsored or endorsed by Blizzard Entertainment, WDG or any team. Overwatch is a trademark of Blizzard Entertainment, Inc., in the U.S. and/or other countries; hero art © Blizzard Entertainment, Inc. Team logos and player photos belong to their owners and are removed on request. Data: Liquipedia (CC-BY-SA 3.0)', '非官方粉丝网站。与 Blizzard Entertainment、WDG 及各战队无合作或授权关系。Overwatch® 及英雄图片为 Blizzard Entertainment, Inc. 的商标或作品，战队标志和选手照片的权利归各自所有者，如有要求将立即删除。 数据: Liquipedia (CC-BY-SA 3.0)'],
    ['데이터: Liquipedia (CC-BY-SA 3.0)', 'データ: Liquipedia (CC-BY-SA 3.0)', 'Data: Liquipedia (CC-BY-SA 3.0)', '数据: Liquipedia (CC-BY-SA 3.0)'],
    ['경기·순위: Liquipedia (CC-BY-SA 3.0)', '試合・順位: Liquipedia (CC-BY-SA 3.0)', 'Matches & standings: Liquipedia (CC-BY-SA 3.0)', '比赛·排名: Liquipedia (CC-BY-SA 3.0)'],
    ['실시간 맵 승패: SOOP 공식 중계 캡처', 'リアルタイムのマップ勝敗: SOOP公式中継のキャプチャ', 'Live map results: captured from the official SOOP stream', '实时地图胜负: 截取自 SOOP 官方直播'],
    ['선수 방송/디스코드: 커뮤니티 시트', '選手配信/Discord: コミュニティシート', 'Player streams/Discord: community sheet', '选手直播/Discord: 社区表格'], ['인스타/X: Liquipedia', 'Instagram/X: Liquipedia', 'Instagram/X: Liquipedia', 'Instagram/X: Liquipedia'],
    ['업데이트', '更新', 'Updated', '更新'], ['테스트 모드:', 'テストモード:', 'Test mode:', '测试模式:'], ['결과는 임의로 넣은 값', 'の結果は仮の値', 'results are made up', '结果为虚构数据'], ['TEST · 임의 결과', 'TEST · 仮の結果', 'TEST · fake results', 'TEST · 虚构结果'],
    ['OWCS 한국 경기의 일정, 결과, 선수 정보를 한국 팬을 위해 한곳에 모았어요.', 'OWCS韓国リーグの日程・結果・選手情報をひとつにまとめました。', 'OWCS Korea schedule, results and players, all in one place.', 'OWCS 韩国赛区的赛程、结果和选手信息，一站汇总。'],
    ['문의', 'お問い合わせ', 'Contact', '联系'],
    ['OWticker 팬 디스코드 · 피드백', 'OWticker ファンDiscord · フィードバック', 'OWticker fan Discord · feedback', 'OWticker 粉丝 Discord · 反馈'],
    // ticket banner
    ['직관 안내 · OWCS ASIA : KOREA STAGE 3', '観戦案内 · OWCS ASIA : KOREA STAGE 3', 'Tickets · OWCS ASIA : KOREA STAGE 3', '现场观赛 · OWCS ASIA : KOREA STAGE 3'], ['직관 안내 · KOREA STAGE 3', '観戦案内 · KOREA STAGE 3', 'Tickets · KOREA STAGE 3', '现场观赛 · KOREA STAGE 3'],
    ['WDG STUDIO HONGDAE에서 직관!', 'WDG STUDIO HONGDAEで観戦しよう!', 'Watch live at WDG STUDIO HONGDAE!', '来 WDG STUDIO HONGDAE 现场观赛!'], ['예매 안내 →', 'チケット案内 →', 'Ticket info →', '购票指南 →'], ['눌러서 예매 안내 보기 →', 'タップしてチケット案内 →', 'Tap for ticket info →', '点击查看购票指南 →'], ['직관 예매 QR', '観戦チケットQR', 'Ticket QR', '购票二维码'],
    // today
    ['오늘의 경기', '今日の試合', "Today's match", '今日比赛'], ['오늘은 경기가 없어요', '今日は試合がありません', 'No match today', '今天没有比赛'], ['다음 경기', '次の試合', 'Next match', '下一场比赛'], ['다음 일정', '次の日程', 'Up next', '接下来'],
    ['방송 예정', '配信予定', 'Starting soon', '即将直播'], ['첫 경기까지', '最初の試合まで', 'First match in', '距首场比赛'], ['다음 경기까지', '次の試合まで', 'Next match in', '距下一场比赛'], ['경기 종료', '試合終了', 'Finished', '比赛结束'], ['오늘 경기 종료', '本日の試合終了', "Today's matches are over", '今日比赛已结束'],
    ['방송이 시작되면 이곳에 자동으로 표시돼요', '配信が始まるとここに自動で表示されます', 'The stream appears here automatically when it starts', '直播开始后会自动显示在这里'],
    ['오늘 경기가 모두 끝났어요', '本日の試合はすべて終了しました', "All of today's matches are over", '今日比赛已全部结束'], ['다시보기는 SOOP owesports 방송국에서 볼 수 있어요', 'アーカイブはSOOP owesportsで見られます', 'Replays are on SOOP owesports', '回放请到 SOOP owesports 观看'],
    ['정규 리그 일정이 끝났어요', 'レギュラーシーズンは終了しました', 'The regular season is over', '常规赛已结束'],
    ['세트별 상세 접기', 'セット詳細を閉じる', 'Hide map details', '收起地图详情'], ['스코어를 눌러 세트별 맵 · 밴 · 승리 팀 보기', 'スコアを押すとマップ・BAN・勝者を表示', 'Tap the score for maps, bans and winners', '点击比分查看地图 · 禁用 · 获胜队伍'],
    ['SOOP · 공식 중계', 'SOOP · 公式中継', 'SOOP · official stream', 'SOOP · 官方直播'], ['SOOP owesports 방송국 ↗', 'SOOP owesports ↗', 'SOOP owesports channel ↗', 'SOOP owesports 频道 ↗'],
    ['선벤', '先BAN', '1st ban', '先禁'], ['후벤', '後BAN', '2nd ban', '后禁'], ['쟁탈', '制圧', 'Control', '占领要点'], ['플래시포인트', 'フラッシュポイント', 'Flashpoint', '闪点'], ['밀기', 'プッシュ', 'Push', '推进'], ['혼합', 'ハイブリッド', 'Hybrid', '混合'], ['호위', 'エスコート', 'Escort', '护送'], ['점령', '占領', 'Assault', '攻防'], ['격돌', 'クラッシュ', 'Clash', '交锋'],
    ['기록 중이에요. 세트가 끝나면 양 팀 조합이 올라와요.', '記録中です。セット終了後に両チームの構成が表示されます。', 'Recording. Both comps appear when the map ends.', '记录中。地图结束后会显示双方阵容。'],
    ['이 세트의 첫 조합 기록이 아직 없어요.', 'このセットの初期構成はまだ記録がありません。', 'No starting comp recorded for this map yet.', '这张地图还没有首发阵容记录。'], ['세트가 끝나면 조합이 올라와요.', 'セット終了後に構成が表示されます。', 'Comps appear when the map ends.', '地图结束后会显示阵容。'], ['첫 조합 기록 없음', '初期構成なし', 'No starting comp', '无首发阵容'],
    ['시간', '時間', 'hrs', '小时'], ['분', '分', 'min', '分'], ['초', '秒', 'sec', '秒'],
    // schedule
    // mobile schedule header: small buttons next to the title, my-team picker
    ['캘린더 구독', 'カレンダー登録', 'Subscribe', '订阅日历'], ['공유', '共有', 'Share', '分享'], ['☆ 내 팀 고르기', '☆ マイチームを選ぶ', '☆ Pick my team', '☆ 选择我的战队'],
    ['다시 누르면 해제돼요 · 선수 섹션의 내 팀과 같이 바뀌어요', 'もう一度押すと解除 · 選手セクションのマイチームと連動します', 'Tap again to clear · Linked with My team in the players section', '再点一次即取消 · 与选手栏目的我的战队同步'],
    ['경기 일정', '試合日程', 'Schedule', '比赛赛程'], ['일정 공유', '日程を共有', 'Share schedule', '分享赛程'], ['최근 · 다가오는 경기', '最近 · 今後の試合', 'Recent · Upcoming', '最近 · 即将进行'], ['모든 시간 KST', '時間はすべて' + ZONE_LONG, 'All times ' + ZONE, '时间均为' + ZONE_LONG], ['전체 일정 보기 →', 'すべての日程 →', 'Full schedule →', '查看全部赛程 →'],
    ['구글 캘린더', 'Googleカレンダー', 'Google Calendar', 'Google 日历'], ['애플 캘린더', 'Appleカレンダー', 'Apple Calendar', 'Apple 日历'], ['링크 복사', 'リンクをコピー', 'Copy link', '复制链接'], ['복사됨', 'コピー済み', 'Copied', '已复制'], ['링크를 복사했어요', 'リンクをコピーしました', 'Link copied', '链接已复制'],
    ['링크 복사됨 ✓', 'リンクをコピーしました ✓', 'Link copied ✓', '链接已复制 ✓'], ['일정 링크 복사', '日程リンクをコピー', 'Copy schedule link', '复制赛程链接'],
    ['전체 경기 캘린더에 추가', '全試合をカレンダーに追加', 'Add all matches to calendar', '将全部比赛加入日历'], ['남은 경기만 캘린더에 추가', '残りの試合をカレンダーに追加', 'Add remaining matches to calendar', '将剩余比赛加入日历'],
    ['좋아하는 팀 경기만 캘린더에 추가', '好きなチームの試合だけ追加', "Add only your team's matches", '只添加喜欢战队的比赛'],
    ['ICS 파일을 받았어요 · 구글 캘린더 > 설정 > 가져오기에서 올리면 돼요', 'ICSファイルを保存しました · Googleカレンダー > 設定 > インポートで追加できます', 'ICS saved · import it in Google Calendar > Settings > Import', '已下载 ICS 文件 · 在 Google 日历 > 设置 > 导入 中上传即可'],
    ['다음 경기를 구글 캘린더에 추가하는 창을 열었어요', '次の試合をGoogleカレンダーに追加する画面を開きました', 'Opened Google Calendar for the next match', '已打开将下一场比赛加入 Google 日历的页面'],
    // standings
    ['팀별 순위', 'チーム順位', 'Standings', '战队排名'], ['플레이오프 진출선', 'プレーオフ圏', 'Playoff line', '季后赛线'], ['라스트 찬스 진출선', 'ラストチャンス圏', 'Last chance line', '最后机会线'], ['플레이오프', 'プレーオフ', 'Playoffs', '季后赛'],
    ['경우의 수 보기', 'プレーオフ条件を見る', 'Playoff scenarios', '查看晋级形势'],
    ['전체 순위 · 경우의 수 보기', '全順位・プレーオフ条件を見る', 'Full standings & scenarios', '完整排名 · 晋级形势'], ['전체 순위 보기', '全順位を見る', 'Full standings', '查看完整排名'],
    ['플레이오프 시드 결정전', 'プレーオフシード決定戦', 'playoff seeding', '季后赛种子决定战'], ['라스트 찬스 예선', 'ラストチャンス予選', 'last chance qualifier', '最后机会预选赛'], ['전 경기 3선승제', '全試合3本先取', 'all matches first to 3', '全部比赛 先赢3局'],
    // teams
    ['팀 & 선수 라인업', 'チーム & 選手', 'Teams & Rosters', '战队 & 选手阵容'], ['팀 & 선수', 'チーム & 選手', 'Teams & Players', '战队 & 选手'], ['한글 이름', '韓国語名', 'Korean name', '韩文名'], ['최근 경기', '最近の試合', 'Last match', '最近比赛'],
    ['로스터', 'ロスター', 'Roster', '阵容'], ['스태프', 'スタッフ', 'Staff', '教练组'], ['감독', '監督', 'Head coach', '主教练'], ['코치', 'コーチ', 'Coach', '教练'], ['보조 코치', 'アシスタントコーチ', 'Assistant coach', '助理教练'], ['분석관', 'アナリスト', 'Analyst', '分析师'], ['직책', '役職', 'Role', '职务'], ['생년월일', '生年月日', 'Birthday', '出生日期'], ['스태프 문서', 'スタッフ記事', 'Staff page', '教练组页面'], ['인물 문서', '人物記事', 'Profile', '人物页面'], ['나무위키', 'NamuWiki', 'NamuWiki', 'NamuWiki'], ['공식 X', '公式X', 'Official X', '官方 X'], ['인스타그램', 'Instagram', 'Instagram', 'Instagram'], ['지금 방송 중인 선수 없음', '配信中の選手はいません', 'No players live', '暂无选手直播'],
    // results
    ['시즌 결과', 'シーズン結果', 'Season results', '赛季结果'], ['지난 시즌 · 대진표', '過去シーズン · トーナメント表', 'Past seasons · Brackets', '往届赛季 · 对阵图'], ['대진표', 'トーナメント表', 'Bracket', '对阵图'], ['경우의 수', 'プレーオフ条件', 'Scenarios', '晋级形势'],
    ['팀별 승률', 'チーム別勝率', 'Win rates', '战队胜率'], ['지난 경기 검색', '過去の試合を検索', 'Search past matches', '搜索往期比赛'], ['팀 약칭·이름으로 검색 · 두 팀은 쉼표로 구분', 'チーム略称・名前で検索 · 2チームはカンマ区切り', 'Search by team · separate two teams with a comma', '按战队简称·名称搜索 · 两支战队用逗号分隔'],
    ['예: PF,CR 또는 CR', '例: PF,CR または CR', 'e.g. PF,CR or CR', '例: PF,CR 或 CR'], ['지난 경기 · PF,CR', '過去の試合 · PF,CR', 'Past matches · PF,CR', '往期比赛 · PF,CR'], ['리플코드', 'リプレイコード', 'Replay code', '回放代码'], ['다시보기 ↗', 'アーカイブ ↗', 'Replay ↗', '回放 ↗'], ['맵 상세 ▾', 'マップ詳細 ▾', 'Map details ▾', '地图详情 ▾'], ['맵 상세 ▴', 'マップ詳細 ▴', 'Map details ▴', '地图详情 ▴'],
    ['팀을 찾을 수 없어요', 'チームが見つかりません', 'Team not found', '找不到该战队'], ['플레이오프 확정', 'プレーオフ確定', 'Playoffs clinched', '锁定季后赛'], ['탈락', '敗退', 'Eliminated', '淘汰'], ['플레이오프 경쟁', 'プレーオフ争い', 'In the playoff race', '争夺季后赛'],
    ['LCQ 확정', 'LCQ確定', 'LCQ clinched', '锁定 LCQ'], ['LCQ 경쟁', 'LCQ争い', 'In the LCQ race', '争夺 LCQ'], ['순위 싸움', '順位争い', 'Race', '排名之争'], ['단두대 매치', '生き残り決戦', 'Elimination match', '生死战'], ['지면 탈락', '負けたら敗退', 'Loser is out', '输者出局'], ['지면 직행 실패', '負けたらプレーオフ直行消滅', 'Loser misses direct playoffs', '输者无缘直接晋级'],
    ['다른 팀 결과와 세트 득실에 따라 플레이오프가 갈려요.', '他チームの結果とセット得失でプレーオフが決まります。', 'Playoffs depend on other results and map differential.', '能否进入季后赛取决于其他战队的结果和地图净胜。'],
    ['플레이오프 직행은 어렵지만 라스트 찬스 예선은 확정이에요.', 'プレーオフ直行は難しいですが、ラストチャンス予選は確定です。', 'Direct playoffs are out of reach, but the LCQ is secured.', '直接晋级季后赛已无望，但已锁定最后机会预选赛。'],
    ['최소 라스트 찬스 예선은 확정이에요.', '少なくともラストチャンス予選は確定です。', 'At least the LCQ is secured.', '至少已锁定最后机会预选赛。'],
    ['경기 기준', '試合基準', 'matches', '场比赛为准'],
    ['이번 스테이지 결과는 숨겼어요', '今ステージの結果は非表示', 'this stage hidden', '已隐藏本赛段结果'],
    // playoffs (seeding deciders / LCQ / bracket)
    ['플레이오프 대진표', 'プレーオフ トーナメント表', 'Playoff bracket', '季后赛对阵图'], ['플레이오프 가는 길', 'プレーオフへの道', 'Road to the playoffs', '季后赛之路'],['대진표 · 지난 시즌 보기', 'トーナメント表 · 過去シーズン', 'Bracket · past seasons', '对阵图 · 往届赛季'], ['시드 결정전', 'シード決定戦', 'Seeding deciders', '种子决定战'],
    ['시드 결정전 순위', 'シード決定戦 順位', 'Seeding standings', '种子决定战排名'], ['승자조 결승', '勝者側決勝', 'Upper final', '胜者组决赛'], ['패자조 준결승', '敗者側準決勝', 'Lower semifinal', '败者组半决赛'], ['패자조 결승', '敗者側決勝', 'Lower final', '败者组决赛'],
    ['8강', '準々決勝', 'Quarterfinal', '八强赛'], ['4강', '準決勝', 'Semifinal', '半决赛'], ['결승', '決勝', 'Final', '决赛'], ['3위 결정전', '3位決定戦', 'Third place', '季军赛'], ['결승 · 3위전', '決勝 · 3位決定戦', 'Final · 3rd place', '决赛 · 季军赛'],
    ['진행 중', '進行中', 'In progress', '进行中'], ['미정', '未定', 'TBD', '待定'], ['시간 미정', '時間未定', 'Time TBD', '时间待定'], ['시작 시간 발표 전', '開始時間は未発表', 'Start time TBA', '开始时间待公布'], ['발표 전', '未発表', 'TBA', '待公布'],
    ['이번 스테이지 일정이 모두 끝났어요', '今ステージの日程はすべて終了しました', 'This stage is over', '本阶段赛程已全部结束'],
    // player
    ['지금 방송 중', '配信中', 'Live now', '正在直播'], ['개인 방송', '個人配信', 'Stream', '个人直播'], ['등록된 방송 없음', '登録された配信なし', 'No stream listed', '未登记直播'], ['방송 보러가기 →', '配信を見る →', 'Watch stream →', '去看直播 →'], ['방송국 가기 →', 'チャンネルへ →', 'Go to channel →', '前往频道 →'],
    ['보러가기 →', '見る →', 'Watch →', '去看 →'], ['치지직 채널', 'CHZZKチャンネル', 'CHZZK channel', 'CHZZK 频道'], ['SOOP 방송국', 'SOOPチャンネル', 'SOOP channel', 'SOOP 频道'], ['디스코드 서버', 'Discordサーバー', 'Discord server', 'Discord 服务器'], ['선수 문서', '選手ページ', 'Player page', '选手页面'],
    ['SOOP 생방송', 'SOOP 配信中', 'SOOP live', 'SOOP 直播中'], ['CHZZK 생방송', 'CHZZK 配信中', 'CHZZK live', 'CHZZK 直播中'], ['SOOP 방송국', 'SOOPチャンネル', 'SOOP channel', 'SOOP 频道'], ['CHZZK 방송국', 'CHZZKチャンネル', 'CHZZK channel', 'CHZZK 频道'],
    ['포지션', 'ポジション', 'Role', '位置'], ['소속', '所属', 'Team', '所属战队'], ['대회 업적', '大会実績', 'Achievements', '赛事成绩'], ['팀 페이지 →', 'チームページ →', 'Team page →', '战队页面 →'], ['사진 준비 중', '写真準備中', 'Photo coming soon', '照片准备中'],
    ['OWCS 코리아·아시아·월드 파이널·EWC 4위 이내 · Liquipedia', 'OWCS コリア・アジア・ワールドファイナル・EWC 4位以内 · Liquipedia', 'Top-4 finishes at OWCS Korea, Asia, World Finals and EWC · Liquipedia', 'OWCS 韩国·亚洲·世界总决赛·EWC 前四名 · Liquipedia'],
    ['구글 캘린더로 남은 경기 구독', 'Googleカレンダーで残りの試合を購読', 'Subscribe in Google Calendar', '用 Google 日历订阅剩余比赛'], ['캘린더에 추가', 'カレンダーに追加', 'Add to calendar', '加入日历'], ['이 경기를 구글 캘린더에 추가', 'この試合をGoogleカレンダーに追加', 'Add this match to Google Calendar', '将这场比赛加入 Google 日历'],
    ['인스타그램', 'Instagram', 'Instagram', 'Instagram'], ['인스타그램에서 보기', 'Instagramで見る', 'View on Instagram', '在 Instagram 查看'],
    ['공식 유튜브', '公式YouTube', 'Official YouTube', '官方 YouTube'], ['예매하기 ↗', 'チケット購入 ↗', 'Buy tickets ↗', '购票 ↗'], ['눌러서 티켓링크에서 예매 ↗', 'タップしてTicketLinkで購入 ↗', 'Tap to buy on TicketLink ↗', '点击在 TicketLink 购票 ↗'],
    ['시드전', 'シード戦', 'Seeding', '种子战'], ['PO 8강', 'PO 準々決勝', 'PO QF', 'PO 八强'], ['PO 4강', 'PO 準決勝', 'PO SF', 'PO 半决赛'], ['PO 결승', 'PO 決勝', 'PO Final', 'PO 决赛'],
    ['여러 팀을 골라도 캘린더 하나로 한 번에 구독돼요. 새 일정(플레이오프 포함)이 생기면 자동으로 들어와요.', '複数チームを選んでもカレンダー1つでまとめて購読できます。新しい日程(プレーオフ含む)は自動で追加されます。', 'Pick several teams and it is still one calendar. New matches (playoffs too) are added automatically.', '选择多支战队也只需订阅一个日历。新赛程(包括季后赛)会自动加入。'],
    ['우승', '優勝', 'Champion', '冠军'], ['준우승', '準優勝', 'Runner-up', '亚军'], ['대회 기록이 아직 없어요', '大会実績はまだありません', 'No major results yet', '暂无赛事成绩'],
    // streams
    ['선수 개인 방송 · CHZZK / SOOP', '選手の個人配信 · CHZZK / SOOP', 'Player streams · CHZZK / SOOP', '选手个人直播 · CHZZK / SOOP'], ['지금 방송 중인 선수', '配信中の選手', 'players live now', '正在直播的选手'], ['방송 중 없음', '配信なし', 'Nobody live', '无人直播'],
    ['채널 없음', 'チャンネルなし', 'No channel', '无频道'], ['마지막 확인', '最終確認', 'Last checked', '最后检查'], ['방송 상태는 CHZZK·SOOP에서 몇 분마다 확인해요.', '配信状況はCHZZK・SOOPで数分ごとに確認しています。', 'Live status is checked on CHZZK and SOOP every few minutes.', '直播状态每隔几分钟从 CHZZK·SOOP 检查一次。'],
    ['방송 상태 확인이 꺼져 있으면 모두 꺼짐으로 보여요', '確認が止まっているとすべてオフライン表示になります', 'everyone shows offline while checking is off', '检查关闭时所有人都会显示为未开播'],
    ['방송 확인이 30분 넘게 멈춰 있어 실제와 다를 수 있어요', '配信確認が30分以上止まっているため、実際と異なる場合があります', 'live check has stalled for 30+ minutes, so this may be out of date', '直播检查已停止超过 30 分钟，可能与实际不符'], ['방송 없음', '配信なし', 'Nobody live', '无人直播'],
    // ticket page
    ['직관 안내 · 2026 OWCS ASIA KOREA STAGE 3', '観戦案内 · 2026 OWCS ASIA KOREA STAGE 3', 'Tickets · 2026 OWCS ASIA KOREA STAGE 3', '现场观赛 · 2026 OWCS ASIA KOREA STAGE 3'],
    ['서울 마포구 상수동 72-1, 홍익대학교 잔다리홀 B1. 정규 리그부터 플레이오프까지 모든 경기를 현장에서 볼 수 있어요.', 'ソウル市麻浦区上水洞72-1 弘益大学チャンダリホールB1。レギュラーシーズンからプレーオフまで全試合を会場で観戦できます。', '72-1 Sangsu-dong, Mapo-gu, Seoul (Hongik Univ. Jandari Hall B1). Every match from the regular season to the playoffs is played here in front of fans.', '首尔麻浦区上水洞 72-1，弘益大学 Jandari Hall B1。从常规赛到季后赛的所有比赛都可以在现场观看。'],
    ['기간', '期間', 'Dates', '日期'], ['토·일', '土・日', 'Sat–Sun', '周六·周日'], ['만 15세 이상', '15歳以上', 'Ages 15+', '15 周岁以上'], ['다음 직관 가능 경기일', '次に観戦できる試合日', 'Next match day with tickets', '下一个可现场观赛的比赛日'],
    ['판매 중', '販売中', 'On sale', '售票中'], ['오픈 예정', '販売予定', 'Coming soon', '即将开售'], ['마감', '締切', 'Closed', '已截止'], ['판매 오픈', '販売開始', 'Sale opens', '开售'], ['판매 마감', '販売締切', 'Sale closes', '停售'], ['상태', '状態', 'Status', '状态'], ['경기일', '試合日', 'Match day', '比赛日'],
    ['티켓링크에서 예매 ↗', 'TicketLinkで購入 ↗', 'Buy on TicketLink ↗', '在 TicketLink 购票 ↗'], ['예매 일정 보기', '販売日程を見る', 'Sale schedule', '查看售票日程'], ['대회 정보', '大会情報', 'Event info', '赛事信息'], ['대회 기간', '大会期間', 'Dates', '赛事日期'], ['대회 시간', '試合時間', 'Times', '比赛时间'],
    ['토, 일', '土, 日', 'Sat, Sun', '周六, 周日'], ['대회 장소', '会場', 'Venue', '比赛场馆'], ['서울 마포구 상수동 72-1, 홍익대학교 잔다리홀 B1', 'ソウル市麻浦区上水洞72-1 弘益大学チャンダリホールB1', '72-1 Sangsu-dong, Mapo-gu, Seoul · Hongik Univ. Jandari Hall B1', '首尔麻浦区上水洞 72-1，弘益大学 Jandari Hall B1'],
    ['관람 시간', '観覧時間', 'Running time', '观赛时长'], ['360분', '360分', '360 min', '360 分钟'], ['관람 등급', '年齢制限', 'Age rating', '观看年龄'], ['만 15세 미만은 보호자 동반 시 입장 가능', '15歳未満は保護者同伴で入場可', 'Under 15 with a guardian', '未满 15 周岁须由监护人陪同入场'],
    ['티켓 가격', 'チケット価格', 'Prices', '票价'], ['R석', 'R席', 'R seat', 'R 座'], ['A석', 'A席', 'A seat', 'A 座'], ['B석', 'B席', 'B seat', 'B 座'], ['30,000원', '30,000ウォン', '₩30,000', '30,000 韩元'], ['25,000원', '25,000ウォン', '₩25,000', '25,000 韩元'], ['20,000원', '20,000ウォン', '₩20,000', '20,000 韩元'],
    ['1인당 4매까지 · 예매수수료 장당 1,000원', '1人4枚まで · 手数料1枚1,000ウォン', 'Max 4 per person · ₩1,000 fee per ticket', '每人限购 4 张 · 每张手续费 1,000 韩元'], ['예매는 경기 당일 오후 9시까지', '購入は試合当日21時まで', 'Sales close at 9 PM on match day', '购票截至比赛当天晚上 9 点'],
    ['취소는 예매처(티켓링크) 규정에 따라요', 'キャンセルはTicketLinkの規定に従います', "Cancellations follow TicketLink's rules", '退票按售票方(TicketLink)规定办理'],
    ['티켓 가격에 기념품은 포함되지 않아요. 현장 기념품은 주최측 무료 제공이라 교환·환불·재지급이 안 돼요', 'チケットに記念品は含まれません。会場の記念品は無料配布のため交換・返金・再配布はできません', 'Merch is not included. On-site gifts are free, so no exchanges, refunds or reissues', '票价不含纪念品。现场纪念品由主办方免费提供，不可更换、退款或补发'],
    ['오시는 길', 'アクセス', 'Getting there', '交通指南'], ['지하철 2·6호선', '地下鉄2・6号線', 'Subway lines 2 & 6', '地铁 2·6 号线'], ['지도를 불러오는 중이에요', '地図を読み込み中', 'Loading map', '地图加载中'], ['안 보이면 오른쪽 네이버 지도 · 카카오맵 버튼을 눌러 주세요', '表示されない場合は右のNAVER地図・KakaoMapを押してください', 'If it does not load, use the NAVER Map or KakaoMap buttons', '如果无法显示，请点击右侧 NAVER 地图 · KakaoMap 按钮'],
    ['주소', '住所', 'Address', '地址'], ['서울 마포구 상수동 72-1', 'ソウル市麻浦区上水洞72-1', '72-1 Sangsu-dong, Mapo-gu, Seoul', '首尔麻浦区上水洞 72-1'], ['홍익대학교 잔다리홀 B1 · WDG STUDIO HONGDAE', '弘益大学チャンダリホールB1 · WDG STUDIO HONGDAE', 'Hongik Univ. Jandari Hall B1 · WDG STUDIO HONGDAE', '弘益大学 Jandari Hall B1 · WDG STUDIO HONGDAE'],
    ['홍대입구역', '弘大入口駅', 'Hongik Univ. Stn', '弘大入口站'], ['홍익대학교 방면', '弘益大学方面', 'toward Hongik Univ.', '弘益大学方向'], ['상수역', '上水駅', 'Sangsu Stn', '上水站'], ['가장 가까운 역', '最寄り駅', 'closest station', '最近车站'], ['합정역', '合井駅', 'Hapjeong Stn', '合井站'], ['2·6호선 환승', '2・6号線乗換', 'Lines 2 & 6 transfer', '2·6 号线换乘'],
    ['네이버 지도 ↗', 'NAVER地図 ↗', 'NAVER Map ↗', 'NAVER 地图 ↗'], ['카카오맵 ↗', 'KakaoMap ↗', 'KakaoMap ↗', 'KakaoMap ↗'], ['예매 정보', 'チケット情報', 'Ticket sales', '售票信息'], ['모든 시간 KST · 상태는 지금 시각 기준', '時間はすべて' + ZONE_LONG + ' · 状態は現在時刻基準', 'All times ' + ZONE + ' · status as of now', '时间均为' + ZONE_LONG + ' · 状态以当前时间为准'],
    ['만 15세 이상 관람가예요.', '15歳以上が観覧できます。', 'Ages 15 and up.', '15 周岁以上可观看。'], ['2011년 이전 출생자', '2011年以前生まれ', 'Born before 2011', '2011 年以前出生者'],
    ['까지 입장할 수 있고, 2011년 출생자는 생일이 지난 날부터 만 15세가 적용돼요. 생년월일을 가장 먼저 확인하니 증빙 서류를 챙겨 주세요. 만 15세 미만은 보호자와 함께 입장할 수 있어요.', 'まで入場でき、2011年生まれは誕生日以降に15歳として扱われます。生年月日を最初に確認するので証明書類をお持ちください。15歳未満は保護者同伴で入場できます。', 'can enter; if born in 2011 you count as 15 from your birthday. Birth dates are checked first, so bring ID. Under 15 may enter with a guardian.', '可以入场；2011 年出生者从生日当天起视为满 15 周岁。入场时会先核对出生日期，请携带证明文件。未满 15 周岁可由监护人陪同入场。'],
    ['티켓 수령 · 관람 안내', 'チケット受取 · 観覧案内', 'Pick-up & house rules', '取票 · 观赛须知'], ['티켓 수령', 'チケット受取', 'Ticket pick-up', '取票'], ['경기 관람', '観覧', 'At the venue', '现场观赛'],
    ['배송 없이 당일 경기 1시간 전부터 현장 키오스크에서 발권해요', '配送はなく、当日試合1時間前から会場のキオスクで発券します', 'No delivery: print at the venue kiosk from 1 hour before the match', '不提供配送，比赛当天开赛前 1 小时起在现场自助机取票'],
    ['운영 시간은 현장 상황에 따라 바뀔 수 있어요', '運営時間は会場の状況により変わる場合があります', 'Hours may change on the day', '开放时间可能根据现场情况调整'], ['부분 출력은 안 되고, 예매한 전체 건만 출력돼요', '一部のみの発券はできず、購入分すべてが発券されます', 'Only whole bookings can be printed', '不能部分取票，只能取出整笔订单'],
    ['1인 1매 티켓을 가진 관객만 입장할 수 있어요', '1人1枚のチケットを持つ方のみ入場できます', 'One ticket per person to enter', '每人持一张票方可入场'], ['수령한 티켓을 잃어버리면 어떤 이유로도 재발권이 안 돼요. 실물 티켓이 있어야 입장할 수 있어요', '受け取ったチケットを紛失しても再発券できません。実物のチケットが必要です', 'Lost tickets cannot be reissued. You need the printed ticket to enter', '取出的门票遗失后，无论任何原因都不补发。须持实体票入场'],
    ['입장은 경기 시작 1시간 전부터 (티켓 미소지 시 입장 불가)', '入場は試合開始1時間前から(チケットがないと入場不可)', 'Doors open 1 hour before (ticket required)', '比赛开始前 1 小时开始入场(无票不得入场)'], ['예매한 좌석에서만 관람하고, 좌석 이동은 안 돼요', '購入した席でのみ観覧でき、席の移動はできません', 'Stay in your booked seat', '只能在所购座位观赛，不可换座'],
    ['티켓은 앞면에 적힌 일시에만 유효하고, 현장 판매는 없어요', 'チケットは記載の日時のみ有効で、当日販売はありません', 'Tickets are valid only for the printed date; no door sales', '门票仅在票面日期时间有效，现场不售票'],
    ['스낵·음료는 괜찮지만 주류와 관람을 방해하는 음식물은 반입할 수 없어요', 'スナック・飲み物は可、酒類と観覧の妨げになる飲食物は持ち込めません', 'Snacks and drinks are fine; no alcohol or disruptive food', '可携带零食·饮料，但禁止携带酒类及影响观赛的食物'],
    ['동영상 촬영, 음성·영상 스트리밍 등 저작권 침해 행위는 금지예요. 적발 시 자료 삭제 후 퇴장해요', '動画撮影・音声/映像の配信など著作権侵害行為は禁止です。発覚時はデータ削除のうえ退場となります', 'No video recording or streaming. Offenders delete the footage and are removed', '禁止录像、音视频直播等侵犯版权的行为。一经发现须删除资料并离场'],
    ['온라인 중계가 있어서 관객 목소리와 얼굴이 방송에 나올 수 있어요', 'オンライン中継があるため観客の声や顔が映る場合があります', 'The event is streamed, so you may appear on the broadcast', '比赛有网络直播，观众的声音和面孔可能出现在直播中'],
    ['비방·정치·종교·상업 목적의 배너, 현수막 등은 반입·게시할 수 없어요', '誹謗・政治・宗教・商業目的のバナー等は持ち込み・掲示できません', 'No defamatory, political, religious or commercial banners', '禁止携带或展示诽谤、政治、宗教、商业目的的横幅等'],
    ['금지 행위나 진행 방해 시 경고 없이 퇴장될 수 있고, 티켓은 환불되지 않아요', '禁止行為や進行妨害は警告なしで退場となり、返金されません', 'Banned behaviour means removal without warning or refund', '如有禁止行为或妨碍比赛进行，可能被直接请离且不予退票'],
    ['본인 확인 · 지정 유효 신분증', '本人確認 · 有効な身分証', 'ID check · accepted ID', '身份核验 · 有效证件'],
    ['암표와 불법 양도를 막기 위해 현장 매표소에서 티켓 수령 전에 본인확인을 해요. 시간이 걸리니 미리 와 주세요', '転売防止のため受取前に本人確認を行います。時間がかかるので早めにお越しください', 'ID is checked before pick-up to stop scalping. Please come early', '为防止黄牛和非法转让，现场取票前会核验身份。需要一些时间，请提前到场'],
    ['예매자와 신분증이 일치하지 않으면 입장이 제한돼요', '購入者と身分証が一致しない場合は入場できません', 'Entry is refused if the ID does not match the buyer', '购票人与证件不一致将无法入场'], ['유효기간이 지나지 않은', '有効期限内の', 'Unexpired', '在有效期内的'], ['실물', '実物の', 'physical', '实体'],
    ['신분증만 인정돼요. 모바일 신분증, 사본, 사진은 안 돼요', '身分証のみ有効です。モバイル身分証・コピー・写真は不可', 'ID only. No mobile ID, copies or photos', '证件方可有效。电子证件、复印件、照片均无效'], ['구분', '区分', 'Type', '类别'], ['미성년', '未成年', 'Minors', '未成年'], ['성년', '成人', 'Adults', '成年'],
    ['학생증 + 재학(적) 증명서', '学生証 + 在学証明書', 'Student ID + enrolment certificate', '学生证 + 在读证明'], ['사진이 있는 학생증과 기관장 관인이 찍힌 재학(적)증명서를 함께 지참', '写真付き学生証と公印のある在学証明書を一緒に持参', 'Photo student ID plus a stamped enrolment certificate', '同时携带带照片的学生证和加盖公章的在读证明'],
    ['주민등록증 / 운전면허증', '住民登録証 / 運転免許証', 'Resident card / driving licence', '居民身份证 / 驾驶证'], ['사진, 주민등록번호, 성명이 명확하게 기재', '写真・登録番号・氏名がはっきり記載されたもの', 'Photo, ID number and name clearly shown', '照片、身份证号、姓名清晰可见'], ['여권', 'パスポート', 'Passport', '护照'],
    ['기관장 관인으로 간인하고 사진을 포함한 인적사항 · 발급번호 · 유효기간이 있는 투명스티커가 붙은 상태', '公印で割印され、写真付きの個人情報・発行番号・有効期限の透明シールが貼られたもの', 'Stamped, with a clear sticker showing photo, details, number and expiry', '加盖骑缝公章，并贴有含照片、个人信息、签发编号、有效期的透明贴纸'],
    ['주민등록증 발급신청 확인서', '住民登録証発行申請確認書', 'Resident card application receipt', '身份证申领确认书'], ['청소년증', '青少年証', 'Youth ID', '青少年证'], ['불가', '不可', 'Not accepted', '不可'], ['기타 인정 범위', 'その他の有効な身分証', 'Also accepted', '其他有效证件'],
    ['공무원증, 선원수첩, 교육 자격증, 국가기술자격증, 장애인복지카드, 전역증(전역 후 1년 이내), 외국인등록증, 외국국적동포국내거소신고증, 재외국민국내거소신고증', '公務員証、船員手帳、教育資格証、国家技術資格証、障害者福祉カード、除隊証(除隊後1年以内)、外国人登録証、在外同胞居所申告証、在外国民居所申告証', 'Civil-servant ID, seaman’s book, teaching or national technical licence, disability card, discharge card (within 1 year), alien registration card, overseas Korean residence cards', '公务员证、船员手册、教师资格证、国家技术资格证、残疾人福利卡、退伍证(退伍后 1 年内)、外国人登录证、外籍同胞国内居所申报证、在外国民国内居所申报证'],
    ['티켓 · 예매 문의', 'チケットのお問い合わせ', 'Ticket enquiries', '门票 · 购票咨询'], ['티켓링크 1588-7890', 'TicketLink 1588-7890', 'TicketLink 1588-7890', 'TicketLink 1588-7890'], ['전화 걸기', '電話する', 'Call', '拨打电话'],
    ['비공식 팬 사이트입니다. Blizzard Entertainment, WDG, 각 팀과 제휴하거나 승인받지 않았습니다. Overwatch®와 영웅 이미지는 Blizzard Entertainment, Inc.의 상표·저작물이고, 팀 로고와 선수 사진의 권리는 각 소유자에게 있으며 요청하면 바로 내립니다. 직관 정보는 2026 OWCS ASIA KOREA STAGE 3 공식 예매 안내를 옮긴 것이라, 바뀐 내용은 티켓링크 공지를 확인해 주세요.', '非公式ファンサイトです。観戦情報は2026 OWCS ASIA KOREA STAGE 3の公式案内を転載したものです。変更はTicketLinkのお知らせをご確認ください。', 'Unofficial fan site. Ticket info is copied from the official 2026 OWCS ASIA KOREA STAGE 3 notice; check TicketLink for changes.', '非官方粉丝网站。现场观赛信息转载自 2026 OWCS ASIA KOREA STAGE 3 官方购票说明，如有变动请查看 TicketLink 公告。'],
    ['WDG STUDIO HONGDAE 지도', 'WDG STUDIO HONGDAE 地図', 'WDG STUDIO HONGDAE map', 'WDG STUDIO HONGDAE 地图'],
    ['정규 리그 판매가 끝났어요. 시드 결정전·LCQ는 10.28, 플레이오프는 11.04 오픈이에요.', 'レギュラーシーズンの販売は終了しました。シード決定戦・LCQは10.28、プレーオフは11.04に販売開始です。', 'Regular-season sales are over. Seeding/LCQ open 10.28, playoffs 11.04.', '常规赛售票已结束。种子决定战·LCQ 于 10.28 开售，季后赛于 11.04 开售。'],
    ['스테이지 3', 'ステージ3', 'Stage 3', '第三阶段'], ['정규 리그', 'レギュラーシーズン', 'regular season', '常规赛'], ['기준', '時点', 'as of', '截至'], ['주 남음', '週残り', 'weeks left', '周剩余'],
  ];
  // [japanese, english, chinese]
  var DOW = { '일': ['日', 'Sun', '周日'], '월': ['月', 'Mon', '周一'], '화': ['火', 'Tue', '周二'], '수': ['水', 'Wed', '周三'], '목': ['木', 'Thu', '周四'], '금': ['金', 'Fri', '周五'], '토': ['土', 'Sat', '周六'] };
  var DOWL = { '일요일': ['日曜日', 'Sunday', '星期日'], '월요일': ['月曜日', 'Monday', '星期一'], '화요일': ['火曜日', 'Tuesday', '星期二'], '수요일': ['水曜日', 'Wednesday', '星期三'], '목요일': ['木曜日', 'Thursday', '星期四'], '금요일': ['金曜日', 'Friday', '星期五'], '토요일': ['土曜日', 'Saturday', '星期六'] };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var col = lang === 'ja' ? 1 : lang === 'zh' ? 3 : 2;
  var DICT = {};
  T.forEach(function (r) { DICT[r[0]] = r[col]; });
  Object.keys(DOW).forEach(function (k) { DICT[k] = DOW[k][col - 1]; });
  Object.keys(DOWL).forEach(function (k) { DICT[k] = DOWL[k][col - 1]; });
  // pick the japanese / english / chinese form of a rule
  function P(j, e, z) { return lang === 'ja' ? j : lang === 'zh' ? z : e; }
  // number patterns (order matters)
  var RULES = [
    // sentences that share a text node with others (footers, calendar labels)
    // home footer: the site's Korean alias before the notice and the data source after it (10-23: whole footer stayed Korean)
    [/^OWticker\(옵티컬\)은 /, 'OWticker · '],
    [/데이터: Liquipedia/g, P('データ: Liquipedia', 'Data: Liquipedia', '数据: Liquipedia')],    [/비공식 팬 사이트입니다\. Blizzard Entertainment, WDG, 각 팀과 제휴하거나 승인받지 않았습니다\. Overwatch®와 영웅 이미지는 Blizzard Entertainment, Inc\.의 상표·저작물이고, 팀 로고와 선수 사진의 권리는 각 소유자에게 있으며 요청하면 바로 내립니다\./g, P('非公式ファンサイトです。Blizzard Entertainment、WDG、各チームとの提携・承認はありません。Overwatch®およびヒーロー画像はBlizzard Entertainment, Inc.の商標・著作物です。チームロゴと選手写真の権利は各所有者にあり、ご要望があればすぐに削除します。', 'Unofficial, non-commercial fan site. Not affiliated with, sponsored or endorsed by Blizzard Entertainment, WDG or any team. Overwatch is a trademark of Blizzard Entertainment, Inc., in the U.S. and/or other countries; hero art © Blizzard Entertainment, Inc. Team logos and player photos belong to their owners and are removed on request.', '非官方粉丝网站。与 Blizzard Entertainment、WDG 及各战队无合作或授权关系。Overwatch® 及英雄图片为 Blizzard Entertainment, Inc. 的商标或作品，战队标志和选手照片的权利归各自所有者，如有要求将立即删除。')],
    [/방송 상태는 CHZZK·SOOP에서 몇 분마다 확인해요\./g, P('配信状況はCHZZK・SOOPで数分ごとに確認しています。', 'Live status is checked on CHZZK and SOOP every few minutes.', '直播状态每隔几分钟从 CHZZK·SOOP 检查一次。')],
    [/일정은 Liquipedia에서 10분마다 가져와요\./g, P('日程はLiquipediaから10分ごとに取得しています。', 'The schedule is pulled from Liquipedia every 10 minutes.', '赛程每 10 分钟从 Liquipedia 获取一次。')],
    [/시간 미정 경기는 Liquipedia에 시간이 올라오면 바뀌어요\./g, P('時間未定の試合は、Liquipediaに時間が載ると更新されます。', 'TBD times update once Liquipedia posts them.', '时间待定的比赛会在 Liquipedia 公布时间后更新。')],
    [/직관 정보는$/, P('観戦情報は', 'Ticket info is copied from the', '观赛信息转载自')],
    [/^ ?공식 예매 안내를 옮긴 것이라, 바뀐 내용은 티켓링크 공지를 확인해 주세요\./, P('の公式販売案内を転載したものです。変更はTicketlinkのお知らせをご確認ください。', ' official sales notice; check Ticketlink for any changes.', ' 官方售票公告，如有变动请以 Ticketlink 公告为准。')],
    [/ \(서울 시간\)/g, P(' (ソウル時間)', ' (Seoul time)', ' (首尔时间)')],
    [/경기 (\d+)개/g, P('$1試合', '$1 matches', '$1场比赛')],
    [/^남은 (\d+)경기의 모든 승패·세트 점수 조합 기준$/, P('残り$1試合の全勝敗・セットスコアのパターンから', 'Every win/loss and set score of the $1 matches left', '基于剩余$1场比赛的全部胜负与局分组合')],
    [/남은 1경기는 져도 1세트만 따면 (플레이오프|\d+위 안) 확정\./g, P('残り1試合は負けても1セット取れば$1確定。', 'Even if it loses the last match, taking one set clinches $1.', '剩余1场即使输，只要拿下1局即锁定$1。')],
    [/남은 1경기는 져도 (\d+)세트 이상 따면 (플레이오프|\d+위 안) 확정\./g, P('残り1試合は負けても$1セット以上取れば$2確定。', 'Even if it loses the last match, taking $1 sets or more clinches $2.', '剩余1场即使输，只要拿下$1局以上即锁定$2。')],
    [/남은 (\d+)경기 중 (\d+)승 하고 세트 득실 합계 ([+-]?\d+) 이상이면 (플레이오프|\d+위 안) 확정\./g, P('残り$1試合中$2勝し、セット得失の合計が$3以上なら$4確定。', 'Win $2 of the last $1 with a combined set difference of $3 or better to clinch $4.', '剩余$1场中赢$2场且净胜局总和不低于$3，即锁定$4。')],
    [/^남은 (\d+)경기의 모든 승패 조합 기준$/, P('残り$1試合の全勝敗パターンから', 'Every win/loss combo of the $1 matches left', '基于剩余$1场比赛的全部胜负组合')],
    [/LCQ 경쟁/g, P('LCQ争い', 'LCQ race', 'LCQ 争夺')], [/플레이오프 경쟁/g, P('プレーオフ争い', 'playoff race', '季后赛争夺')],
    [/ \(지난 시즌\)/g, P(' (前シーズン)', ' (last season)', ' (上赛季)')],
    // results page: playoff scenarios (whole sentences, several can sit in one line)
    [/남은 경기 결과와 관계없이 1–(\d+)위 안이에요\./g, P('残り試合の結果に関係なく1–$1位以内です。', 'Top $1 no matter how the remaining matches go.', '无论剩余比赛结果如何，都在前$1名之内。')],
    [/남은 경기를 모두 이겨도 (\d+)위 안에 들 수 없어요\./g, P('残り試合に全勝しても$1位以内に入れません。', "Can't make the top $1 even by winning every remaining match.", '即使赢下所有剩余比赛，也无法进入前$1名。')],
    [/남은 (\d+)경기 중 (\d+)승 하면 플레이오프 확정\./g, P('残り$1試合中$2勝でプレーオフ確定。', 'Win $2 of the last $1 to clinch the playoffs.', '剩余$1场中赢$2场即锁定季后赛。')],
    [/남은 (\d+)경기 중 (\d+)승 하면 (\d+)위 안 확정\./g, P('残り$1試合中$2勝で$3位以内確定。', 'Win $2 of the last $1 to clinch the top $3.', '剩余$1场中赢$2场即锁定前$3名。')],
    [/다른 팀 결과와 세트 득실에 따라 플레이오프가 갈려요\./g, P('他チームの結果とセット得失でプレーオフ進出が決まります。', 'Playoffs depend on other results and map differential.', '能否进入季后赛取决于其他队伍的结果和地图净胜。')],
    [/다른 팀 결과에 따라 (\d+)위 안에 들 수 있어요\./g, P('他チームの結果次第で$1位以内に入れます。', 'Can still make the top $1, depending on other results.', '视其他队伍结果，仍可进入前$1名。')],
    [/ ?최소 라스트 찬스 예선은 확정이에요\./g, P(' 少なくともラストチャンス予選は確定です。', ' The last chance qualifier is already locked in.', ' 至少已锁定最后机会预选赛。')],
    [/플레이오프 직행은 어렵지만 라스트 찬스 예선은 확정이에요\./g, P('プレーオフ直行は難しいものの、ラストチャンス予選は確定です。', 'A direct playoff spot is out of reach, but the last chance qualifier is locked in.', '难以直接晋级季后赛，但已锁定最后机会预选赛。')],
    [/^(\d+)승 (\d+)패$/, P('$1勝 $2敗', '$1W $2L', '$1胜 $2负')],
    [/^(\d+)주차$/, P('第$1週', 'Week $1', '第$1周')],
    [/(\d+)주차/g, P('第$1週', 'week $1', '第$1周')],
    [/\((월|화|수|목|금|토|일)\)/g, function (m, d) { return '(' + DOW[d][col - 1] + ')'; }],
    [/^(\d+)월 (\d+)일 ?\((월|화|수|목|금|토|일)\)/, function (m, mo, d, w) { return P(mo + '月' + d + '日(' + DOW[w][0] + ')', MON[mo - 1] + ' ' + d + ' (' + DOW[w][1] + ')', mo + '月' + d + '日(' + DOW[w][2] + ')'); }],
    [/(\d+)월 (\d+)일/g, function (m, mo, d) { return P(mo + '月' + d + '日', MON[mo - 1] + ' ' + d, mo + '月' + d + '日'); }],
    [/(\d\d:\d\d(?: \([^)]*\))?(?: \/ \d\d:\d\d(?: \([^)]*\))?)*) KST 오픈/g, P('$1 (' + ZONE + ') 販売開始', 'on sale $1 ' + ZONE, '$1 (' + ZONE + ') 开售')],
    [/오후 ([\d /]+)시 오픈/g, P('午後$1時 販売開始', 'on sale $1 PM', '下午$1点 开售')],
    [/^(월|화|수|목|금|토|일) · (\d\d:\d\d)$/, function (m, d, t) { return DOW[d][col - 1] + ' · ' + t; }],
    [/^오늘 (\d\d:\d\d)$/, P('今日 $1', 'Today $1', '今天 $1')],
    [/^LIVE · (\d+)세트$/, P('LIVE · 第$1セット', 'LIVE · Map $1', 'LIVE · 第$1局')],
    [/^(\d\d:\d\d) 시작$/, P('$1 開始', 'Starts $1', '$1 开始')],
    [/^(\d\d:\d\d(?: \([^)]*\))?) KST 시작$/, P('$1 ' + ZONE + ' 開始', 'Starts $1 ' + ZONE, '$1 ' + ZONE + ' 开始')],
    [/^(\d+)위$/, P('$1位', '#$1', '第$1名')],
    [/^현재 (\d+)위$/, P('現在$1位', 'currently #$1', '目前第$1名')],
    [/^(\d+)–(\d+)위 플레이오프 시드 결정전$/, P('$1–$2位 プレーオフシード決定戦', '#$1–$2 playoff seeding', '第$1–$2名 季后赛种子决定战')],
    [/^(\d+)–(\d+)위 라스트 찬스 예선$/, P('$1–$2位 ラストチャンス予選', '#$1–$2 last chance qualifier', '第$1–$2名 最后机会预选赛')],
    [/^(@[\w.]+) 프로필 →$/, P('$1 プロフィール →', '$1 profile →', '$1 主页 →')],
    [/^(.+) 우승$/, P('$1 優勝', '$1 champion', '$1 冠军')],
    [/^(.+) 경기 한 번에 구독$/, P('$1 の試合をまとめて購読', 'Subscribe to $1 matches', '一次订阅 $1 的比赛')],
    [/^(\d+)회$/, P('$1回', '$1×', '$1次')],
    [/^(\d+)명$/, P('$1人', '$1', '$1人')],
    [/^로스터 (\d+)명$/, P('ロスター $1人', 'Roster · $1', '阵容 $1人')],
    [/^스태프진 (\d+)명$/, P('スタッフ $1人', 'Staff · $1', '教练组 $1人')],
    [/^● 방송 중 (\d+)명$/, P('● 配信中 $1人', '● $1 live', '● 直播中 $1人')],
    [/^지금 방송 중인 선수 (\d+)명$/, P('配信中の選手 $1人', '$1 players live now', '正在直播的选手 $1人')],
    [/^(SOOP|CHZZK) 방송 중 ↗$/, P('$1 配信中 ↗', '$1 live ↗', '$1 直播中 ↗')],
    [/^(\d+)경기$/, P('$1試合', '$1 matches', '$1场比赛')],
    [/^(.+) 라인업 · (\d+)명$/, P('$1 ロスター · $2人', '$1 roster · $2', '$1 阵容 · $2人')],
    [/^경우의 수 공개 중 · 정규 리그 종료까지 (\d+)주$/, P('プレーオフ条件を公開中 · レギュラーシーズン終了まで$1週', 'Scenarios live · $1 weeks left in the regular season', '晋级形势公开中 · 距常规赛结束还有$1周')],
    [/^경우의 수는 정규 리그 종료 (\d)주 전부터 공개돼요 · 현재 (\d+)주 남음$/, P('プレーオフ条件は終了$1週前から公開 · 残り$2週', 'Scenarios open $1 weeks before the end · $2 weeks left', '晋级形势在常规赛结束前$1周公开 · 目前还剩$2周')],
    [/^(.*) 지난 경기 (\d+)건$/, P('$1 過去の試合 $2件', '$1 · $2 past matches', '$1 往期比赛 $2场')],
    [/^(\d+)경기 · 모든 시간 KST$/, P('$1試合 · 時間はすべて' + ZONE_LONG, '$1 matches · all times ' + ZONE, '$1场比赛 · 时间均为' + ZONE_LONG)],
    [/^판매 (오픈|마감) /, function (m, k) { return k === '오픈' ? P('販売開始 ', 'Sale opens ', '开售 ') : P('販売締切 ', 'Sale closes ', '停售 '); }],
    [/^마지막 확인 /, P('最終確認 ', 'Last checked ', '最后检查 ')],
    [/^(\d+)승 (\d+)패 · /, P('$1勝 $2敗 · ', '$1W $2L · ', '$1胜 $2负 · ')],
    [/ · 대진 미정$/, P(' · 対戦未定', ' · matchup TBD', ' · 对阵待定')],
    [/^정규 리그가 끝났어요 · /, P('レギュラーシーズン終了 · ', 'Regular season over · ', '常规赛已结束 · ')],
    [/ 정규 리그 (\d+)주차$/, P(' レギュラーシーズン 第$1週', ' regular season · week $1', ' 常规赛 第$1周')],
    [/^2026 OWCS KR 스테이지 (\d)/, '2026 OWCS KR STAGE $1'],
    [/코리아 스테이지 (\d)/g, P('コリア ステージ$1', 'Korea Stage $1', '韩国 第$1阶段')],
    [/아시아 스테이지 (\d)/g, P('アジア ステージ$1', 'Asia Stage $1', '亚洲 第$1阶段')],
    [/챔피언스 클래시/g, P('Champions Clash', 'Champions Clash', '冠军争霸赛')], [/미드시즌 챔피언십/g, P('Midseason Championship', 'Midseason Championship', '季中锦标赛')], [/월드 파이널/g, P('World Finals', 'World Finals', '世界总决赛')], [/댈러스 메이저/g, P('Dallas Major', 'Dallas Major', '达拉斯 Major')],
    [/^(\d)–(\d)위$/, P('$1–$2位', '#$1–$2', '第$1–$2名')],
    [/스테이지 (\d)/g, P('ステージ$1', 'Stage $1', '第$1阶段')],
  ];
  var KO_NAMES = null;   // players' Korean nicknames: dropped in ja/en/zh ("탱커 · 베르나르" -> "Tank")
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
        var parts = core.split(/( · | – | \/ |, |: | → )/), res = [];   // → : the bracket's round chain '8강 → 4강 → 결승'
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
    var kst = ZONE !== 'KST' && /KST/.test(cur);
    if (!HANGUL.test(cur) && !kst) return;
    var t = HANGUL.test(cur) ? tr(cur) : cur;
    if (kst) t = t.replace(/KST/g, ZONE);
    if (t !== cur) { ORIG.set(n, { o: cur, t: t }); n.data = t; }
  }
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  function doEl(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (!v || !HANGUL.test(v) || lang === 'ko') continue;
      var t = tr(v);   // write only on change: an unchanged write still fires the observer and loops forever
      if (t !== v) el.setAttribute(ATTRS[i], t);
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doNode(root); return; }
    if (root.nodeType !== 11 && (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(root.tagName))) return;
    if (root.nodeType === 1) doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { var pe = n.parentNode; if (pe && /^(SCRIPT|STYLE|TEMPLATE)$/.test(pe.tagName)) continue; doNode(n); }
      else doEl(n);
    }
  }
  function run() { if (busy) return; busy = true; try { walk(document.body); } finally { busy = false; } }

  // the language picker itself is in the page top (owcs-nav.js: 🌐 KOR ⌄)
  function set(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    if (l !== lang) location.reload();
  }
  window.OWCSi18n = { lang: lang, set: set, t: function (s) { return lang === 'ko' ? s : tr(s); }, hm: hm, tz: TZ, zone: ZONE };
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;

  function start() {
    if (lang === 'ko') return;
    var st = document.createElement('style');   // upright Korean role letters read sideways in other scripts
    st.textContent = '[style*="text-orientation: upright"]{text-orientation:mixed !important;transform:rotate(180deg)}';
    document.head.appendChild(st);
    run();
    watch(document.body);
    roots.forEach(function (r) { walk(r); watch(r); });
    started = true;
  }
  function watch(root) {
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
    }).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // components that draw into a shadow root (owcs-bracket, owcs-intl) are out of the page walker's and the observer's
  // reach (10-23: the whole home bracket stayed Korean in en/ja/zh): every shadow root made after this script is
  // watched like the page. This script loads before the components, so it sees each attachShadow.
  var roots = [], started = false, attach = Element.prototype.attachShadow;
  if (lang !== 'ko' && attach) {
    Element.prototype.attachShadow = function (o) {
      var r = attach.call(this, o);
      if (started) watch(r); else roots.push(r);
      return r;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
