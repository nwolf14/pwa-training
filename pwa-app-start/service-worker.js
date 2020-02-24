importScripts('/js/lib/idb.js');
importScripts('/js/lib/idbUtility.js');

const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = `dynamic-${new Date().getUTCMilliseconds()}`;

const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/js/app.js",
  "/js/lib/idb.js",
  "/js/lib/idbUtility.js",
  "/styles/style.css",
  "/images/bootstrap.png",
  "/js/cache-then-network.js",
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

function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) {
    cachePath = string.substring(self.origin.length);
  } else {
    cachePath = string;
  }
  return array.indexOf(cachePath) > -1;
}

addEventListener("install", event => {
  console.log("SW installed...", event);
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
  );
});

addEventListener("activate", event => {
  // self.addEventListener()
  console.log("SW activated..asd.", event);
  event.waitUntil(self.clients.claim());

  event.waitUntil(
    caches.keys().then(keysList => {
      return Promise.all(
        keysList.map(key => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    })
  );
});

addEventListener("fetch", event => {
  // if (event.request.url.indexOf("http") !== -1) {
  //   event.respondWith(
  //     caches.match(event.request).then(response => {
  //       if (response) {
  //         return Promise.resolve(response);
  //       } else {
  //         return fetch(event.request)
  //           .then(res => {
  //             return caches.open(DYNAMIC_CACHE).then(cache => {
  //               cache.put(event.request, res.clone()).then(() => {
                //   trimCache(DYNAMIC_CACHE, 10);
                // });
  //               return Promise.resolve(res);
  //             });
  //           })
  //           .catch(() => {
  //             if(event.request.headers.get("accept").includes("text/html")) {
  //               return caches.open(STATIC_CACHE).then(cache => {
  //                 return cache.match("/offline.html").then(response => {
  //                   return Promise.resolve(response);
  //                 });
  //               })
  //             }
  //           });
  //       }
  //     })
  //   );
  // }

  // if (event.request.url.indexOf("http") !== -1) {
  //   event.respondWith(
  //     fetch(event.request)
  //       .then(response => {
  //         return caches.open(DYNAMIC_CACHE).then(cache => {
  //           cache.put(event.request, response.clone());
  //           return Promise.resolve(response);
  //         })
  //       })
  //       .catch(() => {
  //         return caches.match(event.request);
  //       }))
  // }

  if (event.request.url.indexOf("http") !== -1) {
    if (event.request.url.indexOf('https://randomuser.me/api') > -1) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            const clonedResponse = response.clone();
            clonedResponse.json().then(
              data => {
                if (Array.isArray(data.results)) {
                  clearAllData('users');
                  data.results.forEach(user => {
                    writeData('users', user);
                  })
                }
              }
            )

            return Promise.resolve(response);
          })
      )
    } else if (isInArray(event.request.url, STATIC_FILES)) {
      event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
          .then(response => {
            console.log('returned from cache only', event.request.url)
            return Promise.resolve(response ? response : new Response())
          })
          .catch(() => {})
      )
    } else {
      event.respondWith(
        caches.match(event.request).then(response => {
          if (response) {
            return Promise.resolve(response);
          } else {
            return fetch(event.request)
              .then(res => {
                return caches.open(DYNAMIC_CACHE).then(cache => {
                  cache.put(event.request, res.clone()).then(() => {
                    trimCache(DYNAMIC_CACHE, 10);
                  });
                  return Promise.resolve(res);
                });
              })
              .catch(() => {
                if(event.request.headers.get("accept").includes("text/html")) {
                  return caches.open(STATIC_CACHE).then(cache => {
                    return cache.match("/offline.html").then(response => {
                      return Promise.resolve(response);
                    });
                  })
                }
              });
          }
        })
      );
    }
  }
});
