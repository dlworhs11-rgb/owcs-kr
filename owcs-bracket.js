// <owcs-bracket>: the playoff bracket of a stage as a tree (seeding deciders, last chance qualifier, playoff rounds),
// the current stage first with the earlier stages one tap away. Used on the home page (every width) and on the
// results page (phones and tablets). Data: owcs-data.js -> OWCS.bracket (this stage) + OWCS.pastStages (newest first).
// It draws itself in a shadow root, so the page's re-renders never touch it; spoiler="1" hides scores.
// part="po" draws only the playoffs (champion, rounds), part="road" only the seeding deciders and LCQ, one under the
// other (the schedule page's tabs); without it, everything.
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
.tree{--hg:8px;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:0 calc(2 * var(--hg))}
.col{display:flex;flex-direction:column;min-width:0}
.ct{font-size:11.5px;font-weight:800;color:var(--b-mute);text-align:center;margin-bottom:6px}
/* equal rows in every column, so match centers line up across columns: a pair's midpoint is the next match's center */
.cm{flex:1;display:grid;grid-auto-rows:1fr}
.c{position:relative;display:flex;flex-direction:column;justify-content:center;padding:5px 0}
.m{position:relative;background:var(--b-card);border:1px solid var(--b-line);border-radius:10px;min-width:0}
.m.live{border:2px solid #D92D20}
.m.next{border:2px solid var(--b-ink)}
.mh em.nx{position:absolute;top:-8px;right:8px;z-index:1;height:15px;line-height:15px;padding:0 6px;border-radius:999px;background:var(--b-ac2);color:#0B0B0F;font-size:10px}
.mh{display:flex;justify-content:space-between;gap:4px;padding:3px 7px;font-size:11px;color:var(--b-mute);border-bottom:1px solid var(--b-line);white-space:nowrap;overflow:hidden}
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
/* wires: out-stub and in-stub are each half the column gap and meet at its middle, where a pair's vertical runs */
.link .m::after{content:'';position:absolute;top:calc(50% - .75px);right:calc(-1px - var(--hg));width:calc(var(--hg) + 1px);border-top:1.5px solid var(--b-wire)}
.into .m::before{content:'';position:absolute;top:calc(50% - .75px);left:calc(-1px - var(--hg));width:calc(var(--hg) + 1px);border-top:1.5px solid var(--b-wire)}
.merge .c::after{content:'';position:absolute;right:calc(-.75px - var(--hg));border-right:1.5px solid var(--b-wire)}
.merge .c:nth-child(odd)::after{top:calc(50% - .75px);bottom:0}
.merge .c:nth-child(even)::after{top:0;bottom:calc(50% - .75px)}
.extra{margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.extra .t{font-size:11.5px;font-weight:800;color:var(--b-mute);margin:0 2px 4px}
.grid{display:grid;gap:12px;margin-top:12px}
.pick+.grid{margin-top:0}
.rr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 6px}
.sd{margin:0 2px 6px}
.sd .sh,.sd .sr{display:grid;grid-template-columns:4px 26px 24px minmax(0,1fr) 64px 56px;align-items:center;gap:10px}
.sd .sh{height:26px;font-size:11.5px;font-weight:700;color:var(--b-mute);border-bottom:1.5px solid var(--b-ink)}
.sd .sh span:nth-child(1){grid-column:1/4}
.sd .sr{height:46px;border-top:1px solid var(--b-line)}
.sd .sh+.sr,.sd .cut+.sr{border-top:0}
.sd .sr em{display:block;width:4px;height:24px;border-radius:2px}
.sd .sr u{text-decoration:none;font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:26px;font-weight:800;line-height:1}
.sd .sr i{width:24px;height:24px}
.sd .sr b{min-width:0;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd .sr b small{margin-left:6px;font-size:11.5px;font-weight:600;color:var(--b-mute)}
.sd .sr span{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:19px;font-weight:700}
.sd .sr span+span{font-size:16px;color:var(--b-mute)}
/* the 4강 직행 line: the same green line and tag as the home standings' 플레이오프 진출선 */
.sd .cut{display:flex;align-items:center;gap:10px;margin:-1px 0}
.sd .cut::before{content:'';flex:1;height:3px;background:#8DCB3E}
.sd .cut span{font-size:12px;font-weight:700;line-height:1.2;background:#8DCB3E;color:#0B0B0F;padding:3px 8px;border-radius:6px}
.sd .pend{margin:6px 0 0;font-size:11.5px;color:var(--b-mute)}
.lane{display:flex;flex-direction:column;gap:12px}
.lh{display:flex;align-items:center;gap:10px;margin:0 2px}
.lh u{flex:none;text-decoration:none;height:30px;line-height:30px;padding:0 11px;border-radius:999px;background:var(--b-ink);color:var(--b-card);font-family:var(--disp,'Barlow Condensed'),sans-serif;font-size:17px;font-weight:800}
.lh b{font-size:16px;font-weight:800}
.say{font-size:15px;font-weight:700;line-height:1.45;margin:0 2px;word-break:keep-all}
.say small{display:block;font-size:12.5px;font-weight:500;color:var(--b-mute);margin-top:2px}
/* what the lane decides, said in one plain line (no chips: the cut line in the table carries the 1·2위 mark) */
.out{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:0 2px;font-size:13px;font-weight:800}
.out i{font-style:normal;color:var(--b-wire)}
.out span.ko{color:var(--b-mute)}
.st{font-size:11.5px;font-weight:800;color:var(--b-mute);margin:2px 2px -4px}
.cw{position:relative;margin-bottom:14px;border-radius:18px;overflow:hidden;background:#0B0B0F;color:#fff}
.cw img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}
.cw.nop img{display:none}
.cw .cb{position:relative;display:flex;align-items:center;gap:16px;padding:22px 20px}
.cw:not(.nop) .cb{min-height:190px;background:linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.4))}
.cw .cb i{flex:none;display:block;width:64px;height:64px;background:center/contain no-repeat}
.cw .ck{display:inline-block;height:24px;line-height:24px;padding:0 10px;border-radius:999px;background:var(--b-ac2);color:#0B0B0F;font-size:12px;font-weight:800;letter-spacing:.04em}
.cw .cn{font-family:var(--disp,'Barlow Condensed'),sans-serif;font-weight:800;font-size:38px;line-height:1;margin:6px 0 4px;word-break:keep-all}
.cw .cs{font-size:14px;font-weight:700;opacity:.85}
.wt{display:inline-block;margin-left:6px;height:18px;line-height:18px;padding:0 6px;border-radius:999px;background:var(--b-ac2);color:#0B0B0F;font-size:11px;font-weight:800;vertical-align:1px}
@container (min-width:640px){.cw .cb{padding:28px 30px}.cw:not(.nop) .cb{min-height:240px}.cw .cb i{width:88px;height:88px}.cw .cn{font-size:60px}.cw .cs{font-size:16px}}
.fin{font-size:11.5px;color:var(--b-mute);margin:10px 2px 0;line-height:1.5}
@container (min-width:640px){.r{height:32px;grid-template-columns:20px minmax(0,1fr) auto;gap:7px;padding:0 10px}.r i{width:20px;height:20px}.r b{font-size:14.5px}.r s{font-size:20px}.mh{font-size:11.5px;padding:4px 10px}.tree{--hg:13px}}
@container (min-width:900px){.cw img{position:static;height:auto;aspect-ratio:16/9;max-height:560px}.cw:not(.nop) .cb{position:absolute;left:0;right:0;bottom:0;min-height:0;padding:90px 30px 28px;background:linear-gradient(transparent,rgba(0,0,0,.82))}}
@container (min-width:640px){.ttl{font-size:46px}.top{padding:20px 22px 20px 26px}}
@container (min-width:900px){.grid:not(.one){grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}.box{padding:18px 18px 20px}.tree{grid-auto-columns:minmax(0,250px);--hg:22px}.extra{grid-template-columns:repeat(auto-fill,minmax(0,250px))}}
`;

  const team = (a) => ((window.OWCS || {}).teams || []).find((t) => t.a === a);

  class OwcsBracket extends HTMLElement {
    static get observedAttributes() { return ['spoiler', 'part']; }
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
      return this.dark() + '|' + this.getAttribute('spoiler') + '|' + this.getAttribute('part') + '|' + this.selKey() + '|' + (s ? s.columns.map((c) => c.matches.map((x) => { const m = byId[x.id]; return m ? m.a + m.sa + m.b + m.sb + m.live : ''; }).join()).join() : '');
    }
    selKey() {
      const all = this.stages();
      let k = this.sel;
      // the schedule page's tabs (part=) always open on this stage: a past stage picked on the home or results page stays there
      if (k == null && !this.getAttribute('part')) { try { k = sessionStorage.getItem(KEY); } catch (e) { k = null; } }
      // before a new regular season starts the finished stage comes first (the new stage's bracket is still empty)
      const D = window.OWCS || {}, q = new URLSearchParams(location.search);
      const now = q.get('date') ? new Date(q.get('date') + 'T12:00:00+09:00').getTime() : Date.now();
      const early = D.stageRange && now < new Date(D.stageRange[0] + 'T00:00:00+09:00').getTime();
      return all.some((s) => s.label === k) ? k : ((early && all[1]) || all[0] || {}).label;
    }

    render() {
      const all = this.stages();
      const dark = this.dark(), SP = this.getAttribute('spoiler') === '1' || this.getAttribute('spoiler') === 'true';
      this.last = this.sig();
      if (!all.length) { this.shadowRoot.innerHTML = ''; return; }
      const key = this.selKey(), S = all.find((s) => s.label === key) || all[0], isCur = S === all[0] && !(S.champion);
      const byId = Object.fromEntries(((window.OWCS || {}).matches || []).map((m) => [m.id, m]));
      const logo = (a) => { const t = team(a); const u = t && (dark ? (t.logoDark || t.logo) : t.logo); return u ? 'style="background-image:url(\'' + esc(u) + '\')"' : 'class="none"'; };
      const name = (r) => { const t = team(r.a); return r.a === 'TBD' ? (r.ph || '미정') : t ? t.a : (r.n || r.a); };

      // next postseason matches (all that start at the same time), marked once the regular season is over
      const OW = window.OWCS || {}, q = new URLSearchParams(location.search);
      const now = q.get('date') ? new Date(q.get('date') + 'T' + (q.get('time') || '12:00') + ':00+09:00').getTime() : Date.now();
      const poOn = OW.stageRange && OW.stageRange[1] && now > new Date(OW.stageRange[1] + 'T23:59:59+09:00').getTime();
      const upNext = (OW.matches || []).filter((m) => m.phase && m.phase !== 'rs' && !(m.played && !m.live) && new Date(m.date).getTime() + 3 * 3600e3 > now);
      const nextAt = poOn && upNext.length ? Math.min.apply(null, upNext.map((m) => new Date(m.date).getTime())) : NaN;
      const nextIds = upNext.filter((m) => new Date(m.date).getTime() === nextAt).map((m) => m.id);
      const chip = (x, opt) => {
        const m = byId[x.id];
        let rows = x.rows.map((r, i) => ({ ...r, ph: opt && opt.ph ? opt.ph[i] : '' }));
        if (m) { rows[0].a = m.a; rows[1].a = m.b; if (m.played || m.live) { rows[0].s = m.sa; rows[1].s = m.sb; } }
        const live = m ? m.live : x.live, played = m ? m.played : x.played;
        const nx = !live && isCur && nextIds.includes(x.id);
        const shown = !SP && (played || live) && rows[0].a !== 'TBD';
        const top = Math.max(+rows[0].s || 0, +rows[1].s || 0);
        const day = String(x.when || '').split(' ').slice(0, opt && opt.short ? 1 : 2).join(' ');
        const bo = (m && m.bo) || x.bo, boTxt = bo ? 'FT' + (Math.floor(bo / 2) + 1) : '';   // Overwatch counts first-to (draw maps don't count): BO5 = FT3, BO7 = FT4
        const head = (opt && opt.round ? '<span>' + esc(opt.title || x.round) + '</span>' : '')
          + (live ? '<em>LIVE</em>' + (boTxt ? '<span>' + boTxt + '</span>' : '') : '<span>' + esc(day) + (boTxt ? ' · ' + boTxt : '') + '</span>' + (nx ? '<em class="nx">다음 경기</em>' : ''));
        return '<div class="m' + (live ? ' live' : nx ? ' next' : '') + '"><div class="mh">' + head + '</div>' + rows.map((r) => {
          const cls = r.a === 'TBD' ? 'tbd' : shown && played && +r.s < top ? 'lose' : '';
          const win = /^결승$/.test(x.round) && shown && played && +r.s === top ? '<span class="wt">우승</span>' : '';
          return '<div class="r ' + cls + '"><i ' + logo(r.a) + '></i><b>' + esc(name(r)) + win + '</b><s>' + (shown ? esc(r.s) : '') + '</s></div>';
        }).join('') + '</div>';
      };

      // a tree from columns of matches: a column feeds the next one straight (same count) or in pairs (half as many)
      const tree = (cols) => '<div class="tree">' + cols.map((c, i) => {
        const nx = cols[i + 1], cls = ['col', nx ? 'link' : '', i ? 'into' : '', nx && nx.ms.length < c.ms.length ? 'merge' : ''].join(' ');
        return '<div class="' + cls + '"><div class="ct">' + esc(c.title) + '</div><div class="cm">' + c.ms.map((x, k) => '<div class="c">' + chip(x, (c.opts && c.opts[k]) || c.opt || { short: cols.length > 2 }) + '</div>').join('') + '</div></div>';
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

      // the two ways into the playoffs, said in plain words: who plays, what winning gets, then the matches
      const lane = (rank, title, say, small, outs) => '<div class="lh"><u>' + rank + '</u><b>' + title + '</b></div>'
        + '<div class="say">' + say + '<small>' + small + '</small></div>'
        + '<div class="out">' + outs.map((o) => '<span class="' + o[0] + '">' + o[1] + '</span>').join('<i>·</i>') + '</div>';
      let lcqHtml = '';
      if (lcq) {
        const up = lcq.matches.find((x) => /승자조 결승/.test(x.round)), semi = lcq.matches.find((x) => /패자조 준결승/.test(x.round)),
          fin = lcq.matches.find((x) => /패자조 결승/.test(x.round));
        lcqHtml = '<div class="box pre lane">' + lane('5–8위', '라스트 찬스', '4팀 중 2팀만 플레이오프에 올라가요', '5·6위는 두 번, 7·8위는 한 번 지면 탈락 · 올라가면 6강', [['', '2팀 6강 진출'], ['ko', '2팀 탈락']])
          + (up && semi && fin
            ? tree([{ title: '첫 경기', ms: [up, semi], opts: [{ round: true, short: true, title: '이기면 바로 진출', ph: ['5위', '6위'] }, { round: true, short: true, title: '지면 탈락', ph: ['7위', '8위'] }] },
                    { title: '마지막 한 자리', ms: [fin], opts: [{ round: true, short: true, title: '이기면 진출', ph: ['5·6위전 패자', '7·8위전 승자'] }] }])
            : '<div class="rr">' + lcq.matches.map((x) => chip(x, { round: true })).join('') + '</div>')
          + '</div>';
      }
      let seedHtml = '';
      if (seed) {
        // the four teams as rows, like the home standings: team colour bar, rank, logo, name, decider record, total;
        // a line under 2위 marks 4강 직행. Before the deciders it shows the regular-season order (this stage only)
        const DD = window.OWCS || {};
        const pre = !(S.seeding && S.seeding.length) && S === all[0] && (DD.standings || []).length >= 4;
        const rsOn = (DD.matches || []).some((m) => m.phase === 'rs' && !m.played);
        const sTeams = S.seeding && S.seeding.length ? S.seeding : pre ? DD.standings.slice(0, 4).map((t) => ({ a: t.a, w: t.w, l: t.l })) : [];
        const sd = !SP && sTeams.length ? '<div class="sd"><div class="sh"><span>순위</span><span>팀</span><span>결정전</span><span>합산</span></div>'
          + sTeams.map((t, i) => { const tm = team(t.a) || {};
            return '<div class="sr"><em style="background:' + esc(tm.color || 'var(--b-wire)') + '"></em><u>' + (i + 1) + '</u><i ' + logo(t.a) + '></i><b>' + esc(t.a) + (tm.n && tm.n !== t.a ? '<small>' + esc(tm.n) + '</small>' : '') + '</b>'
              + '<span>' + (t.sw != null ? esc(t.sw + '-' + t.sl) : '–') + '</span><span>' + esc(t.w + '-' + t.l) + '</span></div>' + (i === 1 ? '<div class="cut"><span>4강 직행</span></div>' : ''); }).join('')
          + (pre ? '<div class="pend">' + (rsOn ? '정규 리그 진행 중 · 지금 순위라 바뀔 수 있어요' : '결정전 전 · 정규 리그 최종 순위') + '</div>' : '') + '</div>' : '';
        // the say line is the format, not a claim about the four shown: during the regular season 5th can still climb in
        seedHtml = '<div class="box pre lane">' + lane('1–4위', '시드 결정전', '1–4위는 모두 플레이오프 진출 · 자리만 정해요', '서로 한 번씩 더 붙고, 정규 리그 승패도 합쳐서 순위 계산', [['', '1·2위 4강 직행'], ['', '3·4위 6강부터']])
          + sd + '<div class="st">경기</div><div class="rr">' + seed.matches.map((x) => chip(x, { short: true })).join('') + '</div></div>';
      }
      const poHtml = poCols.length ? '<div class="box main"><div class="h"><b>플레이오프 본선</b><span>' + esc(poCols.map((c) => c.title).join(' → ')) + '</span></div>' + tree(poCols)
        + (third.length || extra.length ? '<div class="extra">' + [...third.map((x) => '<div><div class="t">' + esc(x.round) + '</div>' + chip(x) + '</div>'), ...extra.map((x) => '<div><div class="t">' + esc(x.round) + '</div>' + chip(x) + '</div>')].join('') + '</div>' : '')
        + '</div>' : '';

      // the champion, big: with a photo when assets/champions/<year>-s<stage>.(jpg|webp|png) is in the repository
      const slug = (S.label.match(/(\d{4})\D+(\d+)/) || []).slice(1).join('-s');
      const finX = poCols.length ? poCols[poCols.length - 1].ms.find((x) => /^결승$/.test(x.round)) : null, finM = finX && byId[finX.id];
      let card = '';
      if (!SP && S.champion) {
        const t = ((window.OWCS || {}).teams || []).find((t) => t.n === S.champion || t.a === S.champion);
        const lg = t && (t.logoDark || t.logo);
        let sub = '';
        if (finX) {
          const r = finM ? [[finM.a, finM.sa], [finM.b, finM.sb]] : finX.rows.map((r) => [r.a, r.s]);
          const w = r.find((x) => t && x[0] === t.a) || r[0], l = r.find((x) => x !== w);
          sub = '결승 ' + w[1] + ' : ' + l[1] + ' ' + l[0] + ' · ' + String(finX.when || '').split(' ')[0];
        }
        card = '<div class="cw nop" data-s="' + esc(slug) + '" data-n="' + esc(S.champion) + '">'
          + '<div class="cb"><i ' + (lg ? 'style="background-image:url(\'' + esc(lg) + '\')"' : '') + '></i><div><span class="ck">CHAMPION · 우승</span><div class="cn">' + esc(S.champion) + '</div><div class="cs">' + esc(sub) + '</div></div></div></div>';
      }
      const pick = all.length > 1 ? '<div class="pick">' + all.map((s, i) => '<button data-k="' + esc(s.label) + '" class="' + (s === S ? 'on' : '') + '">' + esc(s.label.replace(/스테이지 /, 'S')) + (i === 0 ? ' · 이번 시즌' : '') + '</button>').join('') + '</div>' : '';
      // which tournament this is, big: a stage name never gets lost among the cards below
      const dates = S.start ? S.start.slice(5).replace('-', '.') + ' – ' + (S.end || '').slice(5).replace('-', '.') : '';
      const head = '<div class="top"><div><span class="tag' + (S === all[0] ? '' : ' old') + '">' + (S === all[0] ? '이번 시즌' : '지난 시즌') + '</span>'
        + '<div class="ttl">' + esc(S.label) + '</div><div class="sub">플레이오프' + (dates ? ' · ' + esc(dates) : '') + '</div></div>' + '</div>';
      const note = isCur ? '대진은 정규 리그가 끝나면 채워져요' : '';

      const part = this.getAttribute('part');
      const road = seedHtml || lcqHtml ? '<div class="grid' + (part === 'road' ? ' one' : '') + '">' + seedHtml + lcqHtml + '</div>' : '';
      this.shadowRoot.innerHTML = '<style>' + CSS + '</style><div class="w' + (dark ? ' dark' : '') + '">' + pick
        + (part === 'road' ? road
          : card + (note ? '<div class="note">' + note + '</div>' : '')
            + poHtml + (part !== 'po' && road ? '<div class="pre-l">플레이오프 가는 길</div>' + road : '')) + '</div>';
      this.shadowRoot.querySelectorAll('.pick button').forEach((b) => b.addEventListener('click', () => {
        this.sel = b.getAttribute('data-k');
        try { sessionStorage.setItem(KEY, this.sel); } catch (e) {}
        this.render();
      }));
      // champion photo: try jpg, webp, png; the card stays a plain banner when there is none (answer kept per stage)
      const cw = this.shadowRoot.querySelector('.cw[data-s]:not([data-s=""])');
      if (cw) {
        const sl = cw.getAttribute('data-s'), memo = (this.photos = this.photos || {}), exts = ['jpg', 'webp', 'png'];
        const show = (u) => { const im = document.createElement('img'); im.src = u; im.alt = cw.getAttribute('data-n') + ' 우승'; cw.prepend(im); cw.classList.remove('nop'); };
        if (memo[sl]) show(memo[sl]);
        else if (memo[sl] !== false) {
          const next = (i) => {
            if (i >= exts.length) { memo[sl] = false; return; }
            const t = new Image(), u = 'assets/champions/' + sl + '.' + exts[i];
            t.onload = () => { memo[sl] = u; if (cw.isConnected) show(u); };
            t.onerror = () => next(i + 1);
            t.src = u;
          };
          next(0);
        }
      }
      const on = this.shadowRoot.querySelector('.pick .on');
      if (on && on.scrollIntoView && on.offsetLeft > on.parentElement.clientWidth) on.parentElement.scrollLeft = on.offsetLeft - 8;
    }
  }
  customElements.define('owcs-bracket', OwcsBracket);
})();
