chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    fetch(msg.api || msg.link, { credentials: 'omit' })
        .then(resp => resp.text())
        .then(text => sendResponse([msg, text]));
    return true;
});
