importScripts("node_modules/workbox-sw/build/workbox-sw.js");
importScripts("js/lib/idb.js");
importScripts("js/lib/idbUtility.js");

const { strategies, precaching, routing } = workbox;

precaching.precacheAndRoute(self.__WB_MANIFEST);

routing.registerRoute(
  /.*(?:bootstrapcdn|jquery)\.com.*$/,
  new strategies.NetworkFirst({ cacheName: "online-assets" })
);

routing.registerRoute(
  /.jpg|.png|.ico|.svg|.gif$/,
  new strategies.NetworkFirst({ cacheName: "dynamic-assets" })
);

routing.registerRoute(/(https:\/\/randomuser.me\/api).*/, ({ event }) => 
    fetch(event.request)
    .then(response => {
      const clonedResponse = response.clone();

      clonedResponse
        .json()
        .then(data => {
          if (Array.isArray(data.results)) {
            data.results.forEach(user => {
              clearAllData("users");
              writeData("users", user);
            });
          }
        });

      return response;
  })
);

routing.registerRoute(
  ({ event }) => event.request.headers.get('accept').includes('text/html'),
  ({ event, url }) => {
    return fetch(event.request)
      .then(function(response) {
        return caches
          .open('dynamic-html')
          .then(function(cache) {
            if (response.statusCode === 200) {
              cache.put(event.request.url, response.clone());
              return response;
            }

            return returnPageOrFallbackFromCache(event, url);
          });
      })
      .catch(() => returnPageOrFallbackFromCache(event, url))
  }
);

function returnPageOrFallbackFromCache(event, url) {
  return caches
    .match(event.request.url)
    .then(response => {
      if (response) {
        return response;
      } else {
        return caches
          .match('/offline.html', { ignoreSearch: true })
          .then(response => response)
      }
    });
}
