(() => {
  const url = "https://randomuser.me/api/?seed=foobar";

  function renderUser(data) {
    const containerNode = document.querySelector(".user-data-container");
    const newFragment = document.createDocumentFragment();
    const newHeadingNode = document.createElement("h4");
    const newParagraphNode = document.createElement("p");

    newHeadingNode.innerText = `${data.name.first} ${data.name.last}`;
    newParagraphNode.innerText = data.email;

    newFragment.appendChild(newHeadingNode);
    newFragment.appendChild(newParagraphNode);
    containerNode.appendChild(newFragment);
  }

  fetch(url)
    .then(response => response.json())
    .then(data => renderUser(data.results[0]));

  const btn = document.querySelector("#cacheOnDemandBtn");
  btn.addEventListener("click", () => {
    if ("caches" in window) {
      caches.open("user-requested").then(cache => {
        cache.add(url);
      });
    }
  });
})();
