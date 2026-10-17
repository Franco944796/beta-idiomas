# Trilex – contenido de aprendizaje (Etapa 2)

Contenido en JSON estático (Fase 1, compatible con GitHub Pages). Idioma objetivo: `en` (inglés británico, con notas del americano). Idioma de la interfaz: `es`.

## Estructura

```text
content/en/
  path.json                  índice de niveles → unidades → lecciones (status: ready | planned)
  placement-test.json        prueba de nivel adaptativa (28 ítems)
  vocab/a1.json              vocabulario (id, lemma, pos, ipa, translation_es, ejemplo)
  grammar/topics.json        temas de gramática y prerrequisitos
  a1/unit-NN/lesson-NN.json  una lección por archivo (la 06 de cada unidad es el checkpoint)
audio-scripts/en/<id>.txt    textos para TTS (diálogos y ejercicios de audio)
tools/                       scripts Python que generan y validan todo (python3 build.py)
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
- **Examen de fin de nivel:** ≥ 75 % para desbloquear el siguiente nivel (`a1/exam.json`: 30 ítems puntuados + 2 tareas opcionales sin nota).
- **SRS (Leitner):** cajas con intervalos de 1, 3, 7, 14, 30 y 60 días. Acierto → sube una caja; error → vuelve a la caja 1 y suma un `lapse`. `srs_items` de cada lección entra al completarla.

## Placement test

Escalera por bloques A1 → A2 → B1 → B2 → C1. Mínimo de aciertos para superar cada bloque: A1 4/6, A2 4/6, B1 4/6, B2 3/5, C1 3/5. Se detiene en el primer bloque no superado; ese es el nivel de inicio (si se superan todos, C2). Los niveles superados se marcan como «saltados» con repaso opcional. Se muestra una opción «No lo sé» (cuenta como incorrecta).

## Audio

Reproducir con `speechSynthesis` (Web Speech API) usando `audio_text` o los archivos de `audio-scripts/en/`. Un diálogo usa un archivo por lección (`...-d01.txt`) con una línea por turno; los ejercicios de audio usan `<exercise-id>-a.txt`.

## Examen final de A1

`content/en/a1/exam.json`: 30 ítems puntuados (vocabulario y funciones, gramática, corrección de errores, listening, dictado y lectura) con `pass_score` 0.75 (23 aciertos) y `optional_tasks` (escritura y rol) que se autoevalúan y no cuentan. Cada ítem trae `tags` para mostrar en qué temas se falló.

## Notas de contenido

- `vocab/a1.json`: cada palabra trae `first_lesson` (lección donde aparece por primera vez) y `topic`.
- `exercises[].refers_to_input: true` indica una pregunta de lectura sobre el texto o diálogo de la propia lección.
- `explanation.false_friends` aparece solo en las lecciones que lo necesitan (parents, library).
