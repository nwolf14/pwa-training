(() => {
  const containerNode = document.querySelector(".user-data-container");
  const url = "https://randomuser.me/api";

  function renderUser(data) {
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
    .then(data => {
      renderUser(data.results[0]);
    })
    .catch(() => {
      if ("indexedDB" in window) {
        readAllData('users')
          .then(data => {
            if (Array.isArray(data)) {
              renderUser(data[0]);
            }
          });
      }
    });
})();
