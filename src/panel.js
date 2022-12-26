class Context {
  static PANEL_CLASS = "optipanel";
  static gpt = new ChatGPTSession();
  static async init() {
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

    Context.searchString = $(Context.engine.searchBox)?.value;
    if (!Context.searchString) {
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

    Context.executeTools();

    Context.numberPanel = 0;
    Context.currentPanelIndex = 0;
    Context.panels = [];


    const links = [];
    /**
     * Take the result Element and send a request to the site if it is supported
     * @param {Element} r 
     */
    const handleResult = (r) => {
      const linksResult = [...r.querySelectorAll("a")].map(a => a.href);
      const link = linksResult.find(l => !l.startsWith(Context.engine.link));
      if (!link) return;

      const found = Object.keys(Sites)
        .find(site => (
          Context.save[site]
          && link.search(Sites[site].link) != -1
          && !links.find(l => link === l)// no duplicates
        ));

      if (found && Context.numberPanel < Context.save.maxResults) {
        links.push(link);

        chrome.runtime.sendMessage({
          engine: Context.engineName,
          link: link,
          site: found,
          type: "html",
          indexPanel: Context.numberPanel,
          ...Sites[found].msgApi(link),
        }, async (resp) => {
          if (!resp) return;
          const [msg, text] = resp;
          const site = Sites[msg.site];
          if (!site) return;

          let doc;
          switch (msg.type) {
            case 'html': doc = new DOMParser().parseFromString(text, "text/html"); break;
            case 'json': doc = JSON.parse(text); break;
            default: return;
          }

          const siteData = { ...msg, ...(await site.get(msg, doc)) };
          const content = site.set(siteData); // set body and foot

          if (content && content.body.innerHTML && siteData.title !== undefined)
            Context.panels[siteData.indexPanel] = Context.panelFromSite({ ...siteData, icon: siteData.icon ?? site.icon, ...content });
          else
            Context.panels[siteData.indexPanel] = null;


          Context.updatePanels();
        });

        Context.numberPanel++;
      }
    }

    const results = $$(Context.engine.resultRow);
    if (results.length === 0) {
      if (Context.engineName === DuckDuckGo) {
        const resultsContainer = $(Context.engine.resultsContainer);
        const observer = new MutationObserver((mutationRecords) => {
          // Handle mutations
          mutationRecords.map(mr => mr.addedNodes[0])
            .filter(n => n?.matches(Context.engine.resultRow))
            .forEach(handleResult);
        });

        observer.observe(resultsContainer, {
          subtree: false,  // observe the subtree rooted at myNode
          childList: true,  // include information childNode insertion/removals
          attribute: false  // include information about changes to attributes within the subtree
        });

      } else {
        debug("No result detected");
      }
    }
    else {
      results.forEach(handleResult);
    }

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
  static async injectStyle() {
    const styles = ['panel', 'tomorrow', 'sunburst', 'w3schools', 'wikipedia', 'genius'];
    const cssContents = await Promise.all(styles.map(s => read(`src/styles/${s}.css`)));
    el('style', { className: 'optistyle', textContent: cssContents.join('\n') }, Context.docHead);
  }
  static executeTools() {
    if (Context.isActive("chatgpt")) Context.chatgpt();
    if (Context.isActive("bangs")) Context.bangs();
    if (Context.isActive("calculator")) Context.calculator();
    if (Context.isActive("calculator") || Context.isActive("plot")) Context.plotOrCompute();
  }

  /**
   * Draw the panels in order. Only when the previous are not undefined
   */
  static updatePanels() {
    while (Context.currentPanelIndex < Context.numberPanel) {
      const panel = Context.panels[Context.currentPanelIndex];
      if (panel === undefined) {
        return;
      }
      if (panel !== null) {
        Context.appendPanel(panel);
      }
      Context.currentPanelIndex++;
    }
  }

  static prettifyCode(element) {
    $$("code, pre", element).forEach(c => c.classList.add("prettyprint"));

    $$("pre", element).forEach((pre) => {
      const surround = el("div", { className: "pre-surround", innerHTML: pre.outerHTML, style: "position: relative" });
      surround.append(createCopyButton(pre.innerText.trim()));

      pre.parentNode.replaceChild(surround, pre);
    });
    PR.prettyPrint();
  }

  static panelFromSite({ site, title, link, icon, header, body, foot }) {
    const panel = el("div", { className: `${Context.PANEL_CLASS}` });

    //watermark
    el("div", { className: "watermark", textContent: "OptiSearch" }, panel);

    const headPanel = el("div", { className: "optiheader" }, panel);

    const a = el("a", { href: link }, headPanel);

    toTeX(el("div", { className: "title result-title", textContent: title }, a));

    const linkElement = el("cite", { className: "optilink result-url" }, a);
    el("img", { width: 16, height: 16, src: icon }, linkElement);
    el("span", { textContent: link }, linkElement);

    if (body)
      hline(panel);

    const content = el('div', { className: "opticontent" }, panel);

    // HEADER
    if (header) {
      content.append(header);
      hline(content);
    }
    // BODY
    if (body) {
      body.classList.add("optibody");

      if (site === "stackexchange") {
        childrenToTeX(body);
      }

      Context.prettifyCode(body);
      content.append(body);
    }

    // FOOT
    if (foot) {
      foot.id = "output";
      hline(content);
      content.append(foot);
    }

    writeHostOnLinks(link, panel);

    return panel;
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  static appendPanel(panel) {
    const rightColumn = Context.getRightColumn();
    if (!rightColumn)
      return null;

    const box = el("div", { className: `optisearchbox bright ${Context.engineName}` }, rightColumn);
    box.append(panel);
    Context.updateColor();

    // const unfold = el('div', { className: 'unfold_button', textContent: 'Display more' }, box);
    // panel.classList.toggle('folded')
    // unfold.onclick = () => panel.classList.toggle('folded');

    return box;
  }

  /**
   * Get and/or add right column to the results page if there isn't one
   * @returns {Node} the rightColumn
   */
  static getRightColumn() {
    const selectorRightCol = Context.engine.rightColumn;
    let rightColumn = $(selectorRightCol);
    if (rightColumn)
      return rightColumn;


    const centerColumn = $(Context.engine.centerColumn);
    if (!centerColumn)
      debug("No right column");

    // create a right column with the correct attributes
    const [sr] = selectorRightCol.split(',');
    const arr = [...sr.matchAll(/[\.#\[][^\.#,\[]+/g)]
    const attr = {}
    arr.map(a => a[0])
      .forEach(token => {
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
      })
    rightColumn = el('div', attr);
    insertAfter(rightColumn, centerColumn);

    return rightColumn;
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