self.addEventListener('install', event => { // zostanie wykonany gdy przeglądarka wykryje nowy SW
  console.log('SW installed...', event)
});

self.addEventListener('activate', event => { // zostanie wykonany gdy poprzedni SW zostanie zderejestrowany poprzez np. zamknięcie wszystkich zakładek naszej aplikacji w przeglądarce 
  console.log('SW activating....', event)
  event.waitUntil(self.clients.claim()) // zapewnia poprawne działanie w momencie aktywacji
});  

self.addEventListener('fetch', event => {
  console.log('Fetch event', event);
  event.respondWith(fetch(event.request)); // coś w stylu fetch proxy
});