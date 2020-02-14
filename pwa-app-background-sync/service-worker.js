importScripts("/js/lib/idb.js");
importScripts("/js/lib/idbUtility.js");

const STATIC_CACHE = "static-v2";
const DYNAMIC_CACHE = "dynamic-v6";

const STATIC_FILES = [
  "/index.html",
  "/offline.html",
  "/js/lib/idb.js",
  "/js/app.js",
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

self.addEventListener("install", function(event) {
  // zostanie wykonany gdy przeglądarka wykryje nowy SW
  console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    // dzięki temu zdarzenie 'install' za nim zacznie kontynuować, zaczeka az wykona się nasz promise
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log("[Service Worker] Precaching App Shell");
      return cache.addAll(STATIC_FILES); // wykonuje i cachuje requesty, kluczem jest adres ządania
    })
  );
});

self.addEventListener("activate", event => {
  // zostanie wykonany gdy poprzedni SW zostanie zderejestrowany poprzez np. zamknięcie wszystkich zakładek naszej aplikacji w przeglądarce
  event.waitUntil(
    // czyścimy śmieci tutaj poniewaz nie jestesmy ju w aktywnej aplikacji
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            caches.delete(key); // zwraca Promise
          }
        })
      );
    })
  );

  console.log("SW activating...", event);
  return self.clients.claim(); // zapewnia poprawne działanie w momencie aktywacji
});

/* *********************** CACHE WITH NETWORK FALLBACK (WITH DYNAMIC CACHE) ********************* */

// self.addEventListener("fetch", event => {
//   event.respondWith(  // coś w stylu fetch proxy
//     caches
//     .match(event.request)
//     .then(function(response) {
//       if (response) { // jezeli istnieje w cachu zwracamy
//         return response;
//       } else {
//         if (event.request.url.indexOf("randomuser.me") > -1) { // nie chcemy cachować danych z API
//           return fetch(event.request);
//         }

//         if (event.request.url.indexOf("http") > -1) { // wykluczamy requesty typu chrome-extension://
//           return fetch(event.request) // wykonujemy request
//             .then(function(response) {
//               return caches
//                 .open(DYNAMIC_CACHE) // otwieramy nowy cache
//                 .then(function(cache) {
//                   // poniewaz request jest juz wykonany uzywamy add() zamiast put()
//                   cache.put(event.request.url, response.clone()); // response mozna skonsumować tylko raz dlatego tworzymy kopie
//                   return response; // zwracamy response do html-a
//                 });
//             })
//             .catch(function(error) {
//               return caches
//                 .open(STATIC_CACHE)
//                 .then(cache => {
//                   if (event.request.headers.get('accept').includes('text/html')) {
//                     return cache.match('/offline.html');
//                   }
//               })
//             }); // pusty catch, dla wszystkich fetchy wywoływanych w trybie offline
//         }
//       }
//     })
//   );
// });

/* *********************** NETWORK WITH CACHE FALLBACK (WITHOUT DYNAMIC CACHE) ********************* */

// self.addEventListener("fetch", event => {
//   event.respondWith(event => {
//     fetch(event.request)
//       .catch(() => caches.match(event.request))
//   });
// });

/* *********************** NETWORK WITH CACHE FALLBACK (WITH DYNAMIC CACHE) ********************* */

// self.addEventListener("fetch", event => {
//   event.respondWith(event => {
//     fetch(event.request)
//       .then(response => {
//         return caches
//           .open(DYNAMIC_CACHE)
//           .then(cache => {
//             cache.put(event.request.url, response.clone());
//             return response;
//           });
//       })
//       .catch(() => {
//         return caches.match(event.request);
//       })
//   });
// });

/* *********************** CACHE, THEN NETWORK (WITH DYNAMIC CACHE) ********************* */

self.addEventListener("fetch", event => {
  const url = "https://randomuser.me/api";

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          if (Array.isArray(data.results)) {
            data.results.forEach(user => {
              clearAllData("users");
              // deleteItemFromData('users', '938-637-820')
              //   .then(() => { console.log('item deleted') });
              writeData("users", user);
            });
          }
        });
        return response;
      })
    );
  } else {
    event.respondWith(
      // CACHE WITH NETWORK FALLBACK dla reszty plików w celu pełnej obsługi trybu offline
      caches.match(event.request).then(function(response) {
        if (response) {
          return response;
        } else {
          if (event.request.url.indexOf("http") > -1) {
            return fetch(event.request)
              .then(function(response) {
                return caches.open(DYNAMIC_CACHE).then(function(cache) {
                  trimCache(DYNAMIC_CACHE, 15);
                  cache.put(event.request.url, response.clone());
                  return response;
                });
              })
              .catch(function(error) {
                return caches.open(STATIC_CACHE).then(cache => {
                  if (
                    event.request.headers.get("accept").includes("text/html")
                  ) {
                    return cache
                      .match("/offline.html")
                      .then(response => response);
                  }
                });
              });
          }
        }
      })
    );
  }
});

self.addEventListener("sync", event => {
  console.log('Sync event')
  if (event.tag === "sync-new-post") {
    event.waitUntil(
      readAllData("sync-posts").then(posts => {
        posts.forEach(post => {
          fetch("https://httpbin.org/post", {
            method: "POST",
            body: JSON.stringify(post)
          })
            .then(response => response.json())
            .then(data => {
              console.log('post synced', data);
              if (data.json.id) {
                deleteItemFromDb('sync-posts', data.json.id);
              }
            })
            .catch(error => console.log(error));
        })
      })
    );
  }
});
