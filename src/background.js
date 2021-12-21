chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    let url = String(msg.api || msg.link);
    if (url.startsWith('http://'))
        url = 'https' + url.slice(4);
    fetch(url, { credentials: 'omit' })
        .then(resp => resp.text())
        .then(text => sendResponse([msg, text]));
    return true;
});
