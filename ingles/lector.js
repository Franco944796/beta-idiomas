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
  // mismo orden en la web y en la app (seededShuffle en util.dart)
  const shuffled = (a, seed) => {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return a
      .map((x) => [x, (s = (s * 1664525 + 1013904223) >>> 0)])
      .sort((p, q) => p[1] - q[1])
      .map((p) => p[0]);
  };
  const norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[^a-z' -]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  let P = {};
  try {
    P = JSON.parse(localStorage.getItem(K)) || {};
  } catch (e) {}
  P = Object.assign(
    { t: {}, b: {}, words: [], drafts: {}, notes: {}, speed: {}, sums: {}, size: 1, rate: 0.9 },
    P,
  );
  const save = () => {
    try {
      localStorage.setItem(K, JSON.stringify(P));
    } catch (e) {}
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const today = () => Math.floor(Date.now() / 864e5);
  const INT = [1, 3, 7, 14, 30, 60]; // mismos intervalos que el Repaso del curso
  const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clock = (sec) => {
    const t = Math.max(0, Math.floor(sec));
    return Math.floor(t / 60) + ':' + pad2(t % 60);
  };
  const wordCount = (v) => (v.match(/[A-Za-z’']+/g) || []).length;
  // corta solo antes de mayúscula: «10 p.m. until» queda en una oración
  const sentencesOf = (text) =>
    String(text)
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?]["'”’)]?)\s+(?=["'“‘(]?[A-Z])/)
      .map((x) => x.trim())
      .filter((x) => /[A-Za-z]/.test(x));
  // timers, grabaciones y barras fijas de la vista actual: route() los cierra al cambiar de vista
  let leaving = [];
  const onLeave = (fn) => leaving.push(fn);
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

  const canSpeak = 'speechSynthesis' in window;
  const say = (t, rate) => {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-GB';
    u.rate = rate || P.rate;
    speechSynthesis.speak(u);
  };
  // la grabación queda en el dispositivo; devuelve una función que la detiene y da la URL del audio
  const canRec = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
  const record = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }),
      mr = new MediaRecorder(stream),
      chunks = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.start();
    let done = null;
    const stop = () =>
      done ||
      (done = new Promise((res) => {
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          res(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })));
        };
        mr.stop();
      }));
    onLeave(stop);
    return stop;
  };
  let reading = null;
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

  // Orden de búsqueda: glosario del texto, luego vocabulario del curso. Para otros idiomas
  // el significado sale de reading/i18n/<idioma>.json (tools/i18n_build.py); en.json es la
  // definición en inglés sencillo.
  let VOC = null,
    GLOSS = {},
    GLOSS1 = {}; // primera palabra de una frase del glosario → la frase (último recurso)
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
  // Frases («got up», «having breakfast» → «get up», «have breakfast»): se prueba cada palabra
  // en su forma base, una por vez. Los irregulares cubren los verbos de los phrasal verbs del curso.
  const IRREG = {
    am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be',
    has: 'have', had: 'have', does: 'do', did: 'do', done: 'do',
    got: 'get', gotten: 'get', went: 'go', gone: 'go', took: 'take', taken: 'take',
    made: 'make', kept: 'keep', ran: 'run', came: 'come', gave: 'give', given: 'give',
    brought: 'bring', found: 'find', felt: 'feel', left: 'leave', said: 'say', told: 'tell',
    thought: 'think', fell: 'fall', fallen: 'fall', grew: 'grow', grown: 'grow',
    broke: 'break', broken: 'break', caught: 'catch', held: 'hold', stood: 'stand',
    wrote: 'write', written: 'write', saw: 'see', seen: 'see', knew: 'know', known: 'know',
    paid: 'pay', sat: 'sit', spoke: 'speak', spoken: 'speak', woke: 'wake', woken: 'wake',
  };
  const phraseForms = (w) => {
    const ws = w.split(' '),
      o = [w];
    ws.forEach((x, i) => {
      [...forms(x).slice(1), IRREG[x]].forEach((f) => {
        if (!f) return;
        const v = ws.slice(0, i).concat(f, ws.slice(i + 1)).join(' ');
        if (!o.includes(v)) o.push(v);
      });
    });
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
        fallback: !own && lg !== 'es',
        def: lg === 'en' ? null : en[kind][base] || null,
        src,
      };
    };
    const cands = w.includes(' ') ? phraseForms(w) : forms(w);
    for (const f of cands) if (GLOSS[f]) return out(f, GLOSS[f], 'glosario');
    for (const f of cands) if (voc[f]) return out(f, voc[f], 'curso');
    // una palabra suelta que solo aparece como inicio de una frase del glosario: se muestra la
    // frase completa («look» → «look after»), nunca su significado como si fuera el de la palabra
    if (!w.includes(' '))
      for (const f of cands) if (GLOSS1[f]) return out(GLOSS1[f], GLOSS[GLOSS1[f]], 'glosario');
    return { w, base: w, tr: null };
  }
  const glossMeaning = (g, d) => (L() === 'es' ? g.es : (d && d.gloss[norm(g.en)]) || g.es);

  const pop = document.createElement('div');
  pop.className = 'rd-pop';
  pop.hidden = true;
  document.body.appendChild(pop);
  // no perder la selección del texto al tocar el diccionario (sus botones dependen de ella)
  pop.addEventListener('mousedown', (e) => e.preventDefault());
  let popSeq = 0;
  const hidePop = () => {
    popSeq++; // descarta búsquedas que todavía no terminaron
    pop.hidden = true;
  };
  const place = (el, x, y, w) => {
    const vw = document.documentElement.clientWidth,
      pw = Math.min(w, vw - 24);
    el.style.width = pw + 'px';
    el.style.left = Math.max(12, Math.min(x - pw / 2, vw - pw - 12)) + 'px';
    el.style.top = y + window.scrollY + 14 + 'px';
  };
  // Barra de colores y significado no deben taparse: en pantallas anchas van lado a lado;
  // en el celular no entran, así que solo se muestra la barra.
  const NARROW = 700,
    narrow = () => document.documentElement.clientWidth < NARROW,
    barOpen = () => selbar && !selbar.hidden;
  const pairUp = () => {
    if (!barOpen() || pop.hidden || !selbar.anchor) return;
    const vw = document.documentElement.clientWidth,
      w = 300,
      gap = 12,
      a = selbar.anchor;
    const left = Math.max(12, Math.min(a.x - w - gap / 2, vw - 2 * w - gap - 12));
    pop.style.width = w + 'px';
    pop.style.left = left + 'px';
    pop.style.top = a.y + window.scrollY + 14 + 'px';
    selbar.style.width = w + 'px';
    selbar.style.left = left + w + gap + 'px';
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
  async function showWord(word, x, y, ctx, onNote) {
    const seq = ++popSeq;
    const r = await lookup(word);
    if (seq !== popSeq) return; // mientras tanto se seleccionó otra cosa
    if (!r) return hidePop();
    if (narrow() && barOpen()) return hidePop();
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
      `${T(saved ? 'savedWord' : 'saveWord')}</button>` +
      (onNote
        ? ` <button type="button" class="tx-btn tx-alt" data-act="note">✎ ${T('seeNote')}</button>`
        : '');
    pop.hidden = false;
    place(pop, x, y, 300);
    if (!narrow()) pairUp();
    pop.onclick = (e) => {
      const a = e.target.closest('[data-act],.rd-x');
      if (!a) return;
      if (a.classList.contains('rd-x')) return hidePop();
      if (a.dataset.act === 'say') say(r.base);
      if (a.dataset.act === 'note') {
        hidePop();
        onNote();
      }
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
    // fuera del texto se cierra (la barra de selección no cuenta: su «Traducir» la abre)
    if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.rd-text, .rd-selbar'))
      hidePop();
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

  // P.notes[id] = {title, href, level, general, marks: [{id, color, quote, note, at,
  // ranges: [{p, s, e}]}]}; p = párrafo, s/e = posición dentro de su texto.
  const COLORS = ['yellow', 'green', 'blue', 'pink'];
  const doc = (o) =>
    P.notes[o.id] ||
    (P.notes[o.id] = { title: o.noteTitle, href: o.href, level: o.level, general: '', marks: [] });
  const tidyNotes = (id) => {
    const d = P.notes[id];
    if (d && !d.general && !d.marks.length) delete P.notes[id];
  };
  const offsetIn = (el, node, off) => {
    const r = document.createRange();
    r.setStart(el, 0);
    r.setEnd(node, off);
    return r.toString().length;
  };
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

  async function textsView(filter) {
    const ix = await index();
    const ok = (l) => ix.levels.includes(l),
      lv = ok(filter) ? filter : ok(P.lvl) ? P.lvl : ix.levels[0];
    P.lvl = lv;
    save();
    const list = ix.texts.filter((t) => t.level === lv);
    const doneN = (l) => ix.texts.filter((t) => t.level === l && P.t[t.id]).length;
    // el camino: brilla la primera lectura del nivel que todavía no se hizo
    const next = list.find((t) => !P.t[t.id]);
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
            `<a class="rd-card ${p ? 'done' : ''} ${t === next ? 'glow' : ''}" href="#/texto/${t.id}">` +
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

  // o: {kind, id, noteTitle, href, level, kicker, title, sub, paragraphs|blocks, glossary, questions, task,
  //     back, backLabel, prev, next, summary, prevBest, onScore}
  async function readerShell(o) {
    GLOSS = {};
    GLOSS1 = {};
    (o.glossary || []).forEach((g) => {
      const k = norm(g.en),
        first = k.split(' ')[0];
      GLOSS[k] = g.es;
      if (first !== k && !GLOSS1[first]) GLOSS1[first] = k;
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
      (canSpeak ? `<section class="tx-sec" id="rd-shadow"></section>` : '') +
      `<section class="tx-sec rd-quiz" id="rd-quiz"></section>` +
      `<section class="tx-sec" id="rd-cloze"></section>` +
      (o.summaryModel ? `<section class="tx-sec" id="rd-sum"></section>` : '') +
      `<section class="tx-sec" id="rd-flu"></section>` +
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

    const panel = app.querySelector('#rd-notes');
    const drawNotes = () => {
      const nd = P.notes[o.id],
        marks = nd ? nd.marks.slice() : [];
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
          : `<p class="rd-empty"><small>${T('markHint')}</small></p>`) +
        `<p class="rd-close-hint"><small>${T('closeHint')}</small></p>`;
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

    const sb = document.createElement('div');
    sb.className = 'rd-selbar';
    sb.hidden = true;
    document.body.appendChild(sb);
    selbar = sb;
    const overlaps = (ranges) =>
      doc(o).marks.some((m) =>
        m.ranges.some((a) => ranges.some((b) => a.p === b.p && a.s < b.e && b.s < a.e)),
      );
    const focusNote = (id) => {
      const t = panel.querySelector(`[data-mk="${id}"] .rd-note-in`);
      if (t) {
        t.scrollIntoView({ block: 'center', behavior: 'smooth' });
        t.focus({ preventScroll: true });
      }
    };
    const addMark = (color, focus) => {
      const sr = selRanges(txt);
      if (!sr || overlaps(sr.ranges)) return;
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
      if (focus) focusNote(m.id);
    };
    // La barra y el diccionario dependen solo de la selección: al cambiarla se actualizan
    // los dos, y al deseleccionar (un toque en el texto) se cierran los dos.
    const showBar = () => {
      const sr = selRanges(txt);
      if (!sr) {
        sb.hidden = true;
        if (txt.isConnected) hidePop();
        return;
      }
      const words = sr.quote.split(/\s+/).length;
      const marked = overlaps(sr.ranges);
      sb.innerHTML =
        (marked
          ? `<span class="rd-sb-msg">${T('alreadyMarked')}</span>`
          : `<span class="rd-dots">` +
            COLORS.map(
              (c) =>
                `<button type="button" class="rd-dot c-${c}" data-color="${c}" aria-label="${T('markW')} · ${c}"></button>`,
            ).join('') +
            `</span><button type="button" class="tx-link" data-note>✎ ${T('noteAdd')}</button>`) +
        (words <= 4 && (words > 1 || narrow())
          ? `<button type="button" class="tx-link" data-tr>${T('translateW')}</button>`
          : '') +
        `<button type="button" class="rd-x" data-close aria-label="${T('close')}">✕</button>`;
      const rect = window.getSelection().getRangeAt(0).getBoundingClientRect(),
        cx = rect.left + rect.width / 2;
      // Junto al puntero, no debajo de toda la selección: con un párrafo entero la barra
      // quedaba al final y a veces fuera de la pantalla.
      const pt = selPoint() || { x: cx, y: rect.bottom + 6 };
      sb.hidden = false;
      // debajo de la selección (en el móvil, arriba queda el menú del sistema)
      place(sb, pt.x, pt.y, 300);
      // si abajo no entra, va arriba del puntero
      const h = sb.offsetHeight;
      let top = pt.y + 14;
      if (top + h > window.innerHeight - 8) {
        top = Math.max(8, pt.y - h - 34);
        sb.style.top = top + window.scrollY + 'px';
      }
      sb.anchor = { x: pt.x, y: top - 14 };
      const openMeaning = () => {
        const sel = window.getSelection(),
          mk = sel.anchorNode && sel.anchorNode.parentElement.closest('.rd-mk'),
          at = wordAt(cx, rect.top + rect.height / 2);
        showWord(sr.quote, pt.x, sb.anchor.y, at ? at.ctx : '', mk && (() => focusNote(mk.dataset.mk)));
      };
      if (narrow()) hidePop();
      // una sola palabra (doble clic): el significado se abre junto a la barra
      else if (words === 1) openMeaning();
      else if (words <= 4) {
        // frase: se abre sola solo si está en el diccionario («get up», «nice to meet you»);
        // si no, queda «Traducir» para ir a los diccionarios externos
        hidePop();
        lookup(sr.quote).then((r) => {
          const now = selRanges(txt);
          if (!r || !r.tr || !now || now.quote !== sr.quote) return;
          const tr = sb.querySelector('[data-tr]');
          if (tr) tr.remove();
          openMeaning();
        });
      } else {
        hidePop();
      }
      sb.onmousedown = (e) => e.preventDefault(); // no perder la selección al tocar la barra
      sb.onclick = (e) => {
        // su ✕ cierra solo la barra, igual que el ✕ del diccionario cierra solo el diccionario
        if (e.target.closest('[data-close]')) return (sb.hidden = true);
        const c = e.target.closest('[data-color]');
        if (c) return addMark(c.dataset.color, false);
        if (e.target.closest('[data-note]')) return addMark('yellow', true);
        if (e.target.closest('[data-tr]')) {
          sb.hidden = true;
          showWord(sr.quote, pt.x, sb.anchor.y, '');
        }
      };
    };
    // Dónde terminó la selección: donde se soltó el mouse, o (teclado / pantalla táctil)
    // el extremo de la selección que se movió último.
    let lastUp = null;
    document.onmouseup = (e) => {
      lastUp = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    const selPoint = () => {
      if (lastUp && Date.now() - lastUp.t < 1000) return { x: lastUp.x, y: lastUp.y + 12 };
      const sel = window.getSelection();
      if (!sel.focusNode) return null;
      const r = document.createRange();
      try {
        r.setStart(sel.focusNode, sel.focusOffset);
      } catch {
        return null;
      }
      const b = r.getClientRects()[0] || r.getBoundingClientRect();
      return b && (b.top || b.bottom) ? { x: b.left, y: b.bottom + 6 } : null;
    };
    let selT = null;
    document.onselectionchange = () => {
      clearTimeout(selT);
      selT = setTimeout(showBar, 220);
    };
    // tocar fuera o Esc deselecciona, así la barra y el diccionario se van juntos
    const closeSel = () => {
      window.getSelection().removeAllRanges();
      sb.hidden = true;
      hidePop();
    };
    document.onkeydown = (e) => {
      if (e.key === 'Escape' && (!sb.hidden || !pop.hidden)) closeSel();
    };
    // un toque fuera del texto, la barra y el diccionario cierra los dos (tocar un botón o una
    // zona no seleccionable no siempre borra la selección, y la barra quedaba abierta)
    document.onmousedown = (e) => {
      if (sb.hidden && pop.hidden) return;
      if (!txt.contains(e.target) && !sb.contains(e.target) && !pop.contains(e.target)) closeSel();
    };
    // un toque en el texto no abre nada: solo cierra lo que estaba abierto de la selección anterior
    txt.addEventListener('mousedown', () => {
      sb.hidden = true;
      hidePop();
    });

    quiz(app.querySelector('#rd-quiz'), o);
    const sents = blocks.flatMap((b) => sentencesOf(b.text));
    if (canSpeak) shadow(app.querySelector('#rd-shadow'), sents);
    cloze(app.querySelector('#rd-cloze'), o, sents, d);
    if (o.summaryModel) summary(app.querySelector('#rd-sum'), o);
    fluency(app.querySelector('#rd-flu'), o, txt);
  }
  let selbar = null;

  // Escuchar y repetir (shadowing), una oración por vez
  function shadow(box, sents) {
    let i = 0,
      stopRec = null,
      url = null;
    const draw = () => {
      box.innerHTML =
        `<span class="kicker blue">${T('shH')}</span><p class="tx-sec-lede">${T('shLede')}</p>` +
        `<div class="card rd-sh"><small>${T('shOf', { i: i + 1, n: sents.length })}</small>` +
        `<p class="rd-sh-s">${esc(sents[i])}</p><div class="tx-row-btns">` +
        `<button type="button" class="tx-btn" data-a="say">🔊 ${T('shListen')}</button>` +
        `<button type="button" class="tx-btn tx-alt" data-a="slow">🐢 ${T('shSlow')}</button>` +
        (canRec
          ? `<button type="button" class="tx-btn tx-alt" data-a="rec">🎙 ${T('shRec')}</button>`
          : '') +
        `</div><audio controls ${url ? `src="${url}"` : 'hidden'}></audio>` +
        `<div class="tx-row-btns rd-sh-nav">` +
        `<button type="button" class="tx-btn tx-alt" data-a="prev" ${i ? '' : 'disabled'}>${T('shPrev')}</button>` +
        `<button type="button" class="tx-btn tx-alt" data-a="next" ${i < sents.length - 1 ? '' : 'disabled'}>${T('shNext')}</button>` +
        `</div></div>`;
    };
    const go = (k) => {
      if (stopRec) return;
      i = k;
      if (url) URL.revokeObjectURL(url);
      url = null;
      draw();
    };
    box.onclick = async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'say') say(sents[i]);
      else if (a === 'slow') say(sents[i], 0.6);
      else if (a === 'prev') go(i - 1);
      else if (a === 'next') go(i + 1);
      else if (a === 'rec') {
        if (stopRec) {
          const s = stopRec;
          stopRec = null;
          if (url) URL.revokeObjectURL(url);
          url = await s();
          draw();
          return;
        }
        try {
          stopRec = await record();
        } catch (err) {
          b.textContent = T('shNoMic');
          b.disabled = true;
          return;
        }
        b.textContent = '■ ' + T('rtStop');
        const mine = stopRec;
        setTimeout(() => {
          if (stopRec === mine) b.click();
        }, 15000);
      }
    };
    draw();
  }

  // Completar huecos: oraciones del propio texto sin las palabras del glosario
  function cloze(box, o, sents, d) {
    const used = new Set(),
      items = [];
    (o.glossary || []).forEach((g) => {
      if (items.length >= 6) return;
      const re = new RegExp('\\b' + reEsc(g.en) + '\\b', 'i'),
        k = sents.findIndex((x, n) => !used.has(n) && re.test(x));
      if (k < 0) return;
      used.add(k);
      const m = sents[k].match(re);
      items.push({ k, s: sents[k], at: m.index, a: m[0], base: g.en, hint: glossMeaning(g, d) });
    });
    if (items.length < 2) return box.remove();
    items.sort((x, y) => x.k - y.k);
    const draw = () => {
      const res = new Array(items.length).fill(null);
      box.innerHTML =
        `<span class="kicker blue">${T('czH')}</span><p class="tx-sec-lede">${T('czLede')}</p>` +
        `<div class="tx-grid">` +
        items
          .map(
            (it, n) =>
              `<article class="tx-ex" data-n="${n}"><span class="tx-ex-n">${n + 1}</span><div class="tx-ex-box">` +
              `<div class="tx-q">${esc(it.s.slice(0, it.at))}<span class="tx-slot">` +
              `<input class="tx-in" autocomplete="off" autocapitalize="off" spellcheck="false" ` +
              `aria-label="${T('answerLabel')}"></span>${esc(it.s.slice(it.at + it.a.length))}</div>` +
              `<small class="rd-hint">${esc(it.hint)}</small>` +
              `<div class="tx-act"><button type="button" class="tx-btn">${T('check')}</button></div>` +
              `<div class="tx-fb wait">${T('answerToSee')}</div></div></article>`,
          )
          .join('') +
        `</div><div class="rd-cz-res"></div>`;
      box.querySelectorAll('.tx-ex').forEach((ex) => {
        const n = +ex.dataset.n,
          it = items[n],
          inp = ex.querySelector('input'),
          b = ex.querySelector('button'),
          fb = ex.querySelector('.tx-fb');
        const check = () => {
          if (!inp.value.trim()) return inp.focus();
          const v = norm(inp.value),
            ok = v === norm(it.a) || v === norm(it.base);
          inp.disabled = b.disabled = true;
          res[n] = ok;
          fb.className = 'tx-fb ' + (ok ? 'ok' : 'bad');
          fb.innerHTML = '<b>' + (ok ? T('correct') : T('answerIs') + ' ' + esc(it.a)) + '</b>';
          if (res.every((x) => x !== null))
            box.querySelector('.rd-cz-res').innerHTML =
              `<div class="tx-row-btns"><b class="tx-big">${res.filter(Boolean).length}/${items.length}</b>` +
              `<button type="button" class="tx-btn tx-alt">${T('restart')}</button></div>`;
        };
        b.onclick = check;
        inp.onkeydown = (e) => {
          if (e.key === 'Enter') check();
        };
      });
    };
    box.addEventListener('click', (e) => {
      if (e.target.closest('.rd-cz-res button')) draw();
    });
    draw();
  }

  // Resumen guiado (solo lecturas graduadas: los modelos están en extras.json)
  function summary(box, o) {
    const [sn, need] = { A1: ['2–3', 15], A2: ['3–4', 25], B1: ['4–5', 35], B2: ['5–6', 45] }[
      o.level
    ] || ['3–5', 25];
    box.innerHTML =
      `<span class="kicker blue">${T('smH')}</span><p class="tx-sec-lede">${T('smLede', { s: sn })}</p>` +
      `<textarea class="tx-in tx-ta" rows="5" placeholder="${T('writeHere')}">` +
      `${esc(P.sums[o.id] || '')}</textarea><p><small class="rd-sm-wc"></small></p>` +
      `<div class="tx-row-btns"><button type="button" class="tx-btn">${T('smCompare')}</button></div>` +
      `<p class="tx-warn rd-sm-warn"></p><div class="rd-sm-res"></div>`;
    const ta = box.querySelector('textarea'),
      wc = box.querySelector('.rd-sm-wc'),
      warn = box.querySelector('.rd-sm-warn');
    const count = () => (wc.textContent = T('wordCount', { n: wordCount(ta.value) }));
    count();
    ta.oninput = () => {
      P.sums[o.id] = ta.value;
      save();
      count();
    };
    box.querySelector('button').onclick = () => {
      const w = wordCount(ta.value);
      if (w < need) {
        warn.textContent = T('smNeed', { n: need, w });
        return ta.focus();
      }
      warn.textContent = '';
      box.querySelector('.rd-sm-res').innerHTML =
        `<div class="panel blue"><span class="kicker blue">${T('smModel')}</span>` +
        `<p>${esc(o.summaryModel)}</p>` +
        (canSpeak
          ? `<button type="button" class="tx-btn tx-alt tx-say" data-sm-say>🔊</button>`
          : '') +
        `<p><b>${T('smCheckH')}</b></p><ul class="tx-check">` +
        ['smC1', 'smC2', 'smC3', 'smC4']
          .map((k) => `<li><label><input type="checkbox"> ${T(k)}</label></li>`)
          .join('') +
        `</ul></div>`;
      const sb = box.querySelector('[data-sm-say]');
      if (sb) sb.onclick = () => say(o.summaryModel);
    };
  }

  // Fluidez: relectura cronometrada y volver a contarlo en 2:00 / 1:30 / 1:00
  function fluency(box, o, txt) {
    const ROUNDS = [120, 90, 60];
    box.innerHTML =
      `<span class="kicker blue">${T('fluH')}</span><div class="rd-flu">` +
      `<article class="card"><h3>${T('tmH')}</h3><p class="rd-flu-lede">${T('tmLede')}</p>` +
      `<div class="tx-row-btns"><button type="button" class="tx-btn" data-tm>${T('tmStart')}</button></div>` +
      `<p class="rd-tm-res"></p></article>` +
      `<article class="card"><h3>${T('rtH')}</h3><p class="rd-flu-lede">${T('rtLede')}</p>` +
      (canRec ? '' : `<p><small>${T('rtNoMic')}</small></p>`) +
      `<div class="rd-rt"></div></article></div>`;

    const tmRes = box.querySelector('.rd-tm-res'),
      tmBtn = box.querySelector('[data-tm]');
    const showSpeed = (msg) => {
      const hist = P.speed[o.id] || [];
      if (!hist.length) return (tmRes.textContent = msg || '');
      const last = hist[hist.length - 1].wpm,
        first = hist[0].wpm;
      tmRes.innerHTML =
        (msg ? esc(msg) + ' ' : '') +
        `<b>${T('tmRes', { w: last })}</b>` +
        (hist.length > 1
          ? ` · ${T('tmFirst', { w: first })} (${last >= first ? '+' : ''}${Math.round(((last - first) / first) * 100)} %)`
          : '');
    };
    showSpeed();
    tmBtn.onclick = () => {
      const t0 = Date.now(),
        bar = document.createElement('div');
      bar.className = 'rd-timer';
      bar.innerHTML = `<span>⏱ <b>0:00</b></span><button type="button" class="tx-btn">${T('tmStop')}</button>`;
      document.body.appendChild(bar);
      const iv = setInterval(() => {
        bar.querySelector('b').textContent = clock((Date.now() - t0) / 1000);
      }, 500);
      const end = () => {
        clearInterval(iv);
        bar.remove();
      };
      onLeave(end);
      tmBtn.disabled = true;
      txt.scrollIntoView({ block: 'start', behavior: 'smooth' });
      bar.querySelector('button').onclick = () => {
        end();
        tmBtn.disabled = false;
        const secs = (Date.now() - t0) / 1000,
          wpm = Math.round(o.words / (secs / 60));
        // más de 600 palabras por minuto no es leer: probablemente se apretó sin querer
        if (!o.words || wpm > 600) return showSpeed(T('tmTooFast'));
        (P.speed[o.id] = P.speed[o.id] || []).push({ wpm, at: Date.now() });
        save();
        showSpeed();
        box.scrollIntoView({ block: 'start', behavior: 'smooth' });
      };
    };

    const rt = box.querySelector('.rd-rt');
    let urls = [],
      r = 0;
    const drawRt = () => {
      rt.innerHTML =
        urls
          .map(
            (u, k) =>
              `<p><small>${T('rtRec', { n: k + 1 })}</small><br><audio controls src="${u}"></audio></p>`,
          )
          .join('') +
        (r < ROUNDS.length
          ? `<div class="tx-row-btns"><button type="button" class="tx-btn" data-rt>` +
            `${T('rtGo', { n: r + 1, t: clock(ROUNDS[r]) })}</button></div>`
          : `<p class="tx-news">${T(urls.length ? 'rtDone' : 'rtDoneNoMic')}</p>` +
            `<div class="tx-row-btns"><button type="button" class="tx-btn tx-alt" data-rt-again>${T('restart')}</button></div>`);
    };
    rt.onclick = async (e) => {
      if (e.target.closest('[data-rt-again]')) {
        urls.forEach((u) => URL.revokeObjectURL(u));
        urls = [];
        r = 0;
        return drawRt();
      }
      if (!e.target.closest('[data-rt]')) return;
      let stop = null;
      if (canRec)
        try {
          stop = await record();
        } catch (err) {}
      let left = ROUNDS[r];
      rt.innerHTML =
        `<p class="rd-rt-clock">${clock(left)}</p><p><small>${T('roundN', { n: r + 1 })}</small></p>` +
        `<div class="tx-row-btns"><button type="button" class="tx-btn tx-alt" data-rt-stop>■ ${T('rtStop')}</button></div>`;
      const face = rt.querySelector('.rd-rt-clock');
      const finish = async () => {
        clearInterval(iv);
        if (stop) urls.push(await stop());
        r++;
        drawRt();
      };
      const iv = setInterval(() => {
        left--;
        face.textContent = clock(left);
        if (left <= 0) finish();
      }, 1000);
      onLeave(() => clearInterval(iv));
      rt.querySelector('[data-rt-stop]').onclick = finish;
    };
    drawRt();
  }

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
      o.prevBest = Math.max(o.prevBest || 0, s); // «Reiniciar» muestra el mejor puntaje actualizado
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
            : shuffled(q.options, q.q).map((x) => [x, x]);
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

  let EXTRAS = null;
  const extras = () => EXTRAS || (EXTRAS = J(C + 'extras.json').catch(() => ({})));
  async function textView(id) {
    const [t, ix, ex] = await Promise.all([J(R + 'texts/' + id + '.json'), index(), extras()]);
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
      words: t.words,
      summaryModel: (ex.summaries || {})[id] || null,
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
      words: c.words,
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

  function wordsView() {
    GLOSS = {}; // el glosario del último texto abierto no vale para las palabras guardadas
    GLOSS1 = {};
    app.innerHTML =
      head(
        T('selfK'),
        T('myWordsTitle'),
        P.words.length ? T('myWordsNote', { n: P.words.length }) : '',
      ) +
      tabs('palabras') +
      (P.words.length
        ? (() => {
            const n = P.words.filter(isDue).length;
            return n
              ? `<div class="tx-row-btns rd-rv-go"><a class="tx-btn" href="#/repaso">${T('rvBtn', { n })}</a></div>`
              : `<p class="rd-rv-go"><small>${T('rvNone')}</small></p>`;
          })()
        : '') +
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

  const isDue = (w) => (w.due ?? 0) <= today();
  // Repaso espaciado de «Mis palabras»: se escribe la palabra a partir del significado (recordar
  // produciendo retiene más que reconocer)
  async function reviewView() {
    const q = P.words.filter(isDue).sort(() => Math.random() - 0.5);
    let i = 0,
      ok = 0;
    const card = async () => {
      if (i >= q.length) {
        app.innerHTML =
          head(T('selfK'), T('rvH'), q.length ? T('rvResult', { o: ok, n: q.length }) : T('rvNone')) +
          tabs('palabras') +
          `<div class="tx-row-btns"><a class="tx-btn" href="#/palabras">${T('myWordsTitle')}</a></div>`;
        return;
      }
      const w = q[i],
        before = { box: w.box, due: w.due };
      const meaning =
        w.lg === L() ? w.tr : L() === 'es' ? w.es : ((await lookup(w.w)) || {}).tr || w.tr || w.es;
      const re = new RegExp('\\b' + reEsc(w.w) + '\\b', 'i'),
        ctx =
          w.ctx && re.test(w.ctx)
            ? esc(w.ctx).replace(new RegExp('\\b' + reEsc(esc(w.w)) + '\\b', 'i'), '<b class="tx-gap">_____</b>')
            : '';
      app.innerHTML =
        head(T('selfK'), T('rvH'), T('rvLede')) +
        tabs('palabras') +
        `<div class="card rd-rv"><small>${i + 1} / ${q.length}</small>` +
        `<p class="rd-rv-m">${esc(meaning || '—')}</p>` +
        (ctx ? `<p class="rd-rv-ctx"><i>${ctx}</i></p>` : '') +
        `<div class="rd-fill"><input class="tx-in" autocomplete="off" autocapitalize="off" spellcheck="false" ` +
        `placeholder="${T('rvPh')}" aria-label="${T('rvPh')}"><button type="button" class="tx-btn">${T('check')}</button></div>` +
        `<div class="tx-fb wait">${T('answerToSee')}</div><div class="tx-row-btns rd-rv-act"></div></div>`;
      const inp = app.querySelector('.rd-rv input'),
        b = app.querySelector('.rd-rv .rd-fill button'),
        fb = app.querySelector('.rd-rv .tx-fb'),
        act = app.querySelector('.rd-rv-act');
      inp.focus();
      const grade = (good) => {
        const prev = before.box || 0;
        w.box = good ? Math.min(INT.length, prev + 1) : 1;
        w.due = today() + INT[w.box - 1];
        save();
      };
      const next = () => {
        i++;
        card();
      };
      const check = () => {
        if (!inp.value.trim()) return inp.focus();
        const good = norm(inp.value) === norm(w.w);
        inp.disabled = b.disabled = true;
        grade(good);
        if (good) ok++;
        say(w.w);
        fb.className = 'tx-fb ' + (good ? 'ok' : 'bad');
        fb.innerHTML = '<b>' + (good ? T('correct') : T('answerIs') + ' ' + esc(w.w)) + '</b>';
        act.innerHTML =
          (good ? '' : `<button type="button" class="tx-btn tx-alt" data-typo>${T('rvTypo')}</button>`) +
          `<button type="button" class="tx-btn" data-next>${T('rvNext')}</button>`;
        const typo = act.querySelector('[data-typo]');
        if (typo)
          typo.onclick = () => {
            grade(true);
            ok++;
            next();
          };
        act.querySelector('[data-next]').onclick = next;
        act.querySelector('[data-next]').focus();
      };
      b.onclick = check;
      inp.onkeydown = (e) => {
        if (e.key === 'Enter') check();
      };
    };
    await card();
  }

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

  async function route() {
    stopRead();
    hidePop();
    leaving.forEach((fn) => fn());
    leaving = [];
    if (selbar) {
      selbar.remove();
      selbar = null;
    }
    document.onselectionchange = null;
    document.onkeydown = null;
    document.onmousedown = null;
    document.onmouseup = null;
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
      else if (p[0] === 'repaso') await reviewView();
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
