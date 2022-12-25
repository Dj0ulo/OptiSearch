const eventStreams = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'get-image-blob':
      fetch(msg.url)
        .then(response => response.blob())
        .then(imageBlob => sendResponse(imageBlob));
      break;
    case 'fetch':
      fetch(msg.url, msg.params && JSON.parse(msg.params))
        .catch(e => sendResponse({ isError: true, errorMsg: e.toString() }))
        .then(async r => {
          if (r.headers.get("content-type").startsWith("application/json"))
            return await r.json();
          else if (r.headers.get("content-type").startsWith("text/event-stream")) {
            eventStreams.push(r.body.getReader());
            return { eventStream: true, index: eventStreams.length - 1 };
          }
          else if(!r.ok)
            return {
              status: r.status,
              body: await r.text(),
            };
          else
            return await r.text();
        })
        .then(sendResponse)
      break;
    case 'event-stream':
      if (!eventStreams[msg.index]){
        sendResponse({ isError: true, errorMsg: `Error: event-stream ${msg.index} not available` })
        return true;
      }
      eventStreams[msg.index].read().then(({ done, value }) => {
        sendResponse({
          done,
          value: [...value.values()].map(c => String.fromCharCode(c)).join('')
        })
      });
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
      chrome.storage.local.set({ [SAVE_QUERIES_ENGINE]: json });
      return json;
    })
    .catch(async () => {
      if (local)
        throw new Error("No local engines found...");
      return fetchEngines(true);
    });
}
fetchEngines();