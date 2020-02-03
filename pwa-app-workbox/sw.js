importScripts("node_modules/workbox-sw/build/workbox-sw.js");
importScripts("js/lib/idb.js");
importScripts("js/lib/idbUtility.js");

const { strategies, precaching, routing } = workbox;

precaching.precacheAndRoute([{"revision":"ad046346a904e133aab139a28e8780a4","url":"about.html"},{"revision":"0721ec13687eaed4a6701a2e008fcaed","url":"index.html"},{"revision":"23f68ebc18362f7c19228164c9cf3a30","url":"js/app.js"},{"revision":"017ced36d82bea1e08b08393361e354d","url":"js/lib/idb.js"},{"revision":"20a01114d384f473add5106e80274958","url":"js/lib/idbUtility.js"},{"revision":"19a9c2e050c2d1a9aafa4361b1ebb2b7","url":"js/reading-from-idb.js"},{"revision":"17a45c8831c9fb032d560cc6929d612e","url":"offline.html"},{"revision":"a1fcb685c5e2221c411e4221afd543a9","url":"styles/style.css"},{"revision":"39999a4900072b8786b0a77614fcc132","url":"workbox-7c85bfc1.js"},{"revision":"c3a861075c7762b45f3125bf441771c2","url":"workbox-config.js"}]);

routing.registerRoute(
  /.*(?:bootstrapcdn|jquery)\.com.*$/,
  new strategies.NetworkFirst({ cacheName: "online-assets" })
);

routing.registerRoute(
  /.json|.jpg|.png$/,
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
  ({ event }) => {
    return fetch(event.request)
      .then(response => {
        return caches
          .open('dynamic-html')
          .then(function(cache) {
            if (response.statusCode === 200) {
              cache.put(event.request.url, response.clone());
              return response;
            }

            return returnPageFromCache(event);
          });
      })
      .catch(() => returnPageFromCache(event))
  }
);

function returnPageFromCache(event) {
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
