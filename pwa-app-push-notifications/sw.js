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

precaching.precacheAndRoute([{"revision":"cfe78ef104a6a969e6556f41e4f451b2","url":"firebase.json"},{"revision":"995f3c3ba6bff9a2530a63689e5d0e26","url":"index.html"},{"revision":"11fabd9bb46ca5248be8727875be81f5","url":"js/app.js"},{"revision":"017ced36d82bea1e08b08393361e354d","url":"js/lib/idb.js"},{"revision":"d091a8b5f8de8c9171f9bfb9afc4ed5e","url":"js/lib/idbUtility.js"},{"revision":"be7505797f5bb302957ffcdca42adb25","url":"js/lib/utility.js"},{"revision":"19a9c2e050c2d1a9aafa4361b1ebb2b7","url":"js/reading-from-idb.js"},{"revision":"bb2d62bb49b7917cf1a718ce7f94409e","url":"js/sending-form.js"},{"revision":"174927677b6f64a5d29aa86a8145ba28","url":"manifest.json"},{"revision":"2c569901991f50525b4a785a4cae5e33","url":"offline.html"},{"revision":"eae50842f69046a7e5376ca8bfa33985","url":"package-lock.json"},{"revision":"a83dd17547a54866e2ab7f1a6fb8ca4b","url":"package.json"},{"revision":"a1fcb685c5e2221c411e4221afd543a9","url":"styles/style.css"},{"revision":"39999a4900072b8786b0a77614fcc132","url":"workbox-7c85bfc1.js"},{"revision":"929ece885f55b75b258f66b35a2da87e","url":"workbox-config.js"}]); // odpowiednik precache w momencie eventu "install"

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

routing.registerRoute(/(https:\/\/randomuser\.me\/api).*/, ({ event }) => 
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
  /https:\/\/us-central1-faceducks\.cloudfunctions\.net\/storePostData/,
  new strategies.NetworkOnly({
    plugins: [
      new backgroundSync.BackgroundSyncPlugin('sync-posts', {
        maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
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

addEventListener('notificationclick', event => {
  const {notification, action} = event;

  if (action === 'confirm') {
    console.log('confirmed')
  } else {
    console.log('cancel')
    event.waitUntil(
      clients.matchAll()
        .then(function(clis) {
          var client = clis.find(function(c) {
            return c.visibilityState === 'visible';
          });

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );
  }

  notification.close();
})

addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event);
});

addEventListener("push", event => {
  console.log('Push Notification received', event);

  var data = {title: 'New!', content: 'Something new happened!', openUrl: '/'};

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/images/icons/app-icon-96x96.png',
    badge: '/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
})