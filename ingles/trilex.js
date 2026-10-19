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
S = Object.assign({ done: {}, srs: {}, exams: null, placement: null, open: false }, S);
if (!S.exams) S.exams = S.exam ? { A1: S.exam } : {};   // migra el examen único antiguo (A1)
const save = () => { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} };

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
    fb.className = 'tx-fb ' + (s >= 1 ? 'ok' : s > 0 ? 'half' : 'bad');
    fb.innerHTML = (e.feedback ? '<b>' + esc(s >= 1 ? e.feedback.correct : e.feedback.incorrect) + '</b>' : '') + x;
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
      if (!o.quiet) { opts.forEach(([u, y]) => { y.disabled = true; if (e.answer.includes(u)) y.classList.add('ok'); }); if (!ok) x.classList.add('bad'); }
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

R.pronunciation = (e, b, fin, ask) => {
  e.items.forEach(i => b.append(h('div', 'tx-row', sayBtn(i.text) + `<div><b>${esc(i.text)}</b> <span class="tx-ipa">${esc(i.ipa)}</span><br><small>${esc(i.tip_es)}</small></div>`)));
  ask(() => fin(1), 'Ya lo practiqué');
};

R.writing = (e, b, fin, ask) => {
  const t = h('textarea', 'tx-in tx-ta'); t.rows = 4; t.setAttribute('aria-label', 'Tu texto');
  b.append(t, h('small', '', 'Mínimo ' + e.min_words + ' palabras'));
  ask(() => { t.disabled = true; fin(1, '<p><b>Modelo:</b> ' + esc(e.model_answer) + '</p><p>Revisa tu texto:</p><ul class="tx-check">' + e.self_check_es.map(x => '<li><label><input type="checkbox"> ' + esc(x) + '</label></li>').join('') + '</ul>'); }, 'Comparar con el modelo');
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
  let s = `<div class="tx-card"><h2>Curso de inglés <small>${soon.length ? 'Próximamente: ' + soon.join(', ') : ''}</small></h2>
  <p><small>Desbloqueas cada lección con ≥ 70 % en la anterior. Si haces la prueba de nivel, los niveles que superes quedan abiertos.</small></p></div>
  <div class="tx-grid">
   <button class="tx-tile" data-go="placement"><b>🎯 Prueba de nivel</b><small>${pl ? 'Tu resultado: ' + esc(pl.level) : 'Hasta 68 preguntas · se adapta a tu nivel'}</small></button>
   <button class="tx-tile" data-go="review" ${due ? '' : 'disabled'}><b>🔁 Repaso</b><small>${due ? due + ' palabras pendientes' : 'Nada pendiente hoy'}</small></button></div>`;
  LV.forEach(lv => {
    const ls = flat.filter(l => l.cefr === lv.cefr), nd = ls.filter(l => S.done[l.id]).length, tot = lvTotal(lv), ex = S.exams[lv.cefr], open = examOpen(lv);
    s += `<div class="tx-card"><h2>Nivel ${lv.cefr} <small>${nd} de ${tot} lecciones completadas</small></h2><div class="tx-prog"><span style="width:${nd / tot * 100}%"></span></div>` +
      (free(lv.cefr) ? '<p><small>✓ Nivel superado en la prueba de nivel: las lecciones están abiertas para repasar.</small></p>' : '') +
      (ls.length < tot ? `<p><small>Las unidades se publican por etapas: ${ls.length} de ${tot} lecciones disponibles por ahora.</small></p>` : '') + '</div>' +
      `<div class="tx-grid"><button class="tx-tile" data-go="exam:${lv.cefr}" ${open ? '' : 'disabled'}><b>📝 Examen final ${lv.cefr}</b><small>${ex ? (ex.passed ? '✓ Aprobado ' : 'Último intento ') + Math.round(ex.pct * 100) + ' %' : !(lv.exam && lv.exam.status === 'ready') ? 'Se habilita cuando esté todo el nivel' : open ? '30 preguntas · aprueba con 75 %' : 'Completa las ' + tot + ' lecciones'}</small></button></div>`;
    s += `<details class="tx-level" ${lv.cefr === cur ? 'open' : ''}><summary>Unidades de ${lv.cefr}</summary>`;
    lv.units.filter(u => u.lessons.some(x => x.status === 'ready')).forEach(u => {
      s += `<div class="tx-card"><h2>Unidad ${u.order}: ${esc(u.title_target)} <small>${esc(u.title_es)}</small></h2>` + u.lessons.filter(l => l.status === 'ready').map(l => {
        const d = S.done[l.id], ok = unlocked(l);
        return `<button class="tx-lesson ${d ? 'done' : ''}" data-go="lesson:${l.id}" ${ok ? '' : 'disabled'}><span>${d ? '✓' : ok ? '▶' : '🔒'}</span><span>${l.kind === 'checkpoint' ? '⭐ ' : ''}${esc(l.title_target)} <small>${esc(l.title_es)}</small></span><span>${d ? Math.round(d.score * 100) + ' %' : ''}</span></button>`;
      }).join('') + '</div>';
    });
    s += '</details>';
  });
  s += `<div class="tx-foot"><label><input type="checkbox" id="tx-open" ${S.open ? 'checked' : ''}> Modo prueba: desbloquear todo</label><button data-go="reset">Borrar progreso</button></div>`;
  app.innerHTML = s; scrollTo(0, 0);
  $('#tx-open').onchange = e => { S.open = e.target.checked; save(); home(); };
}

async function lesson(ent) {
  const L = await J(ent.file), exs = L.exercises, pass = L.checkpoint?.pass_score ?? .7, total = 3 + exs.length, title = `${esc(L.title.target)} <small>${esc(L.title.es)}</small>`;
  let sc = 0;
  const intro = () => { const s = stepCard(title, 0, total); s.innerHTML = `<p>${esc(L.objective)}</p><p><small>≈ ${L.est_minutes} min</small></p>` + (L.warmup ? `<p class="tx-warm">${esc(L.warmup.prompt_es)}</p>` : ''); s.append(btn('Empezar', input)); };
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
    runEx(E.exercises[i], s, (v, e) => { sc += v; if (v < 1) (e.tags || []).forEach(t => wrong[t] = (wrong[t] || 0) + 1); i++; step(); });
  };
  const result = () => {
    const pct = sc / n, ok = pct >= E.pass_score; S.exams[cefr] = { pct, passed: ok, at: Date.now() }; save();
    const weak = Object.entries(wrong).sort((a, b) => b[1] - a[1]);
    const c = view(`<h2>${esc(E.title.es)}</h2><p class="tx-big">${Math.round(sc)} / ${n} · ${Math.round(pct * 100)} %</p><p>${ok ? '¡Aprobado! ' + cefr + ' completado.' : 'Necesitas ' + Math.ceil(E.pass_score * n) + ' aciertos. Repasa los temas débiles e inténtalo de nuevo.'}</p>` +
      (weak.length ? '<h3>Temas para reforzar</h3><ul>' + weak.map(([t, k]) => `<li>${esc(t)} (${k})</li>`).join('') + '</ul>' : '') + `<p><small>${esc(E.instructions_es)}</small></p>`);
    c.append(btn('Tareas opcionales (sin nota)', () => opt(0)), btn('Volver al curso', home));
  };
  const opt = k => { if (k >= E.optional_tasks.length) return home(); const s = stepCard('Tarea opcional <small>sin nota</small>', k, E.optional_tasks.length); runEx(E.optional_tasks[k], s, () => opt(k + 1)); };
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

const fail = e => view(`<h2>No se pudo cargar el contenido</h2><p>${esc(e.message)}</p><p><small>Comprueba que la carpeta <b>content/</b> está en la raíz del sitio. Si abres el archivo con doble clic (file://), el navegador bloquea la carga: usa GitHub Pages o un servidor local.</small></p>`);

app.onclick = ev => {
  const t = ev.target.closest('[data-go]'); if (!t || t.disabled) return;
  const [a, id] = t.dataset.go.split(':');
  if (a === 'lesson') lesson(flat.find(l => l.id === id)).catch(fail);
  else if (a === 'review') review().catch(fail);
  else if (a === 'exam') exam(id).catch(fail);
  else if (a === 'placement') placement().catch(fail);
  else if (a === 'reset' && confirm('¿Borrar todo tu progreso en este navegador?')) { S = { done: {}, srs: {}, exams: {}, placement: null, open: false }; save(); home(); }
};

window.Trilex = { runEx, norm };
J('path.json').then(p => {
  P = p; LV = p.levels.filter(l => l.units.some(u => u.lessons.some(x => x.status === 'ready')));
  flat = LV.flatMap(lv => lv.units.flatMap(u => u.lessons.filter(l => l.status === 'ready').map(l => Object.assign(l, { cefr: lv.cefr }))));
  home();
}).catch(fail);
})();
