(async function () {
  debug("Hello !");

  // Inject style
  const docHead = document.head || document.documentElement;
  const styles = ['panel', 'tomorrow', 'sunburst', 'w3schools', 'wikipedia', 'genius'];
  const cssContents = await Promise.all(styles.map(s => read(`src/styles/${s}.css`)));
  el('style', { className: 'optistyle', textContent: cssContents.join('\n') }, docHead);

  const PANEL_CLASS = "optipanel";

  const engines = await loadEngines();

  const siteFound = window.location.hostname;
  const engineName = Object.entries(engines)
    .find(([_, e]) => siteFound.search(new RegExp(e.regex)) != -1)[0];
  const engine = engines[engineName];
  if (!engine)
    return;

  const searchString = document.querySelector(engine.searchBox)?.value;
  if (!searchString) {
    err("No search string detected");
    return;
  }

  debug(`${engineName} — "${searchString}"`);


  // Change style based on the search engine
  const style = engine.style;
  if (style) el('style', { textContent: style, className: `optistyle-${engineName}` }, docHead);

  const save = await loadSettings();
  // Bigger right column
  const minW = 400;
  const maxW = 600;
  if (save['wideColumn']) {
    const widthStyle = engine.widthStyle?.replace("${maxW}", maxW).replace("${minW}", minW);
    if (widthStyle) el('style', { textContent: widthStyle, className: `optistyle-${engineName}` }, docHead);
  }


  //Tools
  if (save["bangs"] && engineName !== DuckDuckGo) {
    const regexp = /[?|&]q=((%21|!)[^&]*)/;
    const reg = window.location.href.match(regexp);
    if (reg) {
      log(reg["1"]);
      window.location.href = "https://duckduckgo.com/?q=" + reg["1"];
    }
  }

  if (save["calculator"]) {
    if (window.location.href.search(/[?|&]q=calculator(&?|$)/) != -1) {
      const iframe = el("iframe", {
        className: PANEL_CLASS,
        id: "opticalculator",
        src: "https://www.desmos.com/scientific"
      });
      appendPanel(iframe);
    }
  }

  const rep = isMathExpr(searchString);
  if (rep) {
    if (rep.vars.length > 0) {
      if (save["plot"]) {
        let fun = {
          expr: rep.expr,
          vars: rep.vars,
        };
        let graph = document.createElement("div");
        graph.id = "optiplot";
        graph.className = PANEL_CLASS;
        appendPanel(graph);
        plotFun(fun, "optiplot");
      }
    } else if (
      save["calculator"] &&
      (typeof rep.answer == "number" ||
        typeof rep.answer == "boolean" ||
        rep.answer.entries)
    ) {
      const panel = el("div", { className: PANEL_CLASS });

      let str = "$" + math.parse(rep.expr).toTex() + "~";
      let answer = rep.answer;
      if (typeof answer == "number") {
        str += "=~" + answer.toPrecision(4);
      } else if (typeof answer == "boolean") {
        str += ":~" + answer;
      } else if (rep.answer.entries) {
        answer = answer.entries[0];
        str += "=~" + answer;
      }
      str += "$";


      const expr = el("div", { id: "optiexpr", textContent: str }, panel);
      toTeX(expr);
      panel.appendChild(createCopyButton(answer.toString()))
      appendPanel(panel)
    }
  }

  //Sites
  const port = chrome.runtime.connect();

  let numberPanel = 0, links = [];

  /**
   * Take the result Element and send a request to the site if it is supported
   * @param {Element} r 
   */
  const handleResult = (r) => {
    const link = r.querySelector("a")?.href;
    if (!link) return;
    const found = Object.keys(Sites)
      .find(site => (
        save[site]
        && link.search(Sites[site].link) != -1
        && !links.find(l => link === l)// no duplicates
      ));
    if (found && numberPanel < save.maxResults) {
      links.push(link);
      port.postMessage({
        engine: engineName,
        link: link,
        site: found,
        type: "html",
        indexPanel: numberPanel,
        ...Sites[found].msgApi(link),
      });
      numberPanel++;
    }
  }

  const results = document.querySelectorAll(engine.resultRow);
  if (results.length === 0) {
    if (engineName === DuckDuckGo) {
      const links = document.querySelector(engines[DuckDuckGo].resultsContainer);
      links.addEventListener("DOMNodeInserted", ({ target }) => {
        const classNames = engines[DuckDuckGo].resultRow.slice(1).replace(/\./g, " ");
        if (target.className.search(classNames) != -1)
          handleResult(target)
      });
    } else {
      err("No result detected");
    }
  }
  else {
    Array.from(results).forEach(handleResult);
  }

  let currentPanelIndex = 0, panels = [];

  // receive parsed data from html page
  port.onMessage.addListener((msg) => {
    if (!Sites.hasOwnProperty(msg.site))
      return;

    const site = Sites[msg.site];
    const content = site.set(msg); // set body and foot

    if (content && content.body.innerHTML && msg.title !== undefined) {
      panels[msg.indexPanel] = panelFromSite(msg, msg.icon ?? site.icon, content);
    } else {
      panels[msg.indexPanel] = null;
    }

    updatePanels()
  })


  /**
   * Draw the panels in order. Only when the previous are not undefined
   */
  function updatePanels() {
    while (currentPanelIndex < numberPanel) {
      const panel = panels[currentPanelIndex];
      if (panel === undefined) {
        return;
      }
      if (panel !== null) {
        appendPanel(panel);
      }
      currentPanelIndex++;
    }
    PR.prettyPrint(); // when all possible panels were appended
  }

  function panelSkeleton() {

  }

  function panelFromSite({ site, title, link }, icon, { body, foot }) {
    const panel = el("div", { className: `${PANEL_CLASS}` });

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
    // BODY
    if (body) {
      body.className += " optibody";

      if (site === "stackexchange") {
        childrenToTeX(body);
      }

      const codes = body.querySelectorAll("code, pre");
      codes.forEach((c) => {
        c.className += ` prettyprint`;
      });

      const pres = body.querySelectorAll("pre");
      pres.forEach((pre) => {
        const surround = el("div", { className: "pre-surround", innerHTML: pre.outerHTML, style: "position: relative" });
        surround.append(createCopyButton(pre.innerText.trim()));

        pre.parentNode.replaceChild(surround, pre);
      });
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
  function appendPanel(panel) {
    const rightColumn = getRightColumn();
    if (!rightColumn)
      return null;

    const box = el("div", { className: `optisearchbox bright ${engineName}` }, rightColumn);
    box.append(panel);
    updateColor();


    // hline(box);

    // panel.style = "max-height: 400px"
    // const unfold = el('div', { className: 'unfold_button', textContent: '˅' }, box);
    // unfold.onclick = () => {
    //   if (panel.classList.toggle('folded'))
    //     panel.style = "max-height: 400px"
    //   else
    //     panel.style = "max-height: 1000px"
    // }

    return box;
  }

  /**
   * Get and/or add right column to the results page if there isn't one
   * @returns {Node} the rightColumn
   */
  function getRightColumn() {
    const selectorRightCol = engine.rightColumn;
    let rightColumn = document.querySelector(selectorRightCol);
    if (rightColumn)
      return rightColumn;

    if (!engine.centerColumn)
      warn("No right column");

    const centerColumn = document.querySelector(engine.centerColumn);

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


  function updateColor() {
    const bg = getBackgroundColor();
    const dark = isDarkMode();
    const panels = document.querySelectorAll(".optisearchbox");

    let style = document.querySelector('#optisearch-bg');
    if (!style) 
      style = el('style', { id: 'optisearch-bg' }, docHead);

    if (dark) {
      style.textContent = `.optisearchbox.dark {background-color: ${colorLuminance(bg, 0.02)}}
      .dark .optipanel .optibody.w3body .w3-example {background-color: ${colorLuminance(bg, 0.04)}}
      .dark .prettyprint, .dark .pre-surround .prettyprint {background-color: ${colorLuminance(bg, -0.02)}}`;
    }
    for (let p of panels) {
      if (dark)
        p.className = p.className.replace("bright", "dark");
      else
        p.className = p.className.replace("dark", "bright");
    }
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
    updateColor();
  }, 200)
})()
