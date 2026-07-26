document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-target]').forEach(item => {
        const navigate = () => {
            window.location.href = item.getAttribute('data-target');
        };

        item.addEventListener('click', navigate);

        // Soporte de teclado (Enter / Espacio), ya que estos elementos no son <a>
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate();
            }
        });
    });
});
