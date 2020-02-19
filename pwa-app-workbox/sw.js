importScripts("node_modules/workbox-sw/build/workbox-sw.js");
importScripts("js/lib/idb.js");
importScripts("js/lib/idbUtility.js");

const {
  strategies,
  precaching,
  routing,
  cacheableResponse,
  expiration,
  backgroundSync
} = workbox;

precaching.precacheAndRoute([{"revision":"d027040153f1f0d15a6a8902c6ad8f21","url":"index.html"},{"revision":"d7ee0bfbbcc104965d63091eb1008387","url":"js/app.js"},{"revision":"017ced36d82bea1e08b08393361e354d","url":"js/lib/idb.js"},{"revision":"d091a8b5f8de8c9171f9bfb9afc4ed5e","url":"js/lib/idbUtility.js"},{"revision":"19a9c2e050c2d1a9aafa4361b1ebb2b7","url":"js/reading-from-idb.js"},{"revision":"ee7907f74348c741b23fa44bb42af6ac","url":"js/sending-form.js"},{"revision":"174927677b6f64a5d29aa86a8145ba28","url":"manifest.json"},{"revision":"2c569901991f50525b4a785a4cae5e33","url":"offline.html"},{"revision":"a009e2f16089a574060dd4b6b45c1cbd","url":"package-lock.json"},{"revision":"3e0bcf3f639af500cb3f7ba62000f16d","url":"package.json"},{"revision":"a1fcb685c5e2221c411e4221afd543a9","url":"styles/style.css"},{"revision":"39999a4900072b8786b0a77614fcc132","url":"workbox-7c85bfc1.js"},{"revision":"179ffef67c1cf10fc16cfd906ac286bf","url":"workbox-config.js"}]); // odpowiednik precache w momencie eventu "install"

workbox.core.clientsClaim();

routing.registerRoute(
  /.*(?:bootstrapcdn|jquery)\.com.*$/,
  new strategies.NetworkFirst({
    cacheName: "online-assets",
    plugins: [
      new cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new expiration.ExpirationPlugin({
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
      new cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

routing.registerRoute(
  /https:\/\/httpbin.org\/post/,
  new strategies.NetworkOnly({
    plugins: [
      new backgroundSync.BackgroundSyncPlugin('sync-posts', {
        maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
      })
    ]
  }),
  'POST'
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
