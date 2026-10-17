// <owcs-bracket>: the playoff bracket of a stage as a tree (seeding deciders, last chance qualifier, playoff rounds),
// the current stage first with the earlier stages one tap away. Used on the home page (every width) and on the
// results page (phones and tablets). Data: owcs-data.js -> OWCS.bracket (this stage) + OWCS.pastStages (newest first).
// It draws itself in a shadow root, so the page's re-renders never touch it; spoiler="1" hides scores.
(function () {
  if (!window.customElements || customElements.get('owcs-bracket')) return;
  const KEY = 'owcs-bracket-stage';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const CSS = `
:host{display:block;container-type:inline-size;font-family:inherit;color:var(--b-ink)}
.w{--b-ink:#0B0B0F;--b-mute:#6B6B72;--b-card:#FFFFFF;--b-line:#E3E3DE;--b-soft:#F3F3EF;--b-wire:#BDBDB6;--b-ac:var(--ac,#7D39EB);--b-ac2:var(--ac2,#C6FF33);color:var(--b-ink)}
.w.dark{--b-ink:#F2F2F5;--b-mute:#9A9AA3;--b-card:#1C1C22;--b-line:#2E2E36;--b-soft:#16161B;--b-wire:#4A4A55}
.pick{display:flex;gap:6px;overflow-x:auto;padding:2px 0 4px;margin-bottom:14px;scrollbar-width:none}
.pick::-webkit-scrollbar{display:none}
.pick button{flex:none;height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--b-line);background:var(--b-card);color:var(--b-ink);font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
.pick button.on{background:var(--b-ink);color:var(--b-card);border-color:var(--b-ink)}
.top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px 16px;margin-bottom:14px;padding:16px 16px 16px 18px;border-radius:18px;background:var(--b-ink);color:var(--b-card);position:relative;overflow:hidden}
.top::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--b-ac2)}
.tag{display:inline-block;height:22px;line-height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:800;background:var(--b-ac2);color:#0B0B0F}
.tag.old{background:transparent;color:var(--b-card);border:1px solid currentColor;opacity:.7;line-height:20px}
.ttl{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-weight:800;font-size:34px;line-height:.95;margin:8px 0 4px;letter-spacing:.005em;word-break:keep-all}
.sub{font-size:15px;font-weight:700;opacity:.8}
.note{font-size:13px;color:var(--b-mute);margin:-4px 2px 14px}
.box.main{border:2px solid var(--b-ink)}
.box.main .h b{font-size:18px}
.box.pre{background:var(--b-soft);border-color:transparent}
.pre-l{display:flex;align-items:center;gap:10px;margin:22px 2px 0;font-size:12.5px;font-weight:800;color:var(--b-mute)}
.pre-l::after{content:'';flex:1;border-top:1px solid var(--b-line)}
.champ{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px 0 8px;border-radius:999px;background:var(--b-card);color:var(--b-ink);font-size:14px;font-weight:800}
.champ small{font-size:11px;font-weight:700;color:var(--b-mute)}
.champ i{width:26px;height:26px}
.box{background:var(--b-card);border:1px solid var(--b-line);border-radius:18px;padding:14px 12px 16px}
.h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 2px 10px}
.h b{font-size:15px;font-weight:800}
.h span{font-size:11.5px;color:var(--b-mute)}
.tree{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:0 16px}
.col{display:flex;flex-direction:column;min-width:0}
.ct{font-size:11.5px;font-weight:800;color:var(--b-mute);text-align:center;margin-bottom:6px}
.cm{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:10px;position:relative}
.m{position:relative;background:var(--b-card);border:1px solid var(--b-line);border-radius:10px;min-width:0}
.m.live{border:2px solid #D92D20}
.m.next{border:2px solid var(--b-ac)}
.mh{display:flex;justify-content:space-between;gap:4px;padding:3px 7px;font-size:10.5px;color:var(--b-mute);border-bottom:1px solid var(--b-line);white-space:nowrap;overflow:hidden}
.mh em{font-style:normal;font-weight:800;color:#D92D20}
.r{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:5px;height:27px;padding:0 7px}
.r+.r{border-top:1px solid var(--b-line)}
.r i,.champ i,.sd i{display:block;background:center/contain no-repeat}
.r i{width:16px;height:16px;border-radius:3px}
.r i.none{background:var(--b-soft)}
.r b{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r s{text-decoration:none;font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:17px;font-weight:800;min-width:10px;text-align:right}
.r.lose b,.r.lose s{color:var(--b-mute);font-weight:500}
.r.lose i{opacity:.45}
.r.tbd b{color:var(--b-mute);font-weight:500}
.link .m::after{content:'';position:absolute;top:50%;right:-9px;width:8px;border-top:1.5px solid var(--b-wire)}
.into .m::before{content:'';position:absolute;top:50%;left:-9px;width:8px;border-top:1.5px solid var(--b-wire)}
.merge .cm::after{content:'';position:absolute;right:-9px;top:25%;bottom:25%;border-right:1.5px solid var(--b-wire)}
.extra{margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.extra .t{font-size:11.5px;font-weight:800;color:var(--b-mute);margin:0 2px 4px}
.grid{display:grid;gap:12px;margin-top:12px}
.rr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 6px}
.sd{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:10px}
.sd div{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px;border-radius:10px;background:var(--b-soft);font-size:11px;color:var(--b-mute);min-width:0}
.sd div b{font-size:13px;color:var(--b-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.sd div u{text-decoration:none;font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:18px;font-weight:800;color:var(--b-ink);line-height:1}
.sd i{width:22px;height:22px}
.fin{font-size:11.5px;color:var(--b-mute);margin:10px 2px 0;line-height:1.5}
@container (min-width:640px){.r{height:32px;grid-template-columns:20px minmax(0,1fr) auto;gap:7px;padding:0 10px}.r i{width:20px;height:20px}.r b{font-size:14.5px}.r s{font-size:20px}.mh{font-size:11.5px;padding:4px 10px}.tree{gap:0 26px}.link .m::after{right:-14px;width:13px}.into .m::before{left:-14px;width:13px}.merge .cm::after{right:-14px}}
@container (min-width:640px){.ttl{font-size:46px}.top{padding:20px 22px 20px 26px}}
@container (min-width:900px){.grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}.box{padding:18px 18px 20px}.tree{grid-auto-columns:minmax(0,250px);gap:0 44px}.link .m::after{right:-23px;width:22px}.into .m::before{left:-23px;width:22px}.merge .cm::after{right:-23px}.extra{grid-template-columns:repeat(auto-fill,minmax(0,250px))}}
`;

  const team = (a) => ((window.OWCS || {}).teams || []).find((t) => t.a === a);

  class OwcsBracket extends HTMLElement {
    static get observedAttributes() { return ['spoiler']; }
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.render();
      // dark mode and live scores can change under it: look again every couple of seconds (cheap: compares a string)
      this.timer = setInterval(() => { if (this.sig() !== this.last) this.render(); }, 2000);
    }
    disconnectedCallback() { clearInterval(this.timer); }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }

    stages() {
      const D = window.OWCS || {};
      const past = D.pastStages && D.pastStages.length ? D.pastStages : (D.lastStage && D.lastStage.columns && D.lastStage.columns.length ? [D.lastStage] : []);
      return [D.bracket, ...past].filter((s) => s && s.columns && s.columns.length);
    }
    dark() {
      // the page's own background behind the element: dark mode on any of the pages, whichever way it was switched on
      for (let el = this; el && el.nodeType === 1; el = el.parentElement || (el.getRootNode() && el.getRootNode().host)) {
        const c = getComputedStyle(el).backgroundColor, m = c && c.match(/[\d.]+/g);
        if (m && (m.length < 4 || +m[3] > .5)) return (+m[0] * .2126 + +m[1] * .7152 + +m[2] * .0722) < 110;
      }
      return false;
    }
    sig() {
      const byId = Object.fromEntries(((window.OWCS || {}).matches || []).map((m) => [m.id, m]));
      const s = this.stages()[0];
      return this.dark() + '|' + this.getAttribute('spoiler') + '|' + this.selKey() + '|' + (s ? s.columns.map((c) => c.matches.map((x) => { const m = byId[x.id]; return m ? m.a + m.sa + m.b + m.sb + m.live : ''; }).join()).join() : '');
    }
    selKey() {
      const all = this.stages();
      let k = this.sel;
      if (k == null) { try { k = sessionStorage.getItem(KEY); } catch (e) { k = null; } }
      return all.some((s) => s.label === k) ? k : (all[0] || {}).label;
    }

    render() {
      const all = this.stages();
      const dark = this.dark(), SP = this.getAttribute('spoiler') === '1' || this.getAttribute('spoiler') === 'true';
      this.last = this.sig();
      if (!all.length) { this.shadowRoot.innerHTML = ''; return; }
      const key = this.selKey(), S = all.find((s) => s.label === key) || all[0], isCur = S === all[0] && !(S.champion);
      const byId = Object.fromEntries(((window.OWCS || {}).matches || []).map((m) => [m.id, m]));
      const logo = (a) => { const t = team(a); const u = t && (dark ? (t.logoDark || t.logo) : t.logo); return u ? 'style="background-image:url(\'' + esc(u) + '\')"' : 'class="none"'; };
      const name = (r) => { const t = team(r.a); return r.a === 'TBD' ? '미정' : t ? t.a : (r.n || r.a); };

      const chip = (x, opt) => {
        const m = byId[x.id];
        let rows = x.rows.map((r) => ({ ...r }));
        if (m) { rows[0].a = m.a; rows[1].a = m.b; if (m.played || m.live) { rows[0].s = m.sa; rows[1].s = m.sb; } }
        const live = m ? m.live : x.live, played = m ? m.played : x.played;
        const shown = !SP && (played || live) && rows[0].a !== 'TBD';
        const top = Math.max(+rows[0].s || 0, +rows[1].s || 0);
        const day = String(x.when || '').split(' ').slice(0, opt && opt.short ? 1 : 2).join(' ');
        const head = (opt && opt.round ? '<span>' + esc(x.round) + '</span>' : '') + (live ? '<em>LIVE</em>' : '<span>' + esc(day) + '</span>');
        return '<div class="m' + (live ? ' live' : '') + '"><div class="mh">' + head + '</div>' + rows.map((r) => {
          const cls = r.a === 'TBD' ? 'tbd' : shown && played && +r.s < top ? 'lose' : '';
          return '<div class="r ' + cls + '"><i ' + logo(r.a) + '></i><b>' + esc(name(r)) + '</b><s>' + (shown ? esc(r.s) : '') + '</s></div>';
        }).join('') + '</div>';
      };

      // a tree from columns of matches: a column feeds the next one straight (same count) or in pairs (half as many)
      const tree = (cols) => '<div class="tree">' + cols.map((c, i) => {
        const nx = cols[i + 1], cls = ['col', nx ? 'link' : '', i ? 'into' : '', nx && nx.ms.length < c.ms.length ? 'merge' : ''].join(' ');
        return '<div class="' + cls + '"><div class="ct">' + esc(c.title) + '</div><div class="cm">' + c.ms.map((x) => chip(x, c.opt || { short: cols.length > 2 })).join('') + '</div></div>';
      }).join('') + '</div>';

      const po = S.columns.filter((c) => c.key.startsWith('po-'));
      const third = [], extra = [], poCols = [];
      po.forEach((c) => {
        if (/all-star/i.test(c.key)) { extra.push(...c.matches.map((x) => ({ ...x, round: c.title }))); return; }
        const ms = c.matches.filter((x) => !/3위/.test(x.round));
        third.push(...c.matches.filter((x) => /3위/.test(x.round)));
        if (ms.length) poCols.push({ title: c.title.replace(/ · 3위전$/, ''), ms });
      });
      const seed = S.columns.find((c) => c.key === 'seed'), lcq = S.columns.find((c) => c.key === 'lcq');

      let lcqHtml = '';
      if (lcq) {
        const up = lcq.matches.filter((x) => /승자조|패자조 준결승/.test(x.round)), fin = lcq.matches.filter((x) => /패자조 결승/.test(x.round));
        lcqHtml = '<div class="box pre"><div class="h"><b>라스트 찬스 예선</b><span>승자조 결승 · 패자조 결승 승리 팀이 8강</span></div>'
          + (up.length === 2 && fin.length === 1
            ? tree([{ title: '1라운드', ms: up, opt: { round: true, short: true } }, { title: '패자조 결승', ms: fin }])
            : '<div class="rr">' + lcq.matches.map((x) => chip(x, { round: true })).join('') + '</div>')
          + '</div>';   // first round: upper final + lower semifinal, named on the card
      }
      let seedHtml = '';
      if (seed) {
        const sd = !SP && S.seeding && S.seeding.length ? '<div class="sd">' + S.seeding.map((t, i) => '<div><u>' + (i + 1) + '</u><i ' + logo(t.a) + '></i><b>' + esc(t.a) + '</b>' + esc(t.sw + '승 ' + t.sl + '패') + '</div>').join('') + '</div>' : '';
        seedHtml = '<div class="box pre"><div class="h"><b>시드 결정전</b><span>정규 리그 1–4위 · 풀리그</span></div>' + sd + '<div class="rr">' + seed.matches.map((x) => chip(x, { short: true })).join('') + '</div></div>';
      }
      const poHtml = poCols.length ? '<div class="box main"><div class="h"><b>플레이오프 본선</b><span>' + esc(poCols.map((c) => c.title).join(' → ')) + '</span></div>' + tree(poCols)
        + (third.length || extra.length ? '<div class="extra">' + [...third.map((x) => '<div><div class="t">' + esc(x.round) + '</div>' + chip(x) + '</div>'), ...extra.map((x) => '<div><div class="t">' + esc(x.round) + '</div>' + chip(x) + '</div>')].join('') + '</div>' : '')
        + '</div>' : '';

      const champ = !SP && S.champion ? (() => { const t = ((window.OWCS || {}).teams || []).find((t) => t.n === S.champion || t.a === S.champion); return '<span class="champ"><i ' + (t ? logo(t.a) : 'class="none"') + '></i><small>우승</small>' + esc(S.champion) + '</span>'; })() : '';
      const pick = all.length > 1 ? '<div class="pick">' + all.map((s, i) => '<button data-k="' + esc(s.label) + '" class="' + (s === S ? 'on' : '') + '">' + esc(s.label.replace(/스테이지 /, 'S')) + (i === 0 ? ' · 이번 시즌' : '') + '</button>').join('') + '</div>' : '';
      // which tournament this is, big: a stage name never gets lost among the cards below
      const dates = S.start ? S.start.slice(5).replace('-', '.') + ' – ' + (S.end || '').slice(5).replace('-', '.') : '';
      const head = '<div class="top"><div><span class="tag' + (S === all[0] ? '' : ' old') + '">' + (S === all[0] ? '이번 시즌' : '지난 시즌') + '</span>'
        + '<div class="ttl">' + esc(S.label) + '</div><div class="sub">플레이오프' + (dates ? ' · ' + esc(dates) : '') + '</div></div>' + champ + '</div>';
      const note = isCur ? '대진은 정규 리그가 끝나면 채워져요' : '';

      this.shadowRoot.innerHTML = '<style>' + CSS + '</style><div class="w' + (dark ? ' dark' : '') + '">' + pick
        + head + (note ? '<div class="note">' + note + '</div>' : '')
        + poHtml + (seedHtml || lcqHtml ? '<div class="pre-l">본선 진출전</div><div class="grid">' + seedHtml + lcqHtml + '</div>' : '') + '</div>';
      this.shadowRoot.querySelectorAll('.pick button').forEach((b) => b.addEventListener('click', () => {
        this.sel = b.getAttribute('data-k');
        try { sessionStorage.setItem(KEY, this.sel); } catch (e) {}
        this.render();
      }));
      const on = this.shadowRoot.querySelector('.pick .on');
      if (on && on.scrollIntoView && on.offsetLeft > on.parentElement.clientWidth) on.parentElement.scrollLeft = on.offsetLeft - 8;
    }
  }
  customElements.define('owcs-bracket', OwcsBracket);
})();
