/* Trilex – Autoaprendizaje: lector de textos graduados y libros completos.
   Lee ../content/en/reading/*.json y guarda el progreso en localStorage (trilex_read_v1). */
(() => {
  'use strict';
  const C = '../content/en/',
    R = C + 'reading/',
    K = 'trilex_read_v1',
    KC = 'trilex_en_v1';
  const app = document.getElementById('app');
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  // Los textos de varias líneas (explicaciones, lecturas…) vienen en el JSON como lista de
  // líneas para que los archivos sean legibles; aquí se vuelven a unir en un único texto.
  const MULTILINE = new Set(['md', 'md_es', 'text', 'es', 'model_answer']);
  const joinLines = (k, v) =>
    MULTILINE.has(k) && Array.isArray(v) && v.every((x) => typeof x === 'string')
      ? v.join('\n')
      : v;
  const J = (u) =>
    fetch(u).then((r) => {
      if (!r.ok) throw new Error(u + ' (' + r.status + ')');
      return r.text().then((t) => JSON.parse(t, joinLines));
    });
  const T = (k, v) => (window.TXI ? TXI.t(k, v) : k),
    L = () => (window.TXI ? TXI.lang : 'es');
  const num = (n) => Number(n).toLocaleString(L());
  const lvc = (l) => 'lv-' + String(l).toLowerCase();
  const norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[^a-z' -]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  /* ---------- progreso ---------- */
  let P = {};
  try {
    P = JSON.parse(localStorage.getItem(K)) || {};
  } catch (e) {}
  P = Object.assign({ t: {}, b: {}, words: [], drafts: {}, size: 1, rate: 0.9 }, P);
  const save = () => {
    try {
      localStorage.setItem(K, JSON.stringify(P));
    } catch (e) {}
  };

  /* el tiempo de lectura suma a la meta diaria del curso (misma clave que trilex.js) */
  const dkey = (d) =>
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0');
  let lastAct = 0,
    pend = 0;
  const tick = () => {
    const n = Date.now();
    if (lastAct && n - lastAct < 120000) pend += (n - lastAct) / 1000;
    lastAct = n;
    if (pend > 15) flushTime();
  };
  const flushTime = () => {
    if (!pend) return;
    try {
      const S = JSON.parse(localStorage.getItem(KC)) || {};
      S.secs = S.secs || {};
      const k = dkey(new Date());
      S.secs[k] = (S.secs[k] || 0) + pend;
      localStorage.setItem(KC, JSON.stringify(S));
    } catch (e) {}
    pend = 0;
  };
  ['click', 'keydown', 'scroll', 'touchstart'].forEach((ev) =>
    document.addEventListener(ev, tick, { capture: true, passive: true }),
  );
  window.addEventListener('pagehide', flushTime);

  /* ---------- audio ---------- */
  const canSpeak = 'speechSynthesis' in window;
  const say = (t) => {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-GB';
    u.rate = P.rate;
    speechSynthesis.speak(u);
  };
  let reading = null; // lectura en voz alta párrafo a párrafo
  const stopRead = () => {
    if (canSpeak) speechSynthesis.cancel();
    if (reading) {
      reading.forEach((e) => e.classList.remove('rd-now'));
    }
    reading = null;
    const b = document.querySelector('#rd-play');
    if (b) b.textContent = T('playAudio');
  };
  const readFrom = (els, i) => {
    if (!canSpeak || !reading || i >= els.length) return stopRead();
    els.forEach((e) => e.classList.remove('rd-now'));
    const el = els[i];
    el.classList.add('rd-now');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const u = new SpeechSynthesisUtterance(el.innerText);
    u.lang = 'en-GB';
    u.rate = P.rate;
    u.onend = () => {
      if (reading === els) readFrom(els, i + 1);
    };
    speechSynthesis.speak(u);
  };

  /* ---------- diccionario: glosario del texto + vocabulario del curso ---------- */
  let VOC = null,
    GLOSS = {};
  const loadVoc = () =>
    VOC ||
    (VOC = Promise.all(
      ['a1', 'a2', 'b1', 'b2'].map((l) =>
        J(C + 'vocab/' + l + '.json').catch(() => ({ items: [] })),
      ),
    ).then((ls) => {
      const m = {};
      ls.forEach((v) =>
        v.items.forEach((x) => {
          const k = norm(x.lemma);
          if (k && !m[k]) m[k] = x.translation_es || x.es;
        }),
      );
      return m;
    }));
  const forms = (w) => {
    const o = [w];
    const add = (x) => {
      if (x && x.length > 1 && !o.includes(x)) o.push(x);
    };
    if (/ies$/.test(w)) add(w.slice(0, -3) + 'y');
    if (/es$/.test(w)) add(w.slice(0, -2));
    if (/s$/.test(w)) add(w.slice(0, -1));
    if (/ied$/.test(w)) add(w.slice(0, -3) + 'y');
    if (/ed$/.test(w)) {
      add(w.slice(0, -2));
      add(w.slice(0, -1));
      if (/(.)\1ed$/.test(w)) add(w.slice(0, -3));
    }
    if (/ing$/.test(w)) {
      add(w.slice(0, -3));
      add(w.slice(0, -3) + 'e');
      if (/(.)\1ing$/.test(w)) add(w.slice(0, -4));
    }
    if (/'s$/.test(w)) add(w.slice(0, -2));
    if (/ly$/.test(w)) add(w.slice(0, -2));
    if (/er$/.test(w)) add(w.slice(0, -2));
    if (/est$/.test(w)) add(w.slice(0, -3));
    return o;
  };
  async function lookup(word) {
    const w = norm(word).replace(/^'+|'+$/g, '');
    if (!w) return null;
    for (const f of forms(w)) if (GLOSS[f]) return { w, base: f, es: GLOSS[f], src: 'glosario' };
    const v = await loadVoc();
    for (const f of forms(w)) if (v[f]) return { w, base: f, es: v[f], src: 'curso' };
    return { w, base: w, es: null };
  }

  /* ventana emergente al tocar una palabra */
  const pop = document.createElement('div');
  pop.className = 'rd-pop';
  pop.hidden = true;
  document.body.appendChild(pop);
  const hidePop = () => {
    pop.hidden = true;
  };
  async function showWord(word, x, y, ctx) {
    const r = await lookup(word);
    if (!r) return hidePop();
    const saved = P.words.some((s) => s.w === r.base);
    pop.innerHTML =
      `<button class="rd-x" aria-label="${T('close')}">✕</button>\n    <b>${esc(r.base)}</b> ` +
      (canSpeak ? `<button class="tx-btn tx-alt rd-mini" data-act="say">🔊</button>` : '') +
      `\n    <p>` +
      (r.es
        ? (L() === 'es' ? '' : '🇪🇸 ') +
          esc(r.es) +
          (` <small>(` +
            T(r.src === 'glosario' ? 'popGloss' : 'popCourse') +
            `${L() === 'es' ? '' : ', ' + T('inSpanish')})</small>`)
        : '<small>' + T('popNotFound') + '</small>') +
      `</p>\n    <p class="rd-links"><small>${T('dictionary')}</small> ${dictLinks(r.w)}</p>\n    <button ` +
      `class="tx-btn rd-mini" data-act="keep" ${saved ? 'disabled' : ''}>${T(saved ? 'savedWord' : 'saveWord')}` +
      `</button>`;
    pop.hidden = false;
    const vw = document.documentElement.clientWidth,
      pw = Math.min(300, vw - 24);
    pop.style.width = pw + 'px';
    pop.style.left = Math.max(12, Math.min(x - pw / 2, vw - pw - 12)) + 'px';
    pop.style.top = y + window.scrollY + 14 + 'px';
    pop.onclick = (e) => {
      const a = e.target.closest('[data-act],.rd-x');
      if (!a) return;
      if (a.classList.contains('rd-x')) return hidePop();
      if (a.dataset.act === 'say') say(r.base);
      if (a.dataset.act === 'keep') {
        P.words.unshift({ w: r.base, es: r.es || '', ctx: ctx || '', at: Date.now() });
        save();
        a.textContent = T('savedWord');
        a.disabled = true;
      }
    };
  }
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.rd-text')) hidePop();
  });

  const wordAt = (x, y) => {
    let node, off;
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (!r) return null;
      node = r.startContainer;
      off = r.startOffset;
    } else if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return null;
      node = p.offsetNode;
      off = p.offset;
    }
    if (!node || node.nodeType !== 3) return null;
    const t = node.textContent,
      isW = (c) => /[A-Za-z’'-]/.test(c);
    let a = off,
      b = off;
    while (a > 0 && isW(t[a - 1])) a--;
    while (b < t.length && isW(t[b])) b++;
    const w = t.slice(a, b).replace(/^[-’']+|[-’']+$/g, '');
    if (!w) return null;
    const s = t.lastIndexOf('.', a) + 1,
      e2 = t.indexOf('.', b);
    return {
      w,
      ctx: t
        .slice(s, e2 < 0 ? t.length : e2 + 1)
        .trim()
        .slice(0, 200),
    };
  };
  const bindText = (el) => {
    el.addEventListener('click', (e) => {
      const sel = window.getSelection && String(window.getSelection()).trim();
      if (sel && sel.split(/\s+/).length <= 3) return showWord(sel, e.clientX, e.clientY, '');
      const r = wordAt(e.clientX, e.clientY);
      if (r) showWord(r.w, e.clientX, e.clientY, r.ctx);
      else hidePop();
    });
  };

  /* ---------- piezas comunes ---------- */
  const head = (title, back, backLabel) =>
    `<nav class="rd-nav"><a href="${back}" class="tx-btn tx-alt">← ${backLabel}</a></nav>`;
  const tabs = (cur) =>
    `<div class="rd-tabs" role="tablist">\n  <a href="#/textos" class="${cur === 'textos' ? 'on' : ''}">${T('tabTexts')}` +
    `</a>` +
    `\n ` +
    ` ` +
    `<a ` +
    `href="#/libros" class="${cur === 'libros' ? 'on' : ''}">${T('tabBooks')}</a>\n  <a href="#/palabras" class="${cur === 'palabras' ? 'on' : ''}` +
    `">${T('tabWords')}` +
    (P.words.length ? ' <i>' + P.words.length + '</i>' : '') +
    `</a></div>`;
  const pct = (x) => Math.round(x * 100) + ' %';
  const dictLinks = (w) => {
    const e = encodeURIComponent(w),
      l = L();
    const cam = {
      es: 'english-spanish',
      fr: 'english-french',
      de: 'english-german',
      it: 'english-italian',
      pt: 'english-portuguese',
      ru: 'english-russian',
      zh: 'english-chinese-simplified',
    }[l];
    const wr = {
      es: 'es/translation.asp?tranword=',
      fr: 'enfr/',
      de: 'ende/',
      it: 'enit/',
      pt: 'enpt/',
    }[l];
    return [
      wr
        ? `<a target="_blank" rel="noopener" href="https://www.wordreference.com/${wr}${e}">WordReference</a>`
        : '',
      `<a target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/${cam || 'english'}/${e}">` +
        `Cambridge</a>`,
    ]
      .filter(Boolean)
      .join(' · ');
  };
  const dur = (b) =>
    b.hours >= 1
      ? T('hoursN', { n: b.hours })
      : '~' + T('minN', { n: Math.max(5, Math.round(b.words / 150)) });
  const badge = (l) =>
    `<span class="rd-lv ${lvc(l)}" title="${esc(T('lv_' + l))}">${esc(l)}</span>`;

  let INDEX = null;
  const index = () => INDEX || (INDEX = J(R + 'index.json'));

  /* ---------- lista de lecturas graduadas ---------- */
  async function textsView(filter) {
    const ix = await index();
    const lv = filter || P.lvl || 'A1';
    P.lvl = lv;
    save();
    const list = ix.texts.filter((t) => t.level === lv);
    const doneN = (l) => ix.texts.filter((t) => t.level === l && P.t[t.id]).length;
    app.innerHTML =
      tabs('textos') +
      (`<div class="tx-card rd-intro"><p>${T('introTexts')}</p>\n    <div class="rd-chips">` +
        ix.levels
          .map(
            (l) =>
              `<a href="#/textos/${l}" class="rd-chip ${lvc(l)} ${l === lv ? 'on' : ''}">${l} <small>${doneN(l)}/` +
              ix.texts.filter((t) => t.level === l).length +
              `</small></a>`,
          )
          .join('') +
        `</div></div>\n    <div class="rd-list">` +
        list
          .map((t) => {
            const p = P.t[t.id];
            return (
              `<a class="rd-item ${lvc(t.level)} ${p ? 'done' : ''}" href="#/texto/${t.id}">\n        <span ` +
              `class="rd-item-l">${badge(t.level)}</span>\n        <span class="rd-item-m"><b>${esc(t.title)}</b><small>` +
              (L() === 'es' ? esc(t.title_es) + ' · ' : '') +
              (`${esc(TXI.topic(t.topic))}</small><small>${T('wordsN', { n: t.words })} · ${T('minN', { n: t.minutes })} · ${T('questionsN', { n: t.questions })}` +
                `</small>` +
                `</span>` +
                `\n ` +
                ` ` +
                ` `) +
              `     <span class="rd-item-r">` +
              (p
                ? `<b>${pct(p.best)}</b><small>${T('bestScore')}</small>`
                : `<span class="rd-go">${T('readGo')}</span>`) +
              `</span></a>`
            );
          })
          .join('') +
        `</div>`);
  }

  /* ---------- estantería de libros ---------- */
  async function booksView() {
    const ix = await index();
    app.innerHTML =
      tabs('libros') +
      (`<div class="tx-card rd-intro"><p>${T('introBooks')}</p></div>\n    <div class="rd-shelf">` +
        ix.books
          .map((b) => {
            const st = P.b[b.id] || { c: {} },
              done = Object.keys(st.c || {}).length;
            return (
              `<a class="rd-book ${lvc(b.level)}" href="#/libro/${b.id}">\n        <span class="rd-cover">${b.cover}</span>` +
              `\n ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              `<span class="rd-book-m"><b>${esc(b.title)}</b><small>${esc(b.author)} · ${b.year}</small>\n          ` +
              `<span class="rd-meta">${badge(b.level)} ${T('chaptersN', { n: b.chapters })} · ${dur(b)}</span>\n          ` +
              `<span class="tx-prog"><span style="width:${Math.round((done / b.chapters) * 100)}%"></span></span>\n ` +
              `         <small>` +
              (done
                ? T('chDone', { d: done, n: b.chapters }) +
                  (st.last ? T('continueAt', { n: st.last }) : '')
                : T('notStarted')) +
              `</small></span></a>`
            );
          })
          .join('') +
        `</div>`);
  }

  async function bookView(id) {
    const b = await J(R + 'books/' + id + '/book.json');
    const st = P.b[id] || { c: {} };
    const next = st.last || 1;
    app.innerHTML =
      tabs('libros') +
      (`<div class="tx-card rd-bookhead ${lvc(b.level)}">\n      <span class="rd-cover big">${b.cover}</span>\n      ` +
        `<div>` +
        `<h2>${esc(b.title)}</h2><p><small>${esc(b.author)} · ${b.year} · ${badge(b.level)} · ${T('wordsN', { n: num(b.words) })} ` +
        `· ` +
        (b.hours >= 1
          ? T('hoursReading', { n: b.hours })
          : T('minN', { n: Math.max(5, Math.round(b.words / 150)) })) +
        `</small></p>\n      <p>${esc(b.blurb[L()] || b.blurb.en)}</p>\n      <a class="tx-btn" href="#/libro/${id}/${next}` +
        `">` +
        (st.last ? T('continueReading', { n: next }) : T('startReading')) +
        `</a></div></div>\n    <div class="tx-card"><h3>${T('chapters')}</h3>` +
        b.chapters
          .map((c) => {
            const p = st.c[c.n];
            return (
              `<a class="tx-lesson rd-ch ${p ? 'done' : ''}" href="#/libro/${id}/${c.n}"><span>${p ? '✅' : c.n === next ? '📖' : '▫️'}` +
              `</span>` +
              `\n ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              ` ` +
              `<span><b>${c.n}. ${esc(c.title)}</b><br><small>${T('wordsN', { n: num(c.words) })} · ~${T('minN', { n: c.minutes })} ` +
              `· ${T('questionsN', { n: c.questions })}</small></span>\n        <span>${p ? pct(p.best) : ''}</span></a>`
            );
          })
          .join('') +
        `<p class="rd-src"><small>${T('pdSource')}</small></p></div>`);
  }

  /* ---------- lector (texto graduado o capítulo) ---------- */
  function readerShell(o) {
    // o: {kind, id, level, title, sub, paragraphs|blocks, glossary, questions, task, back, backLabel, prev, next, summary}
    GLOSS = {};
    (o.glossary || []).forEach((g) => {
      GLOSS[norm(g.en)] = g.es;
      norm(g.en).split(' ').length === 1 ||
        (GLOSS[norm(g.en).split(' ')[0]] = GLOSS[norm(g.en).split(' ')[0]] || g.es);
    });
    const blocks = o.blocks || o.paragraphs.map((p) => ({ t: 'p', text: p }));
    const gl = (o.glossary || []).length
      ? `<details class="rd-gloss" ${o.kind === 'text' ? 'open' : ''}><summary>${T('keywords', { n: o.glossary.length })}` +
        `</summary>` +
        `\n ` +
        ` ` +
        ` ` +
        ` ` +
        ` ` +
        ` ` +
        (L() === 'es' ? '' : '<p><small>' + T('glossNote') + '</small></p>') +
        `<ul>` +
        o.glossary.map((g) => `<li><b>${esc(g.en)}</b> — ${esc(g.es)}</li>`).join('') +
        `</ul></details>`
      : '';
    app.innerHTML =
      `<nav class="rd-nav"><a href="${o.back}" class="tx-btn tx-alt">← ${esc(o.backLabel)}</a></nav>\n    ` +
      `<article class="tx-card rd-reader ${lvc(o.level)}" style="--rd-size:${P.size}">\n      <header ` +
      `class="rd-rhead">${badge(o.level)}<div><h2>${esc(o.title)}</h2><small>${o.sub}</small></div></header>\n      ` +
      (o.summary ? `<p class="rd-summary"><small>${esc(o.summary)}</small></p>` : '') +
      `\n      <div class="rd-tools">\n        ` +
      (canSpeak
        ? `<button type="button" id="rd-play" class="tx-btn">${T('playAudio')}</button>\n        ` +
          `<select id="rd-rate" aria-label="${T('speed')}"><option value=".9">${T('speedNormal')}</option><option ` +
          `value=".7">${T('speedSlow')}</option><option value="1.05">${T('speedFast')}</option></select>`
        : '') +
      (`\n        <span class="rd-size"><button type="button" class="tx-btn tx-alt" data-size="-1" aria-label="${T('smaller')}` +
        `">` +
        `A−</button>`) +
      `<button type="button" class="tx-btn tx-alt" data-size="1" aria-label="${T('bigger')}">A+</button></span>` +
      `\n        <label class="rd-hl"><input type="checkbox" id="rd-hl"> ${T('highlight')}</label>\n      ` +
      `</div>\n      ${gl}\n      <p class="rd-tip">${T('tapTip')}</p>\n      <div class="rd-text">` +
      blocks
        .map((b) =>
          b.t === 'v'
            ? `<p class="rd-verse">${esc(b.text).replace(/\n/g, '<br>')}</p>`
            : `<p>${esc(b.text)}</p>`,
        )
        .join('') +
      `</div>\n    </article>\n    <section class="tx-card rd-quiz" id="rd-quiz"></section>\n    ` +
      (o.task
        ? `<section class="tx-card rd-task"><h3>${T('afterReading')}</h3><p>${esc(o.task)}</p>\n      ` +
          (`<textarea class="tx-in tx-ta" id="rd-draft" rows="6" placeholder="${T('writeHere')}">${esc(P.drafts[o.id] || '')}` +
            `</textarea>` +
            `\n ` +
            ` ` +
            ` ` +
            ` ` +
            ` ` +
            ` `) +
          `<p><small id="rd-wc"></small> <small>${T('draftNote')}</small></p></section>`
        : '') +
      `\n    <nav class="rd-pager">` +
      (o.prev ? `<a class="tx-btn tx-alt" href="${o.prev}">${T('prev')}</a>` : '<span></span>') +
      (o.next ? `<a class="tx-btn" href="${o.next}">${T('next')}</a>` : '') +
      `</nav>`;

    const art = app.querySelector('.rd-reader'),
      txt = app.querySelector('.rd-text');
    bindText(txt);
    app.querySelectorAll('[data-size]').forEach(
      (b) =>
        (b.onclick = () => {
          P.size = Math.max(0.85, Math.min(1.6, +(P.size + b.dataset.size * 0.1).toFixed(2)));
          save();
          art.style.setProperty('--rd-size', P.size);
        }),
    );
    const hl = app.querySelector('#rd-hl');
    hl.onchange = () => {
      if (!hl.checked) {
        txt.querySelectorAll('mark').forEach((m) => m.replaceWith(m.textContent));
        txt.normalize();
        return;
      }
      const keys = (o.glossary || [])
        .map((g) => g.en)
        .sort((a, b) => b.length - a.length)
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (!keys.length) return;
      const re = new RegExp('\\b(' + keys.join('|') + ')\\b', 'gi');
      txt.querySelectorAll('p').forEach((p) => {
        p.innerHTML = p.innerHTML.replace(
          /(<[^>]+>)|([^<]+)/g,
          (m, tag, s) => tag || s.replace(re, '<mark>$1</mark>'),
        );
      });
    };
    if (canSpeak) {
      const rate = app.querySelector('#rd-rate');
      rate.value = String(P.rate);
      if (rate.value === '') rate.value = '.9';
      rate.onchange = () => {
        P.rate = +rate.value;
        save();
      };
      app.querySelector('#rd-play').onclick = (e) => {
        if (reading) return stopRead();
        reading = [...txt.querySelectorAll('p')];
        e.target.textContent = T('stopAudio');
        readFrom(reading, 0);
      };
    }
    const d = app.querySelector('#rd-draft');
    if (d) {
      const wc = () => {
        const n = (d.value.match(/[A-Za-z’']+/g) || []).length;
        app.querySelector('#rd-wc').textContent = T('wordCount', { n });
      };
      wc();
      d.oninput = () => {
        P.drafts[o.id] = d.value;
        save();
        wc();
      };
    }
    quiz(app.querySelector('#rd-quiz'), o);
  }

  /* ---------- preguntas de comprensión ---------- */
  function quiz(box, o) {
    const qs = o.questions || [];
    if (!qs.length) {
      box.innerHTML = `<h3>${T('finishedQ')}</h3><button class="tx-btn" id="rd-mark">${T('markRead')}</button>`;
      box.querySelector('#rd-mark').onclick = () => {
        o.onScore(1);
        box.innerHTML = '<p>' + T('markedRead') + '</p>';
      };
      return;
    }
    const ans = new Array(qs.length).fill(null);
    const prev = o.prevBest;
    box.innerHTML =
      `<h3>${T('compQ')} <small>(${qs.length})</small></h3>\n    <p class="rd-qnote"><small>${T('qNote')}` +
      (L() === 'es' || L() === 'en' ? '' : ' ' + T('qLangNote')) +
      (prev != null ? ' ' + T('yourBest', { s: '<b>' + pct(prev) + '</b>' }) : '') +
      `</small></p>\n    <ol class="rd-qs">` +
      qs
        .map(
          (q, i) =>
            `<li class="rd-qi" data-i="${i}"><p class="tx-q">${esc(q.q)}</p><div class="rd-a"></div>` +
            `<div class="tx-fb"></div></li>`,
        )
        .join('') +
      `</ol>\n    <div class="rd-score" aria-live="polite"></div>`;
    const finish = () => {
      if (ans.some((a) => a === null)) return;
      const s = ans.filter(Boolean).length / qs.length;
      o.onScore(s);
      const msg = T(s === 1 ? 'msgPerfect' : s >= 0.75 ? 'msgGood' : s >= 0.5 ? 'msgOk' : 'msgLow');
      box.querySelector('.rd-score').innerHTML =
        `<div class="rd-result"><span class="tx-big">${ans.filter(Boolean).length}/${qs.length}</span><p>${msg}</p>\n  ` +
        ` ` +
        ` ` +
        ` ` +
        ` ` +
        `<button ` +
        `class="tx-btn tx-alt" id="rd-retry">${T('retry')}</button>` +
        (o.next ? ` <a class="tx-btn" href="${o.next}">${T('next')}</a>` : '') +
        `</div>`;
      box.querySelector('#rd-retry').onclick = () =>
        quiz(box, Object.assign({}, o, { prevBest: Math.max(prev ?? 0, s) }));
    };
    box.querySelectorAll('.rd-qi').forEach((li) => {
      const i = +li.dataset.i,
        q = qs[i],
        a = li.querySelector('.rd-a'),
        fb = li.querySelector('.tx-fb');
      const done = (ok, shown) => {
        ans[i] = ok;
        fb.className = 'tx-fb ' + (ok ? 'ok' : 'bad');
        fb.innerHTML =
          (ok
            ? '✔ ' + T('correct') + ' '
            : '✘ ' + (shown ? T('answerIs') + ' <b>' + esc(shown) + '</b>. ' : '')) +
          '<span class="tx-why">' +
          esc(q.why) +
          '</span>';
        finish();
      };
      if (q.type === 'mc' || q.type === 'tf') {
        const opts =
          q.type === 'tf'
            ? [
                [T('trueW'), true],
                [T('falseW'), false],
              ]
            : q.options.map((x) => [x, x]);
        a.innerHTML =
          `<div class="tx-opts">` +
          opts
            .map(
              (x, k) =>
                `<button type="button" class="tx-btn tx-opt" data-k="${k}">${esc(x[0])}</button>`,
            )
            .join('') +
          `</div>`;
        a.querySelectorAll('.tx-opt').forEach(
          (b) =>
            (b.onclick = () => {
              const v = opts[+b.dataset.k][1],
                ok = v === q.answer;
              a.querySelectorAll('.tx-opt').forEach((x) => {
                x.disabled = true;
                if (opts[+x.dataset.k][1] === q.answer) x.classList.add('ok');
              });
              if (!ok) b.classList.add('bad');
              done(ok);
            }),
        );
      } else {
        a.innerHTML =
          `<input class="tx-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${T('answerLabel')}` +
          `">` +
          ` ` +
          `<button ` +
          `type="button" class="tx-btn">${T('check')}</button>`;
        const inp = a.querySelector('input'),
          b = a.querySelector('button');
        const check = () => {
          if (!inp.value.trim()) return inp.focus();
          const ok = q.answer.some((x) => norm(x) === norm(inp.value));
          inp.disabled = b.disabled = true;
          done(ok, ok ? null : q.answer[0]);
        };
        b.onclick = check;
        inp.onkeydown = (e) => {
          if (e.key === 'Enter') check();
        };
      }
    });
  }

  async function textView(id) {
    const [t, ix] = await Promise.all([J(R + 'texts/' + id + '.json'), index()]);
    const same = ix.texts.filter((x) => x.level === t.level),
      k = same.findIndex((x) => x.id === id);
    readerShell({
      kind: 'text',
      id: 't:' + id,
      level: t.level,
      title: t.title,
      sub:
        `` +
        (L() === 'es' ? esc(t.title_es) + ' · ' : '') +
        `${esc(TXI.topic(t.topic))} · ${T('wordsN', { n: t.words })} · ~${T('minN', { n: t.minutes })}`,
      paragraphs: t.paragraphs,
      glossary: t.glossary,
      questions: t.questions,
      task: t.task,
      back: '#/textos/' + t.level,
      backLabel: T('readingsLv', { l: t.level }),
      prev: k > 0 ? '#/texto/' + same[k - 1].id : null,
      next: k < same.length - 1 ? '#/texto/' + same[k + 1].id : null,
      prevBest: P.t[id] ? P.t[id].best : null,
      onScore: (s) => {
        const p = P.t[id] || { best: 0 };
        P.t[id] = { best: Math.max(p.best, s), last: s, at: Date.now() };
        save();
      },
    });
  }

  let posTimer = null;
  async function chapterView(id, n) {
    const [b, c] = await Promise.all([
      J(R + 'books/' + id + '/book.json'),
      J(R + 'books/' + id + '/ch-' + String(n).padStart(2, '0') + '.json'),
    ]);
    const st = (P.b[id] = P.b[id] || { c: {}, pos: {} });
    st.last = n;
    st.pos = st.pos || {};
    save();
    const N = b.chapters.length;
    readerShell({
      kind: 'book',
      id: 'b:' + id + ':' + n,
      level: b.level,
      title: `${n}. ${c.title}`,
      sub: `${esc(b.title)} · ${esc(b.author)} · ${T('wordsN', { n: num(c.words) })} · ${T('chapterOf', { n, m: N })}`,
      summary: L() === 'es' ? c.summary_es : '',
      blocks: c.blocks,
      glossary: c.glossary,
      questions: c.questions,
      task: null,
      back: '#/libro/' + id,
      backLabel: b.title.length > 28 ? T('chaptersBack') : b.title,
      prev: n > 1 ? `#/libro/${id}/${n - 1}` : null,
      next: n < N ? `#/libro/${id}/${n + 1}` : null,
      prevBest: st.c[n] ? st.c[n].best : null,
      onScore: (s) => {
        const p = st.c[n] || { best: 0 };
        st.c[n] = { best: Math.max(p.best, s), at: Date.now() };
        if (n < N) st.last = n + 1;
        save();
      },
    });
    // recordar por dónde iba
    const txt = app.querySelector('.rd-text'),
      key = String(n);
    const y0 = st.pos[key];
    if (y0) {
      const nb = (h) => {
        window.scrollTo(0, txt.offsetTop + y0 * txt.offsetHeight - 120);
      };
      requestAnimationFrame(nb);
      const note = document.createElement('p');
      note.className = 'rd-tip';
      note.textContent = T('resumed');
      txt.before(note);
    }
    window.onscroll = () => {
      clearTimeout(posTimer);
      posTimer = setTimeout(() => {
        const f = (window.scrollY + 120 - txt.offsetTop) / txt.offsetHeight;
        if (f > 0 && f < 1) {
          st.pos[key] = +f.toFixed(3);
          save();
        }
      }, 400);
    };
  }

  /* ---------- mis palabras ---------- */
  function wordsView() {
    app.innerHTML =
      tabs('palabras') +
      (`<div class="tx-card"><h3>${T('myWordsTitle')}</h3>\n    ` +
        (P.words.length
          ? `<p><small>${T('myWordsNote', { n: P.words.length })}</small></p>\n    <ul class="rd-words">` +
            P.words
              .map(
                (w, i) =>
                  `<li><span><b>${esc(w.w)}</b> ${w.es ? '— ' + esc(w.es) : ''}` +
                  (w.ctx ? `<br><small><i>${esc(w.ctx)}</i></small>` : '') +
                  `</span>\n      <span>` +
                  (canSpeak
                    ? `<button class="tx-btn tx-alt rd-mini" data-say="${i}">🔊</button>`
                    : '') +
                  `<a class="tx-btn tx-alt rd-mini" target="_blank" rel="noopener" ` +
                  `href="https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(w.w)}" ` +
                  (`aria-label="Cambridge">📖</a><button class="tx-btn tx-alt rd-mini" data-del="${i}" aria-label="${T('delete')}` +
                    `">` +
                    `🗑</button>` +
                    `</span>`) +
                  `</li>`,
              )
              .join('') +
            `</ul>`
          : '<p>' + T('noWords') + '</p>') +
        `</div>`);
    app.onclick = (e) => {
      const s = e.target.closest('[data-say]'),
        d = e.target.closest('[data-del]');
      if (s) say(P.words[+s.dataset.say].w);
      if (d) {
        P.words.splice(+d.dataset.del, 1);
        save();
        wordsView();
      }
    };
  }

  /* ---------- router ---------- */
  async function route() {
    stopRead();
    hidePop();
    window.onscroll = null;
    app.onclick = null;
    flushTime();
    const p = (location.hash || '#/textos').slice(2).split('/');
    try {
      if (p[0] === 'texto' && p[1]) await textView(p[1]);
      else if (p[0] === 'libros') await booksView();
      else if (p[0] === 'libro' && p[2]) await chapterView(p[1], +p[2]);
      else if (p[0] === 'libro' && p[1]) await bookView(p[1]);
      else if (p[0] === 'palabras') wordsView();
      else await textsView(p[0] === 'textos' && p[1] ? p[1] : null);
    } catch (e) {
      app.innerHTML =
        `<div class="tx-card"><p>${T('loadError', { e: esc(e.message) })}</p><a class="tx-btn" href="#/textos">${T('back')}` +
        `</a>` +
        `</div>`;
    }
    if (!/^#\/libro\/[^/]+\/\d+/.test(location.hash)) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('tx-lang', () => {
    const y = window.scrollY;
    route().then(() => window.scrollTo(0, y));
  });
  route();
  window.TrilexLector = { P, lookup, route };
})();
