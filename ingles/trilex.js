(() => {
  'use strict';
  const C = '../content/en/',
    K = 'trilex_en_v1',
    INT = [1, 3, 7, 14, 30, 60]; // días entre repasos (cajas de Leitner)
  const app = document.getElementById('app'),
    $ = (s) => app.querySelector(s);

  const day = () => Math.floor(Date.now() / 864e5);
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length; i > 1; ) {
      const j = (Math.random() * i--) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const h = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const btn = (label, fn, cls = '') => {
    const b = h('button', 'tx-btn ' + cls, label);
    b.type = 'button';
    if (fn) b.onclick = fn;
    return b;
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const pct = (x) => Math.round(x * 100) + ' %';
  const fmt = (x) => String(Math.round(x * 10) / 10);
  const bar = (f) => `<span class="bar"><span style="width:${Math.round(f * 100)}%"></span></span>`;

  // Los textos de varias líneas vienen en el JSON como lista de líneas (archivos legibles);
  // aquí se vuelven a unir en un único texto.
  const MULTILINE = new Set(['md', 'md_es', 'text', 'es', 'model_answer']);
  const joinLines = (k, v) =>
    MULTILINE.has(k) && Array.isArray(v) && v.every((x) => typeof x === 'string')
      ? v.join('\n')
      : v;
  const J = (u) =>
    fetch(C + u).then((r) => {
      if (!r.ok) throw new Error(u + ' (' + r.status + ')');
      return r.text().then((t) => JSON.parse(t, joinLines));
    });
  const sent = (a) => a.join(' ').replace(/ ([.,?!;:])/g, '$1');
  const T = (k, v) => (window.TXI ? TXI.t(k, v) : k),
    ES = () => !window.TXI || TXI.lang === 'es';

  let OV = {},
    OVlang = null;
  const lvOf = (id) => (String(id).match(/^en-(a1|a2|b1|b2)/) || [])[1];
  const ovPack = (id) => OV[lvOf(id)] || null;
  const ovL = (id) => {
    const p = ovPack(id);
    return (p && p.lessons[id]) || null;
  };
  const ovU = (id) => {
    const p = ovPack(id);
    return (p && p.units[id]) || null;
  };
  const ovV = (id) => {
    const p = ovPack(id);
    return (p && p.vocab[id]) || null;
  };
  async function loadOv() {
    const lg = window.TXI ? TXI.lang : 'es';
    if (lg === OVlang) return;
    OVlang = lg;
    OV = {};
    if (lg === 'es') return;
    try {
      const ix = await J('i18n/index.json'),
        lvls = (ix.langs || {})[lg] || [];
      const packs = await Promise.all(
        lvls.map((l) => J('i18n/' + lg + '/' + l + '.json').catch(() => null)),
      );
      lvls.forEach((l, i) => {
        if (packs[i]) OV[l] = packs[i];
      });
    } catch (e) {}
  }
  const subTitle = (id, es, target) => {
    if (ES()) return es || '';
    const t = id && id.includes('-l') ? (ovL(id) || {}).title : ovU(id);
    return t && t !== target ? t : '';
  };
  const exTr = (s) => {
    if (typeof s !== 'string' || !s) return s;
    for (const lv in OV) {
      const d = OV[lv].ex;
      if (d && Object.prototype.hasOwnProperty.call(d, s)) return d[s];
    }
    return s;
  };
  const FB_PREFIX = /^(¡Correcto!|Revisa esto:)\s*/;
  const fbTr = (x) => {
    if (typeof x !== 'string') return x;
    const m = x.match(FB_PREFIX);
    return m ? m[1] + ' ' + exTr(x.slice(m[0].length)) : exTr(x);
  };
  // Copia traducida de un ejercicio. Las respuestas en inglés no cambian; las opciones en
  // español se traducen igual en "options" y en "answer", así la corrección sigue funcionando.
  function localizeEx(e) {
    if (ES() || !e) return e;
    const x = JSON.parse(JSON.stringify(e)),
      list = (a) => (Array.isArray(a) ? a.map(exTr) : a);
    x.prompt = exTr(x.prompt);
    x.situation_es = exTr(x.situation_es);
    if (x.feedback) {
      x.feedback.correct = fbTr(x.feedback.correct);
      x.feedback.incorrect = fbTr(x.feedback.incorrect);
    }
    x.self_check_es = list(x.self_check_es);
    x.options = list(x.options);
    if (Array.isArray(x.answer)) x.answer = x.answer.map(exTr);
    (x.items || []).forEach((i) => {
      if (i.tip_es) i.tip_es = exTr(i.tip_es);
    });
    (x.turns || []).forEach((t) => {
      if (t.why_es) t.why_es = exTr(t.why_es);
    });
    (x.pairs || []).forEach((p) => {
      p.right = exTr(p.right);
    });
    return x;
  }
  const localizeExam = (E) =>
    ES()
      ? E
      : Object.assign({}, E, {
          exercises: E.exercises.map(localizeEx),
          optional_tasks: (E.optional_tasks || []).map(localizeEx),
        });
  const meaning = (w) =>
    (ES() ? w.translation_es || w.es : ovV(w.id) || w.translation_es || w.es) || '';
  function localize(L) {
    if (ES()) return L;
    const o = ovL(L.id),
      C = JSON.parse(JSON.stringify(L)),
      en = TXI.lang === 'en';
    const n = C.input || {};
    (n.glossary || []).forEach((g) => {
      g.es = meaning(g);
    });
    if (n.lines)
      n.lines.forEach((l, i) => {
        l.es = en ? '' : o && o.lines ? o.lines[i] : l.es;
      });
    if (n.text) n.es = en ? '' : o && o.text ? o.text : n.es;
    if (o) {
      C.title.es = o.title && o.title !== C.title.target ? o.title : '';
      if (o.objective) C.objective = o.objective;
      if (o.warmup && C.warmup) C.warmup.prompt_es = o.warmup;
      if (o.recap) n.recap_es = o.recap;
      if (o.md) C.explanation.md_es = o.md;
      if (o.mist)
        C.explanation.common_mistakes_es = (C.explanation.common_mistakes_es || []).map((m, i) =>
          Object.assign(m, { note: o.mist[i] || m.note }),
        );
      C.explanation.false_friends = []; // los falsos amigos son específicos del español
    } else C.title.es = '';
    ((C.explanation && C.explanation.common_mistakes_es) || []).forEach((m) => {
      m.wrong = exTr(m.wrong);
      m.right = exTr(m.right);
    });
    C.exercises = (C.exercises || []).map(localizeEx);
    if (C.summary && C.summary.key_phrases) C.summary.key_phrases = C.summary.key_phrases.map(exTr);
    return C;
  }
  const fbTxt = (x) =>
    String(x || '')
      .replace(/^¡Correcto!/, T('correctEx'))
      .replace(/^Revisa esto:/, T('reviewThis'));

  const fresh = () => ({
    done: {},
    srs: {},
    exams: {},
    placement: null,
    open: false,
    secs: {},
    goal: 20,
  });
  let S = {};
  try {
    S = JSON.parse(localStorage.getItem(K)) || {};
  } catch (e) {}
  S = Object.assign(fresh(), S);
  if (!S.exams) S.exams = S.exam ? { A1: S.exam } : {}; // migra el examen único antiguo (A1)
  const save = () => {
    try {
      localStorage.setItem(K, JSON.stringify(S));
    } catch (e) {}
  };

  const dkey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  let lastAct = 0,
    lastSave = 0;
  const tick = () => {
    // suma el tiempo entre interacciones (pausas de más de 2 min no cuentan)
    const now = Date.now();
    if (lastAct && now - lastAct < 120000) {
      const k = dkey(new Date());
      S.secs[k] = (S.secs[k] || 0) + (now - lastAct) / 1000;
      if (now - lastSave > 5000) {
        save();
        lastSave = now;
      }
    }
    lastAct = now;
  };
  ['click', 'keydown'].forEach((ev) => document.addEventListener(ev, tick, true));
  const minsToday = () => Math.floor((S.secs[dkey(new Date())] || 0) / 60);
  const streak = () => {
    // días seguidos cumpliendo la meta (si hoy aún no, cuenta desde ayer)
    const ok = (k) => (S.secs[k] || 0) >= S.goal * 60,
      d = new Date();
    let n = 0;
    if (!ok(dkey(d))) d.setDate(d.getDate() - 1);
    while (ok(dkey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  const say = (t, slow) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-GB';
    u.rate = slow ? 0.6 : 0.9;
    speechSynthesis.speak(u);
  };
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-say]');
    if (s) say(s.dataset.say, s.dataset.slow);
  });
  const sayBtn = (t, l = '🔊') =>
    `<button type="button" class="tx-btn tx-alt tx-say" data-say="${esc(t)}" aria-label="${T('listen')}">${l}</button>`;
  const audioBar = (t) =>
    sayBtn(t, '🔊 ' + T('listen')) +
    ` <button type="button" class="tx-btn tx-alt tx-say" data-slow="1" data-say="${esc(t)}">` +
    `🐢 ${T('speedSlow')}</button>`;

  const norm = (s, cs) => {
    s = String(s).replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
    if (!cs) s = s.toLowerCase();
    return s
      .replace(/[.?!]+$/, '')
      .replace(/'/g, '')
      .trim();
  };

  const md = (t) => {
    const I = (s) =>
      esc(s)
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<i>$1</i>');
    const L = t.split('\n'),
      li = /^\s*(-|\d+\.) /;
    let out = '',
      i = 0;
    while (i < L.length) {
      const l = L[i];
      if (/^\s*\|/.test(l)) {
        const r = [];
        while (i < L.length && /^\s*\|/.test(L[i])) r.push(L[i++]);
        const rows = r
          .filter((x) => !/^\s*\|[\s:|-]+\|\s*$/.test(x))
          .map((x) =>
            x
              .trim()
              .replace(/^\||\|$/g, '')
              .split('|')
              .map((c) => I(c.trim())),
          );
        const tr = (c, k) =>
          '<tr>' + c.map((d) => (k ? `<td>${d}</td>` : `<th>${d}</th>`)).join('') + '</tr>';
        out +=
          '<div class="tx-scroll"><table class="tx-table">' +
          rows.map(tr).join('') +
          '</table></div>';
      } else if (li.test(l)) {
        const o = /^\s*\d/.test(l),
          r = [];
        while (i < L.length && li.test(L[i])) r.push(L[i++].replace(li, ''));
        out +=
          (o ? '<ol>' : '<ul>') +
          r.map((x) => '<li>' + I(x) + '</li>').join('') +
          (o ? '</ol>' : '</ul>');
      } else {
        if (l.trim()) out += '<p>' + I(l) + '</p>';
        i++;
      }
    }
    return out;
  };

  const allTr = (g) => ES() || g.every((w) => ovV(w.id));
  const glossRow = (w, extra = '') =>
    `<tr><td>${sayBtn(w.lemma)}</td><td><b>${esc(w.lemma)}</b> <small>${esc(w.pos)}</small></td>` +
    `<td class="tx-ipa">${esc(w.ipa)}</td><td>${esc(meaning(w))}</td><td>${esc(w.example)}</td>${extra}</tr>`;
  const glossHead = (g, extra = '') =>
    `<tr><th></th><th>${T('colWord')}</th><th>${T('colIPA')}</th>` +
    `<th>${T(allTr(g) ? 'colMeaningTr' : 'colMeaning')}</th><th>${T('colExample')}</th>${extra}</tr>`;
  const gloss = (g) =>
    g && g.length
      ? `<h3>${T('vocabH')}</h3><div class="tx-scroll"><table class="tx-table">` +
        glossHead(g) +
        g.map((w) => glossRow(w)).join('') +
        '</table></div>'
      : '';
  const inputHTML = (n, plain) => {
    let s = '';
    if (n.type === 'dialogue')
      s = n.lines
        .map(
          (l) =>
            `<div class="tx-line">${plain ? '' : sayBtn(l.text)}` +
            `<p><b>${esc(l.speaker)}:</b> ${esc(l.text)}` +
            (l.es ? `<br><small>${esc(l.es)}</small>` : '') +
            `</p></div>`,
        )
        .join('');
    else if (n.type === 'text')
      s =
        `<div class="tx-line">${plain ? '' : sayBtn(n.text)}<p>${esc(n.text)}` +
        (n.es ? `<br><small>${esc(n.es)}</small>` : '') +
        `</p></div>`;
    else if (n.recap_es) s = '<p>' + esc(n.recap_es) + '</p>';
    return s + (plain ? '' : gloss(n.glossary));
  };

  const R = {};
  const reviewHTML = (e) => {
    const r = e.review;
    if (!r) return T('reviewTheory');
    const o = r.lesson && !ES() ? ovL(r.lesson) : null;
    return (
      '<b>' +
      esc(o ? o.topic || o.title : r.topic_es) +
      '</b>' +
      (r.lesson
        ? ' <small>· ' +
          T('unitLesson', { u: r.unit, l: r.order }) +
          ': ' +
          esc(o ? o.title : r.lesson_es) +
          '</small>'
        : '')
    );
  };
  // Dibuja un ejercicio en "box" y llama a next(puntaje, ejercicio) al responderlo.
  // o.exam: sin respuesta, solo el tema a repasar · o.quiet: sin corrección visible ·
  // o.optional: autoevaluación sin nota · o.dk: opción «No lo sé» · o.grid: sin botón
  // «Continuar» (la cuadrícula de práctica sigue sola).
  function runEx(e, box, next, o = {}) {
    box.innerHTML = '';
    const q = h('div', 'tx-q', esc(e.prompt)),
      b = h('div', 'tx-body'),
      fb = h('div', 'tx-fb'),
      act = h('div', 'tx-act');
    if (e.passage) box.append(h('div', 'tx-sit', esc(e.passage)));
    box.append(q);
    if (e.refers_to_input && o.input)
      box.append(
        h(
          'details',
          'tx-ref',
          '<summary>' + T('seeText') + '</summary>' + inputHTML(o.input, true),
        ),
      );
    box.append(b, act, fb);
    if (o.grid && !o.quiet) {
      fb.className = 'tx-fb wait';
      fb.textContent = T('answerToSee');
    }
    let done = 0;
    const fin = (s, x = '') => {
      if (done) return;
      done = 1;
      if (o.quiet) return next(s, e);
      const selfCheck = o.optional || e.type === 'writing' || e.type === 'pronunciation';
      fb.className = 'tx-fb ' + (selfCheck ? 'self' : s >= 1 ? 'ok' : s > 0 ? 'half' : 'bad');
      const why = e.feedback ? e.feedback.incorrect.replace(/^Revisa esto:\s*/, '') : '';
      let head;
      if (o.exam) {
        x = '';
        head =
          s >= 1
            ? '<b>' + esc(e.feedback ? fbTxt(e.feedback.correct) : T('correctEx')) + '</b>'
            : '<b>' + T('reviewThis') + '</b> ' + reviewHTML(e);
      } else if (selfCheck) head = why ? '<b>' + esc(why) + '</b>' : '';
      else
        head = e.feedback
          ? '<b>' + esc(fbTxt(s >= 1 ? e.feedback.correct : e.feedback.incorrect)) + '</b>'
          : '';
      fb.innerHTML = head + x;
      if (o.grid) {
        act.replaceChildren();
        next(s, e);
      } else act.replaceChildren(btn(T('continue'), () => next(s, e)));
    };
    const ask = (fn, l = T('check')) => act.replaceChildren(btn(l, fn));
    R[e.type](e, b, fin, ask, q, o);
  }

  R.multiple_choice = R.listening = (e, b, fin, ask, q, o) => {
    if (e.type === 'listening') b.append(h('p', 'tx-audio', audioBar(e.audio_text)));
    const w = h('div', 'tx-opts');
    b.append(w);
    const opts = (e.fixed ? e.options : shuffle(e.options)).map((t) => [t, btn(t, null, 'tx-opt')]);
    if (o.dk) opts.push(['', btn(T('dontKnow'), null, 'tx-opt')]);
    opts.forEach(([t, x]) => {
      x.onclick = () => {
        const ok = e.answer.includes(t);
        if (!o.quiet) {
          opts.forEach(([u, y]) => {
            y.disabled = true;
            if (e.answer.includes(u) && (ok || !o.exam)) y.classList.add('ok');
          });
          if (!ok) x.classList.add('bad');
        }
        fin(
          ok ? 1 : 0,
          e.type === 'listening'
            ? '<p>' + T('transcript') + ' <i>' + esc(e.audio_text) + '</i></p>'
            : '',
        );
      };
      w.append(x);
    });
  };
  R.true_false = (e, b, fin, ask, q, o) =>
    R.multiple_choice(
      {
        ...e,
        fixed: 1,
        options: [T('trueW'), T('falseW')],
        answer: [e.answer[0] ? T('trueW') : T('falseW')],
      },
      b,
      fin,
      ask,
      q,
      o,
    );

  const typed = (e, b, fin, ask, q) => {
    const inp = h('input', 'tx-in');
    inp.type = 'text';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.setAttribute('autocapitalize', 'off');
    inp.setAttribute('aria-label', T('yourAnswer'));
    if (e.type === 'fill_blank')
      q.innerHTML = esc(e.prompt).replace('___', '<span class="tx-slot"></span>');
    if (e.type === 'error_correction') b.append(h('div', 'tx-wrong', esc(e.text)));
    if (e.audio_text) b.append(h('p', 'tx-audio', audioBar(e.audio_text)));
    (q.querySelector('.tx-slot') || b).append(inp);
    const go = () => {
      const v = inp.value;
      if (!v.trim()) return;
      inp.disabled = true;
      const ok = [...e.answer, ...(e.accepted_alternatives || [])].some(
        (a) => norm(a, e.case_sensitive) === norm(v, e.case_sensitive),
      );
      fin(
        ok ? 1 : 0,
        (ok ? '' : '<p>' + T('answerIs') + ' <b>' + esc(e.answer[0]) + '</b></p>') +
          (e.audio_text ? '<p>' + T('transcript') + ' <i>' + esc(e.audio_text) + '</i></p>' : ''),
      );
    };
    inp.onkeydown = (ev) => {
      if (ev.key === 'Enter') go();
    };
    ask(go);
  };
  R.fill_blank = R.translation = R.error_correction = R.dictation = typed;

  R.word_order = (e, b, fin, ask) => {
    const ans = h('div', 'tx-tray'),
      pool = h('div', 'tx-tray tx-pool');
    b.append(ans, pool);
    shuffle(e.tokens).forEach((t) => {
      const x = btn(t, () => (x.parentNode === pool ? ans : pool).append(x), 'tx-chip');
      pool.append(x);
    });
    ask(() => {
      const got = [...ans.children].map((x) => x.textContent);
      if (!got.length) return;
      [...ans.children, ...pool.children].forEach((x) => (x.disabled = true));
      const ok = got.join(' ') === e.answer.join(' ');
      fin(
        ok ? 1 : 0,
        ok ? '' : '<p>' + T('correctOrder') + ' <b>' + esc(sent(e.answer)) + '</b></p>',
      );
    });
  };

  R.matching = (e, b, fin) => {
    const cols = h('div', 'tx-cols'),
      l = h('div'),
      r = h('div');
    cols.append(l, r);
    b.append(cols);
    let sel = null,
      n = 0,
      mist = 0;
    const mk = (t, side) => {
      const x = btn(t, () => pick(x, side), 'tx-opt tx-pair');
      x.dataset.t = t;
      return x;
    };
    const pick = (x, side) => {
      if (side === 'l') {
        l.querySelectorAll('.sel').forEach((y) => y.classList.remove('sel'));
        sel = x;
        x.classList.add('sel');
        return;
      }
      if (!sel) return;
      const ok = e.pairs.some((p) => p.left === sel.dataset.t && p.right === x.dataset.t);
      if (ok) {
        [sel, x].forEach((y) => {
          y.classList.remove('sel');
          y.classList.add('ok');
          y.disabled = true;
        });
        sel = null;
        if (++n === e.pairs.length)
          fin(Math.max(0, 1 - mist / n), mist ? '<p>' + T('mistakes') + ' ' + mist + '</p>' : '');
      } else {
        mist++;
        x.classList.add('bad');
        setTimeout(() => x.classList.remove('bad'), 450);
      }
    };
    e.pairs.forEach((p) => l.append(mk(p.left, 'l')));
    shuffle(e.pairs.map((p) => p.right)).forEach((t) => r.append(mk(t, 'r')));
  };

  R.categorize = (e, b, fin) => {
    const cols = h('div', 'tx-cols'),
      l = h('div'),
      r = h('div');
    cols.append(l, r);
    b.append(h('p', 'tx-note', '<small>' + T('tapCategory') + '</small>'), cols);
    let sel = null,
      n = 0,
      mist = 0;
    shuffle(e.items).forEach((it) => {
      const x = btn(
        it.text,
        () => {
          if (x.disabled) return;
          l.querySelectorAll('.sel').forEach((y) => y.classList.remove('sel'));
          sel = x;
          x.classList.add('sel');
        },
        'tx-opt tx-pair',
      );
      x.dataset.c = it.category;
      x.dataset.t = it.text;
      l.append(x);
    });
    e.categories.forEach((c) => {
      const y = btn(
        c,
        () => {
          if (!sel || sel.disabled) return;
          if (sel.dataset.c === c) {
            sel.classList.remove('sel');
            sel.classList.add('ok');
            sel.disabled = true;
            sel.insertAdjacentHTML('beforeend', ' <small>→ ' + esc(c) + '</small>');
            sel = null;
            if (++n === e.items.length)
              fin(
                Math.max(0, 1 - mist / e.items.length),
                mist ? '<p>' + T('mistakes') + ' ' + mist + '</p>' : '',
              );
          } else {
            mist++;
            y.classList.add('bad');
            setTimeout(() => y.classList.remove('bad'), 450);
          }
        },
        'tx-opt tx-pair',
      );
      r.append(y);
    });
  };

  /* grabarse y compararse con el modelo (la grabación no sale del dispositivo) */
  const recorder = () => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder))
      return null;
    const wrap = h('span', 'tx-rec'),
      b = btn(T('recordMe'), null, 'tx-alt'),
      a = h('audio');
    a.controls = true;
    a.hidden = true;
    a.setAttribute('aria-label', T('yourRecording'));
    let mr = null,
      stream = null,
      chunks = [];
    b.onclick = async () => {
      if (mr && mr.state === 'recording') {
        mr.stop();
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        b.textContent = T('noMic');
        return;
      }
      chunks = [];
      mr = new MediaRecorder(stream);
      mr.ondataavailable = (ev) => chunks.push(ev.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (a.src) URL.revokeObjectURL(a.src);
        a.src = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
        a.hidden = false;
        b.textContent = T('recordAgain');
      };
      mr.start();
      b.textContent = T('stop');
      setTimeout(() => {
        if (mr && mr.state === 'recording') mr.stop();
      }, 8000);
    };
    wrap.append(b, ' ', a);
    return wrap;
  };
  R.pronunciation = (e, b, fin, ask) => {
    const can = !!recorder();
    b.append(h('p', 'tx-note', '<small>' + T(can ? 'pronTip' : 'pronTipNoRec') + '</small>'));
    e.items.forEach((i) => {
      const row = h(
        'div',
        'tx-row',
        sayBtn(i.text) +
          `<div><b>${esc(i.text)}</b> <span class="tx-ipa">${esc(i.ipa)}</span>` +
          `<br><small>${esc(i.tip_es)}</small></div>`,
      );
      const r = recorder();
      if (r) row.lastElementChild.append(h('br'), r);
      b.append(row);
    });
    ask(() => fin(1), T('practised'));
  };

  R.writing = (e, b, fin, ask) => {
    const t = h('textarea', 'tx-in tx-ta'),
      warn = h('p', 'tx-warn');
    t.rows = 4;
    t.setAttribute('aria-label', T('yourText'));
    const need = e.min_words || 8;
    b.append(t, h('small', '', T('minWords', { n: need })), warn);
    ask(() => {
      const ws = t.value.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)),
        uniq = new Set(ws.map((w) => w.toLowerCase().replace(/[^a-z']/g, ''))).size;
      if (ws.length < need || uniq < Math.max(3, Math.ceil(need / 3))) {
        warn.textContent = T('writeMore', {
          n: need,
          w: ws.length,
          rep: ws.length >= need ? T('tooRepeated') : '',
        });
        t.focus();
        return;
      }
      warn.textContent = '';
      t.disabled = true;
      fin(
        1,
        `<p><b>${T('modelCompare')}</b> ${esc(e.model_answer)}</p><p>${T('checkText')}</p>` +
          '<ul class="tx-check">' +
          e.self_check_es
            .map((x) => '<li><label><input type="checkbox"> ' + esc(x) + '</label></li>')
            .join('') +
          '</ul>',
      );
    }, T('compareModel'));
  };

  R.roleplay = (e, b, fin) => {
    b.append(h('p', 'tx-sit', esc(e.situation_es)));
    let i = 0,
      good = 0;
    const n = e.turns.filter((t) => t.choices).length;
    const step = () => {
      while (i < e.turns.length) {
        const t = e.turns[i++];
        if (!t.choices) {
          b.append(
            h('div', 'tx-turn', `<b>${esc(t.speaker)}:</b> ${esc(t.text)} ` + sayBtn(t.text)),
          );
          continue;
        }
        const w = h('div', 'tx-opts');
        b.append(h('div', 'tx-turn', '<b>' + T('you') + '</b>'), w);
        shuffle(t.choices.map((c, k) => [c, k])).forEach(([c, k]) => {
          const x = btn(
            c,
            () => {
              [...w.children].forEach((y) => {
                y.disabled = true;
                if (+y.dataset.k === t.best) y.classList.add('ok');
              });
              if (k === t.best) good++;
              else x.classList.add('bad');
              b.append(h('p', 'tx-why', esc(t.why_es)));
              step();
            },
            'tx-opt',
          );
          x.dataset.k = k;
          w.append(x);
        });
        return;
      }
      fin(n ? good / n : 1);
    };
    step();
  };

  const WIDE = new Set(['matching', 'categorize', 'roleplay', 'writing', 'pronunciation']);
  // o: {input, exam, optional, noScore, onDone(puntaje, total, resultados)}
  function practice(root, list, o = {}) {
    const n = list.length,
      res = new Array(n).fill(null);
    let sc = 0,
      answered = 0;
    root.innerHTML = '';
    const panel = h('div', 'tx-score'),
      grid = h('div', 'tx-grid');
    if (!o.noScore) root.append(panel);
    root.append(grid);
    const paint = () => {
      panel.innerHTML =
        `<div class="tx-score-n"><span class="kicker blue">${T('scoreH')}</span>` +
        `<b>${fmt(sc)} / ${n}</b></div>` +
        `<div class="tx-score-p"><small>${T('answeredNofM', { a: answered, n })}</small>${bar(answered / n)}</div>`;
      panel.append(
        btn(
          T('restart'),
          () => {
            practice(root, list, o);
            root.scrollIntoView({ block: 'start' });
          },
          'tx-alt',
        ),
      );
    };
    list.forEach((e, i) => {
      const card = h('article', 'tx-ex' + (WIDE.has(e.type) ? ' wide' : '')),
        box = h('div', 'tx-ex-box');
      card.append(h('span', 'tx-ex-n', String(i + 1)), box);
      grid.append(card);
      runEx(
        e,
        box,
        (s) => {
          if (res[i] !== null) return;
          res[i] = s;
          sc += s;
          answered++;
          card.classList.add('answered');
          paint();
          if (answered === n && o.onDone) o.onDone(sc, n, res);
        },
        { input: o.input, exam: o.exam, optional: o.optional, grid: true },
      );
    });
    paint();
  }

  let P,
    LV = [],
    flat = [],
    EX = {}, // extras.json: lectura y dictogloss por unidad
    RIX = { texts: [] }; // catálogo del lector, para el título de la lectura de cada unidad
  let redraw = null;
  const lvName = (c) => T('lv_' + c);
  const lvTotal = (lv) => lv.units.reduce((a, u) => a + u.lessons.length, 0);
  const unitOf = (l) => LV.find((v) => v.cefr === l.cefr).units.find((u) => u.lessons.includes(l));
  const head = (kicker, title, lede = '', back = true) =>
    `<header class="ph"><div class="ph-row"><span class="kicker blue">${kicker}</span>` +
    (back ? `<button type="button" class="pill" data-go="home">${T('mapBack')}</button>` : '') +
    `</div><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</header>`;
  const show = (html) => {
    app.innerHTML = html;
    scrollTo(0, 0);
  };
  const stepCard = (kicker, title, i, n) => {
    show(
      `<header class="ph"><div class="ph-row"><span class="kicker blue">${kicker}</span>` +
        `<button type="button" class="pill" id="tx-exit">✕ ${T('exitMap')}</button></div>` +
        `<h1>${title}</h1>${bar(n ? i / n : 1)}</header><div class="card tx-step" id="step"></div>`,
    );
    $('#tx-exit').onclick = () => {
      if (i === 0 || i >= n || confirm(T('exitConfirm'))) home();
    };
    return $('#step');
  };
  const dueItems = () => Object.keys(S.srs).filter((k) => S.srs[k].due <= day());
  // nivel superado en la prueba de nivel: sus lecciones quedan abiertas
  const free = (c) => !!(S.placement && S.placement.passed && S.placement.passed.includes(c));
  const unlocked = (l) => {
    const k = flat.indexOf(l),
      p = flat[k - 1];
    return (
      S.open || k === 0 || free(l.cefr) || !!S.done[p.id] || (p.cefr !== l.cefr && free(p.cefr))
    );
  };
  const examOpen = (lv) =>
    lv.exam &&
    lv.exam.status === 'ready' &&
    (S.open ||
      free(lv.cefr) ||
      (flat.filter((l) => l.cefr === lv.cefr).length === lvTotal(lv) &&
        flat.filter((l) => l.cefr === lv.cefr).every((l) => S.done[l.id])));

  function home() {
    redraw = home;
    const due = dueItems().length,
      pl = S.placement,
      soon = P.levels.filter((l) => !LV.includes(l));
    const nextL = flat.find((l) => !S.done[l.id] && unlocked(l)),
      curLv = nextL ? nextL.cefr : LV[LV.length - 1].cefr;
    const nDone = flat.filter((l) => S.done[l.id]).length,
      mt = minsToday(),
      g = S.goal,
      stk = streak();
    let s = head(T('courseMap'), T('courseTitle'), T('courseLede'), false);

    s +=
      `<section class="tx-stats panel blue">` +
      `<div><span class="kicker blue">${T('progressH')}</span><b>${nDone} / ${flat.length}</b>` +
      `<small>${T('lessonsWord')}</small>${bar(nDone / flat.length)}</div>` +
      `<div><span class="kicker blue">${T('todayH')}</span><b>${mt} / ${g} min</b>` +
      `<label class="tx-goal"><small>${T('goalTitle')}</small><select id="tx-goal">` +
      [10, 20, 30]
        .map((m) => `<option value="${m}" ${m === g ? 'selected' : ''}>${m} min</option>`)
        .join('') +
      `</select></label></div>` +
      `<div title="${T('streakTitle')}"><span class="kicker blue">${T('streakH')}</span>` +
      `<b>${stk}</b><small>${T(stk === 1 ? 'day1' : 'days')}</small></div>` +
      `<div><span class="kicker blue">${T('reviewT')}</span><b>${due}</b>` +
      `<small>${due ? T('pendingN', { n: due }) : T('nothingDue')}</small></div>` +
      `</section>`;

    s +=
      `<nav class="tx-tools" aria-label="${T('toolsH')}"><span class="kicker">${T('toolsH')}</span>` +
      `<button type="button" class="pill" data-go="placement">${T('placementT')}` +
      (pl ? ` <small>· ${esc(pl.level)}</small>` : '') +
      `</button>` +
      `<button type="button" class="pill" data-go="review" ${due ? '' : 'disabled'}>${T('reviewT')}` +
      (due ? ` <i class="tx-dot">${due}</i>` : '') +
      `</button>` +
      `<button type="button" class="pill" data-go="mixed">${T('mxT')}` +
      (mixedDue() ? ` <i class="tx-dot">!</i>` : '') +
      `</button>` +
      `<button type="button" class="pill" data-go="vocab">${T('vocabT')}</button>` +
      `<button type="button" class="pill" data-go="faq">${T('helpT')}</button></nav>`;

    if (nextL) {
      const u = unitOf(nextL);
      s +=
        `<section class="panel dark tx-next glow"><div><span class="kicker">${T('nextH')} · ${nextL.cefr} · ` +
        `${T('unitN', { n: u.order })} · ${T('lessonN', { n: nextL.order })}</span>` +
        `<h2>${esc(nextL.title_target)}</h2>` +
        `<p>${esc(subTitle(nextL.id, nextL.title_es, nextL.title_target))}</p></div>` +
        `<button type="button" class="tx-btn tx-light" data-go="lesson:${nextL.id}">` +
        `${T(nDone ? 'continueArrow' : 'startArrow')}</button></section>`;
    }

    LV.forEach((lv) => {
      const ls = flat.filter((l) => l.cefr === lv.cefr),
        nd = ls.filter((l) => S.done[l.id]).length,
        tot = lvTotal(lv),
        ex = S.exams[lv.cefr],
        open = examOpen(lv);
      s +=
        `<details class="tx-level" ${lv.cefr === curLv ? 'open' : ''}><summary>` +
        `<span class="tx-lv-code">${lv.cefr}</span><span class="tx-lv-t">` +
        `<span class="kicker">${T('levelK', { l: lv.cefr })}</span><b>${lvName(lv.cefr)}</b>` +
        `<small>${T('lessonsOf', { d: nd, t: tot })}` +
        (ex && ex.passed ? T('examPassedS') : '') +
        (free(lv.cefr) ? T('passedPlacement') : '') +
        `</small></span>${bar(nd / tot)}<span class="tx-chev" aria-hidden="true"></span></summary>` +
        (ls.length < tot
          ? `<p class="tx-note">${T('stagesNote', { n: ls.length, t: tot })}</p>`
          : '') +
        `<div class="tx-units">`;
      lv.units
        .filter((u) => u.lessons.some((x) => x.status === 'ready'))
        .forEach((u) => {
          const L = u.lessons.filter((l) => l.status === 'ready'),
            ud = L.filter((l) => S.done[l.id]).length;
          s +=
            `<article class="tx-unit ${ud === L.length ? 'done' : ''}"><header>` +
            `<span class="num">${T('unitN', { n: pad2(u.order) })}</span>` +
            `<span class="tx-unit-count">${ud}/${L.length}</span>` +
            `<h3>${esc(u.title_target)}</h3>` +
            `<small>${esc(subTitle(u.id, u.title_es, u.title_target))}</small></header><ol>`;
          L.forEach((l) => {
            const dn = S.done[l.id],
              ok = unlocked(l),
              cur = !!nextL && l.id === nextL.id,
              cp = l.kind === 'checkpoint';
            const state = dn
              ? `<span class="tx-st ok">✓ ${pct(dn.score)}</span>`
              : !ok
                ? `<span class="tx-st lock">${T('lockedW')}</span>`
                : `<span class="tx-st go">${T(cur ? 'startArrow' : 'openArrow')}</span>`;
            s +=
              `<li><button type="button" class="tx-ls ${cur ? 'cur glow' : ''} ${dn ? 'done' : ''}" ` +
              `data-go="lesson:${l.id}" ${ok ? '' : 'disabled'}>` +
              `<span class="tx-ls-n">${pad2(l.order)}</span><span class="tx-ls-t">${esc(l.title_target)}` +
              (cp ? ` <em>${T('checkpointTag')}</em>` : '') +
              `<small>${esc(subTitle(l.id, l.title_es, l.title_target))}</small></span>${state}</button></li>`;
          });
          const rd = RIX.texts.find((t) => t.id === (EX.unit_readings || {})[u.id]),
            dg = S.dicto && S.dicto[u.id];
          s +=
            `</ol><footer>` +
            (rd
              ? `<a class="tx-link" href="lectura.en.html#/texto/${rd.id}">📖 ${T('unitReading', { t: esc(rd.title) })}</a>`
              : '') +
            ((EX.dictogloss || {})[u.id]
              ? `<button type="button" class="tx-link" data-go="dicto:${u.id}">🎧 ${T('dgT')}` +
                (dg ? ` <small>· ${pct(dg)}</small>` : '') +
                `</button>`
              : '') +
            `<button type="button" class="tx-link" data-go="print:unit:${u.id}" ` +
            `aria-label="${T('printUnitN', { n: u.order })}">${T('printUnit')}</button></footer></article>`;
        });
      const examTxt = ex
        ? T(ex.passed ? 'passedPct' : 'lastTry', { p: Math.round(ex.pct * 100) })
        : !(lv.exam && lv.exam.status === 'ready')
          ? T('examWhenLevel')
          : open
            ? T('examQs', { n: lv.exam.items || 30 })
            : T('completeN', { n: tot });
      s +=
        // el examen brilla cuando ya se terminaron las lecciones del nivel y todavía no se aprobó
        `</div><section class="panel rust tx-exam ${ex && ex.passed ? 'won' : open && nd === ls.length ? 'glow' : ''}">` +
        `<div><span class="kicker rust">${T('finalExam', { l: lv.cefr })}</span>` +
        `<p class="tx-exam-txt">${examTxt}</p></div><div class="tx-row-btns">` +
        `<button type="button" class="tx-btn" data-go="exam:${lv.cefr}" ${open ? '' : 'disabled'}>` +
        `${T('takeExam')}</button>` +
        `<button type="button" class="tx-btn tx-alt" data-go="print:exam:${lv.cefr}" ${open ? '' : 'disabled'}>` +
        `${T('examSheet')}</button></div></section></details>`;
    });
    soon.forEach((l) => {
      s +=
        `<div class="tx-level soon"><div class="tx-soon"><span class="tx-lv-code">${l.cefr}</span>` +
        `<span class="tx-lv-t"><b>${lvName(l.cefr)}</b><small>${T('comingSoon')}</small></span></div></div>`;
    });
    s +=
      `<footer class="tx-foot"><label><input type="checkbox" id="tx-open" ${S.open ? 'checked' : ''}> ` +
      `${T('testMode')}</label><button type="button" class="tx-link" data-go="reset">${T('resetProgress')}</button></footer>` +
      (ES() ? '' : `<p class="tx-foot"><small>${T('contentNote')}</small></p>`);
    show(s);
    $('#tx-open').onchange = (e) => {
      S.open = e.target.checked;
      save();
      home();
    };
    $('#tx-goal').onchange = (e) => {
      S.goal = +e.target.value;
      save();
      home();
    };
  }

  async function lesson(ent) {
    const raw = await J(ent.file),
      u = unitOf(ent),
      lv = LV.find((v) => v.cefr === ent.cefr);
    const draw = () => {
      redraw = draw;
      const L = localize(raw),
        x = L.explanation,
        n = L.exercises.length;
      const kick = `${ent.cefr} · ${T('unitN', { n: u.order })} · ${T('lessonN', { n: ent.order })}`;
      let s =
        head(kick, esc(L.title.target), esc(L.objective)) +
        `<p class="tx-meta">${L.title.es ? `<b>${esc(L.title.es)}</b> · ` : ''}` +
        `${T('minExercises', { m: L.est_minutes, n })} ` +
        `<button type="button" class="tx-link" data-go="print:lesson:${ent.id}">${T('printW')}</button></p>`;
      if (L.warmup)
        s +=
          `<div class="note"><span class="kicker">${T('secWarmup')}</span>` +
          `<p>${esc(L.warmup.prompt_es)}</p></div>`;
      s +=
        `<section class="tx-sec"><span class="kicker blue">01 · ${T('secInput')}</span>` +
        `<div class="card tx-input">${inputHTML(L.input)}</div></section>` +
        `<section class="tx-sec"><span class="kicker blue">02 · ${T('secExplain')}</span>` +
        `<div class="card tx-explain">${md(x.md_es)}</div>`;
      if (x.common_mistakes_es && x.common_mistakes_es.length)
        s +=
          `<div class="panel rust tx-mist"><span class="kicker rust">${T('commonMistakes')}</span><ul>` +
          x.common_mistakes_es
            .map(
              (m) =>
                `<li><s>${esc(m.wrong)}</s> → <b>${esc(m.right)}</b>` +
                (m.note ? `<br><small>${esc(m.note)}</small>` : '') +
                `</li>`,
            )
            .join('') +
          '</ul></div>';
      if (x.false_friends && x.false_friends.length)
        s +=
          `<div class="panel tx-ff"><span class="kicker">${T('falseFriends')}</span><ul>` +
          x.false_friends
            .map(
              (f) =>
                `<li><b>${esc(f.word)}</b>: ${T('ffLine', { f: esc(f.es_false), r: esc(f.real) })}` +
                `<br><small>${esc(f.note)}</small></li>`,
            )
            .join('') +
          '</ul></div>';
      s +=
        `</section><section class="tx-sec" id="tx-practice">` +
        `<span class="kicker blue">03 · ${T('secPractice')}</span><h2>${T('practiceH')}</h2>` +
        `<p class="tx-sec-lede">${T('practiceLede')}</p><div id="tx-ex"></div><div id="tx-result"></div></section>`;
      show(s);
      practice($('#tx-ex'), L.exercises, {
        input: L.input,
        onDone: (sc) => finish(L, sc, n),
      });
    };
    const finish = (L, sc, n) => {
      const p = sc / n,
        pass = (L.checkpoint && L.checkpoint.pass_score) || 0.7,
        ok = p >= pass,
        k = flat.indexOf(ent),
        nx = flat[k + 1],
        UL = u.lessons.filter((x) => x.status === 'ready');
      const unitWas = UL.every((x) => S.done[x.id]),
        examWas = examOpen(lv);
      if (ok) {
        const prev = S.done[L.id];
        if (!prev || prev.score < p) S.done[L.id] = { score: p, at: Date.now() };
        (L.srs_items || []).forEach((i) => {
          if (!S.srs[i.id]) S.srs[i.id] = { box: 1, due: day() + 1, lapses: 0 };
        });
        save();
      }
      const news = [];
      if (ok && !unitWas && UL.every((x) => S.done[x.id]))
        news.push(T('unitCompleted', { n: u.order }));
      if (ok && !examWas && examOpen(lv)) news.push(T('examUnlocked', { l: lv.cefr }));
      const box = $('#tx-result');
      box.innerHTML =
        `<div class="panel ${ok ? 'blue' : 'rust'} tx-result">` +
        `<span class="kicker ${ok ? 'blue' : 'rust'}">${T('resultH')}</span>` +
        `<div class="tx-result-row"><b class="tx-big">${pct(p)}</b><p>` +
        (ok
          ? T(p >= 0.95 ? 'perfect' : p >= 0.85 ? 'veryGood' : 'lessonPassed')
          : T('almost', { p: Math.round(pass * 100) }) + ' ' + T('tryAgain')) +
        `</p></div>` +
        news.map((t) => `<p class="tx-news">${t}</p>`).join('') +
        `<div class="tx-row-btns"></div></div>` +
        (L.summary && L.summary.key_phrases && L.summary.key_phrases.length
          ? `<div class="card tx-keys"><span class="kicker">${T('keyPhrases')}</span><ul>` +
            L.summary.key_phrases.map((q) => `<li>${sayBtn(q)} ${esc(q)}</li>`).join('') +
            '</ul></div>'
          : '');
      const row = box.querySelector('.tx-row-btns');
      if (ok && nx) row.append(btn(T('nextLessonArrow'), () => lesson(nx).catch(fail)));
      row.append(
        btn(T('mapBack'), home, ok && nx ? 'tx-alt' : ''),
        btn(T('restart'), draw, 'tx-alt'),
      );
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    draw();
  }

  const TOPIC_ES = {
    greetings: 'Saludos',
    alphabet: 'Alfabeto',
    numbers: 'Números',
    age: 'Edad',
    countries: 'Países y nacionalidades',
    'to-be': 'Verbo to be',
    jobs: 'Trabajos',
    family: 'Familia',
    possessives: 'Posesivos',
    'have-got': 'Have got',
    adjectives: 'Adjetivos',
    routine: 'Rutina diaria',
    time: 'La hora',
    'present-simple': 'Presente simple',
    days: 'Días de la semana',
    food: 'Comida y bebida',
    plurals: 'Plurales',
    likes: 'Gustos',
    meals: 'Comidas del día',
    cafe: 'En el café',
    home: 'La casa',
    'there-is': 'There is / there are',
    prepositions: 'Preposiciones de lugar',
    colours: 'Colores',
    town: 'La ciudad',
    directions: 'Direcciones',
    transport: 'Transporte',
    imperatives: 'Imperativos',
    prices: 'Precios',
    clothes: 'Ropa',
    'this-that': 'This / that',
    shop: 'De compras',
    hobbies: 'Aficiones',
    can: 'Can (habilidad)',
    'present-continuous': 'Presente continuo',
    invitations: 'Invitaciones',
    weather: 'El clima',
    months: 'Meses',
    dates: 'Fechas',
    plans: 'Planes',
    objects: 'Objetos cotidianos',
    'past-simple': 'Pasado simple',
    travel: 'Viajes',
    comparing: 'Comparar',
    quantities: 'Comida y cantidades',
    future: 'Futuro',
    'health-rules': 'Salud y reglas',
    'work-study': 'Trabajo y estudios',
    experiences: 'Experiencias',
    technology: 'Tecnología',
    opinions: 'Opiniones y sentimientos',
    'getting-around': 'Moverse por la ciudad',
    leisure: 'Tiempo libre',
    'life-stories': 'Historias de vida',
    places: 'Lugares',
    careers: 'Carreras',
    lifestyle: 'Estilo de vida',
    media: 'Medios',
    tourism: 'Turismo',
    money: 'Dinero',
    education: 'Educación',
    environment: 'Medio ambiente',
    culture: 'Cultura y tradiciones',
    relationships: 'Relaciones',
    achievements: 'Retos y logros',
    identity: 'Identidad',
    workplace: 'Mundo laboral',
    news: 'Noticias y medios',
    science: 'Ciencia',
    wellbeing: 'Bienestar',
    'culture-travel': 'Viajes y culturas',
    economy: 'Economía',
    society: 'Sociedad',
    planet: 'Planeta',
    arts: 'Arte y cultura',
    law: 'Ley y sociedad',
    communication: 'Comunicación',
    adventure: 'Aventura y riesgo',
    global: 'Temas globales',
  };

  async function vocab() {
    redraw = () => vocab().catch(fail);
    const lists = await Promise.all(LV.map((l) => J('vocab/' + l.cefr.toLowerCase() + '.json')));
    const all = lists.flatMap((v, i) => v.items.map((x) => Object.assign({ lv: LV[i].cefr }, x)));
    const name = (t) =>
      (ES() && TOPIC_ES[t]) ||
      (t === 'otros' || !t
        ? T('others')
        : String(t)
            .replace(/-/g, ' ')
            .replace(/^./, (c) => c.toUpperCase()));
    show(
      head(T('toolsH'), T('vocabByTopic'), T('wordsCount', { n: all.length })) +
        `<div class="tx-filters"><label>${T('colLevel')} <select id="v-lv">` +
        `<option value="">${T('all')}</option>` +
        LV.map((l) => `<option>${l.cefr}</option>`).join('') +
        `</select></label><label>${T('search')} <input id="v-q" type="search" class="tx-in" ` +
        `placeholder="${T('searchPh')}" aria-label="${T('searchAria')}"></label></div><div id="v-list"></div>`,
    );
    const draw = () => {
      const lvl = $('#v-lv').value,
        q = $('#v-q').value.trim().toLowerCase(),
        by = {};
      all
        .filter(
          (w) =>
            (!lvl || w.lv === lvl) &&
            (!q || (w.lemma + ' ' + meaning(w)).toLowerCase().includes(q)),
        )
        .forEach((w) => (by[w.topic || 'otros'] = by[w.topic || 'otros'] || []).push(w));
      $('#v-list').innerHTML =
        Object.keys(by)
          .sort((a, b) => name(a).localeCompare(name(b), TXI.lang))
          .map(
            (tp) =>
              `<details class="tx-fold" ${q ? 'open' : ''}><summary>${esc(name(tp))} ` +
              `<small>${by[tp].length}</small></summary><div class="tx-scroll"><table class="tx-table">` +
              glossHead(by[tp], `<th>${T('colLevel')}</th>`) +
              by[tp].map((w) => glossRow(w, `<td>${w.lv}</td>`)).join('') +
              '</table></div></details>',
          )
          .join('') || '<p>' + T('noResults') + '</p>';
    };
    $('#v-lv').onchange = draw;
    $('#v-q').oninput = draw;
    draw();
  }

  const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // respuestas aceptadas para un lema: «how do you spell...?», «fall out (with)», «a / an»…
  const cardAnswers = (lemma) => {
    const base = lemma.replace(/\.\.\.|…/g, ' ').replace(/\s+/g, ' ').trim(),
      bare = base.replace(/\s*\([^)]*\)/g, '').trim(),
      full = base.replace(/[()]/g, '');
    return [base, bare, full, ...base.split(' / '), ...bare.split(' / ')];
  };
  const cardNorm = (x) =>
    norm(x)
      .replace(/[,;?]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Repaso escrito: se ve el significado y se escribe la palabra (recordar produciendo retiene más
  // que reconocerla y marcar «la sabía»)
  async function review() {
    const Vs = await Promise.all(LV.map((l) => J('vocab/' + l.cefr.toLowerCase() + '.json'))),
      map = Object.fromEntries(Vs.flatMap((V) => V.items).map((v) => [v.id, v]));
    const q = shuffle(dueItems().filter((k) => map[k]));
    let i = 0,
      ok = 0;
    const cardView = () => {
      redraw = cardView;
      if (i >= q.length) {
        show(
          head(T('reviewT'), T('reviewDone'), T('gotNofM', { o: ok, n: q.length })) +
            `<div class="tx-row-btns"><button type="button" class="tx-btn" data-go="home">` +
            `${T('mapBack')}</button></div>`,
        );
        return;
      }
      const v = map[q[i]],
        it = S.srs[q[i]],
        before = { box: it.box, lapses: it.lapses },
        s = stepCard(T('reviewT') + ` · ${i + 1}/${q.length}`, esc(meaning(v)), i, q.length);
      const ex =
        v.example && !v.lemma.includes('/') && new RegExp('\\b' + reEsc(v.lemma) + '\\b', 'i').test(v.example)
          ? esc(v.example).replace(
              new RegExp('\\b' + reEsc(esc(v.lemma)) + '\\b', 'i'),
              '<b class="tx-gap">_____</b>',
            )
          : '';
      s.innerHTML =
        `<p class="tx-note"><small>${T('cardHow')} · ${esc(v.pos || '')}</small></p>` +
        (ex ? `<p class="tx-card-ex"><i>${ex}</i></p>` : '') +
        `<div class="rd-fill tx-card-in"><input class="tx-in" autocomplete="off" autocapitalize="off" ` +
        `spellcheck="false" aria-label="${T('yourAnswer')}"></div><div class="tx-act"></div><div class="tx-fb"></div>`;
      const inp = s.querySelector('input'),
        act = s.querySelector('.tx-act'),
        fb = s.querySelector('.tx-fb');
      const grade = (good) => {
        it.box = good ? Math.min(6, before.box + 1) : 1;
        it.lapses = before.lapses + (good ? 0 : 1);
        it.due = day() + INT[it.box - 1];
        save();
      };
      const next = () => {
        i++;
        cardView();
      };
      const check = () => {
        if (!inp.value.trim()) return inp.focus();
        const good = cardAnswers(v.lemma).some((a) => cardNorm(a) === cardNorm(inp.value));
        inp.disabled = true;
        grade(good);
        if (good) ok++;
        say(v.lemma);
        fb.className = 'tx-fb ' + (good ? 'ok' : 'bad');
        fb.innerHTML =
          `<b>${good ? T('correctEx') : T('answerIs')}</b> ${esc(v.lemma)} ` +
          `<span class="tx-ipa">${esc(v.ipa)}</span> ${sayBtn(v.lemma)}` +
          (v.example ? `<br><small>${esc(v.example)}</small>` : '');
        act.replaceChildren(
          ...(good
            ? []
            : [
                btn(
                  T('cardTypo'),
                  () => {
                    grade(true);
                    ok++;
                    next();
                  },
                  'tx-alt',
                ),
              ]),
          btn(T('continue'), next),
        );
        act.lastChild.focus();
      };
      act.append(btn(T('check'), check));
      inp.onkeydown = (e) => {
        if (e.key === 'Enter') check();
      };
      inp.focus();
    };
    cardView();
  }

  // Repaso mixto: ejercicios de lecciones ya hechas, de unidades distintas y mezclados
  const MIXED_N = 30,
    MIXED_TYPES = new Set([
      'multiple_choice',
      'fill_blank',
      'error_correction',
      'translation',
      'word_order',
      'matching',
      'listening',
      'categorize',
      'dictation',
    ]);
  const mixedDue = () =>
    Object.keys(S.done).length >= 2 && (!S.mixed || day() - Math.floor(S.mixed.at / 864e5) >= 7);
  async function mixed() {
    redraw = () => mixed().catch(fail);
    const done = flat.filter((l) => S.done[l.id]);
    if (done.length < 2) {
      show(
        head(T('toolsH'), T('mxT'), T('mxNeed')) +
          `<div class="tx-row-btns"><button type="button" class="tx-btn" data-go="home">${T('mapBack')}</button></div>`,
      );
      return;
    }
    const picks = shuffle(done).slice(0, 15),
      per = Math.ceil(MIXED_N / picks.length);
    const lessons = await Promise.all(picks.map((ent) => J(ent.file).then((L) => [ent, localize(L)])));
    const pool = lessons.flatMap(([ent, L]) =>
      shuffle(
        L.exercises.filter(
          (e) => MIXED_TYPES.has(e.type) && !e.refers_to_input && !e.review_of,
        ),
      )
        .slice(0, per)
        .map((e) => Object.assign({}, e, { _lesson: ent })),
    );
    const list = shuffle(pool).slice(0, MIXED_N);
    show(
      head(T('toolsH'), T('mxT'), T('mxLede', { n: list.length })) +
        `<section class="tx-sec"><div id="tx-ex"></div><div id="tx-result"></div></section>`,
    );
    practice($('#tx-ex'), list, {
      onDone: (sc, n, res) => {
        S.mixed = { at: Date.now(), pct: sc / n };
        save();
        const weak = [];
        list.forEach((e, k) => {
          if (res[k] < 1 && !weak.includes(e._lesson)) weak.push(e._lesson);
        });
        const box = $('#tx-result');
        box.innerHTML =
          `<div class="panel ${sc / n >= 0.7 ? 'blue' : 'rust'} tx-result">` +
          `<span class="kicker">${T('resultH')}</span>` +
          `<div class="tx-result-row"><b class="tx-big">${pct(sc / n)}</b><p>${T('mxNext')}</p></div></div>` +
          (weak.length
            ? `<div class="card tx-weak"><span class="kicker">${T('mxWeak')}</span><ul>` +
              weak
                .map(
                  (l) =>
                    `<li><span>${l.cefr} · ${T('unitN', { n: unitOf(l).order })} · ${esc(l.title_target)}</span>` +
                    `<button type="button" class="tx-btn tx-alt" data-go="lesson:${l.id}">${T('goLesson')}</button></li>`,
                )
                .join('') +
              '</ul></div>'
            : '') +
          `<div class="tx-row-btns"><button type="button" class="tx-btn" data-go="home">${T('mapBack')}</button></div>`;
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });
  }

  // Dictogloss: escuchar un texto, reconstruirlo y compararlo palabra por palabra
  // «I'm» y «I am» valen lo mismo: cada palabra se compara por sus partes sin contraer
  const S_PRON = new Set(['it', 'he', 'she', 'that', 'there', 'here', 'what', 'where', 'who', 'how', 'this']);
  const parts = (w) => {
    const x = w.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
    const irr = { "won't": ['will', 'not'], "can't": ['can', 'not'], "shan't": ['shall', 'not'], cannot: ['can', 'not'] };
    if (irr[x]) return irr[x];
    const m = x.match(/^(.+?)(n't|'m|'re|'ve|'ll|'d|'s)$/);
    if (m) {
      const end = { "n't": 'not', "'m": 'am', "'re": 'are', "'ve": 'have', "'ll": 'will', "'d": 'would' }[m[2]];
      if (end) return [m[1], end];
      if (S_PRON.has(m[1])) return [m[1], 'is'];
    }
    const k = x.replace(/'/g, '');
    return k ? [k] : [];
  };
  const dgWords = (t) =>
    t
      .split(/\s+/)
      .map((w) => ({ w, ks: parts(w) }))
      .filter((x) => x.ks.length);
  // subsecuencia común más larga: qué partes del original aparecen, en orden, en la versión escrita
  const lcsMarks = (a, b) => {
    const m = a.length,
      n = b.length,
      L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let x = m - 1; x >= 0; x--)
      for (let y = n - 1; y >= 0; y--)
        L[x][y] = a[x] === b[y] ? L[x + 1][y + 1] + 1 : Math.max(L[x + 1][y], L[x][y + 1]);
    const hit = new Array(m).fill(false);
    for (let x = 0, y = 0; x < m && y < n; )
      if (a[x] === b[y]) {
        hit[x] = true;
        x++;
        y++;
      } else if (L[x + 1][y] >= L[x][y + 1]) x++;
      else y++;
    return hit;
  };
  // una palabra del original cuenta como acertada si aparecen todas sus partes
  const dgCompare = (orig, mine) => {
    const flatO = orig.flatMap((x, i) => x.ks.map(() => i)),
      hitK = lcsMarks(
        orig.flatMap((x) => x.ks),
        mine.flatMap((x) => x.ks),
      ),
      ok = orig.map(() => true);
    flatO.forEach((i, k) => {
      if (!hitK[k]) ok[i] = false;
    });
    return ok;
  };
  function dicto(uid) {
    const u = LV.flatMap((l) => l.units).find((x) => x.id === uid),
      lv = LV.find((l) => l.units.includes(u)),
      text = (EX.dictogloss || {})[uid];
    let plays = 0,
      draft = '';
    const draw = () => {
      redraw = draw;
      show(
        head(`${lv.cefr} · ${T('unitN', { n: u.order })} · ${esc(u.title_target)}`, T('dgT'), T('dgLede')) +
          `<section class="tx-sec"><div class="card tx-dg"><div class="tx-row-btns">` +
          `<button type="button" class="tx-btn" data-dg="say">🔊 ${T('dgListen', { n: plays })}</button>` +
          `<button type="button" class="tx-btn tx-alt" data-dg="slow">🐢 ${T('speedSlow')}</button></div>` +
          `<textarea class="tx-in tx-ta" rows="6" placeholder="${T('dgPh')}" aria-label="${T('dgPh')}"></textarea>` +
          `<p class="tx-warn"></p><div class="tx-row-btns"><button type="button" class="tx-btn" data-dg="cmp">` +
          `${T('dgCompare')}</button></div></div><div id="tx-result"></div></section>`,
      );
      const ta = $('.tx-dg textarea'),
        warn = $('.tx-dg .tx-warn');
      ta.value = draft;
      ta.oninput = () => (draft = ta.value);
      $('.tx-dg').onclick = (e) => {
        const b = e.target.closest('[data-dg]');
        if (!b) return;
        if (b.dataset.dg === 'say' || b.dataset.dg === 'slow') {
          say(text, b.dataset.dg === 'slow');
          if (b.dataset.dg === 'say') b.textContent = '🔊 ' + T('dgListen', { n: ++plays });
          return;
        }
        const mine = dgWords(ta.value);
        if (mine.length < 5) {
          warn.textContent = T('dgNeed');
          return ta.focus();
        }
        warn.textContent = '';
        const orig = dgWords(text),
          hit = dgCompare(orig, mine),
          p = hit.filter(Boolean).length / orig.length;
        S.dicto = S.dicto || {};
        S.dicto[uid] = Math.max(S.dicto[uid] || 0, p);
        save();
        $('#tx-result').innerHTML =
          `<div class="panel ${p >= 0.7 ? 'blue' : 'rust'} tx-result"><span class="kicker">${T('resultH')}</span>` +
          `<div class="tx-result-row"><b class="tx-big">${pct(p)}</b><p>${T('dgScore')}</p></div></div>` +
          `<div class="card tx-dg-res"><p class="tx-dg-orig">` +
          orig.map((x, k) => (hit[k] ? esc(x.w) : `<mark class="tx-miss">${esc(x.w)}</mark>`)).join(' ') +
          `</p><p><small>${T('dgLegend')}</small></p><div class="tx-row-btns">` +
          `<button type="button" class="tx-btn tx-alt" data-dg-again>${T('restart')}</button>` +
          `<button type="button" class="tx-btn" data-go="home">${T('mapBack')}</button></div></div>`;
        $('[data-dg-again]').onclick = () => {
          plays = 0;
          draft = '';
          draw();
        };
        $('#tx-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    };
    draw();
  }

  const examInstr = (E, lv) => {
    const n = E.exercises.length;
    return T('examInstr', { n, u: lv.units.length, l: lv.cefr, k: Math.ceil(E.pass_score * n) });
  };
  async function exam(cefr) {
    const lv = LV.find((l) => l.cefr === cefr),
      Eraw = await J(lv.exam.file);
    const draw = () => {
      redraw = draw;
      const E = localizeExam(Eraw);
      show(
        head(
          T('levelX', { l: cefr, n: lvName(cefr) }),
          T('examTitle', { l: cefr }),
          examInstr(E, lv),
        ) + `<section class="tx-sec"><div id="tx-ex"></div><div id="tx-result"></div></section>`,
      );
      practice($('#tx-ex'), E.exercises, {
        exam: true,
        onDone: (sc, n, res) => result(E, sc, n, res),
      });
    };
    const result = (E, sc, n, res) => {
      const p = sc / n,
        ok = p >= E.pass_score,
        before = S.exams[cefr];
      S.exams[cefr] = { pct: p, passed: ok || !!(before && before.passed), at: Date.now() };
      save();
      const wrong = {};
      E.exercises.forEach((e, i) => {
        if (res[i] >= 1) return;
        const r = e.review || { topic_es: T('generalReview') };
        (wrong[r.topic_es] = wrong[r.topic_es] || { n: 0, r }).n++;
      });
      const weak = Object.values(wrong).sort((a, b) => b.n - a.n);
      const box = $('#tx-result');
      box.innerHTML =
        `<div class="panel ${ok ? 'blue' : 'rust'} tx-result">` +
        `<span class="kicker ${ok ? 'blue' : 'rust'}">${T('resultH')}</span>` +
        `<div class="tx-result-row"><b class="tx-big">${fmt(sc)} / ${n}</b><p>${pct(p)} · ` +
        (ok ? T('examPassedMsg', { l: cefr }) : T('examNeed', { n: Math.ceil(E.pass_score * n) })) +
        `</p></div></div>` +
        (weak.length
          ? `<div class="card tx-weak"><span class="kicker">${T('topicsReview')}</span><ul>` +
            weak
              .map(
                (w) =>
                  `<li><span>${reviewHTML({ review: w.r })} <small>(${w.n} ` +
                  `${T(w.n === 1 ? 'question1' : 'questionsW')})</small></span>` +
                  (w.r.lesson
                    ? `<button type="button" class="tx-btn tx-alt" data-go="lesson:${w.r.lesson}">` +
                      `${T('goLesson')}</button>`
                    : '') +
                  '</li>',
              )
              .join('') +
            '</ul></div>'
          : '') +
        (E.optional_tasks && E.optional_tasks.length
          ? `<section class="tx-sec"><span class="kicker blue">${T('optTasks')}</span>` +
            `<div id="tx-opt"></div></section>`
          : '') +
        `<div class="tx-row-btns"><button type="button" class="tx-btn" data-go="home">${T('mapBack')}</button></div>`;
      const opt = box.querySelector('#tx-opt');
      if (opt) practice(opt, E.optional_tasks, { optional: true, noScore: true });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    draw();
  }

  async function placement() {
    const PT = await J('placement-test.json'),
      A = PT.algorithm,
      res = {},
      last = PT.blocks.length - 1;
    let bi = 0,
      ii = 0,
      ok = 0;
    const pc = (r) => Math.round((r.ok / r.n) * 100);
    const end = () => {
      redraw = end;
      const done = PT.blocks.filter((B) => res[B.level]),
        passed = done.filter((B) => res[B.level].ok / res[B.level].n >= A.pass_ratio);
      const lv = passed.length ? passed[passed.length - 1].level : 'A1';
      const failB = done.find((B) => !passed.includes(B));
      S.placement = {
        level: lv,
        passed: passed.map((B) => B.level),
        scores: Object.fromEntries(done.map((B) => [B.level, pc(res[B.level])])),
        at: Date.now(),
      };
      save();
      const need = Math.round(A.pass_ratio * 100);
      const msg = !passed.length
        ? T('plStartA1', { p: need })
        : !failB
          ? T('plTop', { l: lv })
          : T('plUpTo', {
              l: lv,
              f: failB.level,
              p: pc(res[failB.level]),
              near: pc(res[failB.level]) >= 50 ? T('plNear') : '',
            });
      show(
        head(
          T('placementT'),
          esc(lv),
          (passed.length ? T('plYourLevel', { l: esc(lv) }) : T('plStartPoint')) + ' ' + msg,
        ) +
          `<div class="card"><div class="tx-scroll"><table class="tx-table"><tr><th>${T('colLevel')}</th>` +
          `<th>${T('plCorrect')}</th><th>${T('plResult')}</th></tr>` +
          done
            .map(
              (B) =>
                `<tr><td>${B.level}</td><td>${res[B.level].ok}/${res[B.level].n} (${pc(res[B.level])} %)</td>` +
                `<td>${T(passed.includes(B) ? 'plPassed' : 'plFailed')}</td></tr>`,
            )
            .join('') +
          `</table></div><p><small>${T('plRule', { p: need })} ` +
          (!passed.length
            ? ''
            : LV.every((l) => passed.some((B) => B.level === l.cefr))
              ? T('plAllDone', { l: LV.map((l) => l.cefr).join(', ') })
              : T('plOpenNext')) +
          `</small></p></div><div class="tx-row-btns" id="pl-btns"></div>`,
      );
      $('#pl-btns').append(
        btn(T('goCourse'), home),
        btn(T('repeatTest'), () => placement().catch(fail), 'tx-alt'),
      );
    };
    const next = () => {
      redraw = next;
      const B = PT.blocks[bi];
      if (ii >= B.items.length) {
        res[B.level] = { ok, n: B.items.length };
        if (ok / B.items.length < A.pass_ratio || bi === last) return end();
        bi++;
        ii = 0;
        ok = 0;
        return next();
      }
      const s = stepCard(
        T('placementT') + ' · ' + T('plQuestion', { l: B.level, i: ii + 1, n: B.items.length }),
        T('placementT'),
        ii,
        B.items.length,
      );
      runEx(
        B.items[ii],
        s,
        (v) => {
          ok += v;
          ii++;
          next();
        },
        { quiet: true, dk: true },
      );
    };
    const intro = () => {
      redraw = intro;
      show(
        head(T('toolsH'), T('placementT'), T('plInstr')) +
          `<div class="tx-row-btns" id="pl-btns"></div>`,
      );
      $('#pl-btns').append(btn(T('start'), next), btn(T('cancel'), home, 'tx-alt'));
    };
    intro();
  }

  const FAQ = [
    [
      '¿Se guarda mi progreso?',
      'Sí, en este navegador y en este dispositivo (no hay cuentas ni contraseñas). Si borras los datos del navegador, usas otro navegador u otro dispositivo, empezarás de cero: el progreso no se sincroniza.',
    ],
    [
      '¿Cómo se desbloquean las lecciones?',
      'Cada lección se abre al superar la anterior, normalmente con un 70 % de aciertos. Si superas un nivel en la prueba de nivel, todas sus lecciones quedan abiertas.',
    ],
    [
      '¿Qué es la prueba de nivel?',
      'Un test que se adapta a ti y estima desde qué nivel conviene empezar. Se supera un nivel con al menos un 75 % de aciertos en su bloque. Puedes repetirla cuando quieras.',
    ],
    [
      '¿Cómo funciona el examen final de cada nivel?',
      'Se habilita al completar todas las lecciones del nivel (o si superaste el nivel en la prueba). Se aprueba con un 75 %. Cuando fallas una pregunta, el examen te indica qué tema repasar, pero no te da la respuesta; al final verás los temas con un botón para ir a la lección. Puedes repetirlo cuantas veces quieras.',
    ],
    [
      '¿Qué pasa con las tareas opcionales?',
      'No cuentan en la nota. En la escritura debes escribir un mínimo de palabras en inglés; después comparas tu texto con un modelo y una lista de control.',
    ],
    [
      '¿Por qué a veces aparecen ejercicios de temas anteriores?',
      'Es a propósito: repasar de forma mezclada ayuda a que lo aprendido no se olvide. Cuentan como parte de la lección.',
    ],
    [
      '¿Cómo funciona el Repaso?',
      'Las palabras de las lecciones que completas vuelven a aparecer a los 1, 3, 7, 14, 30 y 60 días si las vas recordando. Si fallas una, vuelve al principio.',
    ],
    [
      '¿Qué es la meta diaria y la racha?',
      'La meta son los minutos de estudio activo que quieres hacer cada día (10, 20 o 30). La racha cuenta los días seguidos en que la cumpliste. Las pausas de más de 2 minutos no suman.',
    ],
    [
      'El audio no suena, ¿qué hago?',
      'El audio usa la voz en inglés de tu navegador. Revisa el volumen, prueba con una versión actual de Chrome, Edge o Safari y comprueba que tu sistema tenga una voz en inglés instalada.',
    ],
    [
      '¿Qué pasa con mi grabación de voz?',
      'Se graba solo en tu dispositivo para que te compares con el modelo; no se envía a ningún sitio. El navegador te pedirá permiso para usar el micrófono.',
    ],
    [
      '¿Puedo hacer las lecciones en papel?',
      'Sí. Usa «Imprimir» dentro de una lección, «Imprimir unidad (PDF)» en cada unidad o «Hoja del examen». Elige si quieres explicación y clave de respuestas, y en el cuadro de impresión selecciona «Guardar como PDF» o tu impresora. Los ejercicios de audio y de pronunciación se hacen mejor en la web.',
    ],
    [
      '¿Qué hace el «Modo prueba»?',
      'Desbloquea todas las lecciones y exámenes para que puedas explorar el contenido. No borra tu progreso.',
    ],
    [
      '¿Cómo borro mi progreso?',
      'Con «Borrar progreso» al final de la página principal del curso. Se borra todo en este navegador, salvo tu meta diaria.',
    ],
    [
      'Encontré un error en una lección',
      'Anota el código de la lección o del ejercicio (por ejemplo en-a2-u03-l02) y avisa a quien administra el sitio. Las traducciones y la pronunciación pueden mejorarse con tu ayuda.',
    ],
    [
      '¿Hasta qué nivel llega el curso?',
      'Hasta B2. Los niveles A1, A2, B1 y B2 ya están disponibles, cada uno con su examen final.',
    ],
  ];
  function faq() {
    redraw = faq;
    const F = (window.TXI && TXI.FAQ && TXI.FAQ[TXI.lang]) || FAQ;
    show(
      head(T('toolsH'), T('faqTitle'), '') +
        `<div id="faq">` +
        F.map(
          ([q, a]) =>
            `<details class="tx-fold"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`,
        ).join('') +
        `</div>`,
    );
  }

  // orden "aleatorio" fijo por ejercicio, para que la hoja y la clave coincidan
  const seeded = (a, seed) => {
    let s = 0;
    for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return a
      .map((x) => [x, (s = (s * 1664525 + 1013904223) >>> 0)])
      .sort((p, q) => p[1] - q[1])
      .map((p) => p[0]);
  };
  const LT = 'ABCDEFGH',
    LN = '<span class="tp-line"></span>';
  // [html del ejercicio, texto de la clave]
  const printEx = (e) => {
    const Q = '<p class="tp-q">' + esc(e.prompt || '') + '</p>',
      aud = '<p class="tp-note">' + T('audioWeb') + '</p>',
      ol = (o, type = 'A') =>
        `<ol class="tp-opts" type="${type}">` +
        o.map((x) => '<li>' + esc(x) + '</li>').join('') +
        '</ol>';
    switch (e.type) {
      case 'multiple_choice':
      case 'listening': {
        const o = seeded(e.options, e.id);
        return [
          (e.type === 'listening' ? aud : '') + Q + ol(o),
          LT[o.indexOf(e.answer[0])] +
            ') ' +
            e.answer[0] +
            (e.audio_text ? ' · ' + T('transcript') + ' ' + e.audio_text : ''),
        ];
      }
      case 'true_false':
        return [
          Q + '<p>☐ ' + T('trueW') + ' &nbsp;&nbsp; ☐ ' + T('falseW') + '</p>',
          e.answer[0] ? T('trueW') : T('falseW'),
        ];
      case 'fill_blank':
        return [
          '<p class="tp-q">' +
            esc(e.prompt).replace('___', '<span class="tp-blank"></span>') +
            '</p>',
          e.answer.join(' / '),
        ];
      case 'translation':
        return [Q + LN, e.answer.join(' / ')];
      case 'error_correction':
        return [Q + '<p class="tp-wrong">' + esc(e.text) + '</p>' + LN, e.answer.join(' / ')];
      case 'dictation':
        return [aud + Q + LN, e.audio_text || e.answer[0]];
      case 'word_order':
        return [
          Q +
            '<p class="tp-tokens">' +
            seeded(e.tokens, e.id).map(esc).join(' &nbsp;/&nbsp; ') +
            '</p>' +
            LN,
          sent(e.answer),
        ];
      case 'matching': {
        const right = seeded(
          e.pairs.map((p) => p.right),
          e.id,
        );
        return [
          Q +
            '<div class="tp-cols"><ol>' +
            e.pairs.map((p) => '<li>' + esc(p.left) + '</li>').join('') +
            '</ol>' +
            ol(right) +
            '</div>',
          e.pairs.map((p, k) => k + 1 + '-' + LT[right.indexOf(p.right)]).join('  '),
        ];
      }
      case 'categorize': {
        const cs = e.categories;
        return [
          Q +
            '<p><b>' +
            cs.map(esc).join(' · ') +
            '</b></p><ol>' +
            seeded(e.items, e.id)
              .map((i) => '<li>' + esc(i.text) + ' ____</li>')
              .join('') +
            '</ol>',
          cs
            .map(
              (c) =>
                c +
                ': ' +
                e.items
                  .filter((i) => i.category === c)
                  .map((i) => i.text)
                  .join(', '),
            )
            .join(' | '),
        ];
      }
      case 'writing':
        return [
          Q +
            '<p class="tp-note">' +
            T('minWordsP', { n: e.min_words || 8 }) +
            '</p>' +
            LN.repeat(4),
          e.model_answer,
        ];
      case 'pronunciation':
        return [
          Q +
            '<ul>' +
            e.items
              .map((i) => `<li>${esc(i.text)} <small>${esc(i.ipa)} · ${esc(i.tip_es)}</small></li>`)
              .join('') +
            '</ul><p class="tp-note">' +
            T('pronPrint') +
            '</p>',
          '—',
        ];
      case 'roleplay': {
        let k = 0;
        const key = [];
        const body = e.turns
          .map((t) => {
            if (!t.choices) return '<p><b>' + esc(t.speaker) + ':</b> ' + esc(t.text) + '</p>';
            const o = seeded(t.choices, e.id + k++);
            key.push(LT[o.indexOf(t.choices[t.best])]);
            return '<p><b>' + T('you') + '</b></p>' + ol(o);
          })
          .join('');
        return ['<p class="tp-q">' + esc(e.situation_es) + '</p>' + body, key.join(', ')];
      }
    }
    return [Q, ''];
  };
  // parts: [{head, intro, exercises}]
  function printDoc(parts, opt) {
    let html = '',
      keys = '';
    parts.forEach((p) => {
      const ks = [];
      html +=
        '<section class="tp-lesson"><h1>' +
        p.head +
        '</h1>' +
        (p.intro || '') +
        '<h2>' +
        T('exercisesH') +
        '</h2>' +
        p.exercises
          .map((e, i) => {
            const [q, k] = printEx(e);
            ks.push(k);
            return '<div class="tp-ex"><span class="tp-n">' + (i + 1) + '.</span>' + q + '</div>';
          })
          .join('') +
        '</section>';
      keys +=
        '<h3>' +
        p.head +
        '</h3><ol class="tp-key">' +
        ks.map((k) => '<li>' + esc(k) + '</li>').join('') +
        '</ol>';
    });
    if (opt.key)
      html += '<section class="tp-lesson"><h1>' + T('answerKey') + '</h1>' + keys + '</section>';
    return html;
  }
  async function printView(kind, id) {
    redraw = () => printView(kind, id).catch(fail);
    const ent =
      kind === 'unit'
        ? LV.flatMap((l) => l.units).find((u) => u.id === id)
        : kind === 'lesson'
          ? flat.find((l) => l.id === id)
          : LV.find((l) => l.cefr === id);
    const name =
      kind === 'unit'
        ? T('unitTitle', { n: ent.order, t: ent.title_target })
        : kind === 'lesson'
          ? ent.title_target
          : T('finalExam', { l: id });
    show(
      head(T('printW'), T('printTitle'), esc(name)) +
        `<div class="card tx-print-opts">` +
        (kind === 'exam'
          ? ''
          : `<p><label><input type="checkbox" id="p-exp" checked> ${T('inclExp')}</label></p>`) +
        `<p><label><input type="checkbox" id="p-key"> ${T('inclKey')}</label></p>` +
        `<p><small>${T('printNote')}</small></p><div class="tx-row-btns" id="p-btns"></div></div>`,
    );
    $('#p-btns').append(
      btn(T('prepareDoc'), async () => {
        const opt = {
          key: $('#p-key').checked,
          exp: kind === 'exam' ? false : $('#p-exp').checked,
        };
        let parts;
        if (kind === 'exam') {
          const E = localizeExam(await J(ent.exam.file));
          parts = [
            {
              head: T('examTitle', { l: id }),
              intro: '<p>' + examInstr(E, ent) + '</p>',
              exercises: E.exercises.concat(E.optional_tasks),
            },
          ];
        } else {
          const files = kind === 'unit' ? ent.lessons.filter((l) => l.status === 'ready') : [ent],
            Ls = (await Promise.all(files.map((f) => J(f.file)))).map(localize);
          parts = Ls.map((L) => ({
            head: esc(L.title.target) + ' <small>' + esc(L.title.es || '') + '</small>',
            intro:
              '<p><i>' +
              esc(L.objective) +
              '</i></p>' +
              inputHTML(L.input, true) +
              (opt.exp
                ? '<h2>' +
                  T('explanationH') +
                  '</h2>' +
                  md(L.explanation.md_es) +
                  (L.explanation.common_mistakes_es && L.explanation.common_mistakes_es.length
                    ? '<h3>' +
                      T('commonMistakes') +
                      '</h3><ul>' +
                      L.explanation.common_mistakes_es
                        .map(
                          (m) =>
                            `<li>✗ ${esc(m.wrong)} → ✓ <b>${esc(m.right)}</b> <small>${esc(m.note)}</small></li>`,
                        )
                        .join('') +
                      '</ul>'
                    : '')
                : ''),
            exercises: L.exercises,
          }));
        }
        const old = document.getElementById('tx-print');
        if (old) old.remove();
        const box = h('div');
        box.id = 'tx-print';
        box.innerHTML = printDoc(parts, opt);
        document.body.append(box);
        window.addEventListener('afterprint', () => box.remove(), { once: true });
        if (typeof window.print === 'function') window.print();
      }),
      btn(T('back'), home, 'tx-alt'),
    );
  }

  const fail = (e) =>
    show(
      head(T('failTitle'), T('failTitle'), esc(e.message)) +
        `<p><small>${T('failHelp')}</small></p>`,
    );

  app.onclick = (ev) => {
    const t = ev.target.closest('[data-go]');
    if (!t || t.disabled) return;
    const [a, id, id2] = t.dataset.go.split(':');
    if (a === 'home') home();
    else if (a === 'lesson') lesson(flat.find((l) => l.id === id)).catch(fail);
    else if (a === 'review') review().catch(fail);
    else if (a === 'vocab') vocab().catch(fail);
    else if (a === 'faq') faq();
    else if (a === 'mixed') mixed().catch(fail);
    else if (a === 'dicto') dicto(id);
    else if (a === 'print') printView(id, id2).catch(fail);
    else if (a === 'exam') exam(id).catch(fail);
    else if (a === 'placement') placement().catch(fail);
    else if (a === 'reset' && confirm(T('resetConfirm'))) {
      S = Object.assign(fresh(), { goal: S.goal || 20 });
      save();
      home();
    }
  };

  window.addEventListener('tx-lang', async () => {
    await loadOv();
    if (redraw) redraw();
  });
  window.Trilex = { runEx, practice, norm, printEx };
  J('path.json')
    .then((p) => {
      P = p;
      LV = p.levels.filter((l) => l.units.some((u) => u.lessons.some((x) => x.status === 'ready')));
      flat = LV.flatMap((lv) =>
        lv.units.flatMap((u) =>
          u.lessons
            .filter((l) => l.status === 'ready')
            .map((l) => Object.assign(l, { cefr: lv.cefr })),
        ),
      );
      return Promise.all([
        J('extras.json').catch(() => ({})),
        J('reading/index.json').catch(() => ({ texts: [] })),
        loadOv(),
      ]).then(([ex, rix]) => {
        EX = ex;
        RIX = rix;
        home();
      });
    })
    .catch(fail);
})();
