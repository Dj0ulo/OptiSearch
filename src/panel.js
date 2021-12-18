console.debug("OptiSearch");

const PANEL_CLASS = "optipanel";
const REGEX_LATEX = /\${1,2}([^\$]*)\${1,2}/;
const REGEX_LATEX_G = /\${1,2}([^\$]*)\${1,2}/g;

//Not await !!
loadEngines().then(async (engines) => {

  const siteFound = window.location.hostname;
  const engine = Object.entries(engines)
    .find(([_, e]) => siteFound.search(new RegExp(e.regex)) != -1)[0];

  if (!engines[engine])
    return;

  const searchString = document.querySelector(engines[engine].searchBox)?.value;
  if (!searchString) console.warn("No search string detected");

  console.debug(`OptiSearch - ${engine} : "${searchString}"`);

  const save = await loadSettings();

  //Tools
  if (save["bangs"] && engine !== DuckDuckGo) {
    const regexp = /[?|&]q=((%21|!)[^&]*)/;
    const reg = window.location.href.match(regexp);
    if (reg) {
      console.log(reg["1"]);
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
        str += "=~" + answer;
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
        engine: engine,
        link: link,
        site: found,
        type: "html",
        indexPanel: numberPanel,
        ...Sites[found].msgApi(link),
      });
      numberPanel++;
    }
  }

  const results = document.querySelectorAll(engines[engine].resultRow);
  if (results.length === 0) {
    if (engine === DuckDuckGo) {
      const links = document.querySelector(engines[DuckDuckGo].resultsContainer);
      links.addEventListener("DOMNodeInserted", ({ target }) => {
        const classNames = engines[DuckDuckGo].resultRow.slice(1).replace(/\./g, " ");
        if (target.className.search(classNames) != -1)
          handleResult(target)
      });
    } else {
      console.warn("No result detected");
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

  function panelFromSite({ site, title, link }, icon, { body, foot }) {
    const panel = el("div", { className: `${PANEL_CLASS}` });

    //watermark
    el("div", { className: "watermark", textContent: "OptiSearch" }, panel);

    const headPanel = el("div", { className: "optiheader" }, panel);

    const a = el("a", { href: link }, headPanel);

    toTeX(el("div", { className: "title result-title", textContent: title }, a));

    const linkElement = el("div", { className: "optilink result-url", textContent: link }, a);
    linkElement.prepend(el("img", { width: 16, height: 16, src: icon }));

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
        surround.append(createCopyButton(pre.innerText));

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
    const rightColumn = fixRightColumn();
    if (!rightColumn)
      return null;

    const box = el("div", { className: `optisearchbox ${isDarkMode() ? "dark" : "bright"}` }, rightColumn);
    if (engine == Ecosia)
      box.style.marginTop = "20px";
    box.style.marginBottom = "20px";
    box.append(panel);


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
   * Add right column to the results page if there isn't one
   * @returns {Node} the rightColumn
   */
  function fixRightColumn() {
    const selectorRightCol = engines[engine].rightColumn;
    let rightColumn = document.querySelector(selectorRightCol);

    if (rightColumn)
      return rightColumn;

    if (!engines[engine].centerColumn)
      console.warn("No right column...");

    const centerColumn = document.querySelector(engines[engine].centerColumn);

    // create a right column with the correct attributes
    const [sr] = selectorRightCol.split(',');
    const arr = [...sr.matchAll(/[\.#][^\.#,]+/g)]
    let className = "", id = "";
    const attr = {}
    arr.map(a => a[0]).forEach(a => {
      if (a[0] === '.')
        className = (className && " ") + a.slice(1);
      else if (a[0] === '#')
        id = (id && " ") + a.slice(1);
    })
    if (id)
      attr.id = id;
    if (className)
      attr.className = className;

    rightColumn = el('div', attr);
    insertAfter(rightColumn, centerColumn);

    return rightColumn;
  }


  /**
   * Update color if the theme has somehow changed
   */
  let wasDark = isDarkMode();
  setInterval(() => {
    const dark = isDarkMode();
    if (dark !== wasDark) {
      wasDark = dark;
      const panels = document.querySelectorAll(".optisearchbox")

      for (let p of panels) {
        if (dark)
          p.className = p.className.replace("bright", "dark");
        else
          p.className = p.className.replace("dark", "bright");
      }
    }
  }, 200)
});
