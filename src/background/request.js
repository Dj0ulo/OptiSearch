chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(msg => {
    fetch(msg.api || msg.link,{
      credentials: 'omit'
    })
      .then(response => response.text())
      .then(text => {
        const site = Sites[msg.site];
        if (site) {
          let doc;
          if(msg.type === 'html')
            doc = new DOMParser().parseFromString(text, "text/html");
          else if(msg.type === 'json')
            doc = JSON.parse(text);
          port.postMessage({site: msg.site, link: msg.link, ...site.get(msg, doc), indexPanel: msg.indexPanel});
        }
      })
  })
})
