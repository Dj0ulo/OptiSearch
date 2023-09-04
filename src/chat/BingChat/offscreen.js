if (typeof browser !== 'undefined') {
  // On Firefox
  chrome.webRequest.onBeforeSendHeaders.addListener((e) => {
    if (e.type !== "main_frame")
      return;
    for (const header of e.requestHeaders) {
      if (header.name.toLowerCase() === "user-agent") {
        header.value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/111.0.1661.62";
        break;
      }
    }
    return { requestHeaders: e.requestHeaders };
  },
    { urls: ["https://www.bing.com/*"] },
    ["blocking", "requestHeaders"]
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;
  if (message.action === 'url') {
    sendResponse(window.location.href);
  } else {
    sendMessageToIframe(message, sendResponse);
  }
  return true;
});


function sendMessageToIframe(message, callback) {
  const iframe = document.querySelector('iframe');
  if (!iframe) {
    throw 'No iframe';
  }

  const messageId = Math.random().toString(36).substring(7);

  const messageHandler = (event) => {
    if (event.data && event.data.messageId === messageId) {
      callback(event.data.message);
      window.removeEventListener('message', messageHandler);
    }
  };

  window.addEventListener('message', messageHandler);
  iframe.contentWindow.postMessage({ message, messageId }, '*');
}
