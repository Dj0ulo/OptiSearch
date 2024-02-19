(() => {
  window.parent.postMessage({
    message: 'ready',
    sender: 'content-script',
  }, '*');

  window.addEventListener('message', onReceiveMessage);

  function onReceiveMessage(event) {
    if (event.origin !== new URL(chrome.runtime.getURL("")).origin) return;
    const data = event.data;
    if (!('scripts' in data)) return;

    data.scripts.forEach(script => {
      const scriptElement = document.createElement('script');
      scriptElement.id = script.id;
      scriptElement.type = 'text/javascript';
      scriptElement.src = script.src;
      document.body.appendChild(scriptElement);
    });

    window.parent.postMessage({
      message: `Script "${data.scriptElementId}" succesfully injected`,
      messageId: event.data.messageId,
    }, '*');
    window.removeEventListener('message', onReceiveMessage);
  }
})();