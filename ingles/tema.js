(function () {
  var KEY = 'trilexTheme';
  var CHOICES = ['auto', 'light', 'dark'];
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var LABELS = {
    en: { title: 'Theme', auto: 'Automatic', light: 'Light', dark: 'Dark' },
    es: { title: 'Tema', auto: 'Automático', light: 'Claro', dark: 'Oscuro' },
    fr: { title: 'Thème', auto: 'Automatique', light: 'Clair', dark: 'Sombre' },
    de: { title: 'Design', auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' },
    it: { title: 'Tema', auto: 'Automatico', light: 'Chiaro', dark: 'Scuro' },
    pt: { title: 'Tema', auto: 'Automático', light: 'Claro', dark: 'Escuro' },
    ru: { title: 'Тема', auto: 'Автоматически', light: 'Светлая', dark: 'Тёмная' },
    zh: { title: '主题', auto: '自动', light: '浅色', dark: '深色' },
  };

  var ICONS = {
    auto:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" ' +
      'fill="currentColor"/></svg>',
    light:
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6' +
      'M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
    dark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4 ' +
      '8.2 8.2 0 1 0 20 14.6z" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linejoin="round"/></svg>',
  };

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* sin almacenamiento: la elección dura hasta cerrar la página */
    }
  }

  var choice = read(KEY);
  if (CHOICES.indexOf(choice) < 0) choice = 'auto';

  function effective() {
    if (choice !== 'auto') return choice;
    return media && media.matches ? 'dark' : 'light';
  }

  function apply() {
    document.documentElement.setAttribute('data-theme', effective());
  }

  function labels() {
    var lang = read('selectedLanguage') || document.documentElement.lang || 'en';
    return LABELS[lang] || LABELS.en;
  }

  var button = null;

  function paint() {
    if (!button) return;
    var t = labels();
    var text = t.title + ': ' + t[choice];
    button.innerHTML = ICONS[choice];
    button.setAttribute('aria-label', text);
    button.title = text;
  }

  function addButton() {
    var actions = document.querySelector('.ph-actions');
    if (!actions || button) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'pill theme-btn';
    button.addEventListener('click', function () {
      choice = CHOICES[(CHOICES.indexOf(choice) + 1) % CHOICES.length];
      write(KEY, choice);
      apply();
      paint();
    });
    var back = actions.querySelector('a.pill');
    actions.insertBefore(button, back);
    paint();
    var select = document.getElementById('languageSelect');
    if (select) {
      select.addEventListener('change', function () {
        setTimeout(paint, 0);
      });
    }
  }

  apply();

  if (media) {
    var onSystem = function () {
      if (choice === 'auto') apply();
    };
    if (media.addEventListener) media.addEventListener('change', onSystem);
    else if (media.addListener) media.addListener(onSystem);
  }

  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    choice = CHOICES.indexOf(e.newValue) < 0 ? 'auto' : e.newValue;
    apply();
    paint();
  });

  window.addEventListener('beforeprint', function () {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  window.addEventListener('afterprint', apply);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else {
    addButton();
  }
})();
