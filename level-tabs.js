/**
 * =========================================================================
 * Tabs de nivel (A1, A2, B1, B2, C1)
 * Reutilizable en la sección "Lectura" de cualquier idioma.
 *
 * Estructura esperada en el HTML:
 *   <button class="level-tab-btn active" data-level="a1">A1</button>
 *   ...
 *   <div class="level-panel active" data-level="a1">...</div>
 *   <div class="level-panel" data-level="a2">...</div>
 * =========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.level-tab-btn');
    const panels = document.querySelectorAll('.level-panel');

    if (!tabButtons.length || !panels.length) return;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const level = button.getAttribute('data-level');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            panels.forEach(panel => {
                panel.classList.toggle('active', panel.getAttribute('data-level') === level);
            });
        });
    });
});