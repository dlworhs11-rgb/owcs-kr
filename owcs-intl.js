// <owcs-intl>: an international event (Champions Clash, Midseason Championship, World Finals) while the site is in
// international mode (owcs-phase.js puts it at the top of the home page). Data: owcs-data.js -> OWCS.intl[]
// (owcs_build.build_intl, Liquipedia). Parts: event card (countdown / live / champion), the teams (Korean teams first,
// marked), the matches of one day (tap a match for its maps and bans), the bracket per section (groups, playoffs).
// Attribute event="2026wf" picks the event (owcs-phase.js sets it). Spoiler mode (localStorage owcs-spoiler) hides scores.
(function () {
  if (!window.customElements || customElements.get('owcs-intl')) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const CITY = { 'Guangzhou': '광저우', 'Paris': '파리', 'Tachikawa, Tokyo': '도쿄', 'Tokyo': '도쿄', 'Stockholm': '스톡홀름', 'Riyadh': '리야드', 'Seoul': '서울' };
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const md = (d) => d.slice(5, 7) + '.' + d.slice(8, 10);
  const dow = (d) => DOW[new Date(d + 'T12:00:00+09:00').getUTCDay()];

  const CSS = `
:host{display:block;container-type:inline-size;font-family:inherit}
.w{--i-ink:#0B0B0F;--i-mute:#6B6B72;--i-card:#FFFFFF;--i-line:#E3E3DE;--i-soft:#F3F3EF;--i-ac:var(--ac,#7D39EB);--i-ac2:var(--ac2,#C6FF33);--i-wire:#BDBDB6;color:var(--i-ink)}
.w.dark{--i-ink:#F2F2F5;--i-mute:#9A9AA3;--i-card:#1C1C22;--i-line:#2E2E36;--i-soft:#16161B;--i-wire:#4A4A55}
.hero{position:relative;overflow:hidden;border-radius:22px;background:#0B0B0F;color:#fff;padding:22px 20px 20px}
.hero::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--i-ac2)}
.kick{display:inline-block;height:24px;line-height:24px;padding:0 10px;border-radius:999px;background:var(--i-ac2);color:#0B0B0F;font-size:12px;font-weight:800}
.kick.live{background:#D92D20;color:#fff}
.nm{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-weight:800;font-size:40px;line-height:.95;margin:10px 0 6px;word-break:keep-all}
.meta{font-size:15px;font-weight:700;opacity:.8}
.cd{display:flex;gap:10px;margin-top:16px}
.cd div{min-width:64px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.08);text-align:center}
.cd b{display:block;font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:30px;line-height:1}
.cd span{font-size:12px;opacity:.7}
.champ{display:inline-flex;align-items:center;gap:10px;margin-top:16px;height:44px;padding:0 16px 0 8px;border-radius:999px;background:#fff;color:#0B0B0F;font-weight:800}
.champ i{width:30px;height:30px}
i.lg{flex:none;display:block;background:center/contain no-repeat}
h4{font-size:15px;font-weight:800;margin:28px 2px 10px;color:var(--i-ink)}
h4 small{font-weight:700;color:var(--i-mute);margin-left:6px}
.teams{display:flex;flex-wrap:wrap;gap:8px}
.tm{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 8px;border-radius:999px;background:var(--i-card);border:1px solid var(--i-line);font-size:14px;font-weight:800}
.tm i{width:24px;height:24px}
.tm.kr{border:2px solid var(--i-ac)}
.tm em{font-style:normal;font-size:10.5px;font-weight:800;color:var(--i-ac)}
.tbd{color:var(--i-mute);font-size:14px;padding:4px 2px}
.days{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}
.days::-webkit-scrollbar{display:none}
.days button{flex:none;height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--i-line);background:var(--i-card);color:var(--i-ink);font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.days button.on{background:var(--i-ink);color:var(--i-card);border-color:var(--i-ink)}
.days button.today::after{content:' · 오늘';color:var(--i-ac)}
.days button.on.today::after{color:var(--i-ac2)}
.ms{display:flex;flex-direction:column;gap:8px;margin-top:10px;max-width:920px}
.m{border-radius:16px;background:var(--i-card);border:1px solid var(--i-line);overflow:hidden}
.m.kr{border-left:5px solid var(--i-ac)}
.m.live{border-color:#D92D20;border-width:2px}
.mrow{display:grid;grid-template-columns:52px minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px;padding:12px 14px;cursor:pointer;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left}
.mt{font-size:12px;color:var(--i-mute);line-height:1.3}
.mt b{display:block;font-size:14px;color:var(--i-ink)}
.mt em{font-style:normal;font-weight:800;color:#D92D20}
.side{display:flex;align-items:center;gap:8px;min-width:0;font-size:15px;font-weight:800}
.side.b{flex-direction:row-reverse;text-align:right}
.side i{width:28px;height:28px}
.side span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.side.lose{opacity:.45}
.sc{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-weight:800;font-size:26px;white-space:nowrap;text-align:center;min-width:64px}
.sc .win{color:var(--i-ink)}
.sc .lo{color:var(--i-mute)}
.sc small{display:block;font-family:inherit;font-size:11px;font-weight:700;color:var(--i-mute)}
.det{border-top:1px solid var(--i-line);padding:6px 14px 12px;display:none}
.m.open .det{display:block}
.mp{display:grid;grid-template-columns:28px minmax(0,1fr) auto auto;gap:4px 10px;align-items:center;margin-top:8px;padding:10px 12px;border-radius:12px;color:#fff;font-size:13.5px}
.mp .no{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-weight:800;font-size:16px;opacity:.7}
.mp .nmp b{font-weight:800}
.mp .nmp small{opacity:.7;margin-left:6px}
.mp .wn{display:flex;align-items:center;gap:6px;font-weight:800}
.mp .wn i{width:20px;height:20px}
.mp .ms2{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-weight:800;font-size:18px;white-space:nowrap;color:var(--i-ac2)}
.mp .bans{grid-column:2 / -1;display:flex;flex-wrap:wrap;gap:6px}
.ban{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px 0 3px;border-radius:999px;background:rgba(0,0,0,.45);font-size:12px;font-weight:700}
.ban i{width:20px;height:20px;border-radius:50%}
.empty{color:var(--i-mute);font-size:14px;padding:14px 2px}
.pick{display:flex;gap:6px;overflow-x:auto;padding:2px 0 4px;margin-bottom:12px;scrollbar-width:none}
.pick::-webkit-scrollbar{display:none}
.pick button{flex:none;height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--i-line);background:var(--i-card);color:var(--i-ink);font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.pick button.on{background:var(--i-ink);color:var(--i-card);border-color:var(--i-ink)}
.box{background:var(--i-card);border:1px solid var(--i-line);border-radius:18px;padding:14px 12px 16px;margin-bottom:12px}
.bxh{font-size:15px;font-weight:800;margin:0 2px 10px}
.tree{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:0 16px}
.col{display:flex;flex-direction:column;min-width:0}
.ct{font-size:11.5px;font-weight:800;color:var(--i-mute);text-align:center;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cm{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:10px;position:relative}
.bm{position:relative;background:var(--i-card);border:1px solid var(--i-line);border-radius:10px;min-width:0}
.bm.kr{box-shadow:inset 3px 0 0 var(--i-ac)}
.bm.live{border:2px solid #D92D20}
.mh{display:flex;justify-content:space-between;gap:4px;padding:3px 7px;font-size:11px;color:var(--i-mute);border-bottom:1px solid var(--i-line);white-space:nowrap;overflow:hidden}
.mh em{font-style:normal;font-weight:800;color:#D92D20}
.r{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:5px;height:27px;padding:0 7px}
.r+.r{border-top:1px solid var(--i-line)}
.r i{display:block;width:16px;height:16px;border-radius:3px;background:center/contain no-repeat}
.r b{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r s{text-decoration:none;font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:17px;font-weight:800;min-width:10px;text-align:right}
.r.lose b,.r.lose s{color:var(--i-mute);font-weight:500}
.r.lose i{opacity:.45}
.r.tbd b{color:var(--i-mute);font-weight:500}
.link .bm::after{content:'';position:absolute;top:50%;right:-9px;width:8px;border-top:1.5px solid var(--i-wire)}
.into .bm::before{content:'';position:absolute;top:50%;left:-9px;width:8px;border-top:1.5px solid var(--i-wire)}
.merge .cm::after{content:'';position:absolute;right:-9px;top:25%;bottom:25%;border-right:1.5px solid var(--i-wire)}
.extra{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
@container (min-width:640px){.hero{padding:28px 30px 26px}.nm{font-size:60px}.meta{font-size:17px}.cd b{font-size:38px}.mrow{grid-template-columns:64px minmax(0,1fr) auto minmax(0,1fr);padding:14px 18px}.side{font-size:17px}.side i{width:34px;height:34px}.sc{font-size:30px}}
@container (min-width:640px){.r{height:32px;grid-template-columns:20px minmax(0,1fr) auto;gap:7px;padding:0 10px}.r i{width:20px;height:20px}.r b{font-size:14.5px}.r s{font-size:20px}.mh{font-size:11.5px;padding:4px 10px}.tree{gap:0 26px}.link .bm::after{right:-14px;width:13px}.into .bm::before{left:-14px;width:13px}.merge .cm::after{right:-14px}}
@container (min-width:900px){.nm{font-size:72px}.box{padding:18px 18px 20px}.tree{grid-auto-columns:minmax(0,250px);gap:0 44px}.link .bm::after{right:-23px;width:22px}.into .bm::before{left:-23px;width:22px}.merge .cm::after{right:-23px}}
`;

  class OwcsIntl extends HTMLElement {
    static get observedAttributes() { return ['event']; }
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.open = new Set();
      this.render();
      // live scores (owcs-data.js swapped in place), dark mode, spoiler switch: look again every 2 s, redraw on change
      this.timer = setInterval(() => { if (this.sig() !== this.last) this.render(); }, 2000);
      this.tick = setInterval(() => { const c = this.shadowRoot.querySelector('.cd'); if (c) c.innerHTML = this.countdown(); }, 30000);
    }
    disconnectedCallback() { clearInterval(this.timer); clearInterval(this.tick); }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }

    now() {
      const q = new URLSearchParams(location.search);
      return q.get('date') ? new Date(q.get('date') + 'T' + (q.get('time') || '12:00') + ':00+09:00').getTime() : (window.__owcsNow || Date.now());
    }
    ev() {
      const L = (window.OWCS || {}).intl || [], k = this.getAttribute('event');
      return L.find((e) => e.key === k) || null;
    }
    spoil() { try { return localStorage.getItem('owcs-spoiler') === '1'; } catch (e) { return false; } }
    dark() {
      for (let el = this; el && el.nodeType === 1; el = el.parentElement || (el.getRootNode() && el.getRootNode().host)) {
        const c = getComputedStyle(el).backgroundColor, m = c && c.match(/[\d.]+/g);
        if (m && (m.length < 4 || +m[3] > .5)) return (+m[0] * .2126 + +m[1] * .7152 + +m[2] * .0722) < 110;
      }
      return false;
    }
    sig() {
      const e = this.ev();
      return this.dark() + '|' + this.spoil() + '|' + this.day + '|' + this.sec + '|' + [...this.open].join() + '|' + (e ? e.matches.map((m) => m.a + m.sa + m.b + m.sb + m.live + m.maps.length).join() + e.teams.length : '');
    }
    team(a) { const e = this.ev(); return (e && e.teams.find((t) => t.a === a)) || null; }
    logo(a, dark) {
      const t = this.team(a), u = t && ((dark ? t.logoDark : t.logo) || t.logo);
      return u ? 'style="background-image:url(\'' + esc(u) + '\')"' : 'style="background:var(--i-soft);border-radius:50%"';
    }
    kr(a) { const t = this.team(a); return !!(t && t.kr); }
    today() { return new Date(this.now() + 9 * 3600e3).toISOString().slice(0, 10); }
    countdown() {
      const e = this.ev(), t0 = e && e.start ? new Date(e.start + 'T00:00:00+09:00').getTime() : 0;
      const first = e && e.matches.length ? new Date(e.matches[0].date).getTime() : t0;
      let s = Math.max(0, Math.floor(((first || t0) - this.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const mi = Math.floor(s / 60);
      return [[d, '일'], [h, '시간'], [mi, '분']].map(([v, u]) => '<div><b>' + v + '</b><span>' + u + '</span></div>').join('');
    }

    render() {
      const e = this.ev(), DK = this.dark(), SP = this.spoil();
      this.last = this.sig();
      if (!e) { this.shadowRoot.innerHTML = ''; return; }
      const now = this.now(), today = this.today(), ms = e.matches;
      const days = [...new Set(ms.map((m) => m.day))];
      const live = ms.filter((m) => m.live);
      const started = ms.length && now >= new Date(ms[0].date).getTime();
      const fin = ms.filter((m) => m.part === 'playoffs' && /^결승$/.test(m.round) && m.played).slice(-1)[0];
      const over = e.end && now > new Date(e.end + 'T23:59:59+09:00').getTime();
      if (this.day == null || !days.includes(this.day)) this.day = days.includes(today) ? today : (days.find((d) => d > today) || days[days.length - 1]);

      // event card
      const dates = e.start ? md(e.start) + ' – ' + md(e.end) : '날짜 미정';
      const city = CITY[e.city] || e.city || '';
      let kick = '<span class="kick">국제 대회</span>', extra = '';
      if (live.length) kick = '<span class="kick live">LIVE</span>';
      if (fin && !SP) {
        const w = fin.sa > fin.sb ? fin.a : fin.b, t = this.team(w);
        extra = '<div class="champ"><i class="lg" ' + this.logo(w, false) + '></i>' + esc(t ? t.n : w) + ' 우승</div>';
      } else if (!started && !over) {
        extra = '<div class="cd">' + this.countdown() + '</div>';
      }
      const hero = '<div class="hero">' + kick + '<div class="nm">' + esc(e.ko) + '</div><div class="meta">' + esc(dates) + (city ? ' · ' + esc(city) : '') + ' · 한국 시간</div>' + extra + '</div>';

      // teams: Korean teams first
      const teams = e.teams.slice().sort((x, y) => (y.kr - x.kr) || x.a.localeCompare(y.a));
      const teamsH = '<h4>참가 팀<small>' + (teams.length ? teams.length + '팀' : '') + '</small></h4>' + (teams.length
        ? '<div class="teams">' + teams.map((t) => '<div class="tm' + (t.kr ? ' kr' : '') + '"><i class="lg" ' + this.logo(t.a, DK) + '></i>' + esc(t.a) + (t.kr ? '<em>KR</em>' : '') + '</div>').join('') + '</div>'
        : '<div class="tbd">참가 팀이 정해지면 여기에 나와요.</div>');

      // matches of the picked day
      let dayH = '';
      if (days.length) {
        const tabs = '<div class="days">' + days.map((d) => '<button data-day="' + d + '" class="' + (d === this.day ? 'on' : '') + (d === today ? ' today' : '') + '">' + md(d) + ' (' + dow(d) + ')</button>').join('') + '</div>';
        const list = ms.filter((m) => m.day === this.day);
        dayH = '<h4>경기</h4>' + tabs + '<div class="ms">' + (list.length ? list.map((m) => this.matchCard(m, SP, DK)).join('') : '<div class="empty">이날은 경기가 없어요.</div>') + '</div>';
      }

      // bracket like the home page's (owcs-bracket.js): one section at a time (A조 · B조 · 플레이오프), each lane a tree
      const secs = [];
      ms.forEach((m) => { let x = secs.find((y) => y.n === m.section); if (!x) secs.push(x = { n: m.section, ms: [] }); x.ms.push(m); });
      secs.sort((x, y) => (x.n === '플레이오프') - (y.n === '플레이오프') || x.n.localeCompare(y.n));
      const label = (n) => ({ 'Group A': 'A조', 'Group B': 'B조', 'Group C': 'C조', 'Group D': 'D조' })[n] || n || '대진표';
      if (this.sec == null || !secs.some((x) => x.n === this.sec)) {
        const po = secs.find((x) => x.n === '플레이오프'), poOn = po && po.ms.some((m) => now >= new Date(m.date).getTime() - 86400e3);
        const krSec = secs.find((x) => x.ms.some((m) => m.day === this.day && (this.kr(m.a) || this.kr(m.b))));
        this.sec = (poOn ? po : krSec || secs[0] || {}).n;
      }
      const cur = secs.find((x) => x.n === this.sec);
      const bracket = cur ? '<h4>대진표</h4>' + (secs.length > 1 ? '<div class="pick">' + secs.map((x) => '<button data-sec="' + esc(x.n) + '" class="' + (x.n === this.sec ? 'on' : '') + '">' + esc(label(x.n)) + '</button>').join('') + '</div>' : '') + this.lanes(cur.ms, SP, DK) : '';

      this.shadowRoot.innerHTML = '<style>' + CSS + '</style><div class="w' + (DK ? ' dark' : '') + '">' + hero + teamsH + dayH + bracket + '</div>';
      this.shadowRoot.querySelectorAll('[data-sec]').forEach((b) => b.addEventListener('click', () => { this.sec = b.dataset.sec; this.render(); }));
      this.shadowRoot.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => { this.day = b.dataset.day; this.render(); }));
      this.shadowRoot.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.open; this.open.has(k) ? this.open.delete(k) : this.open.add(k); this.render();
      }));
    }

    matchCard(m, SP, DK) {
      const shown = !SP && (m.played || m.live) && m.a !== 'TBD';
      const top = Math.max(m.sa || 0, m.sb || 0), done = m.played && !m.live;
      const side = (a, s, cls) => '<div class="side ' + cls + (shown && done && s < top ? ' lose' : '') + '"><i class="lg" ' + this.logo(a, DK) + '></i><span>' + esc(a === 'TBD' ? '미정' : a) + '</span></div>';
      const num = (s) => '<span class="' + (shown && done && s === top ? 'win' : shown && done ? 'lo' : '') + '">' + s + '</span>';
      const sc = shown ? num(m.sa) + ' : ' + num(m.sb) : 'vs';
      const kr = this.kr(m.a) || this.kr(m.b), open = this.open.has(m.id);
      // map rows like the home page / results page: map art, winner, score, then each team's ban with the hero portrait
      const MP = window.OWCSMaps || {}, pts = (v) => (v == null ? '' : Number.isInteger(+v) ? String(v) : (+v).toFixed(1) + 'm');
      const det = m.maps.length ? m.maps.map((x) => {
        const w = x.winner ? m[x.winner] : null;
        const sc2 = SP || x.sa == null || !w ? '' : (x.winner === 'b' ? pts(x.sb) + ' : ' + pts(x.sa) : pts(x.sa) + ' : ' + pts(x.sb));
        const bans = (x.bans || []).map((b) => '<span class="ban"><i style="background:' + (MP.heroBg ? MP.heroBg(b.h) : '#24242B') + '"></i>' + esc(b.t === 'a' ? m.a : m.b) + ' · ' + esc(MP.heroName ? MP.heroName(b.h).split(' · ')[0] : b.h) + '</span>').join('');
        return '<div class="mp" style="background:' + (MP.mapBg ? MP.mapBg(x.map, true) : '#15151B') + '"><span class="no">' + String(x.no).padStart(2, '0') + '</span><span class="nmp"><b>' + esc(x.map) + '</b><small>' + esc(x.mode) + '</small></span>'
          + '<span class="wn">' + (SP || !w ? '' : '<i class="lg" ' + this.logo(w, true) + '></i>' + esc(w)) + '</span><span class="ms2">' + esc(sc2) + '</span>'
          + (bans ? '<span class="bans">' + bans + '</span>' : '') + '</div>';
      }).join('') : '<div class="empty">세트 정보가 아직 없어요.</div>';
      return '<div class="m' + (kr ? ' kr' : '') + (m.live ? ' live' : '') + (open ? ' open' : '') + '"><button class="mrow" data-open="' + m.id + '">'
        + '<span class="mt">' + (m.live ? '<em>LIVE</em>' : '<b>' + esc(m.time) + '</b>') + esc(m.round) + '</span>'
        + side(m.a, m.sa, 'a') + '<span class="sc">' + sc + '<small>BO' + m.bo + '</small></span>' + side(m.b, m.sb, 'b') + '</button><div class="det">' + det + '</div></div>';
    }

    // a section split into lanes: 승자조 (GSL 개막전 · 승자전), 패자조 (패자전 · 최종전); 결승 · 3위 결정전 as cards under them.
    // Single elimination (8강 → 4강 → 결승) is one tree.
    lanes(list, SP, DK) {
      const idx = (m) => +String(m.id).replace(/^.*-[gp]/, '');
      const cols = [];
      list.slice().sort((x, y) => idx(x) - idx(y)).forEach((m) => { let c = cols.find((x) => x.r === m.round); if (!c) cols.push(c = { r: m.round, ms: [] }); c.ms.push(m); });
      const lane = (re) => cols.filter((c) => re.test(c.r));
      const low = lane(/^(패자조|패자전|최종전)/), fin = lane(/^(결승|3위)/);
      const up = cols.filter((c) => !low.includes(c) && !fin.includes(c));
      const tree = (cs) => '<div class="tree">' + cs.map((c, i) => {
        const nx = cs[i + 1], cls = ['col', nx ? 'link' : '', i ? 'into' : '', nx && nx.ms.length < c.ms.length ? 'merge' : ''].join(' ');
        return '<div class="' + cls + '"><div class="ct">' + esc(c.r) + '</div><div class="cm">' + c.ms.map((m) => this.box(m, SP, DK, cs.length > 2)).join('') + '</div></div>';
      }).join('') + '</div>';
      const block = (t, cs) => cs.length ? '<div class="box">' + (t ? '<div class="bxh">' + t + '</div>' : '') + tree(cs) + '</div>' : '';
      const cards = (cs) => cs.length ? '<div class="extra">' + cs.map((c) => c.ms.map((m) => '<div><div class="ct" style="text-align:left">' + esc(c.r) + '</div>' + this.box(m, SP, DK, false) + '</div>').join('')).join('') + '</div>' : '';
      if (!low.length) {
        const gf = fin.filter((c) => /^결승/.test(c.r));
        return block('', up.concat(gf)) + cards(fin.filter((c) => !gf.includes(c)));
      }
      return block('승자조', up) + block('패자조', low) + cards(fin);
    }

    box(m, SP, DK, short) {
      const shown = !SP && (m.played || m.live) && m.a !== 'TBD';
      const top = Math.max(m.sa || 0, m.sb || 0), done = m.played && !m.live;
      const row = (a, s) => '<div class="r' + (a === 'TBD' ? ' tbd' : shown && done && s < top ? ' lose' : '') + '"><i ' + this.logo(a, DK) + '></i><b>' + esc(a === 'TBD' ? '미정' : a) + '</b><s>' + (shown ? s : '') + '</s></div>';
      const kr = this.kr(m.a) || this.kr(m.b);
      const when = short ? md(m.day) : md(m.day) + ' ' + m.time;
      return '<div class="bm' + (kr ? ' kr' : '') + (m.live ? ' live' : '') + '"><div class="mh">' + (m.live ? '<em>LIVE</em>' : '<span>' + esc(when) + '</span>') + '<span>BO' + m.bo + '</span></div>' + row(m.a, m.sa) + row(m.b, m.sb) + '</div>';
    }
  }
  customElements.define('owcs-intl', OwcsIntl);
})();
