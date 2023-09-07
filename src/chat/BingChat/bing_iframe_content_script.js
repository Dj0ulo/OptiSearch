(() => {
  window.parent.postMessage({
    message: 'ready',
    sender: 'content-script',
  }, '*');

  window.addEventListener('message', onReceiveMessage);

  function onReceiveMessage(event) {
    if (event.origin !== new URL(chrome.runtime.getURL("")).origin) return;
    const data = event.data;
    if (!('scriptToInject' in data)) return;

    const scriptElement = document.createElement('script');
    scriptElement.id = data.scriptElementId;
    scriptElement.type = 'text/javascript';
    scriptElement.src = data.scriptToInject;
    document.body.appendChild(scriptElement);

    window.parent.postMessage({
      message: `Script "${data.scriptElementId}" succesfully injected`,
      messageId: event.data.messageId,
    }, '*');
    window.removeEventListener('message', onReceiveMessage);
  }
})();