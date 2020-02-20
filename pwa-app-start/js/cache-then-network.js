(() => {
  let isFetched = false;
  const containerNode = document.querySelector('.user-data-container');
  const url = 'https://randomuser.me/api';

  function removeUsers() {
      if(containerNode.hasChildNodes()) {
        containerNode.innerHTML = null;
      }
  }

  function renderUser(data) {
    const newFragment = document.createDocumentFragment();
    const newHeadingNode = document.createElement("h4");
    const newParagraphNode = document.createElement("p");

    newHeadingNode.innerText = `${data.results[0].name.first} ${data.results[0].name.last}`;
    newParagraphNode.innerText = data.results[0].email;

    newFragment.appendChild(newHeadingNode);
    newFragment.appendChild(newParagraphNode);
    containerNode.appendChild(newFragment);
  }

  fetch(url)
    .then(response => response.json())
    .then(data => {
      removeUsers();
      renderUser(data);
      isFetched = true;
    })

  if ("caches" in window) {
    caches
      .match(url)
      .then(response => response ? response.json() : null)
      .then(data => {
        if (!isFetched && data) {
          renderUser(data);
        }
      })
  }
})()