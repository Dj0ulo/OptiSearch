chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.action !== 'bing-socket' || message.target !== 'offscreen') return;
  sendMessageToIframe(message, sendResponse);
  return true;  
});


function sendMessageToIframe(message, callback) {
  const iframe = document.querySelector('iframe');
  if (!iframe) return;

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
