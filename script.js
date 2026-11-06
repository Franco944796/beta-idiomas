document.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada correctamente');

    initContentProtection();
    initLanguageCarousel();
    initLockedLanguages();
    initContactMail();
    initAppPromo();
    initVisitCounter();
});

// El mismo contador (Abacus) está en el portafolio (script.js) y en carreras_uni (js/ui/visits.js)
function initVisitCounter() {
    const actions = document.querySelector('.index-actions');
    if (!actions) return;

    const WORDS = {
        en: { one: 'visit', other: 'visits' },
        es: { one: 'visita', other: 'visitas' },
        fr: { one: 'visite', other: 'visites' },
        de: { one: 'Besuch', other: 'Besuche' },
        it: { one: 'visita', other: 'visite' },
        pt: { one: 'visita', other: 'visitas' },
        ru: { one: 'визит', few: 'визита', many: 'визитов', other: 'визита' },
        zh: { other: '次访问' },
    };
    let lang = null;
    try {
        lang = localStorage.getItem('selectedLanguage');
    } catch (e) { }
    if (!WORDS[lang]) lang = WORDS[document.documentElement.lang] ? document.documentElement.lang : 'es';

    // Abrir el archivo en local o con un servidor de prueba solo lee el total, sin sumar.
    const published = /^https?:$/.test(location.protocol) &&
        !/^(localhost|127\.|\[::1\])/.test(location.hostname);
    const url = 'https://abacus.jasoncameron.dev/' + (published ? 'hit' : 'get') +
        '/franco944796-trilex/inicio';

    fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(({ value }) => {
            if (typeof value !== 'number') return;
            const words = WORDS[lang];
            const word = words[new Intl.PluralRules(lang).select(value)] || words.other;
            const text = value.toLocaleString(lang) + ' ' + word;

            const badge = document.createElement('span');
            badge.className = 'visit-count';
            badge.innerHTML =
                '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
                'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>' +
                '<circle cx="12" cy="12" r="3"/></svg>';
            badge.append(text);
            actions.append(badge);
        })
        .catch(() => { });
}

function initContentProtection() {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        alert('El clic derecho está deshabilitado en este sitio.');
    });

    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });

    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
        // Ctrl+S (guardar)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            alert('Guardar esta página está prohibido.');
        }
        // Ctrl+U (ver código fuente)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            alert('Ver el código fuente está prohibido.');
        }
        // F12 (herramientas de desarrollador)
        if (e.keyCode === 123) {
            e.preventDefault();
            alert('Las herramientas de desarrollador están deshabilitadas.');
        }
    });
}

// Al hacer clic en un idioma bloqueado, la tarjeta se sacude y muestra su insignia "en desarrollo"
function initLockedLanguages() {
    document.querySelectorAll('.lang-item.locked').forEach(item => {
        let hideTimer;
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Reinicia la animación si se vuelve a hacer clic antes de que termine
            item.classList.remove('denied');
            void item.offsetWidth;
            item.classList.add('denied');

            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => item.classList.remove('denied'), 2000);
        });
    });
}

function initContactMail() {
    const button = document.querySelector('.contact-mail');
    if (!button) return;

    // Se arma acá para que los bots que leen el HTML no encuentren la dirección
    const address = ['sudoanonimo', 'gmail.com'].join('@');

    button.addEventListener('click', () => {
        const url = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(address);
        window.open(url, '_blank', 'noopener');
    });
}

// Selector de idiomas como carrusel, solo en el celular (no entran todas las banderas): se ve un idioma
// por vez y se cambia con las flechas, los puntos, deslizando o con las flechas del teclado. En pantallas
// grandes (y sin JavaScript) se ven todas en fila; el CSS oculta flechas y puntos.
function initLanguageCarousel() {
    const box = document.querySelector('.language-switch');
    if (!box) return;
    const items = [...box.querySelectorAll('.lang-item')];
    if (items.length < 2) return;
    const phone = window.matchMedia('(max-width: 576px)');
    const tabs = items.map(item => item.getAttribute('tabindex'));

    const view = document.createElement('div');
    view.className = 'ls-view';
    items.forEach(item => view.appendChild(item));

    const arrow = (cls, label, text) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ls-arrow ' + cls;
        b.setAttribute('aria-label', label);
        b.textContent = text;
        return b;
    };
    const prev = arrow('prev', 'Idioma anterior', '‹');
    const next = arrow('next', 'Idioma siguiente', '›');

    const row = document.createElement('div');
    row.className = 'ls-row';
    row.append(prev, view, next);

    const dots = document.createElement('div');
    dots.className = 'ls-dots';
    const dotButtons = items.map((item, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'ls-dot';
        d.setAttribute('aria-label', item.querySelector('.lang-text').textContent);
        d.addEventListener('click', () => show(i, i > current ? 1 : -1));
        dots.appendChild(d);
        return d;
    });

    box.replaceChildren(row, dots);
    box.classList.add('is-carousel');

    let current = 0;
    const show = (i, dir) => {
        current = (i + items.length) % items.length;
        items.forEach((item, k) => {
            const on = k === current;
            item.classList.toggle('active', on);
            item.classList.remove('from-left', 'from-right');
            // en el celular los idiomas que no se ven tampoco se alcanzan con Tab ni con lector de pantalla
            const hidden = phone.matches && !on;
            if (hidden) {
                item.setAttribute('aria-hidden', 'true');
                item.tabIndex = -1;
            } else {
                item.removeAttribute('aria-hidden');
                if (tabs[k] === null) item.removeAttribute('tabindex');
                else item.setAttribute('tabindex', tabs[k]);
            }
        });
        if (dir) {
            const item = items[current];
            void item.offsetWidth; // reinicia la animación
            item.classList.add(dir > 0 ? 'from-right' : 'from-left');
        }
        dotButtons.forEach((d, k) => d.classList.toggle('active', k === current));
    };
    prev.addEventListener('click', () => show(current - 1, -1));
    next.addEventListener('click', () => show(current + 1, 1));

    box.addEventListener('keydown', (e) => {
        if (!phone.matches) return;
        if (e.key === 'ArrowLeft') show(current - 1, -1);
        else if (e.key === 'ArrowRight') show(current + 1, 1);
    });

    // Deslizar: si el dedo (o el mouse) se movió lo suficiente, cambia de idioma y no cuenta como clic
    let startX = null,
        swiped = false;
    view.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        swiped = false;
    });
    view.addEventListener('pointerup', (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (phone.matches && Math.abs(dx) > 40) {
            swiped = true;
            show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }
    });
    view.addEventListener('pointercancel', () => (startX = null));
    // en fase de captura, antes que la navegación o el aviso «en desarrollo» de la tarjeta
    view.addEventListener('click', (e) => {
        if (swiped) {
            swiped = false;
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    phone.addEventListener('change', () => show(current));
    show(0);
}

function initAppPromo() {
    const promo = document.querySelector('.app-promo');
    if (!promo) return;
    const tab = promo.querySelector('.app-promo-tab');

    tab.addEventListener('click', () => {
        const open = promo.classList.toggle('open');
        tab.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (e) => {
        if (!promo.classList.contains('open') || promo.contains(e.target)) return;
        promo.classList.remove('open');
        tab.setAttribute('aria-expanded', 'false');
    });
}
