// Oculta la URL que el navegador muestra abajo a la izquierda al pasar el mouse por un enlace.
// Mueve el href de cada <a> a data-href (el navegador solo muestra la URL si existe href)
// y navega por JS al hacer clic. También cubre los enlaces que se crean dinámicamente.
(() => {
    const style = document.createElement('style');
    style.textContent = 'a[data-href] { cursor: pointer; }';
    document.head.appendChild(style);

    const hideHref = (a) => {
        // El title también muestra un cartel al pasar el mouse. Si el enlace no tiene texto visible,
        // se conserva como aria-label para los lectores de pantalla
        if (a.hasAttribute('title')) {
            if (!a.hasAttribute('aria-label') && !a.textContent.trim()) a.setAttribute('aria-label', a.title);
            a.removeAttribute('title');
        }
        if (!a.hasAttribute('href')) return;
        a.dataset.href = a.getAttribute('href');
        a.removeAttribute('href');
        // Sin href el <a> deja de ser enfocable con el teclado
        if (!a.hasAttribute('tabindex')) a.setAttribute('tabindex', '0');
        if (!a.hasAttribute('role')) a.setAttribute('role', 'link');
    };

    const hideAll = (root) => {
        if (root.matches && root.matches('a[href]')) hideHref(root);
        if (root.querySelectorAll) root.querySelectorAll('a[href]').forEach(hideHref);
    };

    const open = (a, newTab) => {
        const url = a.dataset.href;

        // Descargas: se usa un enlace temporal que nunca recibe el mouse
        if (a.hasAttribute('download')) {
            const tmp = document.createElement('a');
            tmp.href = url;
            tmp.download = a.getAttribute('download');
            document.body.appendChild(tmp);
            tmp.click();
            tmp.remove();
            return;
        }

        if (newTab || a.target === '_blank') {
            window.open(url, '_blank', 'noopener');
        } else {
            window.location.href = url;
        }
    };

    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-href]');
        if (!a || e.defaultPrevented) return;
        e.preventDefault();
        open(a, e.ctrlKey || e.metaKey || e.shiftKey);
    });

    // Clic con la rueda del mouse: abrir en otra pestaña
    document.addEventListener('auxclick', (e) => {
        const a = e.target.closest('a[data-href]');
        if (!a || e.button !== 1) return;
        e.preventDefault();
        open(a, true);
    });

    // Soporte de teclado (Enter), como en un enlace normal
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const a = e.target.closest && e.target.closest('a[data-href]');
        if (!a) return;
        e.preventDefault();
        open(a, e.ctrlKey || e.metaKey);
    });

    hideAll(document);
    new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            if (m.type === 'attributes') { if (m.target.tagName === 'A') hideHref(m.target); }
            else m.addedNodes.forEach(hideAll);
        });
    }).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href'],
    });
})();
