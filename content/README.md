# Trilex – contenido de aprendizaje

Contenido en JSON estático (Fase 1, compatible con GitHub Pages). Idioma objetivo: `en` (inglés británico, con notas del americano). Idioma de la interfaz: `es`.

## Niveles

Se cubren A1, A2, B1 y B2, y los cuatro niveles están completos (cada uno con su examen final).

## Estructura

```text
content/en/
  path.json                  índice de niveles → unidades → lecciones (status: ready | planned)
  placement-test.json        prueba de nivel A1-B2 (hasta 68 ítems)
  vocab/a1.json, a2.json     vocabulario por nivel (id, lemma, pos, ipa, translation_es, ejemplo)
  grammar/topics.json        temas de gramática y prerrequisitos
  a1/unit-NN/lesson-NN.json  una lección por archivo (la 06 de cada unidad es el checkpoint)
  a1/exam.json               examen final del nivel (cada nivel tendrá el suyo: a2/exam.json…)
  a2/unit-NN/lesson-NN.json  igual que A1 (se publica por unidades; path.json marca cada lección ready | planned)
audio-scripts/en/<id>.txt    textos para TTS (diálogos y ejercicios de audio)
tools/                       scripts Python que generan y validan todo (python3 build.py); NO va en el repositorio de la web
```

Para otro idioma (alemán, ruso, chino) se usa la misma estructura bajo `content/<lang>/` y se añade `romanization` en las entradas de vocabulario.

## Lección

Campos: `id`, `language`, `level`, `unit`, `order`, `kind` (`lesson` | `checkpoint`), `version`, `title{target,es}`, `objective`, `est_minutes`, `skills`, `warmup`, `input`, `explanation{md_es, common_mistakes_es, false_friends}`, `exercises[]`, `summary{key_phrases}`, `srs_items[]` y, en checkpoints, `checkpoint{pass_score}`.

`input.type`: `vocab_list` (solo glosario), `review` (checkpoints) o `dialogue` (líneas con `speaker`, `text`, `es`; `ipa` por línea es opcional y el IPA va en el glosario), `text`, `vocab_list` o `review`. Cada entrada del glosario es `{id, lemma, pos, ipa, es, example}`.

## Ejercicios

Campos comunes: `id`, `type`, `skill`, `difficulty` (1–5), `tags`, `est_seconds`, `prompt`, `feedback{correct, incorrect}`.

| type | campos propios | respuesta |
|---|---|---|
| `multiple_choice` | `options`, `answer[1]`, `refers_to_input` (lectura) | una opción |
| `fill_blank` | `___` en `prompt`, `answer[]`, `accepted_alternatives[]` | cualquier valor de `answer` |
| `word_order` | `tokens[]` (desordenados), `answer[]` (en orden) | secuencia exacta; la puntuación va como token aparte |
| `matching` | `pairs[{left,right}]` | cada izquierda con su derecha |
| `true_false` | `answer[true/false]` | booleano |
| `translation` | `direction` (`es-en`/`en-es`), `answer[]`, `accepted_alternatives[]` | cualquier valor de `answer` |
| `error_correction` | `text` (frase con error), `answer[]` | cualquier valor de `answer` |
| `listening` | `audio_text`, `audio_script_id`, `options`, `answer` | una opción |
| `dictation` | `audio_text`, `audio_script_id`, `answer[]` | texto escrito |
| `pronunciation` | `items[{text, ipa, tip_es}]` | autoevaluación (el reconocimiento de voz es opcional) |
| `writing` | `min_words`, `self_check_es[]`, `model_answer` | autoevaluación con lista de control |
| `roleplay` | `situation_es`, `turns[]` (`{speaker,text}` o `{speaker:"You", choices, best, why_es}`) | elegir `best` en cada turno |

## Reglas de corrección (en el cliente)

1. Normalizar antes de comparar: minúsculas, `trim`, espacios dobles → uno, apóstrofos tipográficos → `'`, quitar `.` `?` `!` finales y todos los apóstrofos, tanto en lo que escribe el usuario como en las respuestas válidas (`Im` = `I'm`, `ve` = `'ve`).
2. Aceptar cualquier valor de `answer` o `accepted_alternatives`.
3. Barajar siempre `options` y `tokens` en pantalla. En `multiple_choice` y `listening` se compara la opción elegida tal cual (la normalización es solo para respuestas escritas).
   Si el ejercicio trae `case_sensitive: true` (mayúsculas en países, meses o días), **no** pasar a minúsculas: las mayúsculas cuentan.
4. Mostrar `feedback.correct` o `feedback.incorrect` después de responder; en `listening` y `dictation`, mostrar el `audio_text` como transcripción.

## Progreso

- **Desbloqueo:** una lección se abre al completar la anterior con ≥ 70 % en sus ejercicios. La lección 06 (checkpoint) usa `checkpoint.pass_score`.
- **Examen de fin de nivel:** ≥ 75 % para desbloquear el siguiente nivel (A1: 32 ítems puntuados, A2: 36, más 2 tareas opcionales sin nota).
- **SRS (Leitner):** cajas con intervalos de 1, 3, 7, 14, 30 y 60 días. Acierto → sube una caja; error → vuelve a la caja 1 y suma un `lapse`. `srs_items` de cada lección entra al completarla.

## Placement test

Escalera por bloques A1 → A2 → B1 → B2 (68 preguntas: 12, 16, 20 y 20; incluye gramática, vocabulario, lectura con texto y audio). Se supera un bloque con al menos el 75 % de aciertos (`algorithm.pass_ratio`). Se detiene en el primer bloque no superado; el nivel estimado es el último bloque superado (si no se supera A1, se empieza en A1; si se supera B2, el resultado es B2, el máximo del sitio). Al final se muestra el porcentaje por nivel. Se ofrece una opción «No lo sé» (cuenta como incorrecta). Las preguntas de lectura llevan un campo `passage` con el texto; las de audio, `audio_text`.

## Audio

Reproducir con `speechSynthesis` (Web Speech API) usando `audio_text` o los archivos de `audio-scripts/en/`. Un diálogo usa un archivo por lección (`...-d01.txt`) con una línea por turno; los ejercicios de audio usan `<exercise-id>-a.txt`.

## Examen final de A1

`content/en/a1/exam.json`: 32 ítems puntuados (vocabulario y funciones, gramática, corrección de errores, listening, dictado y lectura) con `pass_score` 0.75 (24 aciertos) y `optional_tasks` (escritura y rol) que se autoevalúan y no cuentan. Cada ítem trae `tags` y un campo `review` (lección y tema a repasar, calculado por build.py) que la web muestra al fallar, sin revelar la respuesta.

## Notas de contenido

- `vocab/a1.json`: cada palabra trae `first_lesson` (lección donde aparece por primera vez) y `topic`.
- `exercises[].refers_to_input: true` indica una pregunta de lectura sobre el texto o diálogo de la propia lección.
- `explanation.false_friends` aparece solo en las lecciones que lo necesitan (parents, library).


## Repaso mezclado (automático)

`build.py` añade a cada lección, **además** de sus ejercicios, unos pocos de unidades anteriores (ids `…-rvNN`, campo `review_of`). Cantidad en `meta.py` → `review_count`: base por nivel (A1 3, A2 4, B1 5, B2 6) + 1 cada 3 unidades, y +2 en los checkpoints; así cada unidad lleva más que la anterior. Solo se copian tipos que no dependen del texto de la lección. La unidad 1 de A1 no recibe repaso (no hay nada anterior). No hace falta escribirlos a mano.

## Tareas de escritura

`write(...)` ajusta `min_words` para que nunca supere las palabras del modelo (build.py lo valida). La web exige ese mínimo de palabras reales y no acepta texto repetido.

## Autoaprendizaje: lectura (`content/en/reading/`)

```text
reading/index.json               catálogo: lecturas graduadas y libros
reading/texts/<id>.json          lectura graduada: párrafos, glosario, preguntas, tarea opcional
reading/books/<id>/book.json     ficha del libro (sinopsis en 8 idiomas) y lista de capítulos
reading/books/<id>/ch-NN.json    texto original del capítulo + resumen + glosario + preguntas
```

- Lecturas graduadas: `tools/reading_graded.py` (24 textos originales, 6 por nivel A1–B2).
- Libros: textos de dominio público en `tools/books_src/`, divididos por `tools/books.py`; fichas en `tools/reading_books.py`; glosario y preguntas de cada capítulo en `tools/bookq_<id>.py`.
- Solo autores fallecidos hace más de 70 años (dominio público también en Argentina y la UE).
- `build.py` valida todo (respuestas presentes en las opciones, palabras del glosario y respuestas de completar que aparecen en el texto) y lo regenera.
- Tipos de pregunta: `mc` (opción múltiple), `tf` (verdadero/falso), `fill` (escribir una palabra del texto).
- **Diccionario del lector** (`reading/i18n/<idioma>.json`, lo genera `i18n_build.py`): `{"gloss": {palabra del
  glosario: significado}, "vocab": {lema del curso: significado}}` en en, fr, de, it, pt, ru y zh. Fuente:
  `tools/i18n/reading_gloss.py` (glosarios de lecturas y libros) y `tools/i18n/<nivel>_vocab.py` (vocabulario de
  A1 a B2). `en.json` es una definición breve en inglés sencillo, que el lector muestra también como «significado».
  `i18n_build.py` avisa si una palabra de un glosario no tiene traducción o si sobra alguna.
- **Libros en PDF** (`reading/books/<id>/<id>.pdf`, `book_pdf.py`): portada, índice, capítulos y glosario de cada
  capítulo en inglés sencillo, en A5 con la tipografía IBM Plex de `tools/fonts/` (licencia SIL OFL). Se generan con
  Chromium (Playwright) y quedan en `tools/pdf_cache/` con un hash del contenido: solo se rehacen si cambia el libro,
  su glosario o la plantilla (`TEMPLATE_VERSION`). Sin Playwright se usan los de la caché. `index.json` lleva el
  tamaño (`pdf_kb`) para el botón «Descargar PDF».
- **Notas y subrayados**: los guarda el navegador en `trilex_read_v1.notes` (`{id del texto: {title, href, level,
  general, marks: [{id, color, quote, note, ranges: [{p, s, e}]}]}}`; `p` es el párrafo y `s`/`e` la posición del
  subrayado dentro de su texto).

## Formato y legibilidad

- **JSON con sangría**: todos los archivos de `content/` se escriben con `indent=2` (un campo por línea),
  nunca en una sola línea.
- **Textos de varias líneas como lista**: los campos `md`, `md_es`, `text`, `es` y `model_answer` que
  tienen saltos de línea se guardan como **lista de líneas** (`lib.to_lines`). El reproductor
  (`trilex.js`) y el lector (`lector.js`) las vuelven a unir con `"\n"` al cargar el JSON
  (`JSON.parse(texto, joinLines)`), y `i18n_build.py` hace lo mismo con `lib.from_lines`.
  Estas claves nunca son listas por otro motivo, así que la conversión no es ambigua.
- **Código Python**: formateado con Black (`black --unstable -l 100`), que también parte las cadenas largas.
- **Lecturas graduadas** (`reading_graded.py`): los párrafos largos están partidos en varias líneas; una línea
  que empieza con 4 espacios es continuación de la anterior y `_unwrap()` la vuelve a unir con un espacio.
- **Traducciones** (`i18n/*.py`): una clave por línea y los textos largos partidos en trozos
  (`("…" "…")`, concatenación implícita de Python).
- **Textos de los ejercicios** (`i18n/<nivel>_ex_<grupo>.py`, grupos `u01`…`uNN` y `exam`): diccionario
  `EX = {texto en español: {idioma: traducción}}` con las consignas, opciones, comentarios, listas de
  control y errores comunes que están en español. `ex_strings.py` decide qué textos hay que traducir;
  `i18n_build.py` avisa de los que faltan y comprueba que las opciones traducidas sigan siendo distintas
  entre sí. El reproductor los aplica con `localizeEx` (traducidos hoy: A1 y A2).
- **Web** (`ingles/*.js|css|html`): formateada con Prettier (ancho 100); las plantillas HTML largas están
  partidas en trozos concatenados con `+` (mismo HTML resultante).
- **Diseño** (editorial, igual en todas las páginas): `shared-topic.css` define los colores, la tipografía IBM Plex y
  las piezas comunes (cabecera con rótulo, tarjetas, paneles); `trilex.css` el curso y `lector.css` el lector.
  El curso muestra el mapa como lista (niveles → unidades → lecciones) y cada lección en una sola página: texto,
  explicación y los ejercicios en cuadrícula, que se corrigen al instante, con el panel de puntaje y «Reiniciar».
  El examen final usa la misma cuadrícula (sin dar la respuesta); la prueba de nivel y el repaso van de a una
  pregunta. Los textos de las portadas (ingles.html, autoaprendizaje, aprendizaje guiado, curso) están en
  `portadas.js`.
