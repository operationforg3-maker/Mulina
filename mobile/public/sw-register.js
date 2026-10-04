// Service Worker Registration for Mulina PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.location.pathname.startsWith('/mulina') 
      ? '/mulina/service-worker.js' 
      : '/service-worker.js';

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log('[Mulina] SW registered with scope:', registration.scope);

        // Always check for updates on every page load
        registration.update().catch(() => {});

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Mulina] New version installed, activating...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[Mulina] SW registration error:', error);
      });

    // Auto reload if controller changed (new version activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[Mulina] Controller changed, refreshing...');
        window.location.reload();
      }
    });
  });
}
