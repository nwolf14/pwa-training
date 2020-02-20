const STATIC_CACHE = "static-v2";
const DYNAMIC_CACHE = `dynamic-${new Date().getUTCMilliseconds()}`;

const STATIC_FILES = [
  "/index.html",
  "/js/app.js",
  "/js/lib/idb.js",
  "/js/lib/idbUtility.js",
  "/styles/style.css",
  "/images/bootstrap.png",
  "https://netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js",
  "https://code.jquery.com/jquery-3.4.1.min.js",
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css"
];

function trimCache(cacheName, maxItems) {
  caches
    .open(cacheName)
    .then(cache => cache
      .keys()
      .then(keys => {
        if (keys.length > maxItems) {
          cache
            .delete(keys[0])
            .then(() => trimCache(cacheName, maxItems))
        }
      })
    )
}

addEventListener("install", event => {
  // zostanie wykonany gdy przeglądarka wykryje nowy SW
  console.log("SW installing....", event);

  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log("[SW] Precaching App shell");
      return cache.addAll(STATIC_FILES); // wykonuje requesty i cachuje, kluczem jest adres ządania
    })
  ); // dzięki temu zdaerzenie 'install' za nim zacznie kontynuować, zaczeka az wykona się nasz promise
});

addEventListener("activate", event => {
  // zostanie wykonany gdy poprzedni SW zostanie zderejestrowany poprzez np. zamknięcie wszystkich zakładek naszej aplikacji w przeglądarce
  event.waitUntil(
    // tutaj czyścimy śmieci, poniewaz nie jestesmy juz w poprzedniej aktywnej aplikacji
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key); // zwraca Promise
          }
        })
      );
    })
  );

  console.log("SW activating...", event);
  return self.clients.claim(); // zapewnia poprawne działanie w momencie aktywacji
});

addEventListener("fetch", event => {
  if (event.request.url.indexOf("http") !== -1) { // wykluczamy requesty typu chrome:// itp.
    event.respondWith(
      // pozwala na nadpisanie domyślnego zachownia przeglądarki gdy pobierany jest jakiś resource
      caches.match(event.request).then(response => {
        if (response) {
          // jezeli istnieje w cachu zwracamy jako promise, strategia Cache first
          return Promise.resolve(response);
        } else {
          return fetch(event.request) // wykonujemy request
            .then(response => {
              return caches
                .open(DYNAMIC_CACHE) // otwieramy nowy cache
                .then(function(cache) {
                  // poniewaz request jest juz wykonany uzywamy put() zamiast add()
                  cache.put(event.request, response.clone()).then(() => {
                    trimCache(DYNAMIC_CACHE, 3);
                  }); // response mozna skonsumować tylko raz dlatego tworzymy kopie
                  return Promise.resolve(response); // zwracamy response do html-a jako promise
                });
            })
            .catch(error => {}); // pusty catch, dla wszystkich fetchy w trybie offline
        }
      })
    );
  }
});