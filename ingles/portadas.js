/* Trilex – textos de las portadas del inglés: ingles.html, autoaprendizaje, aprendizaje guiado
   y curso. Cada página indica su clave en <body data-page="…">; los elementos con
   data-translate="clave" toman el texto en el idioma elegido. El idioma se guarda en
   localStorage 'selectedLanguage' (compartido con todo el sitio). */
(() => {
  'use strict';
  const PAGES = {
    ingles: {
      en: {
        mainTitle: 'English',
        subtitle: 'Choose your learning path',
        homeButton: '← Languages',
        selfLearning: 'Self-Learning',
        selfLearningDesc: 'Read graded texts and full books at your own pace',
        guidedLearning: 'Guided Learning',
        guidedLearningDesc: 'Follow a structured course through every level, step by step',
        open: 'Open →',
      },
      es: {
        mainTitle: 'Inglés',
        subtitle: 'Elige tu camino de aprendizaje',
        homeButton: '← Idiomas',
        selfLearning: 'Autoaprendizaje',
        selfLearningDesc: 'Lee textos por nivel y libros completos a tu ritmo',
        guidedLearning: 'Aprendizaje Guiado',
        guidedLearningDesc: 'Sigue un curso estructurado por todos los niveles, paso a paso',
        open: 'Abrir →',
      },
      fr: {
        mainTitle: 'Anglais',
        subtitle: "Choisissez votre parcours d'apprentissage",
        homeButton: '← Langues',
        selfLearning: 'Autoformation',
        selfLearningDesc: 'Lisez des textes par niveau et des livres complets à votre rythme',
        guidedLearning: 'Apprentissage Guidé',
        guidedLearningDesc: 'Suivez un cours structuré à travers tous les niveaux, étape par étape',
        open: 'Ouvrir →',
      },
      de: {
        mainTitle: 'Englisch',
        subtitle: 'Wählen Sie Ihren Lernweg',
        homeButton: '← Sprachen',
        selfLearning: 'Selbstlernen',
        selfLearningDesc: 'Lesen Sie Texte nach Niveau und ganze Bücher in Ihrem Tempo',
        guidedLearning: 'Geführtes Lernen',
        guidedLearningDesc:
          'Folgen Sie einem strukturierten Kurs durch alle Niveaus, Schritt für Schritt',
        open: 'Öffnen →',
      },
      it: {
        mainTitle: 'Inglese',
        subtitle: 'Scegli il tuo percorso di apprendimento',
        homeButton: '← Lingue',
        selfLearning: 'Autoapprendimento',
        selfLearningDesc: 'Leggi testi per livello e libri completi al tuo ritmo',
        guidedLearning: 'Apprendimento Guidato',
        guidedLearningDesc:
          'Segui un corso strutturato attraverso tutti i livelli, passo dopo passo',
        open: 'Apri →',
      },
      pt: {
        mainTitle: 'Inglês',
        subtitle: 'Escolha seu caminho de aprendizagem',
        homeButton: '← Idiomas',
        selfLearning: 'Autoaprendizagem',
        selfLearningDesc: 'Leia textos por nível e livros completos no seu ritmo',
        guidedLearning: 'Aprendizagem Guiada',
        guidedLearningDesc: 'Siga um curso estruturado por todos os níveis, passo a passo',
        open: 'Abrir →',
      },
      ru: {
        mainTitle: 'Английский',
        subtitle: 'Выберите свой путь обучения',
        homeButton: '← Языки',
        selfLearning: 'Самостоятельное обучение',
        selfLearningDesc: 'Читайте тексты по уровням и целые книги в своём темпе',
        guidedLearning: 'Управляемое обучение',
        guidedLearningDesc: 'Следуйте структурированному курсу через все уровни, шаг за шагом',
        open: 'Открыть →',
      },
      zh: {
        mainTitle: '英语',
        subtitle: '选择你的学习路径',
        homeButton: '← 语言',
        selfLearning: '自主学习',
        selfLearningDesc: '按自己的节奏阅读分级文章和整本书',
        guidedLearning: '引导式学习',
        guidedLearningDesc: '循序渐进地学习结构化课程，逐级提升',
        open: '打开 →',
      },
    },
    self: {
      en: {
        mainTitle: 'Self-Learning',
        subtitle: 'Learn at your own pace with free practice',
        homeButton: '← English',
        graded: 'Graded readings',
        gradedDesc: '24 texts from A1 to B2 with comprehension questions',
        books: 'Full books',
        booksDesc: '7 classic books in English, chapter by chapter',
        words: 'My words',
        wordsDesc: 'The words you saved while reading',
        open: 'Open →',
        notes: 'My notes',
        notesDesc: 'Your highlights and notes from every text, in one place',
      },
      es: {
        mainTitle: 'Autoaprendizaje',
        subtitle: 'Aprende a tu ritmo con práctica libre',
        homeButton: '← Inglés',
        graded: 'Lecturas por nivel',
        gradedDesc: '24 textos de A1 a B2 con preguntas de comprensión',
        books: 'Libros completos',
        booksDesc: '7 libros clásicos en inglés, capítulo a capítulo',
        words: 'Mis palabras',
        wordsDesc: 'Las palabras que guardaste al leer',
        open: 'Abrir →',
        notes: 'Mis notas',
        notesDesc: 'Tus subrayados y notas de cada texto, en un solo lugar',
      },
      fr: {
        mainTitle: 'Autoformation',
        subtitle: 'Apprenez à votre rythme avec une pratique libre',
        homeButton: '← Anglais',
        graded: 'Lectures par niveau',
        gradedDesc: '24 textes de A1 à B2 avec questions de compréhension',
        books: 'Livres complets',
        booksDesc: '7 classiques en anglais, chapitre par chapitre',
        words: 'Mes mots',
        wordsDesc: 'Les mots que vous avez enregistrés en lisant',
        open: 'Ouvrir →',
        notes: 'Mes notes',
        notesDesc: 'Vos surlignages et notes de chaque texte, au même endroit',
      },
      de: {
        mainTitle: 'Selbstlernen',
        subtitle: 'Lernen Sie in Ihrem eigenen Tempo mit freiem Üben',
        homeButton: '← Englisch',
        graded: 'Lesetexte nach Niveau',
        gradedDesc: '24 Texte von A1 bis B2 mit Verständnisfragen',
        books: 'Ganze Bücher',
        booksDesc: '7 Klassiker auf Englisch, Kapitel für Kapitel',
        words: 'Meine Wörter',
        wordsDesc: 'Die Wörter, die Sie beim Lesen gespeichert haben',
        open: 'Öffnen →',
        notes: 'Meine Notizen',
        notesDesc: 'Ihre Markierungen und Notizen aus allen Texten an einem Ort',
      },
      it: {
        mainTitle: 'Autoapprendimento',
        subtitle: 'Impara al tuo ritmo con la pratica libera',
        homeButton: '← Inglese',
        graded: 'Letture per livello',
        gradedDesc: '24 testi da A1 a B2 con domande di comprensione',
        books: 'Libri completi',
        booksDesc: '7 classici in inglese, capitolo per capitolo',
        words: 'Le mie parole',
        wordsDesc: 'Le parole che hai salvato leggendo',
        open: 'Apri →',
        notes: 'Le mie note',
        notesDesc: 'Le tue evidenziazioni e note di ogni testo, in un unico posto',
      },
      pt: {
        mainTitle: 'Autoaprendizagem',
        subtitle: 'Aprenda no seu ritmo com prática livre',
        homeButton: '← Inglês',
        graded: 'Leituras por nível',
        gradedDesc: '24 textos de A1 a B2 com perguntas de compreensão',
        books: 'Livros completos',
        booksDesc: '7 clássicos em inglês, capítulo a capítulo',
        words: 'Minhas palavras',
        wordsDesc: 'As palavras que você salvou ao ler',
        open: 'Abrir →',
        notes: 'Minhas notas',
        notesDesc: 'Seus destaques e notas de cada texto, num só lugar',
      },
      ru: {
        mainTitle: 'Самостоятельное обучение',
        subtitle: 'Учитесь в своём темпе со свободной практикой',
        homeButton: '← Английский',
        graded: 'Тексты по уровням',
        gradedDesc: '24 текста от A1 до B2 с вопросами на понимание',
        books: 'Книги целиком',
        booksDesc: '7 классических книг на английском, глава за главой',
        words: 'Мои слова',
        wordsDesc: 'Слова, которые вы сохранили при чтении',
        open: 'Открыть →',
        notes: 'Мои заметки',
        notesDesc: 'Ваши выделения и заметки из всех текстов в одном месте',
      },
      zh: {
        mainTitle: '自主学习',
        subtitle: '按自己的节奏自由练习',
        homeButton: '← 英语',
        graded: '分级阅读',
        gradedDesc: '从 A1 到 B2 的 24 篇短文，附阅读理解题',
        books: '整本书',
        booksDesc: '7 本英文经典，逐章阅读',
        words: '我的单词',
        wordsDesc: '你在阅读时保存的单词',
        open: '打开 →',
        notes: '我的笔记',
        notesDesc: '所有文章中的标注和笔记，集中在一处',
      },
    },
    guided: {
      en: {
        mainTitle: 'Guided Learning',
        subtitle: 'Follow a structured path through every level',
        homeButton: '← English',
        course: 'Course',
        courseDesc: 'Study all levels',
        open: 'Open →',
      },
      es: {
        mainTitle: 'Aprendizaje Guiado',
        subtitle: 'Sigue un camino estructurado por todos los niveles',
        homeButton: '← Inglés',
        course: 'Curso',
        courseDesc: 'Estudia todos los niveles',
        open: 'Abrir →',
      },
      fr: {
        mainTitle: 'Apprentissage Guidé',
        subtitle: 'Suivez un parcours structuré à travers tous les niveaux',
        homeButton: '← Anglais',
        course: 'Cours',
        courseDesc: 'Étudiez tous les niveaux',
        open: 'Ouvrir →',
      },
      de: {
        mainTitle: 'Geführtes Lernen',
        subtitle: 'Folgen Sie einem strukturierten Pfad durch alle Niveaus',
        homeButton: '← Englisch',
        course: 'Kurs',
        courseDesc: 'Studieren Sie alle Niveaus',
        open: 'Öffnen →',
      },
      it: {
        mainTitle: 'Apprendimento Guidato',
        subtitle: 'Segui un percorso strutturato attraverso tutti i livelli',
        homeButton: '← Inglese',
        course: 'Corso',
        courseDesc: 'Studia tutti i livelli',
        open: 'Apri →',
      },
      pt: {
        mainTitle: 'Aprendizagem Guiada',
        subtitle: 'Siga um caminho estruturado por todos os níveis',
        homeButton: '← Inglês',
        course: 'Curso',
        courseDesc: 'Estude todos os níveis',
        open: 'Abrir →',
      },
      ru: {
        mainTitle: 'Управляемое обучение',
        subtitle: 'Следуйте структурированному пути через все уровни',
        homeButton: '← Английский',
        course: 'Курс',
        courseDesc: 'Изучайте все уровни',
        open: 'Открыть →',
      },
      zh: {
        mainTitle: '引导式学习',
        subtitle: '循序渐进，逐级学习',
        homeButton: '← 英语',
        course: '课程',
        courseDesc: '学习所有级别',
        open: '打开 →',
      },
    },
    course: {
      en: {
        startCourse: 'Start the course',
        startCourseDesc:
          'A1 to B2: 300 interactive lessons, placement test, review, printable sheets and final exams',
        mainTitle: 'Course',
        subtitle: 'Study all levels, from your first words to fluent debate',
        homeButton: '← Guided Learning',
        courseIntro:
          "The course is organized by CEFR level, from A1 to B2. Each level lists its grammar focus and vocabulary focus. Course content stays in English regardless of your interface language, since it's what you're here to practice.",
        open: 'Open →',
        levelsTitle: 'Levels',
      },
      es: {
        startCourse: 'Empezar el curso',
        startCourseDesc:
          'De A1 a B2: 300 lecciones interactivas, prueba de nivel, repaso, fichas imprimibles y exámenes finales',
        mainTitle: 'Curso',
        subtitle: 'Estudia todos los niveles, desde tus primeras palabras hasta el debate fluido',
        homeButton: '← Aprendizaje Guiado',
        courseIntro:
          'El curso está organizado por nivel del MCER, de A1 a B2. Cada nivel indica su foco gramatical y su foco de vocabulario. El contenido del curso se mantiene en inglés sin importar tu idioma de interfaz, ya que es lo que venís a practicar.',
        open: 'Abrir →',
        levelsTitle: 'Niveles',
      },
      fr: {
        startCourse: 'Commencer le cours',
        startCourseDesc:
          'De A1 à B2 : 300 leçons interactives, test de niveau, révision, fiches imprimables et examens finaux',
        mainTitle: 'Cours',
        subtitle: 'Étudiez tous les niveaux, de vos premiers mots au débat fluide',
        homeButton: '← Apprentissage Guidé',
        courseIntro:
          "Le cours est organisé par niveau du CECR, de A1 à B2. Chaque niveau indique son focus grammatical et son focus lexical. Le contenu du cours reste en anglais quelle que soit votre langue d'interface, puisque c'est ce que vous venez pratiquer.",
        open: 'Ouvrir →',
        levelsTitle: 'Niveaux',
      },
      de: {
        startCourse: 'Kurs starten',
        startCourseDesc:
          'A1 bis B2: 300 interaktive Lektionen, Einstufungstest, Wiederholung, Druckblätter und Abschlussprüfungen',
        mainTitle: 'Kurs',
        subtitle: 'Studieren Sie alle Niveaus, von den ersten Worten bis zur fließenden Debatte',
        homeButton: '← Geführtes Lernen',
        courseIntro:
          'Der Kurs ist nach GER-Niveau von A1 bis B2 gegliedert. Jedes Niveau listet seinen Grammatik- und Wortschatzfokus auf. Die Kursinhalte bleiben unabhängig von Ihrer Interfacesprache auf Englisch, da Sie genau das üben möchten.',
        open: 'Öffnen →',
        levelsTitle: 'Niveaus',
      },
      it: {
        startCourse: 'Inizia il corso',
        startCourseDesc:
          'Da A1 a B2: 300 lezioni interattive, test di livello, ripasso, schede stampabili ed esami finali',
        mainTitle: 'Corso',
        subtitle: 'Studia tutti i livelli, dalle prime parole al dibattito fluente',
        homeButton: '← Apprendimento Guidato',
        courseIntro:
          "Il corso è organizzato per livello QCER, da A1 a B2. Ogni livello elenca il suo focus grammaticale e lessicale. I contenuti del corso restano in inglese indipendentemente dalla lingua dell'interfaccia, perché è ciò che sei qui a praticare.",
        open: 'Apri →',
        levelsTitle: 'Livelli',
      },
      pt: {
        startCourse: 'Começar o curso',
        startCourseDesc:
          'Do A1 ao B2: 300 lições interativas, teste de nível, revisão, fichas para imprimir e exames finais',
        mainTitle: 'Curso',
        subtitle: 'Estude todos os níveis, das primeiras palavras ao debate fluente',
        homeButton: '← Aprendizagem Guiada',
        courseIntro:
          'O curso é organizado por nível do QECR, de A1 a B2. Cada nível lista seu foco gramatical e de vocabulário. O conteúdo do curso permanece em inglês independentemente do seu idioma de interface, já que é isso que você veio praticar.',
        open: 'Abrir →',
        levelsTitle: 'Níveis',
      },
      ru: {
        startCourse: 'Начать курс',
        startCourseDesc:
          'От A1 до B2: 300 интерактивных уроков, тест на уровень, повторение, материалы для печати и итоговые экзамены',
        mainTitle: 'Курс',
        subtitle: 'Изучайте все уровни, от первых слов до свободной дискуссии',
        homeButton: '← Управляемое обучение',
        courseIntro:
          'Курс организован по уровням CEFR, от A1 до B2. Для каждого уровня указан грамматический и лексический фокус. Содержание курса остаётся на английском независимо от языка интерфейса, ведь именно его вы пришли практиковать.',
        open: 'Открыть →',
        levelsTitle: 'Уровни',
      },
      zh: {
        startCourse: '开始课程',
        startCourseDesc: 'A1 到 B2：300 节互动课、分级测试、复习、可打印讲义和结业考试',
        mainTitle: '课程',
        subtitle: '学习所有级别，从第一句话到流利辩论',
        homeButton: '← 引导式学习',
        courseIntro:
          '课程按欧洲语言共同参考框架（CEFR）等级组织，从 A1 到 B2。每个等级都列出语法重点和词汇重点。无论界面语言是什么，课程内容都保持英语，因为这正是你要练习的内容。',
        open: '打开 →',
        levelsTitle: '级别',
      },
    },
  };

  const page = PAGES[document.body.dataset.page] || {};
  const apply = (lang) => {
    const t = page[lang];
    if (!t) return;
    document.querySelectorAll('[data-translate]').forEach((el) => {
      const v = t[el.dataset.translate];
      if (v) el.textContent = v;
    });
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('selectedLanguage', lang);
    } catch (e) {}
  };
  let saved = null;
  try {
    saved = localStorage.getItem('selectedLanguage');
  } catch (e) {}
  const sel = document.getElementById('languageSelect');
  if (sel) {
    sel.value = page[saved] ? saved : 'en';
    sel.addEventListener('change', () => apply(sel.value));
  }
  if (page[saved]) apply(saved);
})();
