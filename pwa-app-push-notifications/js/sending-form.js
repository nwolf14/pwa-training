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

    sendData(data);
  }

  function sendData(data) {
    fetch('https://us-central1-faceducks.cloudfunctions.net/storePostData', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.log(error))
  }
})();
