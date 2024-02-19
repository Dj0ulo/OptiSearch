window.addEventListener('message', onIframeReady);
function onIframeReady({data}) {
  if (data.message === 'ready' && data.sender === 'content-script') {
    injectScriptToIframe();
    window.removeEventListener('message', onIframeReady);
  }
}

let socketScriptReady = {
  _val: false,
  _listener: function(val) {},
  set val(val) {
    this._val = val;
    this._listener(val);
  },
  get val() {
    return this._val;
  },
  registerListener: function(listener) {
    this._listener = listener;
  }
};
window.addEventListener('message', onSocketScriptReady);
function onSocketScriptReady({data}) {
  if (data.message === 'ready' && data.sender === 'socket-script') {
    socketScriptReady.val = true;
    window.removeEventListener('message', onSocketScriptReady);
  }
}

function injectScriptToIframe() {
  const iframeWindow = document.querySelector("iframe").contentWindow;
  iframeWindow.postMessage(
    {
      scripts: [
        {
          id: "websocket-script",
          src: chrome.runtime.getURL("src/background/websocket_utils.js"),
        },
        {
          id: "bing-socket-script",
          src: chrome.runtime.getURL("src/chat/bingchat/bing_socket.js"),
        },
      ],
    },
    "*"
  );
};

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.target !== 'offscreen') return;
  if (message.action === 'url') {
    sendResponse(window.location.href);
  } else {
    sendMessageToIframe(message).then(sendResponse);
  }
  return true;
});


async function sendMessageToIframe(message) {
  const iframe = document.querySelector('iframe');
  if (!iframe) {
    throw 'No iframe';
  }

  if (!socketScriptReady.val) {
    await new Promise(resolve => socketScriptReady.registerListener(resolve));
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
