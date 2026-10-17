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