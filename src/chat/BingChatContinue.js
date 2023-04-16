(async () => {
  continueChat();
  copyButtons();

  /**  */
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

  /** Append a copy buttons to <pre> elements when they appear in the DOM */
  function copyButtons() {
    observeShadowRoots((mutations) => {
      const pres = mutations
        .filter(m => !!m.addedNodes.length)
        .map(m => [...m.addedNodes]
            .filter(node => node.tagName?.startsWith('CIB-'))
            .map(x => [...$$shadow('pre', x)])
            .flat()
        ).flat();

      pres.forEach(pre => {
        pre.style.position = 'relative';
        el('style', {
          textContent: `
            .opticopy {
              position: absolute; width: auto; height: auto;
              right: 6px; top: 6px;
              user-select: none; font-size: x-small; opacity: 70%;
            }
            .opticopy svg { width: 15px; height: 15px; stroke: #bbc0c4; }
            .opticopy svg:hover { stroke: #9fa6ad; cursor: pointer; }`,
        }, pre);
        pre.append(createCopyButton(pre.innerText.trim()));
      });
    }, document.body, { childList: true, subtree: true });
  }

  /**
   * Observe a node that contains shadowRoot elements
   * @param {MutationCallback} handle 
   * @param {Node} target 
   * @param {MutationObserverInit | undefined} options 
   */
  function observeShadowRoots(handle, target, options) {
    setObserver((mutations, observer) => {
      mutations
        .filter(m => !!m.addedNodes.length)
        .forEach(m =>
          [...m.addedNodes]
            .filter(node => node.shadowRoot)
            .forEach(node => observeShadowRoots(handle, node.shadowRoot, options))
        );
      handle(mutations, observer);
    }, target, options);

    if (target.shadowRoot) {
      observeShadowRoots(handle, target.shadowRoot, options);
    }

    [...target.querySelectorAll('*')]
      .filter(child => child.shadowRoot)
      .forEach(child => observeShadowRoots(handle, child.shadowRoot, options));
  };

  /**
   * Make a querySelectorAll bypassing the shadowRoot elements
   * @param {string} query 
   * @param {HTMLElement} element 
   * @returns 
   */
  function $$shadow(query, element = document) {
    return [
      ...element.querySelectorAll(query),
      ...(element.shadowRoot ? $$shadow(query, element.shadowRoot) : []),
      ...[...element.querySelectorAll('*')]
        .filter(x => x.shadowRoot)
        .map(x => $$shadow(query, x.shadowRoot))
        .flat()
    ];
  }
})();
