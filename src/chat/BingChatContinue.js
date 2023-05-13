(async () => {
  continueChat();
  async function continueChat() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('showconv') !== '1')
      return;

    const sessionID = url.searchParams.get('continuesession');
    if (!sessionID)
      return;

    const conv = await new Promise(resolve =>
      chrome.runtime.sendMessage({ action: 'session-storage', type: 'get', key: sessionID }, resolve));
    if (!conv || conv.hasContinued)
      return;
    conv.hasContinued = true;
    chrome.runtime.sendMessage({ action: 'session-storage', type: 'set', key: sessionID, value: conv });
    
    const scriptElement = el('script', {
      id: 'BingChatContinueScript',
      type: 'text/javascript',
      src: chrome.runtime.getURL('src/chat/BingChatContinueScript.js'),
    }, document.body);
    scriptElement.dataset.conv = JSON.stringify(conv);
  }
})();
