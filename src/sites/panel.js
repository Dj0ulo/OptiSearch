function contentFromTemplate(xsl, html) {
  const template = xsl;
  const doc = parseHTML(html);
  window.extdoc = doc;
  const res = parseHTML(xslTransform(parseXML(template), doc));

  res.querySelectorAll('style, script').forEach(el => {
    try { res.removeChild(el) } catch (e) { }
  });

  const optiheader = res.querySelector('optiheader');
  return {
    title: optiheader?.title,
    body: res.querySelector('optibody'),
    foot: res.querySelector('optifoot'),
    icon: optiheader?.getAttribute('icon'),
    styles: [...res.querySelectorAll('optistyle')],
  };
}

function panelFromSite({ site, title, link, icon, header, body, foot, styles }) {
  const panel = el("div", { className: 'optipanel' });
  const headPanel = el("div", { className: "optiheader" }, panel);
  //watermark
  el("div", { className: "watermark", textContent: "OptiSearch" }, headPanel);

  const a = el("a", { href: link, className: "result-link" }, headPanel);

  toTeX(el("div", { className: "title result-title", textContent: title }, a), false);

  const linkElement = el("cite", { className: "optilink result-url" }, a);
  if (!icon && link)
    icon = new URL(link).origin + "/favicon.ico";
  el("img", { width: 16, height: 16, src: icon }, linkElement);
  el("span", { textContent: link }, linkElement);

  if (body)
    hline(panel);

  const opticontentId = `opticontent-${generateUUID().slice(0, 8)}`;
  const content = el('div', { id: opticontentId }, panel);

  convertOptiStyles(styles, opticontentId);
  content.append(mergeStyles(styles));

  if (header) {
    content.append(header);
    hline(content);
  }
  if (body) {
    body.classList.add("optibody");

    if (site === "stackexchange") {
      $$('.math-container', body).forEach((e) => toTeX(e, true));
    }

    prettifyCode(body);
    content.append(body);
  }
  if (foot) {
    foot.classList.add("optifoot")
    foot.id = "output";
    hline(content);
    content.append(foot);
  }

  writeHostOnLinks(link, panel);

  return panel;
}

function convertOptiStyles(styles, opticontentId) {
  styles.forEach(el => {
    el.innerHTML = addParentCssSelectors(el.innerHTML, '#' + opticontentId);
    const colorSheme = el.getAttribute('color-sheme');
    if (colorSheme)
      el.innerHTML = addParentCssSelectors(el.innerHTML, `.optisearchbox.${colorSheme === 'dark' ? 'dark' : 'bright'}`);
  });
}

function mergeStyles(styles) {
  return el('style', { innerHTML: styles.map(el => el.innerHTML).join('\n').trim() });
}

function addParentCssSelectors(cssText, parent) {
  return cssText.replace(/([^{}]+){([^}]*)}/g, (_, selector, body) =>
    `${selector.split(",").map(s => `${parent} ${s.trim()}`).join(", ")} {${body}}\n`
  );
}