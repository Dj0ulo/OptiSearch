chrome.extension.onConnect.addListener(port => {
  port.onMessage.addListener(msg => {
    fetch(msg.link)
      .then(response => response.text())
      .then(text => {
        const site = Sites[msg.site];
        if (site) {
          const doc = new DOMParser().parseFromString(text, "text/html");
          port.postMessage(site.get(msg, doc));
        }
      })
  })
})
