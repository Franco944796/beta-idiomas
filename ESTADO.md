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

- 2026-10-28 Mascota (prueba, solo web; si convence se pasa a la app): `ingles/mascota.js` y `mascota.css`,
  en el camino guiado: portadas «Aprendizaje guiado» y «Curso», curso (`estudiar.en.html`) y lector
  (`lectura.en.html`). La primera vez se abre sola para elegir. Se guarda en `trilex_pet_v1`.
  - Animales: dragón y oso panda (los primeros, zorro/búho/gato, se reemplazaron: quien tenía uno vuelve a elegir).
  - 4 etapas por puntos (cría 0 · joven 200 · adulto 600 · sabio 1500; lección +10, lectura o capítulo +15,
    examen +50, día con meta +5). Cambia la forma: dragón con cáscara → cuernos y cresta → alas grandes y púas
    → barba y birrete; panda cría con mechón → sentado → de pie → cejas, barba y birrete.
  - Color por examen de nivel aprobado: escamas del dragón (verde → azul → rojo → violeta → dorado) y manchas del
    panda (negro → marrón → azul pizarra → ciruela → dorado).
  - Ánimo: festejando (examen aprobado o evolución ese día), contento (meta cumplida), concentrado (estudió hoy
    sin llegar a la meta), con sueño (3 días sin estudiar), triste (7 días), normal.
  - Accesorios por parte del cuerpo, varios a la vez: cabeza (gorro: racha de 7 días; auriculares: 1 examen;
    corona: examen B2), cara (anteojos: 5 lecturas), cuello (bufanda: 3 días con meta; medallas: una por examen),
    espalda (mochila: 20 lecciones), mano (libro: 30 lecciones; bambú/farol: 10 lecturas).
  - Modo prueba del curso: elegir etapa, color y ánimo, y todos los accesorios libres.
  - Probado en Firefox (35 comprobaciones) y revisado en capturas (claro, oscuro, celular).

- 2026-10-28 Mascota asomada en el título: se asoma (cabeza y patitas) al final del título de cada página del camino
  guiado; si no entra a la derecha, encima del título. Al bajar y perder de vista el título aparece la insignia de la
  esquina. Tocarla abre el panel debajo. Probado en Firefox (60 comprobaciones de la mascota en total).
- 2026-10-28 Opciones de opción múltiple más parejas en exámenes finales, prueba de nivel y lecciones: 452 preguntas
  (502 apariciones, contando repasos) tenían la correcta mucho más larga o incorrectas groseras/absurdas. Se
  reescribieron las incorrectas: largo parecido, mismo tipo de frase y claramente equivocadas según el texto o audio;
  en las de «forma educada» son educadas pero con un error de gramática, registro o significado. La correcta y los
  comentarios no cambiaron. Antes la correcta era ≥ 30 % más larga en 432 preguntas; ahora en ninguna.
  Copiado a la app con `trilex/tool/contenido.py`.

- 2026-10-28 Portada (`index.html`, `style.css`): «Trilex» en el celeste del modo oscuro (#8fa9f0) con sombra suave,
  más grande y en IBM Plex Sans; la frase en IBM Plex Mono en mayúsculas; marca ∴ junto al nombre, que también es el
  ícono de la pestaña en todas las páginas (`imgs/favicon.svg`, solo los 3 puntos, sin fondo). Inglés destacado (grande, «Empezar →» y borde de luz
  que gira); los otros idiomas en gris con «Próximamente» en su idioma (sin candado rojo). Sin la línea brillante bajo
  el lema; título de la pestaña «Trilex — Aprende idiomas»; botón de tema claro/oscuro arriba a la izquierda
  (`ingles/tema.js`). Revisado en capturas (computadora, celular, tema claro).

- 2026-10-28 Borde de luz que gira (clase `.glow` en `ingles/shared-topic.css`, como la bandera de inglés de la
  portada) en el curso: tarjeta «Siguiente lección», la lección que toca en el mapa y el examen final del nivel cuando
  ya se terminaron sus lecciones y falta aprobarlo. Celeste/violeta en oscuro, azul/celeste en claro; quieto si el
  sistema pide menos movimiento; no se imprime. Revisado en capturas (oscuro y claro).

- 2026-10-28 Fondo «aurora» en las páginas de inglés (`ingles/shared-topic.css`): halos celeste y violeta en las
  esquinas sobre el fondo de siempre, más tenues en oscuro y blanco al imprimir. Se quitó una copia repetida del
  estilo `.glow` y en el lector ya no aparece una barra vertical en la fila de pestañas. Revisado en capturas.

- 2026-10-29 Portada: el puntero queda como flecha sobre el texto (no se puede seleccionar); manito en lo clicable.

## En curso
- Nada.

## Pendiente
- Preguntas frecuentes del curso (FAQ, 8 idiomas): no mencionan el repaso mixto ni el dictogloss.
- Si se regenera `content/` con build.py, conservar también las opciones reescritas de los ejercicios (2026-10-28) y `content/en/extras.json`, las lecturas y libros B1–B2
  nuevos y las palabras nuevas del diccionario: sus fuentes están en `../trilex/tool/contenido/`
  (`python3 tool/contenido/generar.py && python3 tool/contenido.py` desde `trilex/`).
- PDF de los 4 libros nuevos sin generar.

## Archivos clave
- Inicio: `index.html`, `style.css`, `script.js`, `nav-links.js`, `hide-links.js`.
- Inglés: `ingles/lector.js` (autoaprendizaje), `ingles/trilex.js` (curso), `ingles/trilex-i18n*.js`,
  `ingles/mascota.js` (mascota).
- Contenido: `content/en/` (generado por tools/ fuera del repo, salvo `extras.json`).

## Problemas conocidos
- `terminos.html` sección 6 muestra franco.insua3.0@gmail.com (no coincide con el contacto nuevo).
- `ingles/textos.en.html` e `ingles/historia.en.html` no se enlazan desde ningún lado.
