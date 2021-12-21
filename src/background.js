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
