async function adoptStyleSheet(stylesheets = ['panel', 'code-light-theme', 'code-dark-theme']) {
  const cssContents = await Promise.all(stylesheets.map(s => get(`../../styles/${s}.css`)));

  document.adoptedStyleSheets = cssContents.map(c => {
    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(c);
    return sheet;
  });
}

function optisearchPanel(template, url, doc) {
  try {
    const content = contentFromTemplate(template, doc);
    content.link = url;
    const panel = panelFromSite(content);

    prettifyCode(panel.querySelector('.optibody'));
    return panel;
  } catch (error) {
    return formatError(error);
  }
}

function errorBox(errorMsg, parent) {
  const box = boxEl(formatError(errorMsg));
  parent.appendChild(box);
  return box;
}

function formatError(errorMsg) {
  console.error(errorMsg);
  const errorEl = el('div');
  errorEl.innerHTML = ('' + errorMsg).replace(/\n/g, '<br>');
  errorEl.className = 'optisearch-error';
  return errorEl;
}

function boxEl(element) {
  const box = el('div', { className: 'optisearchbox dark' });
  box.append(element);
  return box;
}

async function get(url) {
  if (!url)
    return '';
  url = url.trim();
  
  if (url.startsWith('http')) {
    let cache = localStorage['cache'] ? JSON.parse(localStorage['cache']) : {};
    if (url in cache && Date.now() < cache[url].expire) {
      console.log('HIT', cache[url]);
      return cache[url].content;
    }
    cache[url] = {};
    return await bgFetch(url)
      .then(r => {
        cache = localStorage['cache'] ? JSON.parse(localStorage['cache']) : {};
        cache[url] = {};
        cache[url].content = r;
        cache[url].expire = Date.now() + 3_600_000;
        localStorage['cache'] = JSON.stringify(cache);
        return r;
      });
  }
  return await fetch(url)
    .then(async r => {
      if (r.ok)
        return await r.text();
      throw parseHTML(await r.text()).body.innerHTML;
    });
}