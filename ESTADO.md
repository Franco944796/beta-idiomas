# Estado — web-idiomas (Trilex)

## Objetivo
Web estática para aprender idiomas (por ahora solo inglés, A1–B2). Trabajo en curso: agregar 8 actividades
basadas en investigación (repaso espaciado, fluidez, producción) al lector y al curso.

## Decisiones tomadas
- Reglas de trabajo: `reglas-de-trabajo.md`.
- Carrusel de idiomas del inicio: solo en celular (≤ 576 px); en escritorio, fila de banderas.
- Contacto: solo ícono ✉ que abre Gmail a sudoanonimo@gmail.com, sin límite de clics.
- Enlaces sin URL visible al pasar el mouse (`hide-links.js`); sin `title` en enlaces.
- Lector: un toque no abre nada; seleccionar abre barra de colores + diccionario; frases de 2–4
  palabras se buscan en el diccionario.
- Actividades nuevas elegidas (todas):
  - Lector: A repaso espaciado de «Mis palabras» (escribir la palabra), B completar huecos con el
    texto, D escuchar y repetir por oración (con grabación), E lectura cronometrada (ppm),
    F volver a contar 3 veces (2:00 / 1:30 / 1:00).
  - Curso: G tarjetas del Repaso escritas (reemplaza «la sabía / no la sabía», con botón de error de
    tipeo), H repaso mixto semanal de 30 ejercicios, I lectura recomendada por unidad,
    J dictogloss por unidad con 50 textos nuevos, C resumen guiado solo en las 24 lecturas graduadas.
- Datos escritos a mano van en `content/en/extras.json` (build.py regenera el resto de `content/`).
- Textos de interfaz nuevos en los 8 idiomas (en, es, fr, de, it, pt, ru, zh).

## Hecho
- 2026-10-26: correcciones (diccionario del lector, «Mis palabras», nivel inválido, reinicio del
  cuestionario, desbordes en celular, contacto visible en celular), carrusel solo en celular,
  investigación de métodos.
- 2026-10-26: las 8 actividades, probadas en Firefox (sintaxis, flujo completo, cambio de idioma,
  sin micrófono, celular):
  - Lector (`ingles/lector.js`): escuchar y repetir, completar huecos, resumen guiado (lecturas
    graduadas), fluidez (lectura cronometrada + volver a contarlo 2:00/1:30/1:00), repaso espaciado
    de «Mis palabras» (`#/repaso`).
  - Curso (`ingles/trilex.js`): tarjetas del Repaso escritas (con «La sabía (error de tipeo)»),
    repaso mixto de 30 ejercicios (aviso «!» si pasó una semana), lectura recomendada y dictogloss
    al pie de cada unidad (contracciones = forma completa).
  - `content/en/extras.json` (resúmenes, lecturas por unidad, 50 textos de dictogloss) y README.

## En curso
- Nada.

## Pendiente
- Preguntas frecuentes del curso (FAQ, 8 idiomas): no mencionan el repaso mixto ni el dictogloss.
- Si se regenera `content/` con build.py, conservar `content/en/extras.json`, las lecturas y libros B1–B2
  nuevos y las palabras nuevas del diccionario: sus fuentes están en `../trilex/tool/contenido/`
  (`python3 tool/contenido/generar.py && python3 tool/contenido.py` desde `trilex/`).
- PDF de los 4 libros nuevos sin generar.

## Archivos clave
- Inicio: `index.html`, `style.css`, `script.js`, `nav-links.js`, `hide-links.js`.
- Inglés: `ingles/lector.js` (autoaprendizaje), `ingles/trilex.js` (curso), `ingles/trilex-i18n*.js`.
- Contenido: `content/en/` (generado por tools/ fuera del repo, salvo `extras.json`).

## Problemas conocidos
- `terminos.html` sección 6 muestra franco.insua3.0@gmail.com (no coincide con el contacto nuevo).
- `ingles/textos.en.html` e `ingles/historia.en.html` no se enlazan desde ningún lado.
