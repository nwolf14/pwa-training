importScripts('/js/lib/idb.js');
importScripts('/js/lib/idbUtility.js');

const STATIC_CACHE = "static-v2";
const DYNAMIC_CACHE = `dynamic-${new Date().getUTCMilliseconds()}`;

const STATIC_FILES = [
  "/index.html",
  "/offline.html",
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
  caches.open(cacheName).then(cache =>
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    })
  );
}

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

addEventListener("install", function(event) {
  // zostanie wykonany gdy przeglądarka wykryje nowy SW
  console.log("[Service Worker] Installing Service Worker ..", event);
  event.waitUntil(
    // dzięki temu zdarzenie 'install' za nim zacznie kontynuować, zaczeka az wykona się nasz promise
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log("[Service Worker] Precaching App Shell");
      return cache.addAll(STATIC_FILES); // wykonuje i cachuje requesty, kluczem jest adres ządania
    })
  );
});

addEventListener("activate", event => {
  // zostanie wykonany gdy poprzedni SW zostanie zderejestrowany poprzez np. zamknięcie wszystkich zakładek naszej aplikacji w przeglądarce
  event.waitUntil(
    // czyścimy śmieci tutaj poniewaz nie jestesmy ju w aktywnej aplikacji
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

  console.log("SW activating....", event);
  return clients.claim(); // zapewnia poprawne działanie w momencie aktywacji
});

/* *********************** CACHE WITH NETWORK FALLBACK (WITH DYNAMIC CACHE) ********************* */

// addEventListener("fetch", event => {
//   if (event.request.url.indexOf("http") > -1) {
//     event.respondWith(
//       caches.match(event.request).then(function(response) {
//         if (response) {
//           return Promise.resolve(response);
//         } else {
//           if (event.request.url.indexOf("randomuser.me") > -1) {
//             // nie chcemy cachować danych z API, poniewaz bedziemy robic to jako cache on demand
//             return fetch(event.request).catch(() => {});
//           }

//           return fetch(event.request)
//             .then(function(response) {
//               return caches.open(DYNAMIC_CACHE).then(function(cache) {
//                 cache.put(event.request, response.clone()).then(() => {
//                   trimCache(DYNAMIC_CACHE, 10);
//                 });
//                 return Promise.resolve(response);
//               });
//             })
//             .catch(function() {
//               if (event.request.headers.get("accept").includes("text/html")) {
//                 // dodajemy offline fallback dla plików html
//                 return caches
//                   .open(STATIC_CACHE)
//                   .then(cache =>
//                     cache
//                       .match(event.request)
//                       .then(response => {
//                         if (response) {
//                           return Promise.resolve(response);
//                         }

//                         return cache
//                           .match("/offline.html")
//                             .then((fallbackResponse) => Promise.resolve(fallbackResponse));
//                       })
//                   );
//               }
//             });
//         }
//       })
//     );
//   }
// });

// /* *********************** NETWORK WITH CACHE FALLBACK (WITHOUT DYNAMIC CACHE) ********************* */

// addEventListener("fetch", event => {
//   if (event.request.url.indexOf("http") > -1) {
//     event.respondWith(event =>
//       fetch(event.request).catch(() => caches.match(event.request))
//     );
//   }
// });

/* *********************** NETWORK WITH CACHE FALLBACK (WITH DYNAMIC CACHE) ********************* */

// addEventListener("fetch", event => {
//   if (event.request.url.indexOf("http") > -1) {
//     event.respondWith(
//       fetch(event.request)
//         .then(response =>
//           caches
//             .open(DYNAMIC_CACHE)
//             .then(cache => {
//               cache.put(event.request, response.clone()).then(() => {
//                 trimCache(DYNAMIC_CACHE, 10);
//               });
//               return Promise.resolve(response);
//             })
//         )
//         .catch(() => caches.match(event.request))
//     )
//   };
// });

// /* *********************** CACHE, THEN NETWORK (WITH DYNAMIC CACHE) + CACHE ONLY FOR STATIC FILES ********************* */

addEventListener("fetch", event => {
  if (event.request.url.indexOf("http") > -1) {
    if (event.request.url.indexOf("https://randomuser.me/api") > -1) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            const clonedResponse = response.clone();
            clonedResponse
              .json()
              .then(data => {
                if (Array.isArray(data.results)) {
                  clearAllData('users');

                  data.results.forEach(user => {
                    // deleteItemFromData('users', '938-637-820')
                    //   .then(() => { console.log('item deleted') });
                    writeData('users', user);
                  });
                }
              })
            return Promise.resolve(response);
          })
      );
    } else if (isInArray(event.request.url, STATIC_FILES)) { // CACHE ONLY, dla plików statycznych
      event.respondWith(
        caches
          .match(event.request)
          .then(response => Promise.resolve(response ? response : new Response()))
          .catch(() => fetch(event.request))
      );
    } else {
      event.respondWith( // CACHE WITH NETWORK FALLBACK dla reszty plików w celu pełnej obsługi trybu offline
        caches.match(event.request).then(function(response) {
          if (response) {
            return Promise.resolve(response);
          } else {
            return fetch(event.request)
              .then(response => {
                return caches.open(DYNAMIC_CACHE).then(function(cache) {
                  cache.put(event.request, response.clone()).then(() => {
                    trimCache(DYNAMIC_CACHE, 10);
                  });
                  return Promise.resolve(response);
                });
              })
              .catch(() => {
                if (event.request.headers.get("accept").includes("text/html")) {
                  return caches
                    .open(STATIC_CACHE)
                    .then(cache =>
                      cache
                        .match(event.request)
                        .then(response => {
                          if (response) {
                            return Promise.resolve(response);
                          }

                          return cache
                            .match("/offline.html")
                            .then((fallbackResponse) => Promise.resolve(fallbackResponse));
                        })
                    );
                }
              });
          }
        })
      );
    }
  }
});
