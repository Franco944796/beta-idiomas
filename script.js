document.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada correctamente');

    initContentProtection();
    initLanguageCarousel();
    initLockedLanguages();
    initContactMail();
    initAppPromo();
});

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
