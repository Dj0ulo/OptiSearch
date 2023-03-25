class Context {
  static PANEL_CLASS = "optipanel";
  
  static async run() {
    debug("Hello !");

    Context.docHead = document.head || document.documentElement;

    await Context.injectStyle();

    const engines = await loadEngines();

    const siteFound = window.location.hostname;
    Context.engineName = Object.entries(engines)
      .find(([_, e]) => siteFound.search(new RegExp(e.regex)) != -1)[0];
    Context.engine = engines[Context.engineName];
    if (!Context.engine)
      return;

    if (!Context.parseSearchString()) {
      debug("No search string detected");
      return;
    }

    debug(`${Context.engineName} — "${Context.searchString}"`);

    // Change style based on the search engine
    const style = Context.engine.style;
    if (style) el('style', { textContent: style, className: `optistyle-${Context.engineName}` }, Context.docHead);

    Context.save = await loadSettings();
    // Bigger right column
    if (Context.isActive('wideColumn')) {
      const minW = 600;
      const maxW = 600;
      const widthStyle = Context.engine.widthStyle?.replace("${maxW}", maxW).replace("${minW}", minW);
      if (widthStyle) el('style', { textContent: widthStyle, className: `optistyle-${Context.engineName}` }, Context.docHead);
    }
    Context.parseRightColumn();
    Context.executeTools();

    /**
     * Update color if the theme has somehow changed
     */
    let prevBg = null;
    setInterval(() => {
      const bg = getBackgroundColor();
      if (bg === prevBg)
        return;
      prevBg = bg;
      Context.updateColor();
    }, 200)

  }

  static isActive(tool) {
    return Context.save[tool];
  }

  static parseSearchString() {
    Context.searchString = $(Context.engine.searchBox)?.value;
    return Context.searchString;
  }

  static async injectStyle() {
    const styles = ['chatgpt', 'panel', 'tomorrow', 'sunburst', 'w3schools', 'wikipedia', 'genius'];
    const cssContents = await Promise.all(styles.map(s => read(`src/styles/${s}.css`).catch(() => '')));
    el('style', { className: 'optistyle', textContent: cssContents.join('\n') }, Context.docHead);
  }

  static executeTools() {
    if (Context.isActive("aichat")) Context.aichat();
    if (Context.isActive("bangs")) Context.bangs();
    if (Context.isActive("calculator")) Context.calculator();
    if (Context.isActive("plot") || Context.isActive("calculator")) Context.plotOrCompute();
    if (typeof Sites !== 'undefined') Context.parseResults();
  }

  static prettifyCode(element, runPrettify = false) {
    $$("code, pre", element).forEach(c => c.classList.add("prettyprint"));

    $$("pre", element).forEach((pre) => {
      const surround = el("div", { className: "pre-surround", innerHTML: pre.outerHTML, style: "position: relative" });
      surround.append(createCopyButton(pre.innerText.trim()));

      pre.parentNode.replaceChild(surround, pre);
    });
    runPrettify && PR.prettyPrint();
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  static appendPanel(panel, prepend = false) {
    if (!Context.rightColumn)
      return null;

    const box = el("div", { className: `optisearchbox bright ${Context.engineName}` });
    if (prepend)
      Context.rightColumn.prepend(box);
    else
      Context.rightColumn.append(box);

    box.append(panel);
    Context.updateColor();

    return box;
  }

  /**
   * Get and/or add right column to the results page if there isn't one
   * @returns {Node} Context.rightColumn
   */
  static parseRightColumn() {
    const selectorRightCol = Context.engine.rightColumn;
    Context.rightColumn = $(selectorRightCol);
    if (Context.rightColumn)
      return Context.rightColumn;

    const centerColumn = $(Context.engine.centerColumn);
    if (!centerColumn)
      debug("No right column");

    // create a right column with the correct attributes
    const [sr] = selectorRightCol.split(',');
    const arr = [...sr.matchAll(/[\.#\[][^\.#,\[]+/g)]
    const attr = {}
    arr.map(a => a[0]).forEach(token => {
      switch (token[0]) {
        case '.':
          if (!attr.className) attr.className = ''
          attr.className += (attr.className && ' ') + token.slice(1);
          break;
        case '#': attr.id = token.slice(1); break;
        case '[':
          const [ss] = [...token.matchAll(/\[([^\]=]+)(=([^\]]+))?\]/g)];
          attr.attributes = [...(attr.attributes || []), { name: ss[1], value: ss[3] }];
          break;
      }
    });

    Context.rightColumn = el('div', attr);
    insertAfter(Context.rightColumn, centerColumn);
    if (Context.engineName === Ecosia) {
      const searchNav = $(Context.engine.searchNav);

      new MutationObserver(_ => {
        if (!$(Context.engine.searchNav))
          insertAfter(searchNav, $(Context.engine.searchNavNeighbor));
        if (!$(Context.engine.rightColumn))
          insertAfter(Context.rightColumn, $(Context.engine.centerColumn));
      }).observe($('#__layout'), { childList: true });
    }

    return Context.rightColumn;
  }

  static updateColor() {
    const bg = getBackgroundColor();
    const dark = isDarkMode();
    const allPanels = $$(".optisearchbox");

    let style = $('#optisearch-bg');
    if (!style)
      style = el('style', { id: 'optisearch-bg' }, Context.docHead);

    if (dark) {
      style.textContent = `.optisearchbox.dark {background-color: ${colorLuminance(bg, 0.02)}}
      .optisearchbox.dark .optipanel .optibody.w3body .w3-example {background-color: ${colorLuminance(bg, 0.04)}}
      .optisearchbox.dark .prettyprint, .optisearchbox.dark .pre-surround .prettyprint {background-color: ${colorLuminance(bg, -0.02)}}`;
    }
    for (let p of allPanels) {
      if (dark)
        p.className = p.className.replace("bright", "dark");
      else
        p.className = p.className.replace("dark", "bright");
    }
  }
}