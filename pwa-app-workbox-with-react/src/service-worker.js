importScripts("./lib/idb.js");
importScripts("./lib/idbUtility.js");

const {
  strategies,
  precaching,
  routing,
  cacheableResponse,
  expiration,
  backgroundSync,
  core
} = workbox;

precaching.precacheAndRoute(self.__precacheManifest);

core.clientsClaim();

routing.registerRoute(
  /.*(?:bootstrapcdn|jquery)\.com.*$/,
  new strategies.NetworkFirst({
    cacheName: "online-assets",
    plugins: [
      new cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

routing.registerRoute(
  /.jpg|.png|.ico|.svg|.gif$/,
  new strategies.NetworkFirst({
    cacheName: "dynamic-assets",
    plugins: [
      new cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

routing.registerRoute(
  ({ event }) => event.request.headers.get('accept').includes('text/html'),
  ({ event, url }) => {
    return fetch(event.request)
      .then(response =>
        caches
          .open('dynamic-html')
          .then(cache => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
              return Promise.resolve(response);
            }

            return returnPageOrFallbackFromCache(url);
          })
      )
      .catch(() => returnPageOrFallbackFromCache(url))
  }
);

routing.registerRoute(/(https:\/\/randomuser.me\/api).*/, ({ event }) => 
    fetch(event.request)
    .then(response => {
      const clonedResponse = response.clone();
      clonedResponse
        .json()
        .then(data => {
          if (Array.isArray(data.results)) {
            clearAllData("users");
            data.results.forEach(user => {
              writeData("users", user);
            });
          }
        });

      return Promise.resolve(response);
  })
);

routing.registerRoute(
  /https:\/\/httpbin.org\/post/,
  new strategies.NetworkOnly({
    plugins: [
      new backgroundSync.Plugin('sync-posts', {
        maxRetentionTime: 24 * 60
      })
    ]
  }),
  'POST'
);

function returnPageOrFallbackFromCache(url) {
  return caches
    .match(url)
    .then(response => {
      if (response) {
        return Promise.resolve(response);
      } else {
        return caches
          .match('/offline.html', { ignoreSearch: true })
          .then(response => Promise.resolve(response))
      }
    });
}
