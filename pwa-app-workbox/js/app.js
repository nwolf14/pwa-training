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
