const strings = {
  scripts: ["src/background/websocket_utils.js", "src/chat/offscreen/bing_socket.js"],
  iframeSrc: "https://copilot.microsoft.com/favicon.ico?bing-chat-gpt-4-in-google",
}

const socketScriptReady = {
  _val: false,
  _listener: () => {},
  set val(val) {
    this._val = val;
    this._listener(val);
  },
  get val() {
    return this._val;
  },
  get promise() {
    return new Promise(resolve => this._listener = resolve);
  }
};

setupIframe(strings.scripts.map((src) => chrome.runtime.getURL(src)));

function setupIframe(scripts) {
  const iframe = createIframe(strings.iframeSrc);
  window.addEventListener('message', ({data}) => {
    switch (data) {
      case 'iframe-script-ready':
        injectScriptToIframe(iframe, scripts);
        break;
      case 'socket-script-ready':
        socketScriptReady.val = true;
        break;
    }
  });
  chrome.runtime.onMessage.addListener(onReceiveMessageFromExtension);
}

function createIframe(src) {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  document.firstElementChild.appendChild(iframe);
  return iframe;
}

function injectScriptToIframe(iframe, scripts) {
  const iframeWindow = iframe.contentWindow;
  iframeWindow.postMessage({ scripts }, "*");
}

function onReceiveMessageFromExtension(message, _, sendResponse) {
  if (message.target !== 'offscreen') return;
  switch (message.action) {
    case 'url':
      sendResponse(window.location.href);
      break;
    default:
      sendMessageToIframe(message).then(sendResponse);
      break;
  }
  return true;
}

async function sendMessageToIframe(message) {
  const iframe = document.querySelector('iframe');
  if (!iframe) {
    throw 'No iframe';
  }

  if (!socketScriptReady.val) {
    await socketScriptReady.promise;
  }

  const messageId = Math.random().toString(36).substring(7);
  return new Promise(resolve => {
    const messageHandler = (event) => {
      if (event.data && event.data.messageId === messageId) {
        resolve(event.data.message);
        window.removeEventListener('message', messageHandler);
      }
    };

    window.addEventListener('message', messageHandler);
    iframe.contentWindow.postMessage({ message, messageId }, '*');
  });
}
