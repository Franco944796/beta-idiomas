/**
 * =========================================================================
 * TRILEX - Script principal
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada correctamente');

    initContentProtection();
    initLockedLanguageModal();
});


/**
 * =========================================================================
 * Protección básica contra copia
 * (deshabilita clic derecho, selección de texto, arrastre de imágenes
 * y algunos atajos de teclado como Ctrl+S, Ctrl+U y F12)
 * =========================================================================
 */
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


/**
 * =========================================================================
 * Modal "en desarrollo" para los idiomas bloqueados
 * =========================================================================
 */

// Traducciones para el modal según el idioma bloqueado que se haya clickeado
const MODAL_TRANSLATIONS = {
    en: {
        title: 'Trilex announces',
        message: 'This section is under development'
    },
    de: {
        title: 'Trilex kündigt an',
        message: 'Dieser Abschnitt befindet sich in der Entwicklung'
    },
    it: {
        title: 'Trilex annuncia',
        message: 'Questa sezione è in sviluppo'
    },
    es: {
        title: 'Trilex anuncia',
        message: 'Esta sección se encuentra en desarrollo'
    },
    ru: {
        title: 'Trilex объявляет',
        message: 'Этот раздел находится в разработке'
    }
};

function initLockedLanguageModal() {
    document.querySelectorAll('.lang-item.locked').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const lang = item.getAttribute('data-lang');
            const { title, message } = MODAL_TRANSLATIONS[lang] || MODAL_TRANSLATIONS.es;

            showSpatialModal(title, message);
        });
    });
}

/**
 * Crea y muestra el modal espacial con el título y mensaje indicados.
 * @param {string} title
 * @param {string} message
 */
function showSpatialModal(title, message) {
    const modal = document.createElement('div');
    modal.className = 'spatial-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'spatial-modal-content';

    const modalTitleElement = document.createElement('h2');
    modalTitleElement.className = 'spatial-modal-title';
    modalTitleElement.textContent = title;

    const modalMessageElement = document.createElement('p');
    modalMessageElement.className = 'spatial-modal-message';
    modalMessageElement.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'spatial-modal-close';
    closeButton.textContent = 'Cerrar';
    closeButton.addEventListener('click', () => closeSpatialModal(modal));

    modalContent.appendChild(modalTitleElement);
    modalContent.appendChild(modalMessageElement);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Activa la animación de aparición en el siguiente frame
    requestAnimationFrame(() => modal.classList.add('show'));
}

/**
 * Cierra y elimina el modal espacial del DOM con su animación.
 * @param {HTMLElement} modal
 */
function closeSpatialModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}