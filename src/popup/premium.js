(async function () {
  renderDocText();

  document.body.className = WhichExtension;
  const manifest = chrome.runtime.getManifest();
  $('#extension-name').textContent = manifest.name;
  $('#title-container img').src = chrome.runtime.getURL(manifest.icons[128]);

  const benefits = {
    save: [SVG.filledBookmark, _t('<strong>Save your conversation</strong> for later')],
    chat: [SVG.chat, _t('<strong>Chat directly</strong> in the result page')],
    bingSearch: [SVG.emptySet, _t('<strong>Disable Bing internal search</strong> and save time')],
  };
  const benefitsContainer = $("#benefits");
  Object.entries(benefits).forEach(([id, [icon, html]]) => {
    if (id === 'bingSearch' && WhichExtension !== 'bingchat') return;
    setSvg(el("div", { className: "icon" }, benefitsContainer), icon);
    el("div", { className: "description", innerHTML: html }, benefitsContainer);
  });

  el('img', { src: `../images/${WhichExtension}_conversation_example.png` }, $('#example-screenshot'));
  const extensionsNames = {
    'optisearch': _t('OptiSearch (for ChatGPT)'),
    'bingchat': _t('bingchatName'),
    'bard': _t('bardName'),
  };
  const otherExtensionsContainer = $('#other-extensions');
  Object.entries(extensionsNames).forEach(([id, name]) => {
    if (id === WhichExtension) return;
    const container = el('div', {}, otherExtensionsContainer);
    el("img", {
      alt: `${name} icon`,
      src: chrome.runtime.getURL(`icons/${id}/icon_128.png`),
    }, container);
    el("a", {
      textContent: name,
      href: webstores[id],
    }, container);
  });

  const upgradeButton = $("#upgrade-button");
  upgradeButton.addEventListener('click', async () => {
    extpay.openPaymentPage();
    setInterval(window.close, 1000);
  });

  hrefPopUp();
})();