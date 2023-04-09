(async () => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('showconv') !== '1')
    return;

  const sessionID = url.searchParams.get('continuesession');
  if (!sessionID)
    return;

  const conv = await new Promise(resolve =>
    chrome.runtime.sendMessage({ action: 'session-storage', type: 'get', key: sessionID }, resolve));
  if (!conv)
    return;

  // remove it from storage 
  chrome.runtime.sendMessage({ action: 'session-storage', type: 'set', key: sessionID, value: null });

  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('type', 'text/javascript');
  scriptElement.setAttribute('src', chrome.runtime.getURL('src/chat/BingChatContinueScript.js'));
  scriptElement.id = 'BingChatContinueScript';
  scriptElement.dataset.conv = JSON.stringify(conv);
  document.body.appendChild(scriptElement);  
})();
