chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'get-image-blob':
      fetch(msg.url)
        .then(response => response.blob())
        .then(imageBlob => sendResponse(imageBlob));
      break;
    default:
      let url = String(msg.api || msg.link);
      if (url.startsWith('http://'))
        url = 'https' + url.slice(4);
      fetch(url, { credentials: 'omit' })
        .then(resp => resp.text())
        .then(text => sendResponse([msg, text]));
  }

  return true;
});

const GIST = "https://gist.githubusercontent.com/Dj0ulo/7224203ee9be47ba5be6f57be1cd22c5/raw";
const SAVE_QUERIES_ENGINE = "save_queries_engine";

const fetchEngines = (local = false) => {
  let url = local ? chrome.runtime.getURL(`./src/engines.json`) : `${GIST}/engines.json`;
  return fetch(url)
    .then(async response => {
      if (!response.ok) 
        throw response
      const json = await response.json();
      chrome.storage.local.set({[SAVE_QUERIES_ENGINE]: json});
      return json;
    })
    .catch(async () => {
      if(local) 
        throw new Error("No local engines found...");
      return fetchEngines(true);
    });
}
fetchEngines();