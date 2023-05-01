(async () => {
  let styles = ['panel', 'tomorrow', 'sunburst'];
  const cssContents = await Promise.all(styles.map(s => get(`../../styles/${s}.css`)));

  document.adoptedStyleSheets = cssContents.map(c => {
    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(c);
    return sheet;
  });

  ['url-template', 'url-html'].map((id) => {
    const inputEl = document.querySelector(`input[name="${id}"]`);
    if (localStorage[id])
      inputEl.value = localStorage[id];

    inputEl.parentElement.onsubmit = async (event) => {
      event.preventDefault();
      const val = inputEl.value.trim();
      localStorage[id] = val;
      inputEl.value = val;
      if (id === 'url-template')
        return;
        
      try {
        localStorage[id.slice(4)] = await get(val);
      } catch (e) {
        printError(e);
        return;
      }
      panel();
    };
    return inputEl;
  });

  if (localStorage['html'])
    panel();

  async function panel() {
    try{
      const template = await get(localStorage['url-template']);
      const doc = localStorage['html'];
      const content = contentFromTemplate(template, doc);
      content.link = localStorage['url-html'];
      const panel = panelFromSite(content);

      const box = document.querySelector('.optisearchbox');
      box.innerHTML = '';
      box.style.backgroundColor = '';
      box.append(panel);
      prettifyCode(panel.querySelector('.optibody'), true);
    } catch (e) {
      printError(e);
    }
  }

  function printError(error) {
    console.error(error);

    const box = document.querySelector('.optisearchbox');
    box.innerHTML = '';
    const errorEl = document.createElement('div');
    errorEl.innerHTML = ('' + error).replace(/\n/g, '<br>');
    errorEl.className = 'error';
    box.append(errorEl);
  }

  async function get(url) {
    url = url.trim();
    if(url.startsWith('http')){
      return await bgFetch(url).catch(printError);
    }
    return await fetch(url)
      .then(async r => {
        if (r.ok)
          return await r.text();
        throw parseHTML(await r.text()).body.innerHTML;
      });
  }
})();
