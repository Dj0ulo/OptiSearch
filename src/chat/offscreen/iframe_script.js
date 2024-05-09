/**
 * Script running in the iframe that has the correct origin.
 */

(() => {
  window.parent.postMessage('iframe-script-ready', '*');

  window.addEventListener('message', onReceiveMessageFromParent);

  function onReceiveMessageFromParent(event) {
    if (event.origin !== new URL(chrome.runtime.getURL("")).origin) return;

    const data = event.data;
    if (!('scripts' in data)) return;

    data.scripts.forEach(insertScript);
    acknowledge(data.messageId, data.scriptElementId);

    window.removeEventListener('message', onReceiveMessageFromParent);
  }

  function acknowledge(messageId, scriptElementId) {
    window.parent.postMessage({
      message: `Script "${scriptElementId}" succesfully injected`,
      messageId: messageId,
    }, '*');
  }

  function insertScript(src) {
    const scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.src = src;
    document.body.appendChild(scriptElement);
  }

})();