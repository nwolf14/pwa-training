let deferedPrompt;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then(function() {
    console.log("SW registered");
  });
}

window.addEventListener("beforeinstallprompt", function(event) {
  console.log("before install prompt fired");
  event.preventDefault();
  deferedPrompt = event;
  return false;
});

document.querySelector(".navbar-brand").addEventListener("click", event => {
  event.preventDefault();

  if (deferedPrompt) {
    deferedPrompt.prompt();

    deferedPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);
    });

    deferedPrompt = null;
  }
});
