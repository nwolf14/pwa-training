(() => {
  const formNode = document.querySelector('#exampleForm');
  formNode.addEventListener('submit', handleSubmit);

  function handleSubmit(event) {
    event.preventDefault();
    const data = {};
    data.id = new Date().getUTCMilliseconds();

    (Array.from(event.target.elements)).forEach(element => {
      if (element.tagName === "INPUT") {
        data[element.name] = element.value;
        element.value = "";
      }
    })

    if (!navigator.onLine && 'serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then(sw => {
          writeData('sync-posts', data)
            .then(() => sw.sync.register('sync-new-post'))
            .then(() => console.log('post registered'));
        })
    } else {
      sendData(data);
    }
  }

  function sendData(data) {
    fetch('https://httpbin.org/post', {
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.log(error))
  }
})();
