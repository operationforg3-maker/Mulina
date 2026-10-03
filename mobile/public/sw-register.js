// Service Worker Registration for Mulina PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.location.pathname.startsWith('/mulina') 
      ? '/mulina/service-worker.js' 
      : '/service-worker.js';

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log('Mulina SW registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Mulina SW registration:', error);
      });
  });
}
