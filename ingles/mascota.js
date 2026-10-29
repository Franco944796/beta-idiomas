(() => {
  const KP = 'trilex_pet_v1',
    KC = 'trilex_en_v1', // curso (trilex.js)
    KR = 'trilex_read_v1'; // lector (lector.js)

  // textos propios: las portadas no cargan trilex-i18n.js
  const D = {
    petChoose: [
      'Choose your pet',
      'Elige tu mascota',
      'Choisissez votre compagnon',
      'Wähle dein Haustier',
      'Scegli il tuo animale',
      'Escolha o seu mascote',
      'Выберите питомца',
      '选择你的宠物',
    ],
    petChooseLede: [
      'It grows as you study: lessons, readings, exams and days meeting your goal give it points.',
      'Crece a medida que estudias: las lecciones, las lecturas, los exámenes y los días con la meta cumplida le dan puntos.',
      'Il grandit à mesure que vous étudiez : leçons, lectures, examens et jours où l’objectif est atteint lui donnent des points.',
      'Es wächst, während du lernst: Lektionen, Lesetexte, Prüfungen und Tage mit erreichtem Ziel geben ihm Punkte.',
      'Cresce mentre studi: lezioni, letture, esami e giorni con l’obiettivo raggiunto gli danno punti.',
      'Ele cresce à medida que você estuda: lições, leituras, exames e dias com a meta cumprida dão pontos.',
      'Он растёт, пока вы учитесь: уроки, чтение, экзамены и дни с выполненной целью дают ему очки.',
      '你学习时它会长大：课程、阅读、考试和完成目标的日子都会给它积分。',
    ],
    petDragon: ['Dragon', 'Dragón', 'Dragon', 'Drache', 'Drago', 'Dragão', 'Дракон', '龙'],
    petPanda: ['Panda', 'Oso panda', 'Panda', 'Panda', 'Panda', 'Panda', 'Панда', '熊猫'],
    petSt1: ['Baby', 'Cría', 'Bébé', 'Baby', 'Cucciolo', 'Filhote', 'Малыш', '幼崽'],
    petSt2: ['Young', 'Joven', 'Jeune', 'Jung', 'Giovane', 'Jovem', 'Подросток', '少年'],
    petSt3: ['Adult', 'Adulto', 'Adulte', 'Erwachsen', 'Adulto', 'Adulto', 'Взрослый', '成年'],
    petSt4: ['Wise', 'Sabio', 'Sage', 'Weise', 'Saggio', 'Sábio', 'Мудрец', '智者'],
    petPoints: ['{n} points', '{n} puntos', '{n} points', '{n} Punkte', '{n} punti', '{n} pontos', 'Очков: {n}', '{n} 积分'],
    petNext: [
      '{n} more to become: {s}',
      'Faltan {n} para: {s}',
      'Encore {n} pour devenir : {s}',
      'Noch {n} bis: {s}',
      'Ne mancano {n} per: {s}',
      'Faltam {n} para: {s}',
      'До стадии «{s}»: {n}',
      '还差 {n} 分：{s}',
    ],
    petMax: [
      'Fully grown!',
      '¡Llegó a la última etapa!',
      'Dernière étape atteinte !',
      'Letzte Stufe erreicht!',
      'Ultima fase raggiunta!',
      'Chegou à última etapa!',
      'Последняя стадия!',
      '已达到最后阶段！',
    ],
    petHow: [
      'Lesson +10 · reading or chapter +15 · exam passed +50 · day meeting your goal +5',
      'Lección +10 · lectura o capítulo +15 · examen aprobado +50 · día con la meta cumplida +5',
      'Leçon +10 · lecture ou chapitre +15 · examen réussi +50 · jour avec objectif atteint +5',
      'Lektion +10 · Lesetext oder Kapitel +15 · bestandene Prüfung +50 · Tag mit erreichtem Ziel +5',
      'Lezione +10 · lettura o capitolo +15 · esame superato +50 · giorno con obiettivo +5',
      'Lição +10 · leitura ou capítulo +15 · exame aprovado +50 · dia com a meta cumprida +5',
      'Урок +10 · текст или глава +15 · сданный экзамен +50 · день с выполненной целью +5',
      '课程 +10 · 阅读或章节 +15 · 通过考试 +50 · 完成目标的一天 +5',
    ],
    petColor: [
      'Its colour changes with each level exam you pass ({n}/4).',
      'Su color cambia con cada examen de nivel aprobado ({n}/4).',
      'Sa couleur change à chaque examen de niveau réussi ({n}/4).',
      'Seine Farbe ändert sich mit jeder bestandenen Niveauprüfung ({n}/4).',
      'Il suo colore cambia con ogni esame di livello superato ({n}/4).',
      'A cor muda a cada exame de nível aprovado ({n}/4).',
      'Цвет меняется с каждым сданным экзаменом уровня ({n}/4).',
      '每通过一次级别考试，它的颜色就会改变（{n}/4）。',
    ],
    petHappy: [
      'Happy: you met today’s goal.',
      'Contento: cumpliste la meta de hoy.',
      'Content : objectif du jour atteint.',
      'Fröhlich: Tagesziel erreicht.',
      'Contento: obiettivo di oggi raggiunto.',
      'Feliz: você cumpriu a meta de hoje.',
      'Доволен: цель на сегодня выполнена.',
      '开心：今天的目标完成了。',
    ],
    petSleepy: [
      'Sleepy: a few days without studying. It wakes up when you come back.',
      'Con sueño: pasaron unos días sin estudiar. Se despierta cuando vuelves.',
      'Endormi : quelques jours sans étudier. Il se réveille à votre retour.',
      'Müde: ein paar Tage ohne Lernen. Es wacht auf, wenn du zurückkommst.',
      'Assonnato: qualche giorno senza studiare. Si sveglia quando torni.',
      'Com sono: alguns dias sem estudar. Ele acorda quando você volta.',
      'Сонный: несколько дней без занятий. Проснётся, когда вы вернётесь.',
      '困了：好几天没学习了。你回来它就会醒。',
    ],
    petCalm: [
      'Meet today’s goal to make it happy.',
      'Cumple la meta de hoy para ponerlo contento.',
      'Atteignez l’objectif du jour pour le rendre heureux.',
      'Erreiche das Tagesziel, um es glücklich zu machen.',
      'Raggiungi l’obiettivo di oggi per renderlo felice.',
      'Cumpra a meta de hoje para deixá-lo feliz.',
      'Выполните цель на сегодня, чтобы порадовать его.',
      '完成今天的目标，让它开心起来。',
    ],
    petAcc: ['Accessory', 'Accesorio', 'Accessoire', 'Accessoire', 'Accessorio', 'Acessório', 'Аксессуар', '配饰'],
    petNone: ['None', 'Ninguno', 'Aucun', 'Keins', 'Nessuno', 'Nenhum', 'Нет', '无'],
    petScarf: ['Scarf', 'Bufanda', 'Écharpe', 'Schal', 'Sciarpa', 'Cachecol', 'Шарф', '围巾'],
    petGlasses: ['Glasses', 'Anteojos', 'Lunettes', 'Brille', 'Occhiali', 'Óculos', 'Очки', '眼镜'],
    petPhones: ['Headphones', 'Auriculares', 'Casque', 'Kopfhörer', 'Cuffie', 'Fones', 'Наушники', '耳机'],
    petScarfReq: [
      '3 days meeting your goal',
      '3 días con la meta cumplida',
      '3 jours avec l’objectif atteint',
      '3 Tage mit erreichtem Ziel',
      '3 giorni con l’obiettivo',
      '3 dias com a meta cumprida',
      '3 дня с выполненной целью',
      '完成目标 3 天',
    ],
    petGlassesReq: [
      '5 readings or chapters',
      '5 lecturas o capítulos',
      '5 lectures ou chapitres',
      '5 Lesetexte oder Kapitel',
      '5 letture o capitoli',
      '5 leituras ou capítulos',
      '5 текстов или глав',
      '5 篇阅读或章节',
    ],
    petPhonesReq: [
      '1 level exam passed',
      '1 examen de nivel aprobado',
      '1 examen de niveau réussi',
      '1 bestandene Niveauprüfung',
      '1 esame di livello superato',
      '1 exame de nível aprovado',
      '1 сданный экзамен уровня',
      '通过 1 次级别考试',
    ],
    petChange: [
      'Change pet',
      'Cambiar de mascota',
      'Changer de compagnon',
      'Haustier wechseln',
      'Cambia animale',
      'Trocar de mascote',
      'Сменить питомца',
      '更换宠物',
    ],
    petUp: [
      'Your pet evolved!',
      '¡Tu mascota evolucionó!',
      'Votre compagnon a évolué !',
      'Dein Haustier hat sich entwickelt!',
      'Il tuo animale si è evoluto!',
      'Seu mascote evoluiu!',
      'Ваш питомец вырос!',
      '你的宠物进化了！',
    ],
    petOpen: ['Your pet', 'Tu mascota', 'Votre compagnon', 'Dein Haustier', 'Il tuo animale', 'Seu mascote', 'Ваш питомец', '你的宠物'],
    petTest: [
      'Test mode: choose stage, colour and mood',
      'Modo prueba: elige etapa, color y ánimo',
      'Mode test : choisissez l’étape, la couleur et l’humeur',
      'Testmodus: Stufe, Farbe und Laune wählen',
      'Modalità test: scegli fase, colore e umore',
      'Modo teste: escolha etapa, cor e humor',
      'Тестовый режим: выберите стадию, цвет и настроение',
      '测试模式：选择阶段、颜色和心情',
    ],
    petBase: ['Initial', 'Inicial', 'Initial', 'Anfang', 'Iniziale', 'Inicial', 'Начальный', '初始'],
    petMoodCalm: ['Normal', 'Normal', 'Normal', 'Normal', 'Normale', 'Normal', 'Обычный', '平常'],
    petMoodHappy: ['Happy', 'Contento', 'Content', 'Fröhlich', 'Contento', 'Feliz', 'Доволен', '开心'],
    petMoodSleepy: ['Sleepy', 'Con sueño', 'Endormi', 'Müde', 'Assonnato', 'Com sono', 'Сонный', '困了'],
    petFocused: [
      'Focused: you studied today; a little more to reach your goal.',
      'Concentrado: hoy estudiaste; falta un poco para la meta.',
      'Concentré : vous avez étudié aujourd’hui ; encore un peu pour l’objectif.',
      'Konzentriert: Du hast heute gelernt; noch ein bisschen bis zum Ziel.',
      'Concentrato: oggi hai studiato; manca poco all’obiettivo.',
      'Concentrado: você estudou hoje; falta pouco para a meta.',
      'Сосредоточен: сегодня вы занимались, до цели осталось немного.',
      '专注：今天学习了，离目标还差一点。',
    ],
    petSad: [
      'Sad: more than a week without studying. It cheers up as soon as you come back.',
      'Triste: pasó más de una semana sin estudiar. Se alegra apenas vuelves.',
      'Triste : plus d’une semaine sans étudier. Il se réjouit dès votre retour.',
      'Traurig: über eine Woche ohne Lernen. Es freut sich, sobald du zurückkommst.',
      'Triste: più di una settimana senza studiare. Si rallegra appena torni.',
      'Triste: mais de uma semana sem estudar. Ele se alegra assim que você volta.',
      'Грустит: больше недели без занятий. Обрадуется, как только вы вернётесь.',
      '难过：一个多星期没学习了。你一回来它就高兴。',
    ],
    petParty: [
      'Celebrating: you passed an exam or it evolved today!',
      '¡Festejando: hoy aprobaste un examen o evolucionó!',
      'En fête : vous avez réussi un examen ou il a évolué aujourd’hui !',
      'Feier: Heute hast du eine Prüfung bestanden oder es hat sich entwickelt!',
      'Festa: oggi hai superato un esame o si è evoluto!',
      'Festejando: hoje você passou num exame ou ele evoluiu!',
      'Праздник: сегодня вы сдали экзамен или питомец вырос!',
      '庆祝：今天你通过了考试，或者它进化了！',
    ],
    petMoodFocused: [
      'Focused',
      'Concentrado',
      'Concentré',
      'Konzentriert',
      'Concentrato',
      'Concentrado',
      'Сосредоточен',
      '专注',
    ],
    petMoodSad: [
      'Sad',
      'Triste',
      'Triste',
      'Traurig',
      'Triste',
      'Triste',
      'Грустит',
      '难过',
    ],
    petMoodParty: [
      'Celebrating',
      'Festejando',
      'En fête',
      'Feiert',
      'Festa',
      'Festejando',
      'Празднует',
      '庆祝',
    ],
    petSlotHead: [
      'Head',
      'Cabeza',
      'Tête',
      'Kopf',
      'Testa',
      'Cabeça',
      'Голова',
      '头部',
    ],
    petSlotFace: [
      'Face',
      'Cara',
      'Visage',
      'Gesicht',
      'Viso',
      'Rosto',
      'Лицо',
      '脸部',
    ],
    petSlotNeck: [
      'Neck',
      'Cuello',
      'Cou',
      'Hals',
      'Collo',
      'Pescoço',
      'Шея',
      '颈部',
    ],
    petSlotBack: [
      'Back',
      'Espalda',
      'Dos',
      'Rücken',
      'Schiena',
      'Costas',
      'Спина',
      '背部',
    ],
    petSlotHand: [
      'Hand',
      'Mano',
      'Main',
      'Hand',
      'Mano',
      'Mão',
      'Рука',
      '手上',
    ],
    petBeanie: [
      'Wool hat',
      'Gorro de lana',
      'Bonnet',
      'Wollmütze',
      'Berretto',
      'Gorro de lã',
      'Шапка',
      '毛线帽',
    ],
    petCrown: [
      'Crown',
      'Corona',
      'Couronne',
      'Krone',
      'Corona',
      'Coroa',
      'Корона',
      '王冠',
    ],
    petMedal: [
      'Medals',
      'Medallas',
      'Médailles',
      'Medaillen',
      'Medaglie',
      'Medalhas',
      'Медали',
      '奖牌',
    ],
    petBackpack: [
      'Backpack',
      'Mochila',
      'Sac à dos',
      'Rucksack',
      'Zaino',
      'Mochila',
      'Рюкзак',
      '书包',
    ],
    petBook: [
      'Book',
      'Libro',
      'Livre',
      'Buch',
      'Libro',
      'Livro',
      'Книга',
      '书',
    ],
    petBamboo: [
      'Bamboo',
      'Bambú',
      'Bambou',
      'Bambus',
      'Bambù',
      'Bambu',
      'Бамбук',
      '竹子',
    ],
    petLantern: [
      'Lantern',
      'Farol',
      'Lanterne',
      'Laterne',
      'Lanterna',
      'Lanterna',
      'Фонарь',
      '灯笼',
    ],
    petBeanieReq: [
      '7-day streak',
      'Racha de 7 días',
      'Série de 7 jours',
      '7 Tage in Folge',
      '7 giorni di fila',
      'Sequência de 7 dias',
      '7 дней подряд',
      '连续 7 天',
    ],
    petCrownReq: [
      'Pass the B2 exam',
      'Aprobar el examen B2',
      'Réussir l’examen B2',
      'B2-Prüfung bestehen',
      'Superare l’esame B2',
      'Passar no exame B2',
      'Сдать экзамен B2',
      '通过 B2 考试',
    ],
    petMedalReq: [
      '1 level exam passed (one medal per exam)',
      '1 examen de nivel aprobado (una medalla por examen)',
      '1 examen de niveau réussi (une médaille par examen)',
      '1 bestandene Niveauprüfung (eine Medaille pro Prüfung)',
      '1 esame di livello superato (una medaglia per esame)',
      '1 exame de nível aprovado (uma medalha por exame)',
      '1 сданный экзамен уровня (медаль за каждый)',
      '通过 1 次级别考试（每次考试一枚奖牌）',
    ],
    petBackpackReq: [
      '20 lessons',
      '20 lecciones',
      '20 leçons',
      '20 Lektionen',
      '20 lezioni',
      '20 lições',
      '20 уроков',
      '20 节课',
    ],
    petBookReq: [
      '30 lessons',
      '30 lecciones',
      '30 leçons',
      '30 Lektionen',
      '30 lezioni',
      '30 lições',
      '30 уроков',
      '30 节课',
    ],
    petToolReq: [
      '10 readings or chapters',
      '10 lecturas o capítulos',
      '10 lectures ou chapitres',
      '10 Lesetexte oder Kapitel',
      '10 letture o capitoli',
      '10 leituras ou capítulos',
      '10 текстов или глав',
      '10 篇阅读或章节',
    ],
    petClose: ['Close', 'Cerrar', 'Fermer', 'Schließen', 'Chiudi', 'Fechar', 'Закрыть', '关闭'],
  };
  const LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh'];
  const lang = () => {
    if (window.TXI) return TXI.lang;
    let l = null;
    try {
      l = localStorage.getItem('selectedLanguage');
    } catch (e) {}
    return LANGS.includes(l) ? l : 'en';
  };
  const T = (k, v) => {
    let s = D[k][LANGS.indexOf(lang())];
    if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => v[x] ?? m);
    return s;
  };

  // puntos para llegar a cada etapa (1 cría … 4 sabio); el índice 0 no se usa
  const STAGES = [null, 0, 200, 600, 1500];
  const LEVELS = ['A1', 'A2', 'B1', 'B2'];
  const ANIMALS = ['dragon', 'panda'];
  const NAME = { dragon: 'petDragon', panda: 'petPanda' };
  const SLOTS = ['head', 'face', 'neck', 'back', 'hand'];
  const ACC = [
    { id: 'beanie', slot: 'head', name: 'petBeanie', req: 'petBeanieReq', ok: (s) => s.streak >= 7 },
    { id: 'phones', slot: 'head', name: 'petPhones', req: 'petPhonesReq', ok: (s) => s.exams >= 1 },
    { id: 'crown', slot: 'head', name: 'petCrown', req: 'petCrownReq', ok: (s) => s.examList.includes('B2') },
    { id: 'glasses', slot: 'face', name: 'petGlasses', req: 'petGlassesReq', ok: (s) => s.reads >= 5 },
    { id: 'scarf', slot: 'neck', name: 'petScarf', req: 'petScarfReq', ok: (s) => s.goalDays >= 3 },
    { id: 'medal', slot: 'neck', name: 'petMedal', req: 'petMedalReq', ok: (s) => s.exams >= 1 },
    { id: 'backpack', slot: 'back', name: 'petBackpack', req: 'petBackpackReq', ok: (s) => s.lessons >= 20 },
    { id: 'book', slot: 'hand', name: 'petBook', req: 'petBookReq', ok: (s) => s.lessons >= 30 },
    { id: 'tool', slot: 'hand', name: (a) => (a === 'panda' ? 'petBamboo' : 'petLantern'), req: 'petToolReq', ok: (s) => s.reads >= 10 },
  ];
  // en el modo prueba del curso todos los accesorios quedan libres
  for (const a of ACC) {
    const ok = a.ok;
    a.ok = (s) => s.test || ok(s);
  }
  const accName = (a) => T(typeof a.name === 'function' ? a.name(pet.animal) : a.name);

  const read = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k)) || {};
    } catch (e) {
      return {};
    }
  };
  let pet = read(KP);
  const savePet = () => {
    try {
      localStorage.setItem(KP, JSON.stringify(pet));
    } catch (e) {}
  };
  // las primeras mascotas eran zorro, búho y gato: quien eligió una vuelve a elegir
  if (pet.animal && !ANIMALS.includes(pet.animal)) {
    delete pet.animal;
    delete pet.asked;
  }
  if (pet.acc) {
    pet.wear = { [{ scarf: 'neck', glasses: 'face', phones: 'head' }[pet.acc]]: pet.acc };
    delete pet.acc;
  }
  pet.wear = pet.wear || {};

  const pad2 = (n) => String(n).padStart(2, '0');
  const dkey = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

  // todo sale de lo que ya guardan el curso y el lector, así cuenta también lo hecho antes de elegir la mascota
  const stats = () => {
    const S = read(KC),
      P = read(KR);
    const today = dkey(new Date());
    const lessons = Object.keys(S.done || {}).length;
    const examList = LEVELS.filter((l) => S.exams && S.exams[l] && S.exams[l].passed);
    const exams = examList.length;
    const secs = S.secs || {};
    const goal = (S.goal || 20) * 60;
    const goalDays = Object.values(secs).filter((s) => s >= goal).length;
    let reads = Object.keys(P.t || {}).length;
    for (const b of Object.values(P.b || {})) reads += Object.keys((b && b.c) || {}).length;
    const points = lessons * 10 + reads * 15 + exams * 50 + goalDays * 5;
    let stage = 1;
    while (stage < 4 && points >= STAGES[stage + 1]) stage++;
    // racha: días seguidos con la meta cumplida, hasta hoy o hasta ayer si hoy todavía no se cumplió
    let streak = 0;
    const d = new Date();
    if ((secs[today] || 0) < goal) d.setDate(d.getDate() - 1);
    while ((secs[dkey(d)] || 0) >= goal) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    const studied = Object.keys(secs)
      .filter((k) => secs[k] >= 60)
      .sort();
    const last = studied.length ? new Date(studied[studied.length - 1] + 'T12:00') : null;
    const away = last ? Math.round((Date.now() - last) / 864e5) : 0;
    const examToday = Object.values(S.exams || {}).some((e) => e && e.passed && e.at && dkey(new Date(e.at)) === today);
    const mood =
      examToday || pet.upDay === today
        ? 'party'
        : (secs[today] || 0) >= goal
          ? 'happy'
          : (secs[today] || 0) >= 60
            ? 'focused'
            : away >= 7
              ? 'sad'
              : away >= 3
                ? 'sleepy'
                : 'calm';
    const st = { points, stage, exams, examList, lessons, reads, goalDays, streak, mood, test: !!S.open };
    // modo prueba del curso: etapa, color y ánimo se eligen a mano para ver cómo queda cada dibujo
    if (S.open && pet.test) {
      Object.assign(st, pet.test);
      st.examList = LEVELS.slice(0, st.exams);
    }
    return st;
  };

  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const x = p(a),
      y = p(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const INK = '#1d1a17';
  const mirror = (svgPart) => svgPart + `<g transform="translate(100 0) scale(-1 1)">${svgPart}</g>`;

  // Dibujos en un lienzo de 100 × 100 con el piso en y = 92. Cada animal tiene la parte de atrás (alas, cola),
  // el cuerpo, la cabeza (centrada en headY) y los brazos; la etapa cambia formas, no solo el tamaño.
  const DRAW = {
    dragon: {
      headY: 44,
      headRy: 18,
      bodyTop: 58,
      eyes: [41, 59, 43],
      mouthY: 57,
      // escamas: verde → azul → rojo → violeta → dorado, una por examen de nivel aprobado
      colors: (n) => {
        const main = ['#5dbb63', '#4a90d9', '#e0533d', '#9361c9', '#e8b83a'][n];
        return {
          main,
          dark: mix(main, '#000000', 0.32),
          light: mix(main, '#ffffff', 0.5),
          wing: mix(main, '#ffffff', 0.3),
          skin: main,
          belly: '#f7e6b5',
          bellyLine: '#dcc07f',
          horn: '#f3e8cf',
          hornLine: '#c9b388',
          iris: n === 4 ? '#e0533d' : '#f4b43a',
        };
      },
      grad: (c) => [c.light, c.main, c.dark],
      back: (c, s) => {
        const wing =
          s === 1
            ? `<path d="M37 64 Q29 60 27 53 Q33 56 38 59 Z" fill="${c.wing}" stroke="${c.dark}" stroke-width=".8"/>`
            : s === 2
              ? `<path d="M38 64 C31 60 24 54 21 45 C25 48 28 48 30 47 C30 51 33 54 36 55 C36 58 37 61 38 64 Z" fill="${c.wing}" stroke="${c.dark}" stroke-width=".8"/>` +
                `<path d="M38 64 L21 45" stroke="${c.dark}" stroke-width=".9"/>`
              : `<path d="M40 64 C30 56 17 45 9 31 C14 35 18 35 21 33 C21 39 24 42 28 42 C28 48 32 51 36 52 C36 57 38 61 40 64 Z" fill="${c.wing}" stroke="${c.dark}" stroke-width=".8"/>` +
                `<path d="M40 64 L9 31 M40 64 L21 33 M40 64 L28 42" stroke="${c.dark}" stroke-width="1" opacity=".8"/>` +
                `<path d="M9 31 l-1.5 -3 l3 1.5 Z" fill="${c.horn}"/>`;
        const tail =
          s === 1
            ? `<path d="M60 84 C70 90 76 84 73 77" stroke="${c.main}" stroke-width="6.5" fill="none" stroke-linecap="round"/>` +
              `<circle cx="73" cy="77" r="3.2" fill="${c.dark}"/>`
            : s === 2
              ? `<path d="M60 84 C74 92 84 84 82 72" stroke="${c.main}" stroke-width="6.5" fill="none" stroke-linecap="round"/>` +
                `<path d="M82 73 L77.5 69 L82.5 62 L87 69 Z" fill="${c.dark}"/>`
              : `<path d="M60 84 C78 94 90 84 86 66" stroke="${c.main}" stroke-width="7.5" fill="none" stroke-linecap="round"/>` +
                `<path d="M86 67 L80.5 62 L86.5 54 L91.5 62 Z" fill="${c.dark}"/>` +
                `<path d="M75 89.6 l1.5 -4.5 l3 3.6 Z M83 85.5 l3 -3.8 l1.6 4.4 Z" fill="${c.dark}"/>`;
        return mirror(wing) + tail;
      },
      body: (c, s, id) =>
        `<ellipse cx="42" cy="89.5" rx="6.2" ry="3.6" fill="${c.main}" stroke="${c.dark}" stroke-width=".6"/>` +
        `<ellipse cx="58" cy="89.5" rx="6.2" ry="3.6" fill="${c.main}" stroke="${c.dark}" stroke-width=".6"/>` +
        (s >= 2
          ? `<g fill="${c.horn}"><circle cx="38.6" cy="91.6" r=".9"/><circle cx="41.6" cy="92.3" r=".9"/><circle cx="44.6" cy="91.6" r=".9"/>` +
            `<circle cx="55.4" cy="91.6" r=".9"/><circle cx="58.4" cy="92.3" r=".9"/><circle cx="61.4" cy="91.6" r=".9"/></g>`
          : '') +
        `<ellipse cx="50" cy="74" rx="17" ry="16" fill="url(#${id}b)"/>` +
        `<ellipse cx="50" cy="77" rx="10.5" ry="12" fill="${c.belly}"/>` +
        [69, 73.5, 78, 82.5]
          .map((y) => `<path d="M41.5 ${y} Q50 ${y + 2.2} 58.5 ${y}" stroke="${c.bellyLine}" stroke-width="1" fill="none"/>`)
          .join('') +
        `<g fill="${c.dark}" opacity=".4"><ellipse cx="36.5" cy="71" rx="2.4" ry="1.7"/><circle cx="63.5" cy="75" r="2"/><circle cx="38.6" cy="80" r="1.4"/><circle cx="62" cy="69" r="1.1"/></g>`,
      head: (c, s, id) =>
        mirror(
          (s === 1
            ? `<path d="M40 30 Q38 24 40 22 Q42 25 44 28 Z" fill="${c.horn}" stroke="${c.hornLine}" stroke-width=".6"/>`
            : s === 2
              ? `<path d="M38 32 Q34 22 30 18 Q36 22 43 29 Z" fill="${c.horn}" stroke="${c.hornLine}" stroke-width=".6"/>`
              : `<path d="M37 33 Q30 21 24 12 Q34 17 44 29 Z" fill="${c.horn}" stroke="${c.hornLine}" stroke-width=".6"/>` +
                `<path d="M34 25 l3.4 -1.8 M31 20.5 l3 -1.6" stroke="${c.hornLine}" stroke-width=".7"/>`) +
            `<path d="M30.5 40 L18 33 L22 41.5 L16.5 47 L30.5 48 Z" fill="${c.wing}" stroke="${c.dark}" stroke-width=".7"/>`,
        ) +
        (s >= 2
          ? `<path d="M41.5 28 L44 21 L46.5 28 Z M47.5 27 L50 18 L52.5 27 Z M53.5 28 L56 21 L58.5 28 Z" fill="${c.dark}"/>`
          : '') +
        `<ellipse cx="50" cy="44" rx="21" ry="18" fill="url(#${id}h)"/>` +
        `<g fill="${c.dark}" opacity=".35"><ellipse cx="35" cy="37" rx="2.4" ry="1.7"/><ellipse cx="64" cy="35" rx="1.8" ry="1.4"/><circle cx="66" cy="40" r="1.2"/><circle cx="38.5" cy="33" r="1"/></g>` +
        `<ellipse cx="50" cy="53" rx="11" ry="7" fill="${c.light}"/>` +
        `<ellipse cx="46.5" cy="50.6" rx="1.2" ry=".8" fill="${c.dark}"/><ellipse cx="53.5" cy="50.6" rx="1.2" ry=".8" fill="${c.dark}"/>` +
        (s === 1
          ? `<path d="M35 31 Q50 17 65 31 L62 28 L59 32 L55.5 27.5 L52 32 L48 27.5 L44.5 32 L41 28 L38 32 Z" fill="#fbf6ec" stroke="#d8ccb3" stroke-width=".7"/>` +
            `<ellipse cx="47" cy="24" rx="2" ry="1.3" fill="${c.wing}" opacity=".8"/>`
          : '') +
        (s === 4
          ? mirror(`<path d="M41 55 C33 56 27 61 21 58" stroke="${c.horn}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`) +
            `<path d="M45 59 Q50 73 55 59 Q50 62 45 59 Z" fill="${c.horn}" stroke="${c.hornLine}" stroke-width=".6"/>`
          : ''),
      brows: (c) =>
        mirror(`<path d="M35.5 37 Q41 33.5 46.5 36.5" stroke="${c.horn}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`),
      arm: (c, up) =>
        up
          ? `<ellipse cx="33" cy="60" rx="4" ry="8" transform="rotate(-35 33 60)" fill="${c.main}" stroke="${c.dark}" stroke-width=".6"/>`
          : `<ellipse cx="36" cy="71" rx="4" ry="7.5" transform="rotate(25 36 71)" fill="${c.main}" stroke="${c.dark}" stroke-width=".6"/>`,
      hand: (up) => (up ? [72, 52] : [67, 78]),
    },
    panda: {
      headY: 45,
      headRy: 19,
      bodyTop: 57,
      eyes: [40, 60, 46],
      mouthY: 58.5,
      // las manchas cambian con cada examen: negro → marrón (panda de Qinling) → azul pizarra → ciruela → dorado
      colors: (n) => {
        const patch = ['#2b2b31', '#6e4c37', '#435a7a', '#5e3d6e', '#c9962b'][n];
        return {
          patch,
          skin: patch,
          dark: mix(patch, '#000000', 0.25),
          patchLight: mix(patch, '#ffffff', 0.28),
          pad: mix(patch, '#f2b8a8', 0.55),
          iris: INK,
        };
      },
      grad: () => ['#ffffff', '#f7f5ef', '#d9d4ca'],
      back: () => '',
      body: (c, s, id) =>
        (s <= 2
          ? `<ellipse cx="50" cy="75" rx="18" ry="16" fill="url(#${id}b)"/>` +
            mirror(
              `<ellipse cx="39" cy="86" rx="8" ry="6" fill="${c.patch}"/><ellipse cx="39" cy="87.4" rx="3.8" ry="2.8" fill="${c.pad}"/>` +
                `<g fill="${c.pad}"><circle cx="35.6" cy="84.6" r="1"/><circle cx="38.4" cy="83.4" r="1"/><circle cx="41.4" cy="83.6" r="1"/></g>`,
            )
          : mirror(`<ellipse cx="41" cy="88.5" rx="7.5" ry="4.5" fill="${c.patch}"/>`) +
            `<ellipse cx="50" cy="73" rx="18" ry="17" fill="url(#${id}b)"/>`) +
        `<ellipse cx="50" cy="78" rx="11" ry="10" fill="#ffffff" opacity=".7"/>` +
        (s >= 2 ? `<path d="M32.5 67 Q50 57 67.5 67 L66 73 Q50 64 34 73 Z" fill="${c.patch}"/>` : ''),
      head: (c, s, id) =>
        mirror(`<circle cx="33" cy="29" r="7.5" fill="${c.patch}"/><circle cx="33.5" cy="29.5" r="3.8" fill="${c.patchLight}"/>`) +
        `<ellipse cx="50" cy="45" rx="23" ry="19" fill="url(#${id}h)"/>` +
        (s === 1 ? `<path d="M47 27.5 Q47.5 21 52.5 22 Q49 23.5 50 27 Z" fill="${c.patch}"/>` : '') +
        `<ellipse cx="40" cy="45" rx="6.5" ry="8.5" transform="rotate(32 40 45)" fill="${c.patch}"/>` +
        `<ellipse cx="60" cy="45" rx="6.5" ry="8.5" transform="rotate(-32 60 45)" fill="${c.patch}"/>` +
        `<ellipse cx="50" cy="55.5" rx="8.5" ry="6" fill="#ffffff"/>` +
        `<path d="M46.5 52 Q50 50.5 53.5 52 Q52 55.5 50 55.5 Q48 55.5 46.5 52 Z" fill="${INK}"/>` +
        `<ellipse cx="49" cy="52.2" rx="1.2" ry=".5" fill="#ffffff" opacity=".6"/>` +
        (s === 4
          ? `<path d="M42 61 Q50 79 58 61 Q50 66 42 61 Z" fill="#ffffff" stroke="#cfc8bb" stroke-width=".8"/>` +
            `<path d="M47 66 q3 4 6 0" stroke="#cfc8bb" stroke-width=".6" fill="none"/>`
          : ''),
      brows: () =>
        mirror(`<path d="M31 34.5 Q38 29.5 45 34" stroke="#bdb6aa" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
          `<path d="M31 34.5 q-2 2 -2.5 5" stroke="#bdb6aa" stroke-width="2" fill="none" stroke-linecap="round"/>`),
      arm: (c, up) =>
        up
          ? `<ellipse cx="32" cy="58" rx="5.5" ry="9.5" transform="rotate(-38 32 58)" fill="${c.patch}"/>`
          : `<ellipse cx="35" cy="71" rx="6" ry="9.5" transform="rotate(22 35 71)" fill="${c.patch}"/>`,
      hand: (up) => (up ? [73, 50] : [68, 79]),
    },
  };

  // cara según el ánimo; en el panda los ojos van sobre la mancha, así que las líneas son claras
  const face = (an, A, c, mood) => {
    const [x1, x2, y] = A.eyes,
      my = A.mouthY;
    const line = an === 'panda' ? '#ffffff' : INK;
    const open = (x, look = 0) =>
      an === 'dragon'
        ? `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="5.2" fill="#ffffff"/><circle cx="${x}" cy="${y + 0.6 + look}" r="3.5" fill="${c.iris}"/>` +
          `<ellipse cx="${x}" cy="${y + 0.6 + look}" rx="1.2" ry="2.8" fill="${INK}"/><circle cx="${x + 1.4}" cy="${y - 1.5}" r="1.2" fill="#ffffff"/>`
        : `<circle cx="${x}" cy="${y}" r="3.4" fill="#ffffff"/><circle cx="${x}" cy="${y + 0.5 + look}" r="2.4" fill="${INK}"/>` +
          `<circle cx="${x + 0.9}" cy="${y - 0.6}" r=".9" fill="#ffffff"/>`;
    const arc = (x, d) => `<path d="M${x - 4} ${y + 1} q4 ${d} 8 0" stroke="${line}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    const lid = (x) => `<path d="M${x - 5.2} ${y - 0.8} Q${x} ${y - 7} ${x + 5.2} ${y - 0.8} Z" fill="${c.skin}"/>`;
    const brow = (d) => `stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round" d="${d}"`;
    const by = an === 'panda' ? y - 10.5 : y - 7.5;
    const blush = (o) =>
      `<ellipse cx="${x1 - 5}" cy="${y + 8.5}" rx="3.2" ry="1.9" fill="#f08a9b" opacity="${o}"/>` +
      `<ellipse cx="${x2 + 5}" cy="${y + 8.5}" rx="3.2" ry="1.9" fill="#f08a9b" opacity="${o}"/>`;
    const smile = `<path d="M46.5 ${my} q3.5 3 7 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    const grin = `<path d="M45 ${my - 1} q5 8 10 0 Z" fill="#7a2e2e"/><path d="M47.6 ${my + 2.4} q2.4 2 4.8 0" fill="#f28b9b"/>`;
    switch (mood) {
      case 'happy':
      case 'party':
        return arc(x1, -6) + arc(x2, -6) + grin + blush(0.7);
      case 'sleepy':
        return arc(x1, 3) + arc(x2, 3) + `<ellipse cx="50" cy="${my + 0.6}" rx="1.6" ry="2" fill="#7a2e2e"/>` + blush(0.3);
      case 'focused':
        return (
          open(x1) +
          open(x2) +
          lid(x1) +
          lid(x2) +
          `<path ${brow(`M${x1 - 5} ${by} L${x1 + 4} ${by + 2.2}`)}/><path ${brow(`M${x2 + 5} ${by} L${x2 - 4} ${by + 2.2}`)}/>` +
          `<path d="M47 ${my + 0.6} h6" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>` +
          blush(0.25)
        );
      case 'sad':
        return (
          open(x1, 1.2) +
          open(x2, 1.2) +
          `<path ${brow(`M${x1 - 4} ${by + 1.5} L${x1 + 4} ${by - 0.8}`)}/><path ${brow(`M${x2 + 4} ${by + 1.5} L${x2 - 4} ${by - 0.8}`)}/>` +
          `<path d="M${x1 - 3} ${y + 5} q-2.2 3.6 0 5.2 q2.2 -1.6 0 -5.2 Z" fill="#7cc3f0"/>` +
          `<path d="M46 ${my + 2.2} q4 -4 8 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
        );
      default:
        return open(x1) + open(x2) + smile + blush(0.35);
    }
  };

  const ACC_DRAW = {
    beanie: () =>
      `<path d="M28.5 35 Q29 15 50 14 Q71 15 71.5 35 Z" fill="#d9534f"/>` +
      `<path d="M38 21 l1.6 1.6 l1.6 -1.6 M47 18 l1.6 1.6 l1.6 -1.6 M57 20 l1.6 1.6 l1.6 -1.6 M43 27 l1.6 1.6 l1.6 -1.6 M53 26 l1.6 1.6 l1.6 -1.6" stroke="#ef8a84" stroke-width=".8" fill="none"/>` +
      `<path d="M27 30 Q50 26 73 30 L73 37 Q50 33 27 37 Z" fill="#b8403c"/>` +
      [31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71].map((x) => `<path d="M${x} 29.6 v6.4" stroke="#963330" stroke-width=".8"/>`).join('') +
      `<circle cx="50" cy="12.5" r="5.2" fill="#f4efe6"/><circle cx="46.5" cy="11" r="2.2" fill="#ffffff"/><circle cx="53" cy="14.5" r="2" fill="#e6dfd2"/>`,
    phones: () =>
      `<path d="M26 45 Q27 14 50 14 Q73 14 74 45" stroke="#2b2f38" stroke-width="3.4" fill="none"/>` +
      `<path d="M27.5 43 Q28.5 16 50 16" stroke="#596273" stroke-width="1" fill="none"/>` +
      mirror(
        `<rect x="20.5" y="38" width="9" height="15" rx="3.5" fill="#2e55c7"/><rect x="27" y="39.5" width="3.5" height="12" rx="1.6" fill="#1d2f73"/>` +
          `<rect x="22" y="40" width="2" height="8" rx="1" fill="#8fa9f0" opacity=".7"/>`,
      ) +
      `<path d="M24 53 C22 60 26 64 32 66" stroke="#2b2f38" stroke-width="1" fill="none"/>`,
    crown: () =>
      `<path d="M37 27 L38.5 15 L44 21.5 L50 12 L56 21.5 L61.5 15 L63 27 Z" fill="#f2c33d" stroke="#b8871f" stroke-width=".8"/>` +
      `<path d="M37 23.5 h26 v3.5 h-26 Z" fill="#e0aa2a"/>` +
      `<circle cx="43" cy="25.2" r="1.3" fill="#d9364f"/><circle cx="50" cy="25.2" r="1.5" fill="#2e7bd9"/><circle cx="57" cy="25.2" r="1.3" fill="#2fa36b"/>` +
      `<g fill="#fff3c4"><circle cx="38.5" cy="15" r="1.4"/><circle cx="50" cy="12" r="1.5"/><circle cx="61.5" cy="15" r="1.4"/></g>` +
      `<path d="M40 19 l1 3" stroke="#fff3c4" stroke-width=".8" opacity=".8"/>`,
    cap: () =>
      `<path d="M37 25 L37 32 Q50 37 63 32 L63 25 Z" fill="#2a2e36"/>` +
      `<path d="M27 24 L50 15 L73 24 L50 33 Z" fill="#1f2228"/><path d="M27 24 L50 33 L73 24" stroke="#3a3f4a" stroke-width=".6" fill="none"/>` +
      `<circle cx="50" cy="24" r="1.4" fill="#e3b341"/>` +
      `<path d="M50 24 L67 27.5 L67 35" stroke="#e3b341" stroke-width="1.3" fill="none"/>` +
      `<path d="M65.5 35 h3 l-.4 4.5 h-2.2 Z" fill="#e3b341"/>`,
    party: () =>
      `<path d="M41 28 L50 6 L59 28 Z" fill="#9361c9"/>` +
      `<path d="M44.5 19.5 L55.5 19.5 M42.6 24 L57.4 24 M46.6 14.5 L53.4 14.5" stroke="#f2c33d" stroke-width="1.6"/>` +
      `<circle cx="50" cy="6" r="2.6" fill="#f08a9b"/>`,
    glasses: (A) => {
      const [x1, x2, y] = A.eyes;
      return (
        [x1, x2]
          .map(
            (x) =>
              `<circle cx="${x}" cy="${y}" r="6.3" fill="#bfe3ff" fill-opacity=".22" stroke="#3a2c22" stroke-width="1.5"/>` +
              `<path d="M${x - 3.4} ${y - 2} q1.5 -2.2 3.6 -2.6" stroke="#ffffff" stroke-width="1" opacity=".85" fill="none"/>`,
          )
          .join('') +
        `<path d="M${x1 + 6.3} ${y - 0.5} Q50 ${y - 3} ${x2 - 6.3} ${y - 0.5}" stroke="#3a2c22" stroke-width="1.4" fill="none"/>` +
        `<path d="M${x1 - 6.3} ${y - 1} L${x1 - 11} ${y - 3} M${x2 + 6.3} ${y - 1} L${x2 + 11} ${y - 3}" stroke="#3a2c22" stroke-width="1.3"/>`
      );
    },
    scarf: () =>
      `<path d="M32 58 Q50 65 68 58 L68.5 64.5 Q50 71.5 31.5 64.5 Z" fill="#c8423b"/>` +
      `<path d="M32.2 60.6 Q50 67.6 67.8 60.6 M32 62.8 Q50 69.8 68.2 62.8" stroke="#f1e4d0" stroke-width=".9" fill="none"/>` +
      `<path d="M55 64 L61 64.5 L60 80 L54.5 79 Z" fill="#b23a34"/>` +
      `<path d="M54.8 70 L60.6 70.6 M54.7 74.5 L60.4 75" stroke="#f1e4d0" stroke-width="1.1"/>` +
      `<path d="M55 79.4 v2.8 M56.6 79.6 v2.8 M58.2 79.8 v2.8 M59.7 80 v2.6" stroke="#c8423b" stroke-width="1"/>`,
    medal: (A, st) => {
      const n = Math.max(1, st.examList.length);
      const color = { A1: '#cd7f32', A2: '#c0c6cf', B1: '#e3b341', B2: '#7fd1e8' };
      return (st.examList.length ? st.examList : ['A1'])
        .map((lv, i) => {
          const x = 50 + (i - (n - 1) / 2) * 7;
          return (
            `<path d="M${x - 3.2} 58.5 L${x - 0.6} 69 L${x + 0.6} 69 L${x + 3.2} 58.5 Z" fill="${i % 2 ? '#c8423b' : '#2e55c7'}"/>` +
            `<path d="M${x} 58.5 L${x} 68.5" stroke="#ffffff" stroke-width=".8" opacity=".7"/>` +
            `<circle cx="${x}" cy="72" r="3.8" fill="${color[lv]}" stroke="${mix(color[lv], '#000000', 0.3)}" stroke-width=".8"/>` +
            `<path d="M${x} 69.6 l.75 1.55 1.7 .25 -1.25 1.2 .3 1.7 -1.5 -.8 -1.5 .8 .3 -1.7 -1.25 -1.2 1.7 -.25 Z" fill="#ffffff" opacity=".85"/>`
          );
        })
        .join('');
    },
    backpackBag: () =>
      `<rect x="28.5" y="60" width="43" height="27" rx="8" fill="#e8833a" stroke="#b9612a" stroke-width=".8"/>` +
      `<rect x="25.5" y="70" width="5" height="12" rx="2" fill="#d4702b"/><rect x="69.5" y="70" width="5" height="12" rx="2" fill="#d4702b"/>`,
    backpack: () =>
      mirror(
        `<path d="M38.5 60 Q36 70 38 82" stroke="#b9612a" stroke-width="2.8" fill="none"/>` +
          `<rect x="35.6" y="70" width="4.4" height="3" rx=".8" fill="#e3b341"/>`,
      ),
    book: ([x, y]) =>
      `<g transform="translate(${x} ${y}) rotate(-12)"><rect x="-5" y="-7" width="10" height="13" rx="1.2" fill="#2e55c7"/>` +
      `<rect x="-4" y="-6" width="1.3" height="11" fill="#1d3a8f"/><rect x="4.2" y="-6.4" width="1.3" height="11.8" fill="#f6f1e6"/>` +
      `<path d="M-1.5 -3.5 h4 M-1.5 -1.5 h3" stroke="#e3b341" stroke-width=".8"/></g>`,
    pencil: ([x, y]) =>
      `<g transform="translate(${x} ${y}) rotate(30)"><rect x="-1.4" y="-9" width="2.8" height="13" fill="#f2c33d"/>` +
      `<rect x="-1.4" y="-10.6" width="2.8" height="1.8" fill="#e98a9b"/><path d="M-1.4 4 L0 7.5 L1.4 4 Z" fill="#f1d9b5"/>` +
      `<path d="M-.5 6.2 L0 7.5 L.5 6.2 Z" fill="#333333"/></g>`,
    bamboo: ([x, y]) =>
      `<g transform="translate(${x} ${y}) rotate(8)"><rect x="-1.8" y="-24" width="3.6" height="30" rx="1.6" fill="#7cbf5a"/>` +
      `<path d="M-1.8 -15 h3.6 M-1.8 -5 h3.6" stroke="#4f8f39" stroke-width="1"/>` +
      `<path d="M1.5 -20 q7 -4 10 -1 q-6 3 -10 1 Z" fill="#5fae47"/><path d="M-1.5 -12 q-7 -3 -9 1 q6 1 9 -1 Z" fill="#4f9c3d"/>` +
      `<path d="M1.5 -9 q6 -1 8 2 q-5 1 -8 -2 Z" fill="#69b852"/></g>`,
    lantern: ([x, y]) =>
      `<g transform="translate(${x} ${y})"><path d="M0 0 v3" stroke="#3a2c22" stroke-width=".9"/>` +
      `<circle cx="0" cy="10" r="8.5" fill="#ffd36b" opacity=".25"/><path d="M-3.5 3 h7 l-1 2 h-5 Z" fill="#3a2c22"/>` +
      `<rect x="-3.6" y="5" width="7.2" height="10" rx="2.4" fill="#ffd36b" stroke="#b8871f" stroke-width=".8"/>` +
      `<path d="M-1.2 6 v8 M1.2 6 v8" stroke="#e8a33a" stroke-width=".6"/><path d="M-3 15 h6 l-1 2 h-4 Z" fill="#3a2c22"/>` +
      `<path d="M0 8 q1.6 2.5 0 5 q-1.6 -2.5 0 -5 Z" fill="#ff8a2a"/></g>`,
  };

  // efectos del ánimo que acompañan a la cabeza (llama, humo, burbuja)
  const moodHead = (an, mood) => {
    if (an === 'dragon' && (mood === 'happy' || mood === 'party'))
      return (
        `<path d="M62 56 C66 51 72 51 77 47.5 C75 52.5 79 55 76 59 C72 62 65 61 62 56 Z" fill="#ff8a2a"/>` +
        `<path d="M64.5 56 C67 54 70 54 73 52.5 C72 55.5 73 57 71 58 C68.5 59 66 58 64.5 56 Z" fill="#ffd23f"/>`
      );
    if (an === 'dragon' && mood === 'sleepy')
      return `<g fill="#b9bec8" opacity=".75"><circle cx="40" cy="52.5" r="1.6"/><circle cx="35.5" cy="50.5" r="2.2"/><circle cx="29.5" cy="48" r="2.8"/></g>`;
    if (an === 'panda' && mood === 'sleepy')
      return `<circle cx="56" cy="55" r="3.6" fill="#cfe8fb" opacity=".8" stroke="#9cc8ea" stroke-width=".5"/><circle cx="55" cy="54" r=".9" fill="#ffffff"/>`;
    return '';
  };
  const moodAround = (mood, hy) => {
    if (mood === 'sleepy' || mood === 'sad')
      return mood === 'sleepy'
        ? `<text x="74" y="${hy - 14}" font-size="9" font-family="var(--mono)" fill="${INK}" opacity=".5">z</text>` +
            `<text x="80" y="${hy - 22}" font-size="12" font-family="var(--mono)" fill="${INK}" opacity=".5">Z</text>`
        : '';
    const star = (x, y, r, f) =>
      `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z" fill="${f}"/>`;
    if (mood === 'happy') return star(82, hy - 16, 4, '#e3b341') + star(17, hy - 8, 2.6, '#f2c33d');
    if (mood === 'party')
      return [
        [18, 20, '#e0533d', 20],
        [28, 9, '#2e55c7', -30],
        [77, 12, '#e3b341', 40],
        [87, 28, '#5dbb63', -15],
        [12, 40, '#9361c9', 35],
        [88, 46, '#e98a9b', 10],
        [14, 62, '#4a90d9', -40],
        [86, 64, '#e0533d', 25],
      ]
        .map(([x, y, f, r]) => `<rect x="${x}" y="${y}" width="3.4" height="1.8" rx=".4" fill="${f}" transform="rotate(${r} ${x} ${y})"/>`)
        .join('') + star(80, 22, 3, '#f2c33d');
    return '';
  };

  const unknown = () =>
    `<circle cx="50" cy="56" r="30" fill="var(--blue-soft)"/>` +
    `<text x="50" y="68" text-anchor="middle" font-size="34" font-weight="600" font-family="var(--sans)" fill="var(--blue)">?</text>`;

  // [tamaño total, cuerpo, cabeza] por etapa: las crías tienen la cabeza más grande
  const SIZE = [null, [0.74, 0.85, 1.12], [0.86, 0.92, 1], [1, 1, 0.95], [1, 1, 0.95]];
  let uid = 0;
  const svg = (st, { animal, mood = 'calm', wear = {}, crop = false, peek = false } = {}) => {
    // crop: sin el aire de los bordes, para que se vea más grande en la insignia y el panel
    let view = crop ? '4 4 92 92' : '0 0 100 100';
    const box = (inner) => `<svg viewBox="${view}" aria-hidden="true" focusable="false">${inner}</svg>`;
    if (!animal) return box(unknown());
    const id = 'pet' + ++uid; // los degradados necesitan ids únicos: hay varias mascotas en la página
    const A = DRAW[animal],
      c = A.colors(st.exams),
      s = st.stage;
    const [k, b, h] = SIZE[s];
    const top = 92 - (92 - A.bodyTop) * b;
    const dy = top + 6 - (A.headY + A.headRy * h);
    const headT = `translate(0 ${dy}) translate(50 ${A.headY}) scale(${h}) translate(-50 ${-A.headY})`;
    const bodyT = `translate(50 92) scale(${b}) translate(-50 -92)`;
    const up = mood === 'party';
    const headAcc = wear.head || (s === 4 ? 'cap' : up ? 'party' : '');
    const hand = wear.hand === 'tool' ? (animal === 'panda' ? 'bamboo' : 'lantern') : wear.hand || (mood === 'focused' ? 'pencil' : '');
    const g = A.grad(c);
    const grad = (n) =>
      `<radialGradient id="${id}${n}" cx="40%" cy="32%" r="78%"><stop offset="0" stop-color="${g[0]}"/>` +
      `<stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></radialGradient>`;
    const handAt = A.hand(up);
    const inner =
      `<defs>${grad('b')}${grad('h')}</defs>` +
      `<ellipse cx="50" cy="92.5" rx="${21 * b}" ry="3" fill="${INK}" opacity=".12"/>` +
      `<g transform="${bodyT}">${A.back(c, s)}${wear.back ? ACC_DRAW.backpackBag() : ''}${A.body(c, s, id)}</g>` +
      `<g transform="${headT}">${A.head(c, s, id)}${face(animal, A, c, mood)}${s === 4 ? A.brows(c) : ''}` +
      `${wear.face ? ACC_DRAW[wear.face](A, st) : ''}${headAcc ? ACC_DRAW[headAcc](A, st) : ''}${moodHead(animal, mood)}</g>` +
      `<g transform="${bodyT}">${wear.neck ? ACC_DRAW[wear.neck](A, st) : ''}${wear.back ? ACC_DRAW.backpack() : ''}` +
      `${hand && hand !== 'lantern' ? ACC_DRAW[hand](handAt) : ''}${mirror(A.arm(c, up))}` +
      `${hand === 'lantern' ? ACC_DRAW.lantern(handAt) : ''}</g>` +
      moodAround(mood, A.headY + dy);
    let paws = '';
    // asomada: solo la cabeza, con las patas apoyadas en el borde de abajo (la línea del título)
    if (peek) {
      const hy = 92 - (92 - (A.headY + dy)) * k,
        r = A.headRy * h * k;
      const y0 = hy - r - 15 * k,
        y1 = hy + r * 0.92;
      view = `16 ${y0} 68 ${y1 - y0}`;
      paws = [39, 61]
        .map(
          (x) =>
            `<ellipse cx="${x}" cy="${y1 - 2.6}" rx="7" ry="4.4" fill="${c.skin}" stroke="${mix(c.skin, '#000000', 0.3)}" stroke-width=".7"/>` +
            `<path d="M${x - 2.4} ${y1 - 4.4} v2.6 M${x} ${y1 - 4.8} v2.8 M${x + 2.4} ${y1 - 4.4} v2.6" stroke="${mix(c.skin, '#000000', 0.35)}" stroke-width=".7" stroke-linecap="round"/>`,
        )
        .join('');
    }
    return box(`<g transform="translate(50 92) scale(${k}) translate(-50 -92)">${inner}</g>${paws}`);
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let st = stats();
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'pet-badge';
  const panel = document.createElement('div');
  panel.className = 'pet-panel';
  panel.hidden = true;
  const peek = document.createElement('button');
  peek.type = 'button';
  peek.className = 'pet-peek';
  peek.hidden = true;
  const toast = document.createElement('div');
  toast.className = 'pet-toast';
  toast.hidden = true;

  const progressOf = () => {
    const nx = STAGES[st.stage + 1];
    return nx == null ? 1 : Math.min(1, Math.max(0, (st.points - STAGES[st.stage]) / (nx - STAGES[st.stage])));
  };
  // lo que lleva puesto, sin lo que dejó de estar permitido (por ejemplo al salir del modo prueba)
  const wearOn = () => {
    const w = {};
    for (const a of ACC) if (pet.wear[a.slot] === a.id && a.ok(st)) w[a.slot] = a.id;
    return w;
  };
  const drawBadge = () => {
    badge.innerHTML = svg(st, { animal: pet.animal, mood: st.mood, wear: wearOn(), crop: true });
    badge.setAttribute('aria-label', T('petOpen'));
    peek.innerHTML = pet.animal ? svg(st, { animal: pet.animal, mood: st.mood, wear: wearOn(), peek: true }) : '';
    peek.setAttribute('aria-label', T('petOpen'));
    place();
  };

  const drawPanel = () => {
    const close = `<button type="button" class="pet-x" data-pet="close" aria-label="${esc(T('petClose'))}">✕</button>`;
    if (!pet.animal || pet.choosing) {
      panel.innerHTML =
        close +
        `<span class="kicker blue">Trilex</span><h3>${esc(T('petChoose'))}</h3>` +
        `<p class="pet-lede">${esc(T('petChooseLede'))}</p>` +
        `<div class="pet-pick">${ANIMALS.map(
          (a) =>
            `<button type="button" data-pet-animal="${a}" class="${pet.animal === a ? 'on' : ''}">` +
            svg({ stage: 3, exams: 0, examList: [] }, { animal: a, mood: 'happy' }) +
            `<span>${esc(T(NAME[a]))}</span></button>`,
        ).join('')}</div>`;
      return;
    }
    const nx = STAGES[st.stage + 1];
    const w = wearOn();
    const SLOT = { head: 'petSlotHead', face: 'petSlotFace', neck: 'petSlotNeck', back: 'petSlotBack', hand: 'petSlotHand' };
    const accHtml =
      SLOTS.map(
        (sl) =>
          `<div class="pet-slot"><span class="pet-slot-l">${esc(T(SLOT[sl]))}</span><div class="pet-acc">` +
          [{ id: '', name: 'petNone', ok: () => true }, ...ACC.filter((a) => a.slot === sl)]
            .map((a) => {
              const ok = a.ok(st),
                on = (w[sl] || '') === a.id;
              return (
                `<button type="button" data-pet-slot="${sl}" data-pet-acc="${a.id}" class="${on ? 'on' : ''}" ${ok ? '' : 'disabled'}` +
                ` title="${a.req ? esc(T(a.req)) : ''}">${ok ? '' : '🔒 '}${esc(accName(a))}</button>`
              );
            })
            .join('') +
          `</div></div>`,
      ).join('') +
      `<p class="pet-small">${ACC.filter((a) => !a.ok(st))
        .map((a) => `🔒 ${esc(accName(a))}: ${esc(T(a.req))}`)
        .join('<br>')}</p>`;
    panel.innerHTML =
      close +
      `<div class="pet-head"><div class="pet-big">${svg(st, {
        animal: pet.animal,
        mood: st.mood,
        wear: w,
        crop: true,
      })}</div><div>` +
      `<span class="kicker blue">${esc(T(NAME[pet.animal]))} · ${esc(T('petSt' + st.stage))}</span>` +
      `<h3>${esc(T('petPoints', { n: st.points }))}</h3>` +
      `<div class="pet-bar"><span style="width:${Math.round(progressOf() * 100)}%"></span></div>` +
      (st.test && pet.test
        ? ''
        : `<p class="pet-small">${esc(nx == null ? T('petMax') : T('petNext', { n: nx - st.points, s: T('petSt' + (st.stage + 1)) }))}</p>`) +
      `</div></div>` +
      `<p class="pet-mood">${esc(T(MOOD_TEXT[st.mood]))}</p>` +
      `<p class="pet-small">${esc(T('petHow'))}</p>` +
      `<p class="pet-small">${esc(T('petColor', { n: st.exams }))}</p>` +
      `<span class="kicker">${esc(T('petAcc'))}</span>` +
      accHtml +
      (st.test ? testHtml() : '') +
      `<button type="button" class="pet-change" data-pet="change">${esc(T('petChange'))}</button>`;
  };

  const MOOD_TEXT = {
    calm: 'petCalm',
    happy: 'petHappy',
    sleepy: 'petSleepy',
    focused: 'petFocused',
    sad: 'petSad',
    party: 'petParty',
  };
  const testHtml = () => {
    const row = (key, values) =>
      `<div class="pet-acc">` +
      values
        .map(([v, name]) => `<button type="button" data-pet-test="${key}" data-v="${v}" class="${st[key] === v ? 'on' : ''}">${esc(name)}</button>`)
        .join('') +
      `</div>`;
    return (
      `<div class="pet-test"><span class="kicker rust">${esc(T('petTest'))}</span>` +
      row('stage', [1, 2, 3, 4].map((n) => [n, T('petSt' + n)])) +
      row('exams', [[0, T('petBase')], [1, 'A1'], [2, 'A2'], [3, 'B1'], [4, 'B2']]) +
      row('mood', [
        ['calm', T('petMoodCalm')],
        ['happy', T('petMoodHappy')],
        ['focused', T('petMoodFocused')],
        ['sleepy', T('petMoodSleepy')],
        ['sad', T('petMoodSad')],
        ['party', T('petMoodParty')],
      ]) +
      `</div>`
    );
  };

  // el panel se abre debajo de la mascota asomada, o abajo a la izquierda si se tocó la insignia
  const open = (v, from) => {
    panel.hidden = !v;
    panel.style.cssText = '';
    if (v && from === peek) {
      const r = peek.getBoundingClientRect(),
        w = Math.min(340, innerWidth - 32);
      panel.style.top = Math.max(8, r.bottom + 8) + 'px';
      panel.style.bottom = 'auto';
      panel.style.left = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 16)) + 'px';
    }
    badge.setAttribute('aria-expanded', String(v));
    if (v) {
      st = stats();
      drawPanel();
    } else if (pet.choosing) {
      delete pet.choosing;
      savePet();
    }
  };

  // la etapa ya vista se guarda: si sube mientras no se miraba, se festeja una sola vez
  const refresh = () => {
    const prev = JSON.stringify(st);
    st = stats();
    if (JSON.stringify(st) !== prev) {
      drawBadge();
      if (!panel.hidden) drawPanel();
    }
    // en modo prueba la etapa es la elegida a mano: no se festeja ni se marca como vista
    if (pet.animal && !st.test && st.stage > (pet.seen || 1)) {
      pet.seen = st.stage;
      pet.upDay = dkey(new Date()); // ese día queda festejando
      savePet();
      for (const el of [badge, peek]) {
        el.classList.remove('pet-up');
        void el.offsetWidth;
        el.classList.add('pet-up');
      }
      toast.textContent = T('petUp');
      toast.hidden = false;
      setTimeout(() => (toast.hidden = true), 4000);
    }
  };

  badge.addEventListener('click', () => open(panel.hidden, badge));
  peek.addEventListener('click', () => open(panel.hidden, peek));

  // Se asoma sobre el título de la página, al final del texto; si no entra a la derecha, se asoma encima.
  // Cuando el título sale de la pantalla, aparece la insignia de la esquina.
  let title = null;
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => badge.classList.toggle('pet-away', !!pet.animal && e.isIntersecting))
      : null;
  function place() {
    const h = [...document.querySelectorAll('h1')].find((x) => !x.closest('#tx-print') && x.offsetParent !== null) || null;
    if (h !== title) {
      if (io && title) io.unobserve(title);
      title = h;
      if (io && h) io.observe(h);
    }
    if (!h || !pet.animal || !peek.isConnected) {
      peek.hidden = true;
      badge.classList.remove('pet-away');
      return;
    }
    peek.hidden = false;
    const range = document.createRange();
    range.selectNodeContents(h);
    const lines = range.getClientRects();
    const last = lines[lines.length - 1] || h.getBoundingClientRect();
    const w = peek.offsetWidth,
      ph = peek.offsetHeight;
    // las patas quedan sobre la línea base del texto (el rectángulo incluye el espacio de las letras con cola)
    let left = last.right + 10,
      top = last.bottom - last.height * 0.18 - ph + 3;
    if (left + w > document.documentElement.clientWidth - 8) {
      left = last.right - w;
      top = last.top - ph + 8;
    }
    peek.style.left = left + scrollX + 'px';
    peek.style.top = top + scrollY + 'px';
  }
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      place();
    });
  };
  // el curso y el lector cambian de vista sin recargar, y las traducciones reemplazan el texto del título
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pet === 'close') return open(false);
    if (b.dataset.pet === 'change') {
      pet.choosing = true;
      return drawPanel();
    }
    if (b.dataset.petAnimal) {
      const first = !pet.animal;
      pet.animal = b.dataset.petAnimal;
      delete pet.choosing;
      // al elegir la primera vez no se festeja lo que ya se había avanzado
      if (first) pet.seen = st.stage;
      savePet();
      drawBadge();
      return drawPanel();
    }
    if (b.dataset.petTest) {
      const k = b.dataset.petTest;
      pet.test = { ...pet.test, [k]: k === 'mood' ? b.dataset.v : Number(b.dataset.v) };
      savePet();
      st = stats();
      drawBadge();
      return drawPanel();
    }
    if (b.dataset.petSlot) {
      pet.wear[b.dataset.petSlot] = b.dataset.petAcc;
      savePet();
      drawBadge();
      drawPanel();
    }
  });
  // composedPath y no contains: al tocar un botón del panel, el panel se redibuja y el botón ya no está en él
  document.addEventListener('click', (e) => {
    const path = e.composedPath();
    if (!panel.hidden && !path.includes(panel) && !path.includes(badge) && !path.includes(peek)) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) open(false);
  });
  const relabel = () => {
    drawBadge();
    if (!panel.hidden) drawPanel();
  };
  window.addEventListener('tx-lang', relabel);
  // en las portadas el idioma lo cambia portadas.js: se redibuja después de que lo guarde
  document.addEventListener('change', (e) => {
    if (e.target.id === 'languageSelect') setTimeout(relabel);
    if (e.target.id === 'tx-open') setTimeout(refresh); // casilla «modo prueba» del curso
  });
  // el curso y el lector guardan su progreso por su cuenta: se relee cada tanto y al volver a la pestaña
  window.addEventListener('storage', refresh);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  setInterval(refresh, 4000);

  const mount = () => {
    document.body.append(peek, badge, panel, toast);
    drawBadge();
    refresh();
    // la primera vez se abre solo para elegir el animal (una sola vez, aunque se cierre sin elegir)
    if (!pet.animal && !pet.asked) {
      pet.asked = true;
      savePet();
      open(true);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.TrilexPet = { svg, stats };
})();
