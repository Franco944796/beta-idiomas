/* Trilex – Autoaprendizaje: lector de lecturas graduadas y libros completos.
   Lee ../content/en/reading/*.json y guarda el progreso en localStorage (trilex_read_v1):
   notas, palabras guardadas, borradores y por dónde ibas en cada libro. */
(() => {
  'use strict';
  const C = '../content/en/',
    R = C + 'reading/',
    K = 'trilex_read_v1',
    KC = 'trilex_en_v1'; // progreso del curso: el tiempo de lectura suma a la meta diaria
  const app = document.getElementById('app');
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  // Los textos de varias líneas vienen en el JSON como lista de líneas (archivos legibles);
  // aquí se vuelven a unir en un único texto.
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
  const pct = (x) => Math.round(x * 100) + ' %';
  const fmt = (x) => String(Math.round(x * 10) / 10);
  const bar = (f) => `<span class="bar"><span style="width:${Math.round(f * 100)}%"></span></span>`;
  // misma normalización que tools/i18n_build.py (_norm) para buscar en los diccionarios
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
  P = Object.assign({ t: {}, b: {}, words: [], drafts: {}, notes: {}, size: 1, rate: 0.9 }, P);
  const save = () => {
    try {
      localStorage.setItem(K, JSON.stringify(P));
    } catch (e) {}
  };

  /* el tiempo de lectura suma a la meta diaria del curso (misma clave que trilex.js) */
  const pad2 = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
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
  let reading = null; // párrafos que se están leyendo en voz alta
  const stopRead = () => {
    if (canSpeak) speechSynthesis.cancel();
    if (reading) reading.forEach((e) => e.classList.remove('rd-now'));
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

  /* ---------- diccionario ----------
     1) glosario del texto abierto (GLOSS: palabra → significado en español)
     2) vocabulario del curso (VOC: lema → significado en español)
     Para los demás idiomas, reading/i18n/<idioma>.json {gloss, vocab} (generado por
     tools/i18n_build.py) da el significado en el idioma elegido; en.json es además una
     definición breve en inglés sencillo. */
  let VOC = null,
    GLOSS = {};
  const DICT = {};
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
  const loadDict = (lg) =>
    DICT[lg] || (DICT[lg] = J(R + 'i18n/' + lg + '.json').catch(() => ({ gloss: {}, vocab: {} })));
  // formas base probables de una palabra (plural, pasado, -ing, comparativos…)
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
  // → {w, base, tr (significado en el idioma elegido), es, def (inglés sencillo), src, fallback}
  async function lookup(word) {
    const w = norm(word).replace(/^'+|'+$/g, '');
    if (!w) return null;
    const lg = L(),
      [d, en, voc] = await Promise.all([
        loadDict(lg === 'es' ? 'en' : lg),
        loadDict('en'),
        loadVoc(),
      ]);
    const out = (base, es, src) => {
      const kind = src === 'glosario' ? 'gloss' : 'vocab',
        own = lg === 'es' ? es : d[kind][base];
      return {
        w,
        base,
        es,
        tr: own || es,
        fallback: !own && lg !== 'es', // no hay traducción en el idioma elegido: se muestra el español
        def: lg === 'en' ? null : en[kind][base] || null,
        src,
      };
    };
    for (const f of forms(w)) if (GLOSS[f]) return out(f, GLOSS[f], 'glosario');
    for (const f of forms(w)) if (voc[f]) return out(f, voc[f], 'curso');
    return { w, base: w, tr: null };
  }
  // significado de una entrada del glosario en el idioma elegido (para la lista de palabras clave)
  const glossMeaning = (g, d) => (L() === 'es' ? g.es : (d && d.gloss[norm(g.en)]) || g.es);

  /* ---------- ventana emergente de una palabra ---------- */
  const pop = document.createElement('div');
  pop.className = 'rd-pop';
  pop.hidden = true;
  document.body.appendChild(pop);
  const hidePop = () => {
    pop.hidden = true;
  };
  const place = (el, x, y, w) => {
    const vw = document.documentElement.clientWidth,
      pw = Math.min(w, vw - 24);
    el.style.width = pw + 'px';
    el.style.left = Math.max(12, Math.min(x - pw / 2, vw - pw - 12)) + 'px';
    el.style.top = y + window.scrollY + 14 + 'px';
  };
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
  async function showWord(word, x, y, ctx) {
    const r = await lookup(word);
    if (!r) return hidePop();
    const saved = P.words.some((s) => s.w === r.base);
    const src =
      T(r.src === 'glosario' ? 'popGloss' : 'popCourse') +
      (r.fallback ? ', ' + T('inSpanish') : '');
    pop.innerHTML =
      `<div class="rd-pop-head"><b>${esc(r.base)}</b>` +
      (canSpeak
        ? `<button type="button" class="tx-btn tx-alt tx-say" data-act="say">🔊</button>`
        : '') +
      `<button type="button" class="rd-x" aria-label="${T('close')}">✕</button></div>` +
      (r.tr
        ? `<p class="rd-tr">${esc(r.tr)}</p><p class="rd-src"><small>${src}</small></p>` +
          (r.def
            ? `<p class="rd-def"><span class="kicker">${T('defEn')}</span> ${esc(r.def)}</p>`
            : '')
        : `<p class="rd-src"><small>${T('popNotFound')}</small></p>`) +
      `<p class="rd-links"><small>${T('dictionary')}</small> ${dictLinks(r.w)}</p>` +
      `<button type="button" class="tx-btn tx-alt" data-act="keep" ${saved ? 'disabled' : ''}>` +
      `${T(saved ? 'savedWord' : 'saveWord')}</button>`;
    pop.hidden = false;
    place(pop, x, y, 300);
    pop.onclick = (e) => {
      const a = e.target.closest('[data-act],.rd-x');
      if (!a) return;
      if (a.classList.contains('rd-x')) return hidePop();
      if (a.dataset.act === 'say') say(r.base);
      if (a.dataset.act === 'keep') {
        P.words.unshift({
          w: r.base,
          es: r.es || '',
          tr: r.tr || '',
          lg: L(),
          ctx: ctx || '',
          at: Date.now(),
        });
        save();
        a.textContent = T('savedWord');
        a.disabled = true;
      }
    };
  }
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.rd-text')) hidePop();
  });

  // palabra bajo el dedo o el cursor, con la oración en la que aparece
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

  /* ---------- subrayados y notas ----------
     P.notes[id] = {title, href, level, general, marks: [{id, color, quote, note, at,
     ranges: [{p, s, e}]}]}; p = número de párrafo, s/e = posición en su texto. */
  const COLORS = ['yellow', 'green', 'blue', 'pink'];
  const doc = (o) =>
    P.notes[o.id] ||
    (P.notes[o.id] = { title: o.noteTitle, href: o.href, level: o.level, general: '', marks: [] });
  const tidyNotes = (id) => {
    const d = P.notes[id];
    if (d && !d.general && !d.marks.length) delete P.notes[id];
  };
  // posición de (node, off) dentro del texto de el
  const offsetIn = (el, node, off) => {
    const r = document.createRange();
    r.setStart(el, 0);
    r.setEnd(node, off);
    return r.toString().length;
  };
  // tramos de la selección actual dentro de los párrafos de txt
  const selRanges = (txt) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const rg = sel.getRangeAt(0);
    if (!txt.contains(rg.commonAncestorContainer)) return null;
    const out = [];
    [...txt.children].forEach((p, i) => {
      if (!rg.intersectsNode(p)) return;
      const t = p.textContent;
      let s = p.contains(rg.startContainer) ? offsetIn(p, rg.startContainer, rg.startOffset) : 0,
        e = p.contains(rg.endContainer) ? offsetIn(p, rg.endContainer, rg.endOffset) : t.length;
      while (s < e && /\s/.test(t[s])) s++;
      while (e > s && /\s/.test(t[e - 1])) e--;
      if (e > s) out.push({ p: i, s, e });
    });
    return out.length ? { ranges: out, quote: String(rg).replace(/\s+/g, ' ').trim() } : null;
  };
  // envuelve el texto [s, e) de un párrafo en <span class="rd-mk">
  const wrapRange = (el, s, e, color, id) => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT),
      parts = [];
    let pos = 0,
      n;
    while ((n = walk.nextNode())) {
      const len = n.data.length,
        a = Math.max(s, pos),
        b = Math.min(e, pos + len);
      if (a < b) parts.push([n, a - pos, b - pos]);
      pos += len;
    }
    parts.forEach(([node, a, b]) => {
      let t = node;
      if (a > 0) t = t.splitText(a);
      if (b - a < t.data.length) t.splitText(b - a);
      const sp = document.createElement('span');
      sp.className = 'rd-mk c-' + color;
      sp.dataset.mk = id;
      t.parentNode.insertBefore(sp, t);
      sp.appendChild(t);
    });
  };

  /* ---------- piezas comunes ---------- */
  const tabs = (cur) =>
    `<nav class="rd-tabs" aria-label="${T('readTitle')}">` +
    [
      ['textos', 'tabTexts'],
      ['libros', 'tabBooks'],
      ['palabras', 'tabWords', P.words.length],
      ['notas', 'tabNotes', Object.keys(P.notes).length],
    ]
      .map(
        ([k, t, n]) =>
          `<a href="#/${k}" class="${cur === k ? 'on' : ''}">${T(t)}${n ? ` <i>${n}</i>` : ''}</a>`,
      )
      .join('') +
    `</nav>`;
  const head = (kicker, title, lede = '', right = '') =>
    `<header class="ph"><div class="ph-row"><span class="kicker blue">${kicker}</span>${right}</div>` +
    `<h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</header>`;
  const dur = (b) =>
    b.hours >= 1
      ? T('hoursN', { n: b.hours })
      : '~' + T('minN', { n: Math.max(5, Math.round(b.words / 150)) });
  const pdfUrl = (b) => R + 'books/' + b.id + '/' + b.id + '.pdf';
  const pdfLink = (b, cls = 'tx-btn tx-alt') =>
    b.pdf_kb
      ? `<a class="${cls}" href="${pdfUrl(b)}" download="${b.id}.pdf">${T('downloadPdf')} ` +
        `<small>${b.pdf_kb >= 1000 ? (b.pdf_kb / 1024).toFixed(1) + ' MB' : b.pdf_kb + ' KB'}</small></a>`
      : '';

  let INDEX = null;
  const index = () => INDEX || (INDEX = J(R + 'index.json'));

  /* ---------- lecturas graduadas ---------- */
  async function textsView(filter) {
    const ix = await index();
    const lv = filter || P.lvl || 'A1';
    P.lvl = lv;
    save();
    const list = ix.texts.filter((t) => t.level === lv);
    const doneN = (l) => ix.texts.filter((t) => t.level === l && P.t[t.id]).length;
    app.innerHTML =
      head(T('selfK'), T('readTitle'), T('introTexts')) +
      tabs('textos') +
      `<div class="rd-levels">` +
      ix.levels
        .map(
          (l) =>
            `<a href="#/textos/${l}" class="rd-lvtab ${l === lv ? 'on' : ''}">${l} ` +
            `<small>${doneN(l)}/${ix.texts.filter((t) => t.level === l).length}</small></a>`,
        )
        .join('') +
      `</div><div class="rd-cards">` +
      list
        .map((t, i) => {
          const p = P.t[t.id],
            notes = P.notes['t:' + t.id];
          return (
            `<a class="rd-card ${p ? 'done' : ''}" href="#/texto/${t.id}">` +
            `<span class="num">${t.level} · ${pad2(i + 1)}</span><h3>${esc(t.title)}</h3>` +
            `<small>${L() === 'es' ? esc(t.title_es) + ' · ' : ''}${esc(TXI.topic(t.topic))}</small>` +
            `<p class="rd-meta">${T('wordsN', { n: t.words })} · ${T('minN', { n: t.minutes })} · ` +
            `${T('questionsN', { n: t.questions })}</p><span class="rd-card-foot">` +
            (p
              ? `<span class="rd-best">${pct(p.best)} <small>${T('bestScore')}</small></span>`
              : `<span class="open-link">${T('readGo')}</span>`) +
            (notes
              ? `<span class="rd-badge">${T('notesN', { n: notes.marks.length })}</span>`
              : '') +
            `</span></a>`
          );
        })
        .join('') +
      `</div>`;
  }

  /* ---------- libros ---------- */
  async function booksView() {
    const ix = await index();
    app.innerHTML =
      head(T('selfK'), T('readTitle'), T('introBooks')) +
      tabs('libros') +
      `<div class="rd-cards">` +
      ix.books
        .map((b) => {
          const st = P.b[b.id] || { c: {} },
            done = Object.keys(st.c || {}).length;
          return (
            `<article class="rd-card rd-book"><a class="rd-book-main" href="#/libro/${b.id}">` +
            `<span class="num">${b.level} · ${T('chaptersN', { n: b.chapters })}</span>` +
            `<h3>${esc(b.title)}</h3><small>${esc(b.author)} · ${b.year}</small>` +
            `<p class="rd-meta">${dur(b)} · ${T('wordsN', { n: num(b.words) })}</p>` +
            bar(done / b.chapters) +
            `<small>${done ? T('chDone', { d: done, n: b.chapters }) + (st.last ? T('continueAt', { n: st.last }) : '') : T('notStarted')}</small>` +
            `</a><span class="rd-card-foot"><a class="open-link" href="#/libro/${b.id}">${T('readGo')}</a>` +
            pdfLink(b, 'tx-link') +
            `</span></article>`
          );
        })
        .join('') +
      `</div>`;
  }

  async function bookView(id) {
    const [b, ix] = await Promise.all([J(R + 'books/' + id + '/book.json'), index()]);
    const meta = ix.books.find((x) => x.id === id) || {};
    const st = P.b[id] || { c: {} },
      next = st.last || 1;
    app.innerHTML =
      head(
        `${T('tabBooks')} · ${b.level}`,
        esc(b.title),
        esc(b.blurb[L()] || b.blurb.en),
        `<a class="pill" href="#/libros">← ${T('tabBooks')}</a>`,
      ) +
      `<p class="tx-meta">${esc(b.author)} · ${b.year} · ${T('wordsN', { n: num(b.words) })} · ` +
      (b.hours >= 1
        ? T('hoursReading', { n: b.hours })
        : T('minN', { n: Math.max(5, Math.round(b.words / 150)) })) +
      `</p><div class="tx-row-btns rd-book-actions"><a class="tx-btn" href="#/libro/${id}/${next}">` +
      (st.last ? T('continueReading', { n: next }) : T('startReading')) +
      `</a>${pdfLink(Object.assign({ id }, meta))}</div>` +
      (meta.pdf_kb ? `<p class="rd-pdfnote"><small>${T('pdfNote')}</small></p>` : '') +
      `<section class="tx-sec"><span class="kicker blue">${T('chapters')}</span><ol class="rd-chapters">` +
      b.chapters
        .map((c) => {
          const p = st.c[c.n],
            notes = P.notes['b:' + id + ':' + c.n];
          return (
            `<li><a class="tx-ls ${c.n === next ? 'cur' : ''}" href="#/libro/${id}/${c.n}">` +
            `<span class="tx-ls-n">${pad2(c.n)}</span><span class="tx-ls-t">${esc(c.title)}` +
            `<small>${T('wordsN', { n: num(c.words) })} · ~${T('minN', { n: c.minutes })} · ` +
            `${T('questionsN', { n: c.questions })}` +
            (notes ? ` · ${T('notesN', { n: notes.marks.length })}` : '') +
            `</small></span>` +
            (p
              ? `<span class="tx-st ok">✓ ${pct(p.best)}</span>`
              : `<span class="tx-st go">${T('readGo')}</span>`) +
            `</a></li>`
          );
        })
        .join('') +
      `</ol><p class="rd-pdfnote"><small>${T('pdSource')}</small></p></section>`;
  }

  /* ---------- lector (lectura graduada o capítulo) ---------- */
  // o: {kind, id, noteTitle, href, level, kicker, title, sub, paragraphs|blocks, glossary, questions, task,
  //     back, backLabel, prev, next, summary, prevBest, onScore}
  async function readerShell(o) {
    GLOSS = {};
    (o.glossary || []).forEach((g) => {
      const k = norm(g.en),
        first = k.split(' ')[0];
      GLOSS[k] = g.es;
      if (first !== k && !GLOSS[first]) GLOSS[first] = g.es;
    });
    const d = L() === 'es' ? null : await loadDict(L());
    const blocks = o.blocks || o.paragraphs.map((p) => ({ t: 'p', text: p }));
    const gl = (o.glossary || []).length
      ? `<details class="rd-gloss" ${o.kind === 'text' ? 'open' : ''}><summary>` +
        `${T('keywords', { n: o.glossary.length })}</summary><ul>` +
        o.glossary
          .map((g) => `<li><b>${esc(g.en)}</b> — ${esc(glossMeaning(g, d))}</li>`)
          .join('') +
        `</ul></details>`
      : '';
    app.innerHTML =
      head(
        o.kicker,
        esc(o.title),
        o.sub,
        `<a class="pill" href="${o.back}">← ${esc(o.backLabel)}</a>`,
      ) +
      (o.summary
        ? `<div class="note"><span class="kicker">${T('summaryK')}</span><p>${esc(o.summary)}</p></div>`
        : '') +
      `<div class="rd-layout"><article class="rd-reader" style="--rd-size:${P.size}">` +
      `<div class="rd-tools">` +
      (canSpeak
        ? `<button type="button" id="rd-play" class="tx-btn">${T('playAudio')}</button>` +
          `<select id="rd-rate" aria-label="${T('speed')}"><option value=".9">${T('speedNormal')}</option>` +
          `<option value=".7">${T('speedSlow')}</option><option value="1.05">${T('speedFast')}</option></select>`
        : '') +
      `<span class="rd-size"><button type="button" class="tx-btn tx-alt" data-size="-1" aria-label="${T('smaller')}">A−</button>` +
      `<button type="button" class="tx-btn tx-alt" data-size="1" aria-label="${T('bigger')}">A+</button></span>` +
      `<label class="rd-hl"><input type="checkbox" id="rd-hl"> ${T('highlight')}</label></div>` +
      gl +
      `<p class="rd-tip">${T('tapTip')} ${T('markHint')}</p>` +
      `<div class="rd-text"></div></article>` +
      `<aside class="rd-notes" id="rd-notes"></aside></div>` +
      `<section class="tx-sec rd-quiz" id="rd-quiz"></section>` +
      (o.task
        ? `<section class="tx-sec rd-task"><span class="kicker blue">${T('afterReading')}</span>` +
          `<p>${esc(o.task)}</p><textarea class="tx-in tx-ta" id="rd-draft" rows="6" ` +
          `placeholder="${T('writeHere')}">${esc(P.drafts[o.id] || '')}</textarea>` +
          `<p><small id="rd-wc"></small> <small>${T('draftNote')}</small></p></section>`
        : '') +
      `<nav class="rd-pager">` +
      (o.prev ? `<a class="tx-btn tx-alt" href="${o.prev}">${T('prev')}</a>` : '<span></span>') +
      (o.next ? `<a class="tx-btn" href="${o.next}">${T('next')}</a>` : '') +
      `</nav>`;

    const art = app.querySelector('.rd-reader'),
      txt = app.querySelector('.rd-text'),
      hl = app.querySelector('#rd-hl');
    // texto: párrafos + palabras clave resaltadas (opcional) + subrayados del usuario
    const glossRe = (() => {
      const keys = (o.glossary || [])
        .map((g) => g.en)
        .sort((a, b) => b.length - a.length)
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      return keys.length ? new RegExp('\\b(' + keys.join('|') + ')\\b', 'gi') : null;
    })();
    const renderText = () => {
      txt.innerHTML = blocks
        .map((b) =>
          b.t === 'v'
            ? `<p class="rd-verse">${esc(b.text).replace(/\n/g, '<br>')}</p>`
            : `<p>${esc(b.text)}</p>`,
        )
        .join('');
      if (hl.checked && glossRe)
        txt.querySelectorAll('p').forEach((p) => {
          p.innerHTML = p.innerHTML.replace(
            /(<[^>]+>)|([^<]+)/g,
            (m, tag, s) => tag || s.replace(glossRe, '<mark>$1</mark>'),
          );
        });
      const nd = P.notes[o.id];
      ((nd && nd.marks) || []).forEach((m) =>
        m.ranges.forEach((r) => {
          const p = txt.children[r.p];
          if (p) wrapRange(p, r.s, r.e, m.color, m.id);
        }),
      );
    };
    renderText();
    hl.onchange = renderText;
    app.querySelectorAll('[data-size]').forEach(
      (b) =>
        (b.onclick = () => {
          P.size = Math.max(0.85, Math.min(1.6, +(P.size + b.dataset.size * 0.1).toFixed(2)));
          save();
          art.style.setProperty('--rd-size', P.size);
        }),
    );
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
    const dr = app.querySelector('#rd-draft');
    if (dr) {
      const wc = () => {
        const n = (dr.value.match(/[A-Za-z’']+/g) || []).length;
        app.querySelector('#rd-wc').textContent = T('wordCount', { n });
      };
      wc();
      dr.oninput = () => {
        P.drafts[o.id] = dr.value;
        save();
        wc();
      };
    }

    /* notas: panel lateral con burbujas de colores */
    const panel = app.querySelector('#rd-notes');
    const drawNotes = () => {
      const nd = P.notes[o.id],
        marks = nd ? nd.marks.slice() : [];
      // en el orden en que aparecen en el texto
      marks.sort((a, b) => a.ranges[0].p - b.ranges[0].p || a.ranges[0].s - b.ranges[0].s);
      panel.innerHTML =
        `<div class="rd-notes-head"><span class="kicker blue">${T('notesH')}</span>` +
        `<small>${T('notesN', { n: marks.length })}</small></div>` +
        `<label class="rd-general"><span>${T('notesGeneral')}</span>` +
        `<textarea class="tx-in" rows="3" placeholder="${T('notesGeneralPh')}">${esc(nd ? nd.general : '')}</textarea></label>` +
        (marks.length
          ? marks
              .map(
                (m) =>
                  `<div class="rd-bubble c-${m.color}" data-mk="${m.id}"><button type="button" class="rd-quote" ` +
                  `data-go-mk="${m.id}" title="${T('goToText')}">«${esc(m.quote.length > 180 ? m.quote.slice(0, 177) + '…' : m.quote)}»</button>` +
                  `<textarea class="rd-note-in" rows="2" placeholder="${T('notePh')}">${esc(m.note)}</textarea>` +
                  `<div class="rd-bubble-foot"><span class="rd-dots">` +
                  COLORS.map(
                    (c) =>
                      `<button type="button" class="rd-dot c-${c} ${c === m.color ? 'on' : ''}" data-color="${c}" ` +
                      `aria-label="${T('markW')} · ${c}"></button>`,
                  ).join('') +
                  `</span><button type="button" class="tx-link" data-del-mk="${m.id}">${T('delete')}</button></div></div>`,
              )
              .join('')
          : `<p class="rd-empty"><small>${T('markHint')}</small></p>`);
      panel.querySelector('.rd-general textarea').oninput = (e) => {
        doc(o).general = e.target.value;
        tidyNotes(o.id);
        save();
      };
      panel.querySelectorAll('.rd-bubble').forEach((bb) => {
        const m = P.notes[o.id].marks.find((x) => x.id === bb.dataset.mk);
        bb.querySelector('.rd-note-in').oninput = (e) => {
          m.note = e.target.value;
          save();
        };
        bb.querySelectorAll('[data-color]').forEach(
          (x) =>
            (x.onclick = () => {
              m.color = x.dataset.color;
              save();
              renderText();
              drawNotes();
            }),
        );
        bb.querySelector('[data-del-mk]').onclick = () => {
          const d = P.notes[o.id];
          d.marks = d.marks.filter((x) => x !== m);
          tidyNotes(o.id);
          save();
          renderText();
          drawNotes();
        };
        bb.querySelector('[data-go-mk]').onclick = () => {
          const sp = txt.querySelector(`[data-mk="${m.id}"]`);
          if (!sp) return;
          sp.scrollIntoView({ block: 'center', behavior: 'smooth' });
          txt.querySelectorAll(`[data-mk="${m.id}"]`).forEach((s) => {
            s.classList.add('flash');
            setTimeout(() => s.classList.remove('flash'), 1400);
          });
        };
      });
    };
    drawNotes();

    // barra que aparece al seleccionar texto: colores, nota y traducción
    const sb = document.createElement('div');
    sb.className = 'rd-selbar';
    sb.hidden = true;
    document.body.appendChild(sb);
    selbar = sb;
    const addMark = (color, focus) => {
      const sr = selRanges(txt);
      if (!sr) return;
      const m = {
        id: 'm' + Date.now().toString(36),
        color,
        quote: sr.quote,
        note: '',
        at: Date.now(),
        ranges: sr.ranges,
      };
      doc(o).marks.push(m);
      save();
      window.getSelection().removeAllRanges();
      sb.hidden = true;
      renderText();
      drawNotes();
      if (focus) {
        const t = panel.querySelector(`[data-mk="${m.id}"] .rd-note-in`);
        if (t) {
          t.scrollIntoView({ block: 'center', behavior: 'smooth' });
          t.focus({ preventScroll: true });
        }
      }
    };
    const showBar = () => {
      const sr = selRanges(txt);
      if (!sr) {
        sb.hidden = true;
        return;
      }
      const words = sr.quote.split(/\s+/).length;
      sb.innerHTML =
        `<span class="rd-dots">` +
        COLORS.map(
          (c) =>
            `<button type="button" class="rd-dot c-${c}" data-color="${c}" aria-label="${T('markW')} · ${c}"></button>`,
        ).join('') +
        `</span><button type="button" class="tx-link" data-note>✎ ${T('noteAdd')}</button>` +
        (words <= 4
          ? `<button type="button" class="tx-link" data-tr>${T('translateW')}</button>`
          : '');
      const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
      sb.hidden = false;
      // debajo de la selección (en el móvil, arriba queda el menú del sistema)
      place(sb, rect.left + rect.width / 2, rect.bottom + 6, 300);
      sb.onmousedown = (e) => e.preventDefault(); // no perder la selección al tocar la barra
      sb.onclick = (e) => {
        const c = e.target.closest('[data-color]');
        if (c) return addMark(c.dataset.color, false);
        if (e.target.closest('[data-note]')) return addMark('yellow', true);
        if (e.target.closest('[data-tr]')) {
          sb.hidden = true;
          showWord(sr.quote, rect.left + rect.width / 2, rect.bottom + 6, '');
        }
      };
    };
    let selT = null;
    document.onselectionchange = () => {
      clearTimeout(selT);
      selT = setTimeout(showBar, 220);
    };
    // tocar una palabra (sin seleccionar): su significado
    txt.addEventListener('click', (e) => {
      const sel = window.getSelection && String(window.getSelection()).trim();
      if (sel) return;
      const r = wordAt(e.clientX, e.clientY);
      if (r) showWord(r.w, e.clientX, e.clientY, r.ctx);
      else hidePop();
    });

    quiz(app.querySelector('#rd-quiz'), o);
  }
  let selbar = null;

  /* ---------- preguntas de comprensión (cuadrícula con corrección inmediata) ---------- */
  function quiz(box, o) {
    const qs = o.questions || [];
    if (!qs.length) {
      box.innerHTML =
        `<span class="kicker blue">${T('finishedQ')}</span>` +
        `<div class="tx-row-btns"><button type="button" class="tx-btn" id="rd-mark">${T('markRead')}</button></div>`;
      box.querySelector('#rd-mark').onclick = () => {
        o.onScore(1);
        box.innerHTML = '<p>' + T('markedRead') + '</p>';
      };
      return;
    }
    const ans = new Array(qs.length).fill(null),
      prev = o.prevBest;
    box.innerHTML =
      `<span class="kicker blue">${T('questionsN', { n: qs.length })}</span><h2>${T('compQ')}</h2>` +
      `<p class="tx-sec-lede">${T('qNote')}` +
      (L() === 'es' || L() === 'en' ? '' : ' ' + T('qLangNote')) +
      (prev != null ? ' ' + T('yourBest', { s: '<b>' + pct(prev) + '</b>' }) : '') +
      `</p><div class="tx-score"></div><div class="tx-grid">` +
      qs
        .map(
          (q, i) =>
            `<article class="tx-ex" data-i="${i}"><span class="tx-ex-n">${i + 1}</span><div class="tx-ex-box">` +
            `<div class="tx-q">${esc(q.q)}</div><div class="rd-a"></div>` +
            `<div class="tx-fb wait">${T('answerToSee')}</div></div></article>`,
        )
        .join('') +
      `</div><div class="rd-result"></div>`;
    const panel = box.querySelector('.tx-score');
    const paint = () => {
      const a = ans.filter((x) => x !== null).length,
        sc = ans.filter(Boolean).length;
      panel.innerHTML =
        `<div class="tx-score-n"><span class="kicker blue">${T('scoreH')}</span><b>${fmt(sc)} / ${qs.length}</b></div>` +
        `<div class="tx-score-p"><small>${T('answeredNofM', { a, n: qs.length })}</small>${bar(a / qs.length)}</div>` +
        `<button type="button" class="tx-btn tx-alt">${T('restart')}</button>`;
      panel.querySelector('button').onclick = () => {
        quiz(box, Object.assign({}, o, { prevBest: o.prevBest }));
        box.scrollIntoView({ block: 'start' });
      };
    };
    paint();
    const finish = () => {
      paint();
      if (ans.some((a) => a === null)) return;
      const s = ans.filter(Boolean).length / qs.length;
      o.onScore(s);
      const msg = T(s === 1 ? 'msgPerfect' : s >= 0.75 ? 'msgGood' : s >= 0.5 ? 'msgOk' : 'msgLow');
      box.querySelector('.rd-result').innerHTML =
        `<div class="panel ${s >= 0.5 ? 'blue' : 'rust'} tx-result"><span class="kicker">${T('resultH')}</span>` +
        `<div class="tx-result-row"><b class="tx-big">${ans.filter(Boolean).length}/${qs.length}</b><p>${msg}</p></div>` +
        (o.next
          ? `<div class="tx-row-btns"><a class="tx-btn" href="${o.next}">${T('next')}</a></div>`
          : '') +
        `</div>`;
    };
    box.querySelectorAll('.tx-ex').forEach((li) => {
      const i = +li.dataset.i,
        q = qs[i],
        a = li.querySelector('.rd-a'),
        fb = li.querySelector('.tx-fb');
      const done = (ok, shown) => {
        ans[i] = ok;
        fb.className = 'tx-fb ' + (ok ? 'ok' : 'bad');
        fb.innerHTML =
          '<b>' +
          (ok ? T('correct') : shown ? T('answerIs') + ' ' + esc(shown) : '✘') +
          '</b> ' +
          esc(q.why);
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
              const ok = opts[+b.dataset.k][1] === q.answer;
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
          `<div class="rd-fill"><input class="tx-in" autocomplete="off" autocapitalize="off" spellcheck="false" ` +
          `aria-label="${T('answerLabel')}"><button type="button" class="tx-btn">${T('check')}</button></div>`;
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
    await readerShell({
      kind: 'text',
      id: 't:' + id,
      noteTitle: t.title,
      href: '#/texto/' + id,
      level: t.level,
      kicker: `${T('tabTexts')} · ${t.level} · ${esc(TXI.topic(t.topic))}`,
      title: t.title,
      sub:
        (L() === 'es' ? esc(t.title_es) + ' · ' : '') +
        `${T('wordsN', { n: t.words })} · ~${T('minN', { n: t.minutes })}`,
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
      J(R + 'books/' + id + '/ch-' + pad2(n) + '.json'),
    ]);
    const st = (P.b[id] = P.b[id] || { c: {}, pos: {} });
    st.last = n;
    st.pos = st.pos || {};
    save();
    const N = b.chapters.length;
    await readerShell({
      kind: 'book',
      id: 'b:' + id + ':' + n,
      noteTitle: `${b.title} · ${n}. ${c.title}`,
      href: `#/libro/${id}/${n}`,
      level: b.level,
      kicker: `${esc(b.title)} · ${T('chapterOf', { n, m: N })}`,
      title: `${n}. ${c.title}`,
      sub: `${esc(b.author)} · ${T('wordsN', { n: num(c.words) })}`,
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
    // volver a donde se dejó de leer
    const txt = app.querySelector('.rd-text'),
      key = String(n),
      y0 = st.pos[key];
    if (y0) {
      requestAnimationFrame(() => window.scrollTo(0, txt.offsetTop + y0 * txt.offsetHeight - 120));
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
      head(
        T('selfK'),
        T('myWordsTitle'),
        P.words.length ? T('myWordsNote', { n: P.words.length }) : '',
      ) +
      tabs('palabras') +
      (P.words.length
        ? `<ul class="rd-words">` +
          P.words
            .map(
              (w, i) =>
                `<li><span class="rd-w"><b>${esc(w.w)}</b> <span class="rd-w-tr" data-i="${i}">` +
                `${esc(w.lg === L() ? w.tr : L() === 'es' ? w.es : '')}</span>` +
                (w.ctx ? `<small><i>${esc(w.ctx)}</i></small>` : '') +
                `</span><span class="rd-w-act">` +
                (canSpeak
                  ? `<button type="button" class="tx-btn tx-alt tx-say" data-say="${i}">🔊</button>`
                  : '') +
                `<a class="tx-btn tx-alt tx-say" target="_blank" rel="noopener" ` +
                `href="https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(w.w)}">Cambridge</a>` +
                `<button type="button" class="tx-link" data-del="${i}">${T('delete')}</button></span></li>`,
            )
            .join('') +
          `</ul>`
        : `<p class="rd-empty">${T('noWords')}</p>`);
    // significado en el idioma actual (las palabras pueden haberse guardado en otro)
    app.querySelectorAll('.rd-w-tr').forEach(async (el) => {
      const w = P.words[+el.dataset.i];
      if (el.textContent) return;
      const r = await lookup(w.w);
      el.textContent = (r && r.tr) || w.es || '';
    });
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

  /* ---------- mis notas (todos los textos) ---------- */
  function notesView() {
    const ids = Object.keys(P.notes).sort((a, b) => {
      const last = (d) => Math.max(0, ...d.marks.map((m) => m.at));
      return last(P.notes[b]) - last(P.notes[a]);
    });
    app.innerHTML =
      head(T('selfK'), T('myNotesTitle'), T('myNotesNote')) +
      tabs('notas') +
      (ids.length
        ? ids
            .map((id) => {
              const d = P.notes[id];
              return (
                `<section class="rd-notes-doc"><header><span class="kicker blue">${esc(d.level || '')}</span>` +
                `<h3><a href="${d.href}">${esc(d.title)}</a></h3></header>` +
                (d.general ? `<p class="rd-general-txt">${esc(d.general)}</p>` : '') +
                `<div class="rd-bubbles">` +
                d.marks
                  .map(
                    (m) =>
                      `<a class="rd-bubble c-${m.color}" href="${d.href}"><span class="rd-quote">«${esc(m.quote)}»</span>` +
                      (m.note ? `<span class="rd-note-txt">${esc(m.note)}</span>` : '') +
                      `</a>`,
                  )
                  .join('') +
                `</div></section>`
              );
            })
            .join('')
        : `<p class="rd-empty">${T('noNotes')}</p>`);
  }

  /* ---------- rutas ---------- */
  async function route() {
    stopRead();
    hidePop();
    if (selbar) {
      selbar.remove();
      selbar = null;
    }
    document.onselectionchange = null;
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
      else if (p[0] === 'notas') notesView();
      else await textsView(p[0] === 'textos' && p[1] ? p[1] : null);
    } catch (e) {
      app.innerHTML =
        `<div class="card"><p>${T('loadError', { e: esc(e.message) })}</p>` +
        `<a class="tx-btn" href="#/textos">${T('back')}</a></div>`;
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
