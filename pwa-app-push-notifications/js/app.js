if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(function() {
    console.log("SW registered");
  });
}

// window.addEventListener("beforeinstallprompt", function(event) {
//   console.log("before install prompt fired");
//   event.preventDefault();
//   deferedPrompt = event;
//   return false;
// });

// (() => {
//   let deferedPrompt;

//   document.querySelector(".navbar-brand").addEventListener("click", event => {
//     if (deferedPrompt) {
//       deferedPrompt.prompt();

//       deferedPrompt.userChoice.then(function(choiceResult) {
//         console.log(choiceResult.outcome);
//       });

//       deferedPrompt = null;
//     }
//   });
// })();

Notification.requestPermission(result => {
  console.log(result);
  if (result === "granted") {
    configurePushSubscription();
  }
});

function configurePushSubscription() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let reg;
  navigator.serviceWorker.ready.then(sw => {
    reg = sw;
    sw.pushManager
      .getSubscription()
      .then(sub => {
        if (sub === null) {
          const vapidPublicKey =
            "BEqRObYAe3y9NKWaSma2VyAQo0ajPwo11K0GESzCq2Eq93nl5nr-e8H8_CkZZAB1H3Dz8-kUKIyFy3-fB6N_l0Q";
          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

          const newSub = reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
          });

          return newSub;
        }
      })
      .then(newSub => {
        if (!newSub) throw "Subscription already exists";

        return fetch("https://faceducks.firebaseio.com/subscriptions.json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(newSub)
        });
      })
      .then(res => {
        if (res.ok) {
          displayConfirmNotification();
        }
      })
      .catch(err => {
        console.log(err);
      });
  });
}

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    const options = {
      body: "You successfully subscribed to our Notification service!",
      icon: "/images/icons/app-icon-92x92.png",
      image: "/images/bootstrap.png",
      dir: "ltr",
      lang: "en-US", // BCP 47,
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-92x92.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "Okay",
          icon: "/src/images/icons/app-icon-92x92.png"
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-92x92.png"
        }
      ]
    };

    navigator.serviceWorker.ready.then(function(swreg) {
      swreg.showNotification("Successfully subscribed!", options);
    });
  }
}
