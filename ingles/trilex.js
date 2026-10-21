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

/* ---------- progreso ---------- */
let S = {}; try { S = JSON.parse(localStorage.getItem(K)) || {}; } catch (e) {}
S = Object.assign({ done: {}, srs: {}, exams: null, placement: null, open: false, secs: {}, goal: 20 }, S);
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
const sayBtn = (t, l = '🔊') => `<button type="button" class="tx-btn tx-alt" data-say="${esc(t)}" aria-label="Escuchar">${l}</button>`;
const audioBar = t => sayBtn(t, '🔊 Escuchar') + ' <button type="button" class="tx-btn tx-alt" data-slow="1" data-say="' + esc(t) + '">🐢 Despacio</button>';

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
const gloss = g => g && g.length ? '<h3>Vocabulario</h3><div class="tx-scroll"><table class="tx-table"><tr><th></th><th>Palabra</th><th>IPA</th><th>Significado</th><th>Ejemplo</th></tr>' +
  g.map(w => `<tr><td>${sayBtn(w.lemma)}</td><td><b>${esc(w.lemma)}</b> <small>${esc(w.pos)}</small></td><td>${esc(w.ipa)}</td><td>${esc(w.es)}</td><td>${esc(w.example)}</td></tr>`).join('') + '</table></div>' : '';
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
  const r = e.review; if (!r) return 'repasa la teoría de este tema en el curso.';
  return '<b>' + esc(r.topic_es) + '</b>' + (r.lesson ? ' <small>· Unidad ' + r.unit + ', lección ' + r.order + ': ' + esc(r.lesson_es) + '</small>' : '');
};
function runEx(e, box, next, o = {}) {
  box.innerHTML = '';
  const q = h('div', 'tx-q', esc(e.prompt)), b = h('div', 'tx-body'), fb = h('div', 'tx-fb'), act = h('div', 'tx-act');
  if (e.passage) box.append(h('div', 'tx-sit', esc(e.passage)));
  box.append(q);
  if (e.refers_to_input && o.input) box.append(h('details', 'tx-ref', '<summary>Ver el texto</summary>' + inputHTML(o.input, true)));
  box.append(b, fb, act);
  let done = 0;
  const fin = (s, x = '') => {
    if (done) return; done = 1;
    if (o.quiet) return next(s, e);
    fb.className = 'tx-fb ' + (o.optional ? '' : s >= 1 ? 'ok' : s > 0 ? 'half' : 'bad');
    const why = e.feedback ? e.feedback.incorrect.replace(/^Revisa esto:\s*/, '') : '';
    let head;
    if (o.exam) { x = ''; head = s >= 1 ? '<b>' + esc(e.feedback ? e.feedback.correct : '¡Correcto!') + '</b>' : '<b>Revisa esto:</b> ' + reviewHTML(e); }   // examen: tema a repasar, nunca la respuesta
    else if (o.optional || e.type === 'writing' || e.type === 'pronunciation') head = why ? '<b>' + esc(why) + '</b>' : '';       // autoevaluación: sin veredicto
    else head = e.feedback ? '<b>' + esc(s >= 1 ? e.feedback.correct : e.feedback.incorrect) + '</b>' : '';
    fb.innerHTML = head + x;
    act.replaceChildren(btn('Continuar', () => next(s, e)));
  };
  const ask = (fn, l = 'Comprobar') => act.replaceChildren(btn(l, fn));
  R[e.type](e, b, fin, ask, q, o);
}

R.multiple_choice = R.listening = (e, b, fin, ask, q, o) => {
  if (e.type === 'listening') b.append(h('p', '', audioBar(e.audio_text)));
  const w = h('div', 'tx-opts'); b.append(w);
  const opts = (e.fixed ? e.options : shuffle(e.options)).map(t => [t, btn(t, null, 'tx-opt')]);
  if (o.dk) opts.push(['', btn('No lo sé', null, 'tx-opt')]);
  opts.forEach(([t, x]) => {
    x.onclick = () => {
      const ok = e.answer.includes(t);
      if (!o.quiet) { opts.forEach(([u, y]) => { y.disabled = true; if (e.answer.includes(u) && (ok || !o.exam)) y.classList.add('ok'); }); if (!ok) x.classList.add('bad'); }
      fin(ok ? 1 : 0, e.type === 'listening' ? '<p>Transcripción: <i>' + esc(e.audio_text) + '</i></p>' : '');
    };
    w.append(x);
  });
};
R.true_false = (e, b, fin, ask, q, o) => R.multiple_choice({ ...e, fixed: 1, options: ['Verdadero', 'Falso'], answer: [e.answer[0] ? 'Verdadero' : 'Falso'] }, b, fin, ask, q, o);

const typed = (e, b, fin, ask, q) => {
  const inp = h('input', 'tx-in'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', 'Tu respuesta');
  if (e.type === 'fill_blank') q.innerHTML = esc(e.prompt).replace('___', '<span class="tx-slot"></span>');
  if (e.type === 'error_correction') b.append(h('div', 'tx-wrong', esc(e.text)));
  if (e.audio_text) b.append(h('p', '', audioBar(e.audio_text)));
  (q.querySelector('.tx-slot') || b).append(inp);
  const go = () => {
    const v = inp.value; if (!v.trim()) return; inp.disabled = true;
    const ok = [...e.answer, ...(e.accepted_alternatives || [])].some(a => norm(a, e.case_sensitive) === norm(v, e.case_sensitive));
    fin(ok ? 1 : 0, (ok ? '' : '<p>Respuesta: <b>' + esc(e.answer[0]) + '</b></p>') + (e.audio_text ? '<p>Transcripción: <i>' + esc(e.audio_text) + '</i></p>' : ''));
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
    fin(ok ? 1 : 0, ok ? '' : '<p>Orden correcto: <b>' + esc(sent(e.answer)) + '</b></p>');
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
    if (ok) { [sel, x].forEach(y => { y.classList.remove('sel'); y.classList.add('ok'); y.disabled = true; }); sel = null; if (++n === e.pairs.length) fin(Math.max(0, 1 - mist / n), mist ? '<p>Errores: ' + mist + '</p>' : ''); }
    else { mist++; x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); }
  };
  e.pairs.forEach(p => l.append(mk(p.left, 'l')));
  shuffle(e.pairs.map(p => p.right)).forEach(t => r.append(mk(t, 'r')));
};

R.categorize = (e, b, fin) => {
  const cols = h('div', 'tx-cols'), l = h('div'), r = h('div'); cols.append(l, r); b.append(h('p', 'tx-note', '<small>Toca una palabra y luego su categoría.</small>'), cols);
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
        if (++n === e.items.length) fin(Math.max(0, 1 - mist / e.items.length), mist ? '<p>Errores: ' + mist + '</p>' : '');
      } else { mist++; y.classList.add('bad'); setTimeout(() => y.classList.remove('bad'), 450); }
    }, 'tx-opt tx-pair');
    r.append(y);
  });
};

/* grabarte y comparar con el modelo (la grabación no sale de tu dispositivo) */
const recorder = () => {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) return null;
  const wrap = h('span', 'tx-rec'), b = btn('🎙 Grabarme', null, 'tx-alt'), a = h('audio');
  a.controls = true; a.hidden = true; a.setAttribute('aria-label', 'Tu grabación');
  let mr = null, stream = null, chunks = [];
  b.onclick = async () => {
    if (mr && mr.state === 'recording') { mr.stop(); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (err) { b.textContent = '🎙 Sin permiso de micrófono'; return; }
    chunks = []; mr = new MediaRecorder(stream);
    mr.ondataavailable = ev => chunks.push(ev.data);
    mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); if (a.src) URL.revokeObjectURL(a.src); a.src = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); a.hidden = false; b.textContent = '🎙 Grabar de nuevo'; };
    mr.start(); b.textContent = '⏹ Detener'; setTimeout(() => { if (mr && mr.state === 'recording') mr.stop(); }, 8000);
  };
  wrap.append(b, ' ', a); return wrap;
};
R.pronunciation = (e, b, fin, ask) => {
  const can = !!recorder();
  b.append(h('p', 'tx-note', can ? '<small>Escucha el modelo 🔊, grábate 🎙 y compara. Tu grabación se queda en tu dispositivo: no se envía a ningún sitio.</small>' : '<small>Escucha el modelo 🔊 y repite en voz alta varias veces.</small>'));
  e.items.forEach(i => {
    const row = h('div', 'tx-row', sayBtn(i.text) + `<div><b>${esc(i.text)}</b> <span class="tx-ipa">${esc(i.ipa)}</span><br><small>${esc(i.tip_es)}</small></div>`);
    const r = recorder(); if (r) row.lastElementChild.append(h('br'), r);
    b.append(row);
  });
  ask(() => fin(1), 'Ya lo practiqué');
};

R.writing = (e, b, fin, ask) => {
  const t = h('textarea', 'tx-in tx-ta'), warn = h('p', 'tx-warn'); t.rows = 4; t.setAttribute('aria-label', 'Tu texto');
  const need = e.min_words || 8;
  b.append(t, h('small', '', 'Mínimo ' + need + ' palabras en inglés'), warn);
  ask(() => {
    const ws = t.value.split(/\s+/).filter(w => /[A-Za-z]/.test(w)), uniq = new Set(ws.map(w => w.toLowerCase().replace(/[^a-z']/g, ''))).size;
    if (ws.length < need || uniq < Math.max(3, Math.ceil(need / 3))) {
      warn.textContent = 'Escribe al menos ' + need + ' palabras en inglés con frases propias (llevas ' + ws.length + (ws.length >= need ? ' y se repiten demasiado' : '') + ').'; t.focus(); return;
    }
    warn.textContent = ''; t.disabled = true;
    fin(1, '<p><b>Modelo para comparar:</b> ' + esc(e.model_answer) + '</p><p>Revisa tu texto:</p><ul class="tx-check">' + e.self_check_es.map(x => '<li><label><input type="checkbox"> ' + esc(x) + '</label></li>').join('') + '</ul>');
  }, 'Comparar con el modelo');
};

R.roleplay = (e, b, fin) => {
  b.append(h('p', 'tx-sit', esc(e.situation_es)));
  let i = 0, good = 0; const n = e.turns.filter(t => t.choices).length;
  const step = () => {
    while (i < e.turns.length) {
      const t = e.turns[i++];
      if (!t.choices) { b.append(h('div', 'tx-turn', `<b>${esc(t.speaker)}:</b> ${esc(t.text)} ` + sayBtn(t.text))); continue; }
      const w = h('div', 'tx-opts'); b.append(h('div', 'tx-turn', '<b>Tú:</b>'), w);
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
const view = (html, cls = 'tx-card') => { app.innerHTML = `<div class="${cls}">${html}</div>`; scrollTo(0, 0); return app.firstChild; };
const stepCard = (title, i, n) => { const c = view(`<div class="tx-prog"><span style="width:${i / n * 100}%"></span></div><h2>${title}</h2><div id="step"></div>`); return $('#step'); };
const dueItems = () => Object.keys(S.srs).filter(k => S.srs[k].due <= day());
const free = c => !!(S.placement && S.placement.passed && S.placement.passed.includes(c));          // nivel superado en la prueba de nivel
const unlocked = l => { const k = flat.indexOf(l), p = flat[k - 1]; return S.open || k === 0 || free(l.cefr) || !!S.done[p.id] || (p.cefr !== l.cefr && free(p.cefr)); };
const examOpen = lv => lv.exam && lv.exam.status === 'ready' && (S.open || free(lv.cefr) || flat.filter(l => l.cefr === lv.cefr).length === lvTotal(lv) && flat.filter(l => l.cefr === lv.cefr).every(l => S.done[l.id]));
const lvTotal = lv => lv.units.reduce((a, u) => a + u.lessons.length, 0);

function home() {
  const due = dueItems().length, pl = S.placement, soon = P.levels.filter(l => !LV.includes(l)).map(l => l.cefr);
  const cur = (LV.find(l => flat.some(x => x.cefr === l.cefr && !S.done[x.id])) || LV[LV.length - 1]).cefr;
  const mt = minsToday(), g = S.goal, stk = streak();
  const goalCard = `<div class="tx-card"><h2>Tu constancia <small>meta: ${g} min al día</small></h2><div class="tx-prog"><span style="width:${Math.min(100, mt / g * 100)}%"></span></div>
  <p>Hoy: <b>${mt}</b> de ${g} min ${mt >= g ? '✓ ¡Meta cumplida!' : ''} · 🔥 Racha: <b>${stk}</b> ${stk === 1 ? 'día' : 'días'}</p>
  <p><small>Estudiar un poco cada día rinde más que mucho un solo día. <label>Mi meta: <select id="tx-goal">${[10, 20, 30].map(m => `<option value="${m}" ${m === g ? 'selected' : ''}>${m} min</option>`).join('')}</select></label></small></p></div>`;
  let s = `<div class="tx-card"><h2>Curso de inglés <small>${soon.length ? 'Próximamente: ' + soon.join(', ') : ''}</small></h2>
  <p><small>Desbloqueas cada lección con ≥ 70 % en la anterior. Si haces la prueba de nivel, los niveles que superes quedan abiertos.</small></p></div>${goalCard}
  <div class="tx-grid">
   <button class="tx-tile" data-go="placement"><b>🎯 Prueba de nivel</b><small>${pl ? 'Tu resultado: ' + esc(pl.level) : 'Hasta 68 preguntas · se adapta a tu nivel'}</small></button>
   <button class="tx-tile" data-go="review" ${due ? '' : 'disabled'}><b>🔁 Repaso</b><small>${due ? due + ' palabras pendientes' : 'Nada pendiente hoy'}</small></button>
   <button class="tx-tile" data-go="vocab"><b>📚 Vocabulario</b><small>Listas por temas, con audio</small></button>
   <button class="tx-tile" data-go="faq"><b>❓ Preguntas frecuentes</b><small>Cómo funciona la plataforma</small></button></div>`;
  LV.forEach(lv => {
    const ls = flat.filter(l => l.cefr === lv.cefr), nd = ls.filter(l => S.done[l.id]).length, tot = lvTotal(lv), ex = S.exams[lv.cefr], open = examOpen(lv);
    s += `<div class="tx-card"><h2>Nivel ${lv.cefr} <small>${nd} de ${tot} lecciones completadas</small></h2><div class="tx-prog"><span style="width:${nd / tot * 100}%"></span></div>` +
      (free(lv.cefr) ? '<p><small>✓ Nivel superado en la prueba de nivel: las lecciones están abiertas para repasar.</small></p>' : '') +
      (ls.length < tot ? `<p><small>Las unidades se publican por etapas: ${ls.length} de ${tot} lecciones disponibles por ahora.</small></p>` : '') + '</div>' +
      `<div class="tx-grid"><button class="tx-tile" data-go="exam:${lv.cefr}" ${open ? '' : 'disabled'}><b>📝 Examen final ${lv.cefr}</b><small>${ex ? (ex.passed ? '✓ Aprobado ' : 'Último intento ') + Math.round(ex.pct * 100) + ' %' : !(lv.exam && lv.exam.status === 'ready') ? 'Se habilita cuando esté todo el nivel' : open ? (lv.exam.items || 30) + ' preguntas · aprueba con 75 %' : 'Completa las ' + tot + ' lecciones'}</small></button><button class="tx-tile" data-go="print:exam:${lv.cefr}" ${open ? '' : 'disabled'}><b>🖨 Hoja del examen ${lv.cefr}</b><small>Para hacerlo en papel</small></button></div>`;
    s += `<details class="tx-level" ${lv.cefr === cur ? 'open' : ''}><summary>Unidades de ${lv.cefr}</summary>`;
    lv.units.filter(u => u.lessons.some(x => x.status === 'ready')).forEach(u => {
      s += `<div class="tx-card"><h2>Unidad ${u.order}: ${esc(u.title_target)} <small>${esc(u.title_es)}</small></h2><p><button class="tx-btn tx-alt" data-go="print:unit:${u.id}">🖨 Imprimir unidad (PDF)</button></p>` + u.lessons.filter(l => l.status === 'ready').map(l => {
        const d = S.done[l.id], ok = unlocked(l);
        return `<button class="tx-lesson ${d ? 'done' : ''}" data-go="lesson:${l.id}" ${ok ? '' : 'disabled'}><span>${d ? '✓' : ok ? '▶' : '🔒'}</span><span>${l.kind === 'checkpoint' ? '⭐ ' : ''}${esc(l.title_target)} <small>${esc(l.title_es)}</small></span><span>${d ? Math.round(d.score * 100) + ' %' : ''}</span></button>`;
      }).join('') + '</div>';
    });
    s += '</details>';
  });
  s += `<div class="tx-foot"><label><input type="checkbox" id="tx-open" ${S.open ? 'checked' : ''}> Modo prueba: desbloquear todo</label><button data-go="reset">Borrar progreso</button></div>`;
  app.innerHTML = s; scrollTo(0, 0);
  $('#tx-open').onchange = e => { S.open = e.target.checked; save(); home(); };
  $('#tx-goal').onchange = e => { S.goal = +e.target.value; save(); home(); };
}

async function lesson(ent) {
  const L = await J(ent.file), exs = L.exercises, pass = L.checkpoint?.pass_score ?? .7, total = 3 + exs.length, title = `${esc(L.title.target)} <small>${esc(L.title.es)}</small>`;
  let sc = 0;
  const intro = () => { const s = stepCard(title, 0, total); s.innerHTML = `<p>${esc(L.objective)}</p><p><small>≈ ${L.est_minutes} min</small></p>` + (L.warmup ? `<p class="tx-warm">${esc(L.warmup.prompt_es)}</p>` : ''); s.append(btn('Empezar', input), btn('🖨 Imprimir', () => printView('lesson', ent.id).catch(fail), 'tx-alt')); };
  const input = () => { const s = stepCard(title, 1, total); s.innerHTML = inputHTML(L.input); s.append(btn('Continuar', explain)); };
  const explain = () => {
    const s = stepCard(title, 2, total), x = L.explanation;
    s.innerHTML = md(x.md_es) +
      (x.common_mistakes_es?.length ? '<h3>Errores comunes</h3><ul>' + x.common_mistakes_es.map(m => `<li>❌ <s>${esc(m.wrong)}</s> → ✅ <b>${esc(m.right)}</b><br><small>${esc(m.note)}</small></li>`).join('') + '</ul>' : '') +
      (x.false_friends?.length ? '<h3>Falsos amigos</h3><ul>' + x.false_friends.map(f => `<li><b>${esc(f.word)}</b>: no es «${esc(f.es_false)}», es «${esc(f.real)}».<br><small>${esc(f.note)}</small></li>`).join('') + '</ul>' : '');
    s.append(btn('Ir a los ejercicios', () => ex(0)));
  };
  const ex = i => {
    if (i >= exs.length) return end();
    const s = stepCard(`${title} <small>· ejercicio ${i + 1}/${exs.length}</small>`, 3 + i, total);
    runEx(exs[i], s, v => { sc += v; ex(i + 1); }, { input: L.input });
  };
  const end = () => {
    const pct = sc / exs.length, ok = pct >= pass, k = flat.findIndex(l => l.id === ent.id), nx = flat[k + 1];
    if (ok) { if (!S.done[L.id] || S.done[L.id].score < pct) S.done[L.id] = { score: pct, at: Date.now() };
      (L.srs_items || []).forEach(i => { if (!S.srs[i.id]) S.srs[i.id] = { box: 1, due: day() + 1, lapses: 0 }; }); save(); }
    const s = stepCard(title, total, total);
    s.innerHTML = `<p class="tx-big">${Math.round(pct * 100)} %</p><p>${ok ? '¡Lección superada!' : 'Necesitas ' + Math.round(pass * 100) + ' % para continuar. Repasa la explicación e inténtalo otra vez.'}</p>` +
      (L.summary?.key_phrases?.length ? '<h3>Frases clave</h3><ul>' + L.summary.key_phrases.map(p => `<li>${esc(p)} ${sayBtn(p)}</li>`).join('') + '</ul>' : '');
    if (ok && nx) s.append(btn('Siguiente lección', () => lesson(nx).catch(fail)));
    s.append(btn('Repetir', () => lesson(ent).catch(fail)), btn('Volver al curso', home));
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
  'getting-around': 'Moverse por la ciudad', leisure: 'Tiempo libre' };

async function vocab() {
  const lists = await Promise.all(LV.map(l => J('vocab/' + l.cefr.toLowerCase() + '.json')));
  const all = lists.flatMap((v, i) => v.items.map(x => Object.assign({ lv: LV[i].cefr }, x)));
  const name = t => TOPIC_ES[t] || String(t || 'otros').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
  const c = view(`<h2>📚 Vocabulario por temas <small>${all.length} palabras</small></h2><div id="v-back"></div>
    <p><label>Nivel <select id="v-lv"><option value="">Todos</option>${LV.map(l => `<option>${l.cefr}</option>`).join('')}</select></label>
    <label>Buscar <input id="v-q" class="tx-in" placeholder="palabra o significado" aria-label="Buscar palabra"></label></p><div id="v-list"></div>`);
  $('#v-back').append(btn('← Volver al curso', home));
  const draw = () => {
    const lvl = $('#v-lv').value, q = $('#v-q').value.trim().toLowerCase(), by = {};
    all.filter(w => (!lvl || w.lv === lvl) && (!q || (w.lemma + ' ' + w.translation_es).toLowerCase().includes(q))).forEach(w => (by[w.topic || 'otros'] = by[w.topic || 'otros'] || []).push(w));
    $('#v-list').innerHTML = Object.keys(by).sort((a, b) => name(a).localeCompare(name(b), 'es')).map(tp =>
      `<details class="tx-level" ${q ? 'open' : ''}><summary>${esc(name(tp))} <small>(${by[tp].length})</small></summary><div class="tx-scroll"><table class="tx-table"><tr><th></th><th>Palabra</th><th>IPA</th><th>Significado</th><th>Ejemplo</th><th>Nivel</th></tr>` +
      by[tp].map(w => `<tr><td>${sayBtn(w.lemma)}</td><td><b>${esc(w.lemma)}</b> <small>${esc(w.pos)}</small></td><td>${esc(w.ipa)}</td><td>${esc(w.translation_es)}</td><td>${esc(w.example)}</td><td>${w.lv}</td></tr>`).join('') +
      '</table></div></details>').join('') || '<p>Sin resultados.</p>';
  };
  $('#v-lv').onchange = draw; $('#v-q').oninput = draw; draw();
}

async function review() {
  const Vs = await Promise.all(LV.map(l => J('vocab/' + l.cefr.toLowerCase() + '.json'))), map = Object.fromEntries(Vs.flatMap(V => V.items).map(v => [v.id, v]));
  const q = shuffle(dueItems().filter(k => map[k])); let i = 0, ok = 0;
  const card = () => {
    if (i >= q.length) { const c = view(`<h2>Repaso terminado</h2><p>Acertaste ${ok} de ${q.length}.</p>`); c.append(btn('Volver al curso', home)); return; }
    const v = map[q[i]], it = S.srs[q[i]], s = stepCard(`Repaso <small>${i + 1}/${q.length}</small>`, i, q.length);
    s.innerHTML = `<p class="tx-big">${esc(v.lemma)} ${sayBtn(v.lemma)}</p><p class="tx-ipa">${esc(v.ipa)}</p>`;
    s.append(btn('Mostrar respuesta', () => {
      s.innerHTML += `<p><b>${esc(v.translation_es)}</b></p><p><small>${esc(v.example)}</small></p>`;
      const grade = good => { if (good) { ok++; it.box = Math.min(6, it.box + 1); } else { it.box = 1; it.lapses++; } it.due = day() + INT[it.box - 1]; save(); i++; card(); };
      s.append(btn('No la sabía', () => grade(0)), btn('La sabía', () => grade(1)));
      s.querySelector('.tx-btn:not([data-say])').remove();
    }));
  };
  card();
}

async function exam(cefr) {
  const lv = LV.find(l => l.cefr === cefr), E = await J(lv.exam.file), n = E.exercises.length, wrong = {}; let i = 0, sc = 0;
  const step = () => {
    if (i >= n) return result();
    const s = stepCard(`${esc(E.title.es)} <small>${i + 1}/${n}</small>`, i, n);
    runEx(E.exercises[i], s, (v, e) => {
      sc += v;
      if (v < 1) { const r = e.review || { topic_es: 'Repaso general' }; (wrong[r.topic_es] = wrong[r.topic_es] || { n: 0, r }).n++; }
      i++; step();
    }, { exam: true });
  };
  const result = () => {
    const pct = sc / n, ok = pct >= E.pass_score; S.exams[cefr] = { pct, passed: ok, at: Date.now() }; save();
    const weak = Object.values(wrong).sort((a, b) => b.n - a.n);
    const c = view(`<h2>${esc(E.title.es)}</h2><p class="tx-big">${Math.round(sc)} / ${n} · ${Math.round(pct * 100)} %</p><p>${ok ? '¡Aprobado! ' + cefr + ' completado.' : 'Necesitas ' + Math.ceil(E.pass_score * n) + ' aciertos. Repasa los temas débiles e inténtalo de nuevo.'}</p>` +
      (weak.length ? '<h3>Temas para repasar</h3><ul>' + weak.map(w => `<li>${reviewHTML({ review: w.r })} <small>(${w.n} ${w.n === 1 ? 'pregunta' : 'preguntas'})</small>` + (w.r.lesson ? ` <button class="tx-btn tx-alt" data-go="lesson:${w.r.lesson}">Ir a la lección</button>` : '') + '</li>').join('') + '</ul>' : '') + `<p><small>${esc(E.instructions_es)}</small></p>`);
    c.append(btn('Tareas opcionales (sin nota)', () => opt(0)), btn('Volver al curso', home));
  };
  const opt = k => { if (k >= E.optional_tasks.length) return home(); const s = stepCard('Tarea opcional <small>sin nota</small>', k, E.optional_tasks.length); runEx(E.optional_tasks[k], s, () => opt(k + 1), { optional: true }); };
  step();
}

async function placement() {
  const T = await J('placement-test.json'), A = T.algorithm, res = {}, last = T.blocks.length - 1;
  let bi = 0, ii = 0, ok = 0;
  const pct = r => Math.round(r.ok / r.n * 100);
  const end = () => {
    const done = T.blocks.filter(B => res[B.level]), passed = done.filter(B => res[B.level].ok / res[B.level].n >= A.pass_ratio);
    const lv = passed.length ? passed[passed.length - 1].level : 'A1';
    const fail = done.find(B => !passed.includes(B));
    S.placement = { level: lv, passed: passed.map(B => B.level), scores: Object.fromEntries(done.map(B => [B.level, pct(res[B.level])])), at: Date.now() }; save();
    const need = Math.round(A.pass_ratio * 100);
    const msg = !passed.length ? `No llegaste al ${need} % en A1, así que lo mejor es empezar por el principio.`
      : !fail ? `Superaste el nivel ${lv}, el más alto que cubre este curso.`
      : `Superaste hasta ${lv}. En ${fail.level} acertaste ${pct(res[fail.level])} %${pct(res[fail.level]) >= 50 ? ': estás cerca, ese es tu siguiente objetivo' : ''}.`;
    const c = view(`<h2>${esc(T.title.es)}</h2><p class="tx-big">${esc(lv)}</p><p>${passed.length ? 'Tu nivel estimado es <b>' + esc(lv) + '</b>.' : 'Tu punto de partida es <b>A1</b>.'} ${msg}</p>
      <div class="tx-scroll"><table class="tx-table"><tr><th>Nivel</th><th>Aciertos</th><th>Resultado</th></tr>${done.map(B => `<tr><td>${B.level}</td><td>${res[B.level].ok}/${res[B.level].n} (${pct(res[B.level])} %)</td><td>${passed.includes(B) ? '✓ superado' : '✗ no superado'}</td></tr>`).join('')}</table></div>
      <p><small>Se supera un nivel con al menos ${need} % de aciertos. ${!passed.length ? '' : LV.every(l => passed.some(B => B.level === l.cefr)) ? 'Ya superaste todo el contenido publicado (' + LV.map(l => l.cefr).join(', ') + '); los siguientes niveles llegarán pronto.' : 'Los niveles que superaste quedan abiertos para repasar y puedes continuar desde el siguiente.'}</small></p>`);
    c.append(btn('Ir al curso', home), btn('Repetir la prueba', () => placement().catch(fail)));
  };
  const next = () => {
    const B = T.blocks[bi];
    if (ii >= B.items.length) {
      res[B.level] = { ok, n: B.items.length };
      if (ok / B.items.length < A.pass_ratio || bi === last) return end();
      bi++; ii = 0; ok = 0; return next();
    }
    const s = stepCard(`${esc(T.title.es)} <small>· ${B.level} · pregunta ${ii + 1}/${B.items.length}</small>`, ii, B.items.length);
    runEx(B.items[ii], s, v => { ok += v; ii++; next(); }, { quiet: true, dk: true });
  };
  const c = view(`<h2>${esc(T.title.es)}</h2><p>${esc(T.instructions_es)}</p>`); c.append(btn('Empezar', next), btn('Cancelar', home));
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
  ['¿Hasta qué nivel llega el curso?', 'Hasta B2. Los niveles A1 y A2 ya están disponibles; B1 y B2 se publican por etapas.']
];
function faq() {
  const c = view(`<h2>❓ Preguntas frecuentes</h2><div id="faq">${FAQ.map(([q, a]) => `<details class="tx-level"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`);
  c.append(btn('← Volver al curso', home));
}

/* ---------- imprimir / guardar como PDF ---------- */
const seeded = (a, seed) => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return a.map(x => [x, (s = (s * 1664525 + 1013904223) >>> 0)]).sort((p, q) => p[1] - q[1]).map(p => p[0]); };
const LT = 'ABCDEFGH', LN = '<span class="tp-line"></span>';
const printEx = e => {                                  // [html del ejercicio, texto de la clave]
  const Q = '<p class="tp-q">' + esc(e.prompt || '') + '</p>', aud = '<p class="tp-note">🎧 Ejercicio de audio: hazlo en la web.</p>';
  switch (e.type) {
    case 'multiple_choice': case 'listening': {
      const o = seeded(e.options, e.id);
      return [(e.type === 'listening' ? aud : '') + Q + '<ol class="tp-opts" type="A">' + o.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>',
        LT[o.indexOf(e.answer[0])] + ') ' + e.answer[0] + (e.audio_text ? ' · Transcripción: ' + e.audio_text : '')];
    }
    case 'true_false': return [Q + '<p>☐ Verdadero &nbsp;&nbsp; ☐ Falso</p>', e.answer[0] ? 'Verdadero' : 'Falso'];
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
    case 'writing': return [Q + '<p class="tp-note">Mínimo ' + (e.min_words || 8) + ' palabras.</p>' + LN + LN + LN + LN, e.model_answer];
    case 'pronunciation': return [Q + '<ul>' + e.items.map(i => '<li>' + esc(i.text) + ' <small>' + esc(i.ipa) + ' · ' + esc(i.tip_es) + '</small></li>').join('') + '</ul><p class="tp-note">Practica en voz alta; compáralo con el audio en la web.</p>', '—'];
    case 'roleplay': {
      let k = 0; const key = [];
      const body = e.turns.map(t => {
        if (!t.choices) return '<p><b>' + esc(t.speaker) + ':</b> ' + esc(t.text) + '</p>';
        const o = seeded(t.choices, e.id + (k++));
        key.push(LT[o.indexOf(t.choices[t.best])]);
        return '<p><b>Tú:</b></p><ol class="tp-opts" type="A">' + o.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
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
    html += '<h2>Ejercicios</h2>' + p.exercises.map((e, i) => { const [q, k] = printEx(e); ks.push((i + 1) + '. ' + k); return '<div class="tp-ex"><span class="tp-n">' + (i + 1) + '.</span>' + q + '</div>'; }).join('') + '</section>';
    keys += '<h3>' + p.head + '</h3><ol class="tp-key">' + ks.map(k => '<li>' + esc(k.replace(/^\d+\.\s*/, '')) + '</li>').join('') + '</ol>';
  });
  if (opt.key) html += '<section class="tp-lesson"><h1>Clave de respuestas</h1>' + keys + '</section>';
  return html;
}
async function printView(kind, id) {
  const ent = kind === 'unit' ? LV.flatMap(l => l.units).find(u => u.id === id) : kind === 'lesson' ? flat.find(l => l.id === id) : LV.find(l => l.cefr === id);
  const name = kind === 'unit' ? 'Unidad ' + ent.order + ': ' + ent.title_target : kind === 'lesson' ? ent.title_target : 'Examen final ' + id;
  const c = view(`<h2>🖨 Imprimir / guardar como PDF</h2><p><b>${esc(name)}</b></p>
    ${kind === 'exam' ? '' : '<p><label><input type="checkbox" id="p-exp" checked> Incluir la explicación</label></p>'}
    <p><label><input type="checkbox" id="p-key"> Incluir la clave de respuestas al final</label></p>
    <p><small>Se abrirá el cuadro de impresión de tu navegador: elige «Guardar como PDF» o tu impresora. Los ejercicios de audio y de pronunciación se hacen mejor en la web.</small></p>`);
  c.append(btn('Preparar documento', async () => {
    const opt = { key: $('#p-key').checked, exp: kind === 'exam' ? false : $('#p-exp').checked };
    let parts;
    if (kind === 'exam') {
      const E = await J(ent.exam.file);
      parts = [{ head: esc(E.title.es), intro: '<p>' + esc(E.instructions_es) + '</p>', exercises: E.exercises.concat(E.optional_tasks) }];
    } else {
      const files = kind === 'unit' ? ent.lessons.filter(l => l.status === 'ready') : [ent], Ls = await Promise.all(files.map(f => J(f.file)));
      parts = Ls.map(L => ({
        head: esc(L.title.target) + ' <small>' + esc(L.title.es) + '</small>',
        intro: '<p><i>' + esc(L.objective) + '</i></p>' + inputHTML(L.input, true) + (opt.exp ? '<h2>Explicación</h2>' + md(L.explanation.md_es) +
          (L.explanation.common_mistakes_es?.length ? '<h3>Errores comunes</h3><ul>' + L.explanation.common_mistakes_es.map(m => `<li>✗ ${esc(m.wrong)} → ✓ <b>${esc(m.right)}</b> <small>${esc(m.note)}</small></li>`).join('') + '</ul>' : '') : ''),
        exercises: L.exercises
      }));
    }
    const old = document.getElementById('tx-print'); if (old) old.remove();
    const box = h('div'); box.id = 'tx-print'; box.innerHTML = printDoc(parts, opt); document.body.append(box);
    window.addEventListener('afterprint', () => box.remove(), { once: true });
    if (typeof window.print === 'function') window.print();
  }), btn('Volver', home, 'tx-alt'));
}

const fail = e => view(`<h2>No se pudo cargar el contenido</h2><p>${esc(e.message)}</p><p><small>Comprueba que la carpeta <b>content/</b> está en la raíz del sitio. Si abres el archivo con doble clic (file://), el navegador bloquea la carga: usa GitHub Pages o un servidor local.</small></p>`);

app.onclick = ev => {
  const t = ev.target.closest('[data-go]'); if (!t || t.disabled) return;
  const [a, id, id2] = t.dataset.go.split(':');
  if (a === 'lesson') lesson(flat.find(l => l.id === id)).catch(fail);
  else if (a === 'review') review().catch(fail);
  else if (a === 'vocab') vocab().catch(fail);
  else if (a === 'faq') faq();
  else if (a === 'print') printView(id, id2).catch(fail);
  else if (a === 'exam') exam(id).catch(fail);
  else if (a === 'placement') placement().catch(fail);
  else if (a === 'reset' && confirm('¿Borrar todo tu progreso en este navegador?')) { S = { done: {}, srs: {}, exams: {}, placement: null, open: false, secs: {}, goal: S.goal || 20 }; save(); home(); }
};

window.Trilex = { runEx, norm, printEx };
J('path.json').then(p => {
  P = p; LV = p.levels.filter(l => l.units.some(u => u.lessons.some(x => x.status === 'ready')));
  flat = LV.flatMap(lv => lv.units.flatMap(u => u.lessons.filter(l => l.status === 'ready').map(l => Object.assign(l, { cefr: lv.cefr }))));
  home();
}).catch(fail);
})();
