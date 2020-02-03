const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

const STATIC_FILES = [
  "/index.html",
  "/js/app.js",
  "/styles/style.css",
  "/images/bootstrap.png",
  "https://netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js",
  "https://code.jquery.com/jquery-3.4.1.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css"
];

self.addEventListener("install", event => {
  // zostanie wykonany gdy przeglądarka wykryje nowy SW
  console.log("SW installed...", event);
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log("[SW] Precaching App shell");
      cache.addAll(STATIC_FILES); // wykonuje requesty i cachuje, kluczem jest adres ządania
    })
  ); // dzięki temu zdaerzenie 'install' za nim zacznie kontynuować, zaczeka az wykona się nasz promise
});

self.addEventListener("activate", event => { // zostanie wykonany gdy poprzedni SW zostanie zderejestrowany poprzez np. zamknięcie wszystkich zakładek naszej aplikacji w przeglądarce
  event.waitUntil( // czyścimy śmieci tutaj poniewaz nie jestesmy ju w aktywnej aplikacji
    caches
      .keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            caches.delete(key); // zwraca Promise
          }
        }));
      })
  );

  console.log("SW activating...", event);
  return self.clients.claim(); // zapewnia poprawne działanie w momencie aktywacji
});

self.addEventListener("fetch", event => {
  event.respondWith(  // coś w stylu fetch proxy
    caches
    .match(event.request)
    .then(function(response) {
      if (response) { // jeeli istnieje w cachu zwracamy
        return response;
      } else {
        if (event.request.url.indexOf("http") !== -1) { // wykluczamy requesty typu chrome://
          return fetch(event.request) // wykonujemy request
            .then(function(response) {
              caches
                .open(DYNAMIC_CACHE) // otwieramy nowy cache
                .then(function(cache) {
                  cache.put(event.request.url, response.clone()); // response mozna skonsumować tylko raz dlatego tworzymy kopie
                  return response; // zwracamy response do html-a
                });
            })
            .catch(function(error) {}); // pusty catch, dla wszystkich fetchy w trybie offline
        }
      }
    })
  );
});
