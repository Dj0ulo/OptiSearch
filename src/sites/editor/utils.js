async function adoptStyleSheet(stylesheets = ['panel', 'code-light-theme', 'code-dark-theme']) {
  const cssContents = await Promise.all(stylesheets.map(s => get(`../../styles/${s}.css`)));

  document.adoptedStyleSheets = cssContents.map(c => {
    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(c);
    return sheet;
  });
}

function optisearchbox(template, url, doc) {
  const box = el('div', { className: 'optisearchbox dark' });
  try {
    const content = contentFromTemplate(template, doc);
    content.link = url;
    const panel = panelFromSite(content);

    box.append(panel);
    prettifyCode(panel.querySelector('.optibody'));
  } catch (error) {
    box.append(formatError(error));
  }
  return box;
}

function formatError(error) {
  const errorEl = el('div');
  errorEl.innerHTML = ('' + error).replace(/\n/g, '<br>');
  errorEl.className = 'optisearch-error';
  return errorEl;
}

async function get(url) {
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
      }, console.error);
  }
  return await fetch(url)
    .then(async r => {
      if (r.ok)
        return await r.text();
      throw parseHTML(await r.text()).body.innerHTML;
    });
}