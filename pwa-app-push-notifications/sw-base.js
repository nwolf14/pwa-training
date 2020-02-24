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

precaching.precacheAndRoute(self.__WB_MANIFEST); // odpowiednik precache w momencie eventu "install"

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
    event.waitUntil(
      clients.matchAll()
        .then(function(macthedClients) {
          const client = macthedClients.find(c => c.visibilityState === 'visible');

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
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
    registration.showNotification(data.title, options)
  );
})