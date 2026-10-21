/* Trilex – reproductor de curso (inglés). Lee ../content/en/*.json y guarda el progreso en localStorage. */
(() => {
'use strict';
const C = '../content/en/', K = 'trilex_en_v1', INT = [1, 3, 7, 14, 30, 60];
const app = document.getElementById('app'), $ = s => document.querySelector(s);
const day = () => Math.floor(Date.now() / 864e5);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length; i > 1;) { const j = Math.random() * i-- | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const h = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; };
const btn = (label, fn, cls = '') => { const b = h('button', 'tx-btn ' + cls, label); b.type = 'button'; if (fn) b.onclick = fn; return b; };
const J = u => fetch(C + u).then(r => { if (!r.ok) throw new Error(u + ' (' + r.status + ')'); return r.json(); });
const sent = a => a.join(' ').replace(/ ([.,?!;:])/g, '$1');
const T = (k, v) => (window.TXI ? TXI.t(k, v) : k), ES = () => !window.TXI || TXI.lang === 'es';
const esSub = x => (ES() && x ? x : '');                     // subtítulo en español solo si la interfaz está en español
/* ---------- traducciones del contenido (content/en/i18n/<idioma>/<nivel>.json) ---------- */
let OV = {}, OVlang = null;
const lvOf = id => (String(id).match(/^en-(a1|a2|b1|b2)/) || [])[1];
const ovPack = id => (OV[lvOf(id)] || null);
const ovL = id => { const p = ovPack(id); return p && p.lessons[id] || null; };
const ovU = id => { const p = ovPack(id); return p && p.units[id] || null; };
const ovV = id => { const p = ovPack(id); return p && p.vocab[id] || null; };
async function loadOv() {
  const lg = window.TXI ? TXI.lang : 'es';
  if (lg === OVlang) return; OVlang = lg; OV = {};
  if (lg === 'es') return;
  try {
    const ix = await J('i18n/index.json'), lvls = (ix.langs || {})[lg] || [];
    const packs = await Promise.all(lvls.map(l => J('i18n/' + lg + '/' + l + '.json').catch(() => null)));
    lvls.forEach((l, i) => { if (packs[i]) OV[l] = packs[i]; });
  } catch (e) {}
}
const subTitle = (id, es, target) => { if (ES()) return es || ''; const t = id && id.includes('-l') ? (ovL(id) || {}).title : ovU(id); return t && t !== target ? t : ''; };
const meaning = w => (ES() ? w.translation_es || w.es : ovV(w.id) || w.translation_es || w.es) || '';
function localize(L) {                                 // copia de la lección con los textos traducidos (si existen)
  if (ES()) return L;
  const o = ovL(L.id), C = JSON.parse(JSON.stringify(L)), en = TXI.lang === 'en';
  const n = C.input || {};
  (n.glossary || []).forEach(g => { g.es = meaning(g); });
  if (n.lines) n.lines.forEach((l, i) => { l.es = en ? '' : (o && o.lines ? o.lines[i] : l.es); });
  if (n.text) n.es = en ? '' : (o && o.text ? o.text : n.es);
  if (o) {
    C.title.es = o.title && o.title !== C.title.target ? o.title : '';
    if (o.objective) C.objective = o.objective;
    if (o.warmup && C.warmup) C.warmup.prompt_es = o.warmup;
    if (o.recap) n.recap_es = o.recap;
    if (o.md) C.explanation.md_es = o.md;
    if (o.mist) C.explanation.common_mistakes_es = (C.explanation.common_mistakes_es || []).map((m, i) => Object.assign(m, { note: o.mist[i] || m.note }));
    C.explanation.false_friends = [];                  // los falsos amigos son específicos del español
  } else C.title.es = '';
  return C;
}
const fbTxt = x => String(x || '').replace(/^¡Correcto!/, T('correctEx')).replace(/^Revisa esto:/, T('reviewThis'));

/* ---------- progreso ---------- */
let S = {}; try { S = JSON.parse(localStorage.getItem(K)) || {}; } catch (e) {}
S = Object.assign({ done: {}, srs: {}, exams: null, placement: null, open: false, secs: {}, goal: 20, mute: false }, S);
if (!S.exams) S.exams = S.exam ? { A1: S.exam } : {};   // migra el examen único antiguo (A1)
const save = () => { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} };

/* ---------- constancia: minutos activos por día (meta recomendada: 20 min) ---------- */
const dkey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
let lastAct = 0, lastSave = 0;
const tick = () => {                                   // suma el tiempo entre interacciones (máx. 2 min de pausa)
  const n = Date.now();
  if (lastAct && n - lastAct < 120000) { const k = dkey(new Date()); S.secs[k] = (S.secs[k] || 0) + (n - lastAct) / 1000; if (n - lastSave > 5000) { save(); lastSave = n; } }
  lastAct = n;
};
['click', 'keydown'].forEach(ev => document.addEventListener(ev, tick, true));
const minsToday = () => Math.floor((S.secs[dkey(new Date())] || 0) / 60);
const streak = () => {                                 // días seguidos cumpliendo la meta (si hoy aún no, cuenta desde ayer)
  const ok = k => (S.secs[k] || 0) >= S.goal * 60, d = new Date(); let n = 0;
  if (!ok(dkey(d))) d.setDate(d.getDate() - 1);
  while (ok(dkey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
};

/* ---------- audio (Web Speech API) ---------- */
const say = (t, slow) => { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; u.rate = slow ? .6 : .9; speechSynthesis.speak(u); };
document.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) say(s.dataset.say, s.dataset.slow); });
const sayBtn = (t, l = '🔊') => `<button type="button" class="tx-btn tx-alt" data-say="${esc(t)}" aria-label="${T('listen')}">${l}</button>`;
const audioBar = t => sayBtn(t, '🔊 ' + T('listen')) + ' <button type="button" class="tx-btn tx-alt" data-slow="1" data-say="' + esc(t) + '">🐢 ' + T('speedSlow') + '</button>';

/* ---------- normalización de respuestas (README) ---------- */
const norm = (s, cs) => { s = String(s).replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim(); if (!cs) s = s.toLowerCase(); return s.replace(/[.?!]+$/, '').replace(/'/g, '').trim(); };

/* ---------- markdown mínimo: tablas, listas, **negrita**, *cursiva* ---------- */
const md = t => {
  const I = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  const L = t.split('\n'), li = /^\s*(-|\d+\.) /; let out = '', i = 0;
  while (i < L.length) {
    const l = L[i];
    if (/^\s*\|/.test(l)) {
      const r = []; while (i < L.length && /^\s*\|/.test(L[i])) r.push(L[i++]);
      const rows = r.filter(x => !/^\s*\|[\s:|-]+\|\s*$/.test(x)).map(x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => I(c.trim())));
      out += '<div class="tx-scroll"><table class="tx-table">' + rows.map((c, k) => '<tr>' + c.map(d => k ? `<td>${d}</td>` : `<th>${d}</th>`).join('') + '</tr>').join('') + '</table></div>';
    } else if (li.test(l)) {
      const o = /^\s*\d/.test(l), r = []; while (i < L.length && li.test(L[i])) r.push(L[i++].replace(li, ''));
      out += (o ? '<ol>' : '<ul>') + r.map(x => '<li>' + I(x) + '</li>').join('') + (o ? '</ol>' : '</ul>');
    } else { if (l.trim()) out += '<p>' + I(l) + '</p>'; i++; }
  }
  return out;
};

/* ---------- entrada de la lección (diálogo / texto / glosario) ---------- */
const allTr = g => ES() || g.every(w => ovV(w.id));
const gloss = g => g && g.length ? `<h3>${T('vocabH')}</h3><div class="tx-scroll"><table class="tx-table"><tr><th></th><th>${T('colWord')}</th><th>${T('colIPA')}</th><th>${T(allTr(g) ? 'colMeaningTr' : 'colMeaning')}</th><th>${T('colExample')}</th></tr>` +
  g.map(w => `<tr><td>${sayBtn(w.lemma)}</td><td><b>${esc(w.lemma)}</b> <small>${esc(w.pos)}</small></td><td>${esc(w.ipa)}</td><td>${esc(meaning(w))}</td><td>${esc(w.example)}</td></tr>`).join('') + '</table></div>' : '';
const inputHTML = (n, plain) => {
  let s = '';
  if (n.type === 'dialogue') s = n.lines.map(l => `<div class="tx-line">${plain ? '' : sayBtn(l.text) + ' '}<b>${esc(l.speaker)}:</b> ${esc(l.text)}<br><small>${esc(l.es)}</small></div>`).join('');
  else if (n.type === 'text') s = `<p class="tx-line">${plain ? '' : sayBtn(n.text) + ' '}${esc(n.text)}<br><small>${esc(n.es)}</small></p>`;
  else if (n.recap_es) s = '<p>' + esc(n.recap_es) + '</p>';
  return s + (plain ? '' : gloss(n.glossary));
};

/* ---------- ejercicios ---------- */
const R = {};
const reviewHTML = e => {                              // tema que hay que repasar para esta pregunta (sin dar la respuesta)
  const r = e.review; if (!r) return T('reviewTheory');
  const o = r.lesson && !ES() ? ovL(r.lesson) : null;
  return '<b>' + esc(o ? o.topic || o.title : r.topic_es) + '</b>' + (r.lesson ? ' <small>· ' + T('unitLesson', { u: r.unit, l: r.order }) + ': ' + esc(o ? o.title : r.lesson_es) + '</small>' : '');
};
function runEx(e, box, next, o = {}) {
  box.innerHTML = '';
  const q = h('div', 'tx-q', esc(e.prompt)), b = h('div', 'tx-body'), fb = h('div', 'tx-fb'), act = h('div', 'tx-act');
  if (e.passage) box.append(h('div', 'tx-sit', esc(e.passage)));
  box.append(q);
  if (e.refers_to_input && o.input) box.append(h('details', 'tx-ref', '<summary>' + T('seeText') + '</summary>' + inputHTML(o.input, true)));
  box.append(b, fb, act);
  let done = 0;
  const fin = (s, x = '') => {
    if (done) return; done = 1;
    if (o.quiet) return next(s, e);
    fb.className = 'tx-fb ' + (o.optional ? '' : s >= 1 ? 'ok' : s > 0 ? 'half' : 'bad');
    const why = e.feedback ? e.feedback.incorrect.replace(/^Revisa esto:\s*/, '') : '';
    let head;
    if (o.exam) { x = ''; head = s >= 1 ? '<b>' + esc(e.feedback ? fbTxt(e.feedback.correct) : T('correctEx')) + '</b>' : '<b>' + T('reviewThis') + '</b> ' + reviewHTML(e); }   // examen: tema a repasar, nunca la respuesta
    else if (o.optional || e.type === 'writing' || e.type === 'pronunciation') head = why ? '<b>' + esc(why) + '</b>' : '';       // autoevaluación: sin veredicto
    else head = e.feedback ? '<b>' + esc(fbTxt(s >= 1 ? e.feedback.correct : e.feedback.incorrect)) + '</b>' : '';
    fb.innerHTML = head + x;
    if (!o.optional && e.type !== 'writing' && e.type !== 'pronunciation') (s >= 1 ? SFX.ok : SFX.bad)();
    act.replaceChildren(btn(T('continue'), () => next(s, e)));
  };
  const ask = (fn, l = T('check')) => act.replaceChildren(btn(l, fn));
  R[e.type](e, b, fin, ask, q, o);
}

R.multiple_choice = R.listening = (e, b, fin, ask, q, o) => {
  if (e.type === 'listening') b.append(h('p', '', audioBar(e.audio_text)));
  const w = h('div', 'tx-opts'); b.append(w);
  const opts = (e.fixed ? e.options : shuffle(e.options)).map(t => [t, btn(t, null, 'tx-opt')]);
  if (o.dk) opts.push(['', btn(T('dontKnow'), null, 'tx-opt')]);
  opts.forEach(([t, x]) => {
    x.onclick = () => {
      const ok = e.answer.includes(t);
      if (!o.quiet) { opts.forEach(([u, y]) => { y.disabled = true; if (e.answer.includes(u) && (ok || !o.exam)) y.classList.add('ok'); }); if (!ok) x.classList.add('bad'); }
      fin(ok ? 1 : 0, e.type === 'listening' ? '<p>' + T('transcript') + ' <i>' + esc(e.audio_text) + '</i></p>' : '');
    };
    w.append(x);
  });
};
R.true_false = (e, b, fin, ask, q, o) => R.multiple_choice({ ...e, fixed: 1, options: [T('trueW'), T('falseW')], answer: [e.answer[0] ? T('trueW') : T('falseW')] }, b, fin, ask, q, o);

const typed = (e, b, fin, ask, q) => {
  const inp = h('input', 'tx-in'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', T('yourAnswer'));
  if (e.type === 'fill_blank') q.innerHTML = esc(e.prompt).replace('___', '<span class="tx-slot"></span>');
  if (e.type === 'error_correction') b.append(h('div', 'tx-wrong', esc(e.text)));
  if (e.audio_text) b.append(h('p', '', audioBar(e.audio_text)));
  (q.querySelector('.tx-slot') || b).append(inp);
  const go = () => {
    const v = inp.value; if (!v.trim()) return; inp.disabled = true;
    const ok = [...e.answer, ...(e.accepted_alternatives || [])].some(a => norm(a, e.case_sensitive) === norm(v, e.case_sensitive));
    fin(ok ? 1 : 0, (ok ? '' : '<p>' + T('answerIs') + ' <b>' + esc(e.answer[0]) + '</b></p>') + (e.audio_text ? '<p>' + T('transcript') + ' <i>' + esc(e.audio_text) + '</i></p>' : ''));
  };
  inp.onkeydown = ev => { if (ev.key === 'Enter') go(); };
  ask(go);
};
R.fill_blank = R.translation = R.error_correction = R.dictation = typed;

R.word_order = (e, b, fin, ask) => {
  const ans = h('div', 'tx-tray'), pool = h('div', 'tx-tray tx-pool'); b.append(ans, pool);
  shuffle(e.tokens).forEach(t => { const x = btn(t, () => (x.parentNode === pool ? ans : pool).append(x), 'tx-chip'); pool.append(x); });
  ask(() => {
    const got = [...ans.children].map(x => x.textContent); if (!got.length) return;
    [...ans.children, ...pool.children].forEach(x => x.disabled = true);
    const ok = got.join(' ') === e.answer.join(' ');
    fin(ok ? 1 : 0, ok ? '' : '<p>' + T('correctOrder') + ' <b>' + esc(sent(e.answer)) + '</b></p>');
  });
};

R.matching = (e, b, fin) => {
  const cols = h('div', 'tx-cols'), l = h('div'), r = h('div'); cols.append(l, r); b.append(cols);
  let sel = null, n = 0, mist = 0;
  const mk = (t, side) => { const x = btn(t, () => pick(x, side), 'tx-opt tx-pair'); x.dataset.t = t; return x; };
  const pick = (x, side) => {
    if (side === 'l') { l.querySelectorAll('.sel').forEach(y => y.classList.remove('sel')); sel = x; x.classList.add('sel'); return; }
    if (!sel) return;
    const ok = e.pairs.some(p => p.left === sel.dataset.t && p.right === x.dataset.t);
    if (ok) { [sel, x].forEach(y => { y.classList.remove('sel'); y.classList.add('ok'); y.disabled = true; }); sel = null; if (++n === e.pairs.length) fin(Math.max(0, 1 - mist / n), mist ? '<p>' + T('mistakes') + ' ' + mist + '</p>' : ''); }
    else { mist++; x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); }
  };
  e.pairs.forEach(p => l.append(mk(p.left, 'l')));
  shuffle(e.pairs.map(p => p.right)).forEach(t => r.append(mk(t, 'r')));
};

R.categorize = (e, b, fin) => {
  const cols = h('div', 'tx-cols'), l = h('div'), r = h('div'); cols.append(l, r); b.append(h('p', 'tx-note', '<small>' + T('tapCategory') + '</small>'), cols);
  let sel = null, n = 0, mist = 0;
  shuffle(e.items).forEach(it => {
    const x = btn(it.text, () => { if (x.disabled) return; l.querySelectorAll('.sel').forEach(y => y.classList.remove('sel')); sel = x; x.classList.add('sel'); }, 'tx-opt tx-pair');
    x.dataset.c = it.category; x.dataset.t = it.text; l.append(x);
  });
  e.categories.forEach(c => {
    const y = btn(c, () => {
      if (!sel || sel.disabled) return;
      if (sel.dataset.c === c) {
        sel.classList.remove('sel'); sel.classList.add('ok'); sel.disabled = true; sel.insertAdjacentHTML('beforeend', ' <small>→ ' + esc(c) + '</small>'); sel = null;
        if (++n === e.items.length) fin(Math.max(0, 1 - mist / e.items.length), mist ? '<p>' + T('mistakes') + ' ' + mist + '</p>' : '');
      } else { mist++; y.classList.add('bad'); setTimeout(() => y.classList.remove('bad'), 450); }
    }, 'tx-opt tx-pair');
    r.append(y);
  });
};

/* grabarte y comparar con el modelo (la grabación no sale de tu dispositivo) */
const recorder = () => {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) return null;
  const wrap = h('span', 'tx-rec'), b = btn(T('recordMe'), null, 'tx-alt'), a = h('audio');
  a.controls = true; a.hidden = true; a.setAttribute('aria-label', T('yourRecording'));
  let mr = null, stream = null, chunks = [];
  b.onclick = async () => {
    if (mr && mr.state === 'recording') { mr.stop(); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (err) { b.textContent = T('noMic'); return; }
    chunks = []; mr = new MediaRecorder(stream);
    mr.ondataavailable = ev => chunks.push(ev.data);
    mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); if (a.src) URL.revokeObjectURL(a.src); a.src = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); a.hidden = false; b.textContent = T('recordAgain'); };
    mr.start(); b.textContent = T('stop'); setTimeout(() => { if (mr && mr.state === 'recording') mr.stop(); }, 8000);
  };
  wrap.append(b, ' ', a); return wrap;
};
R.pronunciation = (e, b, fin, ask) => {
  const can = !!recorder();
  b.append(h('p', 'tx-note', '<small>' + T(can ? 'pronTip' : 'pronTipNoRec') + '</small>'));
  e.items.forEach(i => {
    const row = h('div', 'tx-row', sayBtn(i.text) + `<div><b>${esc(i.text)}</b> <span class="tx-ipa">${esc(i.ipa)}</span><br><small>${esc(i.tip_es)}</small></div>`);
    const r = recorder(); if (r) row.lastElementChild.append(h('br'), r);
    b.append(row);
  });
  ask(() => fin(1), T('practised'));
};

R.writing = (e, b, fin, ask) => {
  const t = h('textarea', 'tx-in tx-ta'), warn = h('p', 'tx-warn'); t.rows = 4; t.setAttribute('aria-label', T('yourText'));
  const need = e.min_words || 8;
  b.append(t, h('small', '', T('minWords', { n: need })), warn);
  ask(() => {
    const ws = t.value.split(/\s+/).filter(w => /[A-Za-z]/.test(w)), uniq = new Set(ws.map(w => w.toLowerCase().replace(/[^a-z']/g, ''))).size;
    if (ws.length < need || uniq < Math.max(3, Math.ceil(need / 3))) {
      warn.textContent = T('writeMore', { n: need, w: ws.length, rep: ws.length >= need ? T('tooRepeated') : '' }); t.focus(); return;
    }
    warn.textContent = ''; t.disabled = true;
    fin(1, '<p><b>' + T('modelCompare') + '</b> ' + esc(e.model_answer) + '</p><p>' + T('checkText') + '</p><ul class="tx-check">' + e.self_check_es.map(x => '<li><label><input type="checkbox"> ' + esc(x) + '</label></li>').join('') + '</ul>');
  }, T('compareModel'));
};

R.roleplay = (e, b, fin) => {
  b.append(h('p', 'tx-sit', esc(e.situation_es)));
  let i = 0, good = 0; const n = e.turns.filter(t => t.choices).length;
  const step = () => {
    while (i < e.turns.length) {
      const t = e.turns[i++];
      if (!t.choices) { b.append(h('div', 'tx-turn', `<b>${esc(t.speaker)}:</b> ${esc(t.text)} ` + sayBtn(t.text))); continue; }
      const w = h('div', 'tx-opts'); b.append(h('div', 'tx-turn', '<b>' + T('you') + '</b>'), w);
      shuffle(t.choices.map((c, k) => [c, k])).forEach(([c, k]) => {
        const x = btn(c, () => {
          [...w.children].forEach(y => { y.disabled = true; if (+y.dataset.k === t.best) y.classList.add('ok'); });
          if (k === t.best) good++; else x.classList.add('bad');
          b.append(h('p', 'tx-why', esc(t.why_es))); step();
        }, 'tx-opt'); x.dataset.k = k; w.append(x);
      });
      return;
    }
    fin(n ? good / n : 1);
  };
  step();
};

/* ---------- vistas ---------- */
let P, LV = [], flat = [];
let redraw = null;                                       // vuelve a dibujar la pantalla actual (cambio de idioma)
const view = (html, cls = 'tx-card') => { app.innerHTML = `<div class="${cls}">${html}</div>`; scrollTo(0, 0); return app.firstChild; };
const stepCard = (title, i, n) => {
  view(`<div class="tx-stephead"><button type="button" class="tx-x" aria-label="${T('exitMap')}">✕</button><div class="tx-prog"><span style="width:${i / n * 100}%"></span></div></div><h2>${title}</h2><div id="step"></div>`);
  $('.tx-x').onclick = () => { if (i === 0 || i >= n || confirm(T('exitConfirm'))) home(); };
  return $('#step');
};
const dueItems = () => Object.keys(S.srs).filter(k => S.srs[k].due <= day());
const free = c => !!(S.placement && S.placement.passed && S.placement.passed.includes(c));          // nivel superado en la prueba de nivel
const unlocked = l => { const k = flat.indexOf(l), p = flat[k - 1]; return S.open || k === 0 || free(l.cefr) || !!S.done[p.id] || (p.cefr !== l.cefr && free(p.cefr)); };
const examOpen = lv => lv.exam && lv.exam.status === 'ready' && (S.open || free(lv.cefr) || flat.filter(l => l.cefr === lv.cefr).length === lvTotal(lv) && flat.filter(l => l.cefr === lv.cefr).every(l => S.done[l.id]));
const lvTotal = lv => lv.units.reduce((a, u) => a + u.lessons.length, 0);

/* ---------- modo juego: estrellas, XP, sonido, confeti, celebraciones ---------- */
const lvName = c => T('lv_' + c);
const ICON = { greetings: '👋', 'countries-jobs': '🌍', family: '👨‍👩‍👧', routine: '⏰', food: '🍎', home: '🏠', town: '🗺️', shopping: '🛍️', hobbies: '🎸',
  'weather-plans': '☀️', objects: '🎒', 'past-simple': '📸', travel: '✈️', comparing: '⚖️', quantities: '🥕', future: '🔮', 'health-rules': '🩺',
  'work-study': '💼', experiences: '🏔️', technology: '📱', opinions: '💬', clothes: '👕', 'getting-around': '🚇', leisure: '🎬',
  'life-stories': '📖', places: '📍', careers: '🧭', lifestyle: '🥗', media: '📰', tourism: '🧳', money: '💰', education: '🎓', environment: '🌿', culture: '🎭', relationships: '🤝', achievements: '🏆', identity: '🪪', workplace: '🏢', news: '🗞️', science: '🔬', wellbeing: '🧘', 'culture-travel': '🛂', economy: '📈', society: '🏛️', planet: '🌎', arts: '🎨', law: '👨‍⚖️', communication: '🗣️', adventure: '🧗', global: '🌐' };
const starsOf = s => s >= .95 ? 3 : s >= .85 ? 2 : s > 0 ? 1 : 0;
const xpOf = () => Object.entries(S.done).reduce((a, [id, d]) => a + (10 + Math.round(d.score * 10)) * (/-l06$/.test(id) ? 2 : 1), 0) +
  Object.values(S.exams || {}).filter(e => e && e.passed).length * 150;
const rank = xp => { let n = 1, need = 60, acc = 0; while (xp >= acc + need) { acc += need; n++; need = Math.round(need * 1.15); } return { n, cur: xp - acc, need }; };
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let AC = null;
const tone = seq => {
  if (S.mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t0 = AC.currentTime + .01;
    seq.forEach(([f, d, at]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t0 + at); g.gain.exponentialRampToValueAtTime(.16, t0 + at + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + d);
      o.connect(g); g.connect(AC.destination); o.start(t0 + at); o.stop(t0 + at + d + .05); });
  } catch (e) {}
};
const SFX = { ok: () => tone([[660, .12, 0], [990, .2, .09]]), bad: () => tone([[196, .22, 0], [174, .25, .12]]),
  win: () => tone([[523, .14, 0], [659, .14, .12], [784, .14, .24], [1047, .45, .36]]), star: i => tone([[784 + i * 196, .18, 0]]) };
function confetti(n = 140) {
  if (reduced() || !window.requestAnimationFrame) return;
  const c = h('canvas', 'tx-confetti'); let x = null; try { x = c.getContext('2d'); } catch (e) {}
  if (!x) return; document.body.append(c);
  const W = c.width = innerWidth, H = c.height = innerHeight, cols = ['#f2b705', '#8B0000', '#2a9d8f', '#3a7bd5', '#ffffff', '#e76f51', '#8e44ad'];
  const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .25, y: H * .38, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 5,
    r: Math.random() * 7 + 5, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6, va: (Math.random() - .5) * .35 }));
  let t = 0;
  const step = () => { x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++t < 170) requestAnimationFrame(step); else c.remove(); };
  requestAnimationFrame(step);
}
function celebrate(icon, title, sub, btns) {
  document.querySelectorAll('.tx-modal').forEach(m => m.remove());
  const o = h('div', 'tx-modal'), b = h('div', 'tx-modal-box', `<div class="tx-modal-icon">${icon}</div><h2>${title}</h2><p>${sub}</p>`);
  o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.append(b);
  const close = () => o.remove();
  (btns || [[T('great'), null]]).forEach(([l, fn], i) => b.append(btn(l, () => { close(); if (fn) fn(); }, i ? 'tx-alt' : '')));
  o.onclick = e => { if (e.target === o) close(); };
  document.body.append(o); const f = b.querySelector('.tx-btn'); if (f) f.focus();
  SFX.win(); confetti(180);
}
let fresh = null;                                       // lección recién desbloqueada: se anima en el mapa
const closePop = () => document.querySelectorAll('.tx-pop').forEach(p => p.remove());
document.addEventListener('click', e => { if (!e.target.closest('.tx-pop,[data-pop]')) closePop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); document.querySelectorAll('.tx-modal').forEach(m => m.remove()); } });
function pop(id) {
  closePop();
  const l = flat.find(x => x.id === id), lv = LV.find(v => v.cefr === l.cefr), u = lv.units.find(u => u.lessons.includes(l)), dn = S.done[id], st = dn ? starsOf(dn.score) : 0;
  const p = h('div', 'tx-pop lv-' + l.cefr.toLowerCase(), `<small>${l.cefr} · ${T('unitN', { n: u.order })} · ${l.kind === 'checkpoint' ? '🎁 Checkpoint' : T('lessonN', { n: l.order })}</small><b>${esc(l.title_target)}</b><span>${esc(subTitle(l.id, l.title_es, l.title_target))}</span>` +
    (dn ? `<span class="tx-stars big">${'<i>★</i>'.repeat(st)}${'<i class="off">★</i>'.repeat(3 - st)}</span><small>${T('bestResult', { p: Math.round(dn.score * 100) })}${st < 3 ? T('moreStar', { p: st === 2 ? 95 : 85 }) : ''}</small>` : `<small>${T(l.kind === 'checkpoint' ? 'cpHint' : 'upTo3')}</small>`));
  p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', l.title_target);
  const row = h('div', 'tx-pop-row');
  row.append(btn(T(dn ? 'repeatBtn' : 'startBtn'), () => { closePop(); lesson(l).catch(fail); }, 'tx-go'), btn('🖨', () => { closePop(); printView('lesson', id).catch(fail); }, 'tx-alt'), btn('✕', closePop, 'tx-alt'));
  row.lastChild.setAttribute('aria-label', T('close')); row.children[1].setAttribute('aria-label', T('printLesson'));
  p.append(row); document.body.append(p); p.querySelector('.tx-go').focus();
}

function home() {
  closePop(); redraw = home;
  const due = dueItems().length, pl = S.placement, soon = P.levels.filter(l => !LV.includes(l));
  const nextL = flat.find(l => !S.done[l.id] && unlocked(l)), curLv = nextL ? nextL.cefr : LV[LV.length - 1].cefr;
  const mt = minsToday(), g = S.goal, stk = streak(), xp = xpOf(), rk = rank(xp);
  const totStars = Object.keys(S.done).filter(id => flat.some(l => l.id === id)).reduce((a, id) => a + starsOf(S.done[id].score), 0);
  const C = 2 * Math.PI * 16;
  let s = `<div class="tx-hud">
    <div class="tx-stat" title="${T('streakTitle')}"><span class="tx-fire ${stk ? 'on' : ''}">🔥</span><b>${stk}</b><small>${T(stk === 1 ? 'day1' : 'days')}</small></div>
    <div class="tx-stat" title="${T('starsTitle')}"><span>⭐</span><b>${totStars}</b><small>/ ${flat.length * 3}</small></div>
    <div class="tx-stat tx-rank" title="${T('xpTitle')}"><span class="tx-badge">${rk.n}</span><div><small>${T('playerLevel')} · <b>${xp}</b> XP</small><div class="tx-xpbar"><span style="width:${rk.cur / rk.need * 100}%"></span></div></div></div>
    <div class="tx-stat tx-goal" title="${T('goalTitle')}"><svg viewBox="0 0 40 40" class="tx-ring" aria-hidden="true"><circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="16" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - Math.min(1, mt / g))}"/></svg>
      <div><b>${mt}/${g}</b> <small>${T('minToday')}${mt >= g ? ' ✓' : ''}</small><br><select id="tx-goal" aria-label="${T('goalTitle')}">${[10, 20, 30].map(m => `<option value="${m}" ${m === g ? 'selected' : ''}>${T('goalMin', { m })}</option>`).join('')}</select></div></div>
    <button type="button" class="tx-mute" id="tx-mute" aria-label="${T(S.mute ? 'soundOn' : 'mute')}">${S.mute ? '🔇' : '🔊'}</button>
  </div>
  <div class="tx-tools">
    <button class="tx-tool" data-go="placement"><span>🎯</span><b>${T('placementT')}</b><small>${pl ? T('resultL', { l: esc(pl.level) }) : T('findLevel')}</small></button>
    <button class="tx-tool" data-go="review" ${due ? '' : 'disabled'}><span>🔁</span><b>${T('reviewT')}</b><small>${due ? T('pendingN', { n: due }) : T('nothingDue')}</small>${due ? `<i class="tx-dot">${due}</i>` : ''}</button>
    <button class="tx-tool" data-go="vocab"><span>📚</span><b>${T('vocabT')}</b><small>${T('byTopics')}</small></button>
    <button class="tx-tool" data-go="faq"><span>❓</span><b>${T('helpT')}</b><small>${T('faqShort')}</small></button>
  </div>`;
  const OFF = [0, .95, 1.55, .95, 0, -.95, -1.55, -.95], ROW = 108;
  LV.forEach(lv => {
    const ls = flat.filter(l => l.cefr === lv.cefr), nd = ls.filter(l => S.done[l.id]).length, tot = lvTotal(lv), ex = S.exams[lv.cefr], open = examOpen(lv);
    const lvStars = ls.reduce((a, l) => a + (S.done[l.id] ? starsOf(S.done[l.id].score) : 0), 0);
    s += `<details class="tx-region lv-${lv.cefr.toLowerCase()} ${ex && ex.passed ? 'cleared' : ''}" ${lv.cefr === curLv ? 'open' : ''}><summary class="tx-region-head">
      <span class="tx-lvbadge">${lv.cefr}${ex && ex.passed ? '<i>🏆</i>' : ''}</span><span class="tx-region-title"><b>${T('levelX', { l: lv.cefr, n: lvName(lv.cefr) })}</b>
      <small>${T('lessonsOf', { d: nd, t: tot })} · ⭐ ${lvStars}/${tot * 3}${ex && ex.passed ? T('examPassedS') : ''}${free(lv.cefr) ? T('passedPlacement') : ''}</small>
      <span class="tx-prog"><span style="width:${nd / tot * 100}%"></span></span></span><span class="tx-chev" aria-hidden="true">▾</span></summary><div class="tx-map">` +
      (ls.length < tot ? `<p class="tx-map-note">${T('stagesNote', { n: ls.length, t: tot })}</p>` : '');
    let k = 0;
    lv.units.filter(u => u.lessons.some(x => x.status === 'ready')).forEach(u => {
      const L = u.lessons.filter(l => l.status === 'ready'), ud = L.filter(l => S.done[l.id]).length, us = L.reduce((a, l) => a + (S.done[l.id] ? starsOf(S.done[l.id].score) : 0), 0), cleared = ud === L.length;
      s += `<section class="tx-unit ${cleared ? 'cleared' : ''}"><div class="tx-unit-head"><span class="tx-unit-ico" aria-hidden="true">${ICON[u.theme] || '📘'}</span>
        <div class="tx-unit-name"><small>${T('unitN', { n: u.order })}</small><b>${esc(u.title_target)}</b><small>${esc(subTitle(u.id, u.title_es, u.title_target))}</small></div>
        <div class="tx-unit-side">${cleared ? `<span class="tx-medal" title="${T('unitDone')}">🏅</span>` : `<span class="tx-unit-count">${ud}/${L.length}</span>`}<small>⭐ ${us}/${L.length * 3}</small></div>
        <button class="tx-btn tx-alt tx-printu" data-go="print:unit:${u.id}" title="${T('printUnit')}" aria-label="${T('printUnitN', { n: u.order })}">🖨</button></div>`;
      const H = L.length * ROW + 44, pts = L.map((l, i) => [160 + OFF[(k + i) % OFF.length] * 52, i * ROW + 80]);
      let d = '', dd = '';
      pts.forEach((p, i) => { if (!i) return; const q = pts[i - 1], my = (q[1] + p[1]) / 2, seg = ` M${q[0]},${q[1]} C${q[0]},${my} ${p[0]},${my} ${p[0]},${p[1]}`; d += seg; if (S.done[L[i - 1].id]) dd += seg; });
      s += `<div class="tx-path" style="height:${H}px"><svg viewBox="0 0 320 ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="tx-road" d="${d}"/><path class="tx-road done" d="${dd}"/></svg>`;
      L.forEach((l, i) => {
        const dn = S.done[l.id], ok = unlocked(l), cur = !!nextL && l.id === nextL.id, st = dn ? starsOf(dn.score) : 0, cp = l.kind === 'checkpoint';
        const icon = !ok ? '🔒' : cp ? (dn ? '🏅' : '🎁') : dn ? '✔' : cur ? '★' : '▶';
        s += `<div class="tx-spot" style="left:${pts[i][0] / 320 * 100}%;top:${pts[i][1]}px">` +
          (cur ? `<span class="tx-here">${T(nd || Object.keys(S.done).length ? 'keepGoing' : 'startHere')}</span>` : '') +
          `<button type="button" class="tx-node ${dn ? 'done' : ''} ${cur ? 'current' : ''} ${cp ? 'chest' : ''} ${fresh === l.id ? 'fresh' : ''}" data-pop="${l.id}" ${ok ? '' : 'disabled'}
            aria-label="${esc(T(cp ? 'ariaCp' : 'ariaLesson') + l.title_target)}${dn ? T('ariaDone', { n: st }) : ok ? '' : T('ariaLocked')}"><span class="tx-node-ico">${icon}</span></button>
          <span class="tx-stars" aria-hidden="true">${dn ? '<i>★</i>'.repeat(st) + '<i class="off">★</i>'.repeat(3 - st) : ''}</span></div>`;
      });
      s += '</div></section>';
      k += L.length;
    });
    const examTxt = ex ? T(ex.passed ? 'passedPct' : 'lastTry', { p: Math.round(ex.pct * 100) }) : !(lv.exam && lv.exam.status === 'ready') ? T('examWhenLevel') : open ? T('examQs', { n: lv.exam.items || 30 }) : T('completeN', { n: tot });
    s += `<div class="tx-castle ${ex && ex.passed ? 'won' : ''} ${open ? 'open' : ''}"><button type="button" class="tx-node tx-exam" data-go="exam:${lv.cefr}" ${open ? '' : 'disabled'} aria-label="${T('finalExam', { l: lv.cefr })}"><span class="tx-node-ico">${ex && ex.passed ? '🏆' : open ? '🏰' : '🔒'}</span></button>
      <b>${T('finalExam', { l: lv.cefr })}</b><small class="tx-exam-txt">${examTxt}</small><button class="tx-btn tx-alt" data-go="print:exam:${lv.cefr}" ${open ? '' : 'disabled'}>${T('examSheet')}</button></div></div></details>`;
  });
  soon.forEach(l => { s += `<div class="tx-region tx-fog lv-${l.cefr.toLowerCase()}"><div class="tx-region-head"><span class="tx-lvbadge">${l.cefr}</span><span class="tx-region-title"><b>${T('levelX', { l: l.cefr, n: lvName(l.cefr) })}</b><small>${T('comingSoon')}</small></span></div><div class="tx-fogmap" aria-hidden="true">☁️ ☁️ ☁️</div></div>`; });
  s += `<div class="tx-foot"><label><input type="checkbox" id="tx-open" ${S.open ? 'checked' : ''}> ${T('testMode')}</label><button data-go="reset">${T('resetProgress')}</button></div>${ES() ? '' : `<p class="tx-foot"><small>${T('contentNote')}</small></p>`}`;
  app.innerHTML = s;
  $('#tx-open').onchange = e => { S.open = e.target.checked; save(); home(); };
  $('#tx-goal').onchange = e => { S.goal = +e.target.value; save(); home(); };
  $('#tx-mute').onclick = () => { S.mute = !S.mute; save(); home(); };
  const target = app.querySelector('.tx-node.fresh') || app.querySelector('.tx-node.current');
  if (target && target.scrollIntoView) setTimeout(() => target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }), 200); else scrollTo(0, 0);
  if (fresh) setTimeout(() => SFX.star(1), 300);
  fresh = null;
}

async function lesson(ent) {
  closePop();
  const raw = await J(ent.file); let L = localize(raw);
  const exs = L.exercises, pass = L.checkpoint?.pass_score ?? .7, total = 3 + exs.length;
  let title = `${esc(L.title.target)} <small>${esc(L.title.es || '')}</small>`;
  const here = f => { redraw = () => { L = localize(raw); title = `${esc(L.title.target)} <small>${esc(L.title.es || '')}</small>`; f(); }; };
  let sc = 0, combo = 0, best = 0;
  const intro = () => { here(intro); const s = stepCard(title, 0, total); s.innerHTML = `<p>${esc(L.objective)}</p><p><small>${T('minExercises', { m: L.est_minutes, n: exs.length })}</small></p>` + (L.warmup ? `<p class="tx-warm">${esc(L.warmup.prompt_es)}</p>` : ''); s.append(btn(T('start'), input), btn(T('print'), () => printView('lesson', ent.id).catch(fail), 'tx-alt')); };
  const input = () => { here(input); const s = stepCard(title, 1, total); s.innerHTML = inputHTML(L.input); s.append(btn(T('continue'), explain)); };
  const explain = () => {
    here(explain);
    const s = stepCard(title, 2, total), x = L.explanation;
    s.innerHTML = md(x.md_es) +
      (x.common_mistakes_es?.length ? '<h3>' + T('commonMistakes') + '</h3><ul>' + x.common_mistakes_es.map(m => `<li>❌ <s>${esc(m.wrong)}</s> → ✅ <b>${esc(m.right)}</b><br><small>${esc(m.note)}</small></li>`).join('') + '</ul>' : '') +
      (x.false_friends?.length ? '<h3>' + T('falseFriends') + '</h3><ul>' + x.false_friends.map(f => `<li><b>${esc(f.word)}</b>: ${T('ffLine', { f: esc(f.es_false), r: esc(f.real) })}<br><small>${esc(f.note)}</small></li>`).join('') + '</ul>' : '');
    s.append(btn(T('toExercises'), () => ex(0)));
  };
  const ex = i => {
    if (i >= exs.length) return end();
    here(() => ex(i));
    const s = stepCard(`${title} <small>${T('exerciseN', { i: i + 1, n: exs.length })}</small>${combo >= 2 ? `<span class="tx-combo">🔥 ×${combo}</span>` : ''}`, 3 + i, total);
    runEx(exs[i], s, v => { sc += v; combo = v >= 1 ? combo + 1 : 0; best = Math.max(best, combo); ex(i + 1); }, { input: L.input });
  };
  const end = again => {
    here(() => end(true));
    const pct = sc / exs.length, ok = pct >= pass, k = flat.findIndex(l => l.id === ent.id), nx = flat[k + 1];
    const lv = LV.find(v => v.cefr === ent.cefr), unit = lv.units.find(u => u.lessons.some(x => x.id === ent.id)), UL = unit.lessons.filter(x => x.status === 'ready');
    const prev = S.done[L.id], prevSt = prev ? starsOf(prev.score) : 0, xp0 = xpOf(), unitWas = UL.every(x => S.done[x.id]), examWas = examOpen(lv), nxWas = nx ? unlocked(nx) : true;
    if (ok) { if (!prev || prev.score < pct) S.done[L.id] = { score: pct, at: Date.now() };
      (L.srs_items || []).forEach(i => { if (!S.srs[i.id]) S.srs[i.id] = { box: 1, due: day() + 1, lapses: 0 }; }); save(); }
    const st = ok ? starsOf(pct) : 0, gain = xpOf() - xp0;
    const s = stepCard(title, total, total);
    s.innerHTML = `<div class="tx-result ${ok ? 'win' : 'lose'}"><div class="tx-bigstars" aria-label="${T('starsOf3', { n: st })}">${[0, 1, 2].map(i => `<span class="${i < st ? 'on' : ''}" style="animation-delay:${.2 + i * .35}s">★</span>`).join('')}</div>
      <p class="tx-big">${Math.round(pct * 100)} %</p><p class="tx-res-msg">${ok ? T(st === 3 ? 'perfect' : st === 2 ? 'veryGood' : 'lessonPassed') : T('almost', { p: Math.round(pass * 100) })}</p>
      ${ok ? '' : '<p>' + T('tryAgain') + '</p>'}
      ${gain > 0 ? `<p><span class="tx-xpgain">+${gain} XP</span></p>` : ''}${ok && prev && st > prevSt ? '<p><b>' + T('newStar') + '</b></p>' : ''}${best >= 3 ? `<p><small>${T('bestCombo', { n: best })}</small></p>` : ''}</div>` +
      (L.summary?.key_phrases?.length ? '<h3>' + T('keyPhrases') + '</h3><ul>' + L.summary.key_phrases.map(p => `<li>${esc(p)} ${sayBtn(p)}</li>`).join('') + '</ul>' : '');
    if (ok && nx) s.append(btn(T('nextLesson'), () => lesson(nx).catch(fail)));
    s.append(btn(T('backMap'), () => { if (ok && nx && !nxWas) fresh = nx.id; home(); }), btn(T('repeat'), () => lesson(ent).catch(fail), 'tx-alt'));
    if (again) {} else if (ok) { SFX.win(); for (let i = 0; i < st; i++) setTimeout(() => SFX.star(i), 450 + i * 350); confetti(40 + st * 45); } else SFX.bad();
    const unitNow = UL.every(x => S.done[x.id]), examNow = examOpen(lv);
    if (ok && unitNow && !unitWas) {
      const us = UL.reduce((a, x) => a + starsOf(S.done[x.id].score), 0);
      setTimeout(() => celebrate('🏅', T('unitCompleted', { n: unit.order }), `<b>${esc(unit.title_target)}</b><br>${esc(subTitle(unit.id, unit.title_es, unit.title_target))}${subTitle(unit.id, unit.title_es, unit.title_target) ? '<br>' : ''}${T('starsOfN', { s: us, t: UL.length * 3 })}` +
        (examNow && !examWas ? `<br><br>🏰 <b>${T('examUnlocked', { l: lv.cefr })}</b>` : ''), [[T('seeMap'), () => { if (nx && !nxWas) fresh = nx.id; home(); }], [T('stayHere'), null]]), 1500);
    }
  };
  intro();
}

const TOPIC_ES = { greetings: 'Saludos', alphabet: 'Alfabeto', numbers: 'Números', age: 'Edad', countries: 'Países y nacionalidades', 'to-be': 'Verbo to be', jobs: 'Trabajos', family: 'Familia',
  possessives: 'Posesivos', 'have-got': 'Have got', adjectives: 'Adjetivos', routine: 'Rutina diaria', time: 'La hora', 'present-simple': 'Presente simple', days: 'Días de la semana',
  food: 'Comida y bebida', plurals: 'Plurales', likes: 'Gustos', meals: 'Comidas del día', cafe: 'En el café', home: 'La casa', 'there-is': 'There is / there are', prepositions: 'Preposiciones de lugar',
  colours: 'Colores', town: 'La ciudad', directions: 'Direcciones', transport: 'Transporte', imperatives: 'Imperativos', prices: 'Precios', clothes: 'Ropa', 'this-that': 'This / that',
  shop: 'De compras', hobbies: 'Aficiones', can: 'Can (habilidad)', 'present-continuous': 'Presente continuo', invitations: 'Invitaciones', weather: 'El clima', months: 'Meses', dates: 'Fechas',
  plans: 'Planes', objects: 'Objetos cotidianos', 'past-simple': 'Pasado simple', travel: 'Viajes', comparing: 'Comparar', quantities: 'Comida y cantidades', future: 'Futuro',
  'health-rules': 'Salud y reglas', 'work-study': 'Trabajo y estudios', experiences: 'Experiencias', technology: 'Tecnología', opinions: 'Opiniones y sentimientos',
  'getting-around': 'Moverse por la ciudad', leisure: 'Tiempo libre',
  'life-stories': 'Historias de vida', places: 'Lugares', careers: 'Carreras', lifestyle: 'Estilo de vida', media: 'Medios', tourism: 'Turismo', money: 'Dinero', education: 'Educación', environment: 'Medio ambiente', culture: 'Cultura y tradiciones', relationships: 'Relaciones', achievements: 'Retos y logros', identity: 'Identidad', workplace: 'Mundo laboral', news: 'Noticias y medios', science: 'Ciencia', wellbeing: 'Bienestar', 'culture-travel': 'Viajes y culturas', economy: 'Economía', society: 'Sociedad', planet: 'Planeta', arts: 'Arte y cultura', law: 'Ley y sociedad', communication: 'Comunicación', adventure: 'Aventura y riesgo', global: 'Temas globales' };

async function vocab() {
  redraw = () => vocab().catch(fail);
  const lists = await Promise.all(LV.map(l => J('vocab/' + l.cefr.toLowerCase() + '.json')));
  const all = lists.flatMap((v, i) => v.items.map(x => Object.assign({ lv: LV[i].cefr }, x)));
  const name = t => (ES() && TOPIC_ES[t]) || (t === 'otros' || !t ? T('others') : String(t).replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()));
  const c = view(`<h2>${T('vocabByTopic')} <small>${T('wordsCount', { n: all.length })}</small></h2><div id="v-back"></div>
    <p><label>${T('colLevel')} <select id="v-lv"><option value="">${T('all')}</option>${LV.map(l => `<option>${l.cefr}</option>`).join('')}</select></label>
    <label>${T('search')} <input id="v-q" class="tx-in" placeholder="${T('searchPh')}" aria-label="${T('searchAria')}"></label></p><div id="v-list"></div>`);
  $('#v-back').append(btn(T('backMapArrow'), home));
  const draw = () => {
    const lvl = $('#v-lv').value, q = $('#v-q').value.trim().toLowerCase(), by = {};
    all.filter(w => (!lvl || w.lv === lvl) && (!q || (w.lemma + ' ' + meaning(w)).toLowerCase().includes(q))).forEach(w => (by[w.topic || 'otros'] = by[w.topic || 'otros'] || []).push(w));
    $('#v-list').innerHTML = Object.keys(by).sort((a, b) => name(a).localeCompare(name(b), TXI.lang)).map(tp =>
      `<details class="tx-level" ${q ? 'open' : ''}><summary>${esc(name(tp))} <small>(${by[tp].length})</small></summary><div class="tx-scroll"><table class="tx-table"><tr><th></th><th>${T('colWord')}</th><th>${T('colIPA')}</th><th>${T(allTr(by[tp]) ? 'colMeaningTr' : 'colMeaning')}</th><th>${T('colExample')}</th><th>${T('colLevel')}</th></tr>` +
      by[tp].map(w => `<tr><td>${sayBtn(w.lemma)}</td><td><b>${esc(w.lemma)}</b> <small>${esc(w.pos)}</small></td><td>${esc(w.ipa)}</td><td>${esc(meaning(w))}</td><td>${esc(w.example)}</td><td>${w.lv}</td></tr>`).join('') +
      '</table></div></details>').join('') || '<p>' + T('noResults') + '</p>';
  };
  $('#v-lv').onchange = draw; $('#v-q').oninput = draw; draw();
}

async function review() {
  const Vs = await Promise.all(LV.map(l => J('vocab/' + l.cefr.toLowerCase() + '.json'))), map = Object.fromEntries(Vs.flatMap(V => V.items).map(v => [v.id, v]));
  const q = shuffle(dueItems().filter(k => map[k])); let i = 0, ok = 0;
  const card = () => {
    redraw = card;
    if (i >= q.length) { const c = view(`<h2>${T('reviewDone')}</h2><p>${T('gotNofM', { o: ok, n: q.length })}</p>`); c.append(btn(T('backMap'), home)); return; }
    const v = map[q[i]], it = S.srs[q[i]], s = stepCard(`${T('reviewT')} <small>${i + 1}/${q.length}</small>`, i, q.length);
    s.innerHTML = `<p class="tx-big">${esc(v.lemma)} ${sayBtn(v.lemma)}</p><p class="tx-ipa">${esc(v.ipa)}</p>`;
    s.append(btn(T('showAnswer'), () => {
      s.innerHTML += `<p><b>${esc(meaning(v))}</b></p><p><small>${esc(v.example)}</small></p>`;
      const grade = good => { if (good) { ok++; it.box = Math.min(6, it.box + 1); } else { it.box = 1; it.lapses++; } it.due = day() + INT[it.box - 1]; save(); i++; card(); };
      s.append(btn(T('didntKnow'), () => grade(0)), btn(T('knewIt'), () => grade(1)));
      s.querySelector('.tx-btn:not([data-say])').remove();
    }));
  };
  card();
}

async function exam(cefr) {
  const lv = LV.find(l => l.cefr === cefr), E = await J(lv.exam.file), n = E.exercises.length, wrong = {}; let i = 0, sc = 0;
  const step = () => {
    if (i >= n) return result();
    redraw = step;
    const s = stepCard(`${T('examTitle', { l: cefr })} <small>${i + 1}/${n}</small>`, i, n);
    runEx(E.exercises[i], s, (v, e) => {
      sc += v;
      if (v < 1) { const r = e.review || { topic_es: T('generalReview') }; (wrong[r.topic_es] = wrong[r.topic_es] || { n: 0, r }).n++; }
      i++; step();
    }, { exam: true });
  };
  const result = () => {
    redraw = result;
    const pct = sc / n, ok = pct >= E.pass_score, before = S.exams[cefr]; S.exams[cefr] = { pct, passed: ok || !!(before && before.passed), at: Date.now() }; save();
    if (ok && !(before && before.passed)) setTimeout(() => celebrate('🏆', T('levelPassed', { l: cefr }), T('passedWith', { p: Math.round(pct * 100) }) + '<br>+150 XP', [[T('seeMap'), home], [T('seeResults'), null]]), 400);
    const weak = Object.values(wrong).sort((a, b) => b.n - a.n);
    const c = view(`<h2>${T('examTitle', { l: cefr })}</h2><p class="tx-big">${Math.round(sc)} / ${n} · ${Math.round(pct * 100)} %</p><p>${ok ? T('examPassedMsg', { l: cefr }) : T('examNeed', { n: Math.ceil(E.pass_score * n) })}</p>` +
      (weak.length ? '<h3>' + T('topicsReview') + '</h3><ul>' + weak.map(w => `<li>${reviewHTML({ review: w.r })} <small>(${w.n} ${T(w.n === 1 ? 'question1' : 'questionsW')})</small>` + (w.r.lesson ? ` <button class="tx-btn tx-alt" data-go="lesson:${w.r.lesson}">${T('goLesson')}</button>` : '') + '</li>').join('') + '</ul>' : '') + `<p><small>${examInstr(E, lv)}</small></p>`);
    c.append(btn(T('optTasks'), () => opt(0)), btn(T('backMap'), home));
  };
  const opt = k => { if (k >= E.optional_tasks.length) return home(); redraw = () => opt(k); const s = stepCard(T('optTask'), k, E.optional_tasks.length); runEx(E.optional_tasks[k], s, () => opt(k + 1), { optional: true }); };
  step();
}

async function placement() {
  const tr = (k, v) => (window.TXI ? TXI.t(k, v) : k);
  const T = await J('placement-test.json'), A = T.algorithm, res = {}, last = T.blocks.length - 1;
  let bi = 0, ii = 0, ok = 0;
  const pct = r => Math.round(r.ok / r.n * 100);
  const end = () => {
    redraw = end;
    const done = T.blocks.filter(B => res[B.level]), passed = done.filter(B => res[B.level].ok / res[B.level].n >= A.pass_ratio);
    const lv = passed.length ? passed[passed.length - 1].level : 'A1';
    const fail = done.find(B => !passed.includes(B));
    S.placement = { level: lv, passed: passed.map(B => B.level), scores: Object.fromEntries(done.map(B => [B.level, pct(res[B.level])])), at: Date.now() }; save();
    const need = Math.round(A.pass_ratio * 100);
    const msg = !passed.length ? T('plStartA1', { p: need })
      : !fail ? T('plTop', { l: lv })
      : T('plUpTo', { l: lv, f: fail.level, p: pct(res[fail.level]), near: pct(res[fail.level]) >= 50 ? T('plNear') : '' });
    const c = view(`<h2>${tr('placementT')}</h2><p class="tx-big">${esc(lv)}</p><p>${passed.length ? tr('plYourLevel', { l: esc(lv) }) : tr('plStartPoint')} ${msg}</p>
      <div class="tx-scroll"><table class="tx-table"><tr><th>${tr('colLevel')}</th><th>${tr('plCorrect')}</th><th>${tr('plResult')}</th></tr>${done.map(B => `<tr><td>${B.level}</td><td>${res[B.level].ok}/${res[B.level].n} (${pct(res[B.level])} %)</td><td>${tr(passed.includes(B) ? 'plPassed' : 'plFailed')}</td></tr>`).join('')}</table></div>
      <p><small>${tr('plRule', { p: need })} ${!passed.length ? '' : LV.every(l => passed.some(B => B.level === l.cefr)) ? tr('plAllDone', { l: LV.map(l => l.cefr).join(', ') }) : tr('plOpenNext')}</small></p>`);
    c.append(btn(tr('goCourse'), home), btn(tr('repeatTest'), () => placement().catch(fail)));
  };
  const next = () => {
    redraw = next;
    const B = T.blocks[bi];
    if (ii >= B.items.length) {
      res[B.level] = { ok, n: B.items.length };
      if (ok / B.items.length < A.pass_ratio || bi === last) return end();
      bi++; ii = 0; ok = 0; return next();
    }
    const s = stepCard(`${tr('placementT')} <small>${tr('plQuestion', { l: B.level, i: ii + 1, n: B.items.length })}</small>`, ii, B.items.length);
    runEx(B.items[ii], s, v => { ok += v; ii++; next(); }, { quiet: true, dk: true });
  };
  const intro = () => { redraw = intro; const c = view(`<h2>${tr('placementT')}</h2><p>${tr('plInstr')}</p>`); c.append(btn(tr('start'), next), btn(tr('cancel'), home)); };
  intro();
}

/* ---------- preguntas frecuentes ---------- */
const FAQ = [
  ['¿Se guarda mi progreso?', 'Sí, en este navegador y en este dispositivo (no hay cuentas ni contraseñas). Si borras los datos del navegador, usas otro navegador u otro dispositivo, empezarás de cero: el progreso no se sincroniza.'],
  ['¿Cómo se desbloquean las lecciones?', 'Cada lección se abre al superar la anterior, normalmente con un 70 % de aciertos. Si superas un nivel en la prueba de nivel, todas sus lecciones quedan abiertas.'],
  ['¿Qué es la prueba de nivel?', 'Un test que se adapta a ti y estima desde qué nivel conviene empezar. Se supera un nivel con al menos un 75 % de aciertos en su bloque. Puedes repetirla cuando quieras.'],
  ['¿Cómo funciona el examen final de cada nivel?', 'Se habilita al completar todas las lecciones del nivel (o si superaste el nivel en la prueba). Se aprueba con un 75 %. Cuando fallas una pregunta, el examen te indica qué tema repasar, pero no te da la respuesta; al final verás los temas con un botón para ir a la lección. Puedes repetirlo cuantas veces quieras.'],
  ['¿Qué pasa con las tareas opcionales?', 'No cuentan en la nota. En la escritura debes escribir un mínimo de palabras en inglés; después comparas tu texto con un modelo y una lista de control.'],
  ['¿Por qué a veces aparecen ejercicios de temas anteriores?', 'Es a propósito: repasar de forma mezclada ayuda a que lo aprendido no se olvide. Cuentan como parte de la lección.'],
  ['¿Cómo funciona el Repaso?', 'Las palabras de las lecciones que completas vuelven a aparecer a los 1, 3, 7, 14, 30 y 60 días si las vas recordando. Si fallas una, vuelve al principio.'],
  ['¿Qué es la meta diaria y la racha?', 'La meta son los minutos de estudio activo que quieres hacer cada día (10, 20 o 30). La racha cuenta los días seguidos en que la cumpliste. Las pausas de más de 2 minutos no suman.'],
  ['El audio no suena, ¿qué hago?', 'El audio usa la voz en inglés de tu navegador. Revisa el volumen, prueba con una versión actual de Chrome, Edge o Safari y comprueba que tu sistema tenga una voz en inglés instalada.'],
  ['¿Qué pasa con mi grabación de voz?', 'Se graba solo en tu dispositivo para que te compares con el modelo; no se envía a ningún sitio. El navegador te pedirá permiso para usar el micrófono.'],
  ['¿Puedo hacer las lecciones en papel?', 'Sí. Usa «🖨 Imprimir» dentro de una lección, «Imprimir unidad (PDF)» en cada unidad o «Hoja del examen». Elige si quieres explicación y clave de respuestas, y en el cuadro de impresión selecciona «Guardar como PDF» o tu impresora. Los ejercicios de audio y de pronunciación se hacen mejor en la web.'],
  ['¿Qué hace el «Modo prueba»?', 'Desbloquea todas las lecciones y exámenes para que puedas explorar el contenido. No borra tu progreso.'],
  ['¿Cómo borro mi progreso?', 'Con «Borrar progreso» al final de la página principal del curso. Se borra todo en este navegador, salvo tu meta diaria.'],
  ['Encontré un error en una lección', 'Anota el código de la lección o del ejercicio (por ejemplo en-a2-u03-l02) y avisa a quien administra el sitio. Las traducciones y la pronunciación pueden mejorarse con tu ayuda.'],
  ['¿Hasta qué nivel llega el curso?', 'Hasta B2. Los niveles A1, A2, B1 y B2 ya están disponibles, cada uno con su examen final.']
];
function faq() {
  redraw = faq;
  const F = (window.TXI && TXI.FAQ && TXI.FAQ[TXI.lang]) || FAQ;
  const c = view(`<h2>${T('faqTitle')}</h2><div id="faq">${F.map(([q, a]) => `<details class="tx-level"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`);
  c.append(btn(T('backMapArrow'), home));
}

/* ---------- imprimir / guardar como PDF ---------- */
const seeded = (a, seed) => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return a.map(x => [x, (s = (s * 1664525 + 1013904223) >>> 0)]).sort((p, q) => p[1] - q[1]).map(p => p[0]); };
const LT = 'ABCDEFGH', LN = '<span class="tp-line"></span>';
const printEx = e => {                                  // [html del ejercicio, texto de la clave]
  const Q = '<p class="tp-q">' + esc(e.prompt || '') + '</p>', aud = '<p class="tp-note">' + T('audioWeb') + '</p>';
  switch (e.type) {
    case 'multiple_choice': case 'listening': {
      const o = seeded(e.options, e.id);
      return [(e.type === 'listening' ? aud : '') + Q + '<ol class="tp-opts" type="A">' + o.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>',
        LT[o.indexOf(e.answer[0])] + ') ' + e.answer[0] + (e.audio_text ? ' · ' + T('transcript') + ' ' + e.audio_text : '')];
    }
    case 'true_false': return [Q + '<p>☐ ' + T('trueW') + ' &nbsp;&nbsp; ☐ ' + T('falseW') + '</p>', e.answer[0] ? T('trueW') : T('falseW')];
    case 'fill_blank': return ['<p class="tp-q">' + esc(e.prompt).replace('___', '<span class="tp-blank"></span>') + '</p>', e.answer.join(' / ')];
    case 'translation': return [Q + LN, e.answer.join(' / ')];
    case 'error_correction': return [Q + '<p class="tp-wrong">' + esc(e.text) + '</p>' + LN, e.answer.join(' / ')];
    case 'dictation': return [aud + Q + LN, e.audio_text || e.answer[0]];
    case 'word_order': return [Q + '<p class="tp-tokens">' + seeded(e.tokens, e.id).map(esc).join(' &nbsp;/&nbsp; ') + '</p>' + LN, sent(e.answer)];
    case 'matching': {
      const R_ = seeded(e.pairs.map(p => p.right), e.id);
      return [Q + '<div class="tp-cols"><ol>' + e.pairs.map(p => '<li>' + esc(p.left) + '</li>').join('') + '</ol><ol type="A">' + R_.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div>',
        e.pairs.map((p, k) => (k + 1) + '-' + LT[R_.indexOf(p.right)]).join('  ')];
    }
    case 'categorize': {
      const cs = e.categories;
      return [Q + '<p><b>' + cs.map(esc).join(' · ') + '</b></p><ol>' + seeded(e.items, e.id).map(i => '<li>' + esc(i.text) + ' ____</li>').join('') + '</ol>',
        cs.map(c => c + ': ' + e.items.filter(i => i.category === c).map(i => i.text).join(', ')).join(' | ')];
    }
    case 'writing': return [Q + '<p class="tp-note">' + T('minWordsP', { n: e.min_words || 8 }) + '</p>' + LN + LN + LN + LN, e.model_answer];
    case 'pronunciation': return [Q + '<ul>' + e.items.map(i => '<li>' + esc(i.text) + ' <small>' + esc(i.ipa) + ' · ' + esc(i.tip_es) + '</small></li>').join('') + '</ul><p class="tp-note">' + T('pronPrint') + '</p>', '—'];
    case 'roleplay': {
      let k = 0; const key = [];
      const body = e.turns.map(t => {
        if (!t.choices) return '<p><b>' + esc(t.speaker) + ':</b> ' + esc(t.text) + '</p>';
        const o = seeded(t.choices, e.id + (k++));
        key.push(LT[o.indexOf(t.choices[t.best])]);
        return '<p><b>' + T('you') + '</b></p><ol class="tp-opts" type="A">' + o.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
      }).join('');
      return ['<p class="tp-q">' + esc(e.situation_es) + '</p>' + body, key.join(', ')];
    }
  }
  return [Q, ''];
};
function printDoc(parts, opt) {                         // parts: [{head, intro, exercises}]
  let html = '', keys = '';
  parts.forEach(p => {
    html += '<section class="tp-lesson"><h1>' + p.head + '</h1>' + (p.intro || '');
    const ks = [];
    html += '<h2>' + T('exercisesH') + '</h2>' + p.exercises.map((e, i) => { const [q, k] = printEx(e); ks.push((i + 1) + '. ' + k); return '<div class="tp-ex"><span class="tp-n">' + (i + 1) + '.</span>' + q + '</div>'; }).join('') + '</section>';
    keys += '<h3>' + p.head + '</h3><ol class="tp-key">' + ks.map(k => '<li>' + esc(k.replace(/^\d+\.\s*/, '')) + '</li>').join('') + '</ol>';
  });
  if (opt.key) html += '<section class="tp-lesson"><h1>' + T('answerKey') + '</h1>' + keys + '</section>';
  return html;
}
async function printView(kind, id) {
  redraw = () => printView(kind, id).catch(fail);
  const ent = kind === 'unit' ? LV.flatMap(l => l.units).find(u => u.id === id) : kind === 'lesson' ? flat.find(l => l.id === id) : LV.find(l => l.cefr === id);
  const name = kind === 'unit' ? T('unitTitle', { n: ent.order, t: ent.title_target }) : kind === 'lesson' ? ent.title_target : T('finalExam', { l: id });
  const c = view(`<h2>${T('printTitle')}</h2><p><b>${esc(name)}</b></p>
    ${kind === 'exam' ? '' : '<p><label><input type="checkbox" id="p-exp" checked> ' + T('inclExp') + '</label></p>'}
    <p><label><input type="checkbox" id="p-key"> ${T('inclKey')}</label></p>
    <p><small>${T('printNote')}</small></p>`);
  c.append(btn(T('prepareDoc'), async () => {
    const opt = { key: $('#p-key').checked, exp: kind === 'exam' ? false : $('#p-exp').checked };
    let parts;
    if (kind === 'exam') {
      const E = await J(ent.exam.file);
      parts = [{ head: T('examTitle', { l: id }), intro: '<p>' + examInstr(E, ent) + '</p>', exercises: E.exercises.concat(E.optional_tasks) }];
    } else {
      const files = kind === 'unit' ? ent.lessons.filter(l => l.status === 'ready') : [ent], Ls = (await Promise.all(files.map(f => J(f.file)))).map(localize);
      parts = Ls.map(L => ({
        head: esc(L.title.target) + ' <small>' + esc(L.title.es || '') + '</small>',
        intro: '<p><i>' + esc(L.objective) + '</i></p>' + inputHTML(L.input, true) + (opt.exp ? '<h2>' + T('explanationH') + '</h2>' + md(L.explanation.md_es) +
          (L.explanation.common_mistakes_es?.length ? '<h3>' + T('commonMistakes') + '</h3><ul>' + L.explanation.common_mistakes_es.map(m => `<li>✗ ${esc(m.wrong)} → ✓ <b>${esc(m.right)}</b> <small>${esc(m.note)}</small></li>`).join('') + '</ul>' : '') : ''),
        exercises: L.exercises
      }));
    }
    const old = document.getElementById('tx-print'); if (old) old.remove();
    const box = h('div'); box.id = 'tx-print'; box.innerHTML = printDoc(parts, opt); document.body.append(box);
    window.addEventListener('afterprint', () => box.remove(), { once: true });
    if (typeof window.print === 'function') window.print();
  }), btn(T('back'), home, 'tx-alt'));
}

const fail = e => view(`<h2>${T('failTitle')}</h2><p>${esc(e.message)}</p><p><small>${T('failHelp')}</small></p>`);
const examInstr = (E, lv) => { const n = E.exercises.length; return T('examInstr', { n, u: lv.units.length, l: lv.cefr, k: Math.ceil(E.pass_score * n) }); };

app.onclick = ev => {
  const pn = ev.target.closest('[data-pop]'); if (pn) { if (!pn.disabled) pop(pn.dataset.pop); return; }
  const t = ev.target.closest('[data-go]'); if (!t || t.disabled) return;
  const [a, id, id2] = t.dataset.go.split(':');
  if (a === 'lesson') lesson(flat.find(l => l.id === id)).catch(fail);
  else if (a === 'review') review().catch(fail);
  else if (a === 'vocab') vocab().catch(fail);
  else if (a === 'faq') faq();
  else if (a === 'print') printView(id, id2).catch(fail);
  else if (a === 'exam') exam(id).catch(fail);
  else if (a === 'placement') placement().catch(fail);
  else if (a === 'reset' && confirm(T('resetConfirm'))) { S = { done: {}, srs: {}, exams: {}, placement: null, open: false, secs: {}, goal: S.goal || 20 }; save(); home(); }
};

window.addEventListener('tx-lang', async () => { await loadOv(); closePop(); if (redraw) redraw(); });
window.Trilex = { runEx, norm, printEx, starsOf, rank, celebrate };
J('path.json').then(p => {
  P = p; LV = p.levels.filter(l => l.units.some(u => u.lessons.some(x => x.status === 'ready')));
  flat = LV.flatMap(lv => lv.units.flatMap(u => u.lessons.filter(l => l.status === 'ready').map(l => Object.assign(l, { cefr: lv.cefr }))));
  return loadOv().then(home);
}).catch(fail);
})();
