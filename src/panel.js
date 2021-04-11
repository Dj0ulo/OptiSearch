console.debug("OptiSearch");

const PANEL_CLASS = "optipanel";
const REGEX_LATEX = /\${1,2}([^\$]*)\${1,2}/;
const REGEX_LATEX_G = /\${1,2}([^\$]*)\${1,2}/g;

//engines
let engine = "";
const siteFound = window.location.hostname;

if (siteFound.endsWith("ecosia.org")) engine = Ecosia;
else if (siteFound.search(".bing.com") != -1) engine = Bing;
else if (siteFound.search(".google.") != -1) engine = Google;
else if (siteFound.search(".yahoo.") != -1) engine = Yahoo;
else if (siteFound.search("duckduckgo.com") != -1) engine = DuckDuckGo;
else if (siteFound.search("baidu.com") != -1) engine = Baidu;


//Not await !!
loadEngines().then(async (engines) => {
  // console.log(engines);
  // console.log(document.body.innerHTML);
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

      const expr = el("div", { id: "optiexpr", innerHTML: str }, panel);
      toTeX(expr);
      panel.appendChild(createCopyButton(answer.toString()))
      appendPanel(panel)
    }
  }

  //Sites
  const port = chrome.runtime.connect();

  let numberPanel = 0, links = [];
  const handleResult = (r) => {
    let link = r.querySelector("a")
    if (!link) return;
    link = link.href;
    const found = Object.keys(Sites).find((site) => {
      return save[site]
        && link.search(Sites[site].link) != -1
        && !links.find(l => link === l);// no duplicates
    });
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
      panels[msg.indexPanel] = panelFromSite(msg, site.icon, content);
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

  function panelFromSite({ site, title, link }, icon, {body, foot}) {
    const panel = el("div", { className: PANEL_CLASS });

    //watermark
    el("div", { className: "watermark", textContent: "OptiSearch" }, panel);

    const headPanel = el("div", { className: "optiheader" }, panel);

    const a = el("a", { href: link }, headPanel);

    toTeX(el("div", { className: "title result-title", textContent: title }, a));

    const linkElement = el("div", { className: "optilink result-url", textContent: link }, a);
    linkElement.prepend(el("img", { width: 16, height: 16, src: icon }));

    // BODY
    if (body) {
      hline(panel);
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
        const surround = el("div", { innerHTML: pre.outerHTML, style: "position: relative" });
        surround.appendChild(createCopyButton(pre.innerText));

        pre.parentNode.replaceChild(surround, pre);
      });
      panel.appendChild(body);
    }

    // FOOT
    if (foot) {
      foot.id = "output";
      hline(panel);
      panel.appendChild(foot);
    }

    // put the host in every link
    const host = link.match("https?://[^/]+")[0];
    const links = panel.querySelectorAll("a");
    links.forEach((a) => {
      let ahref = a.getAttribute("href");
      if (!ahref.startsWith("//") && !ahref.startsWith("http")) {
        if (!ahref.startsWith("/")) {
          a.href = `${link.replace(/\/[^\/]*$/, "")}/${ahref}`;
        } else a.href = host + ahref;
      }
    });

    return panel;
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  function appendPanel(panel) {
    const selectorRightCol = engines[engine].rightColumn
    let rightColumn = document.querySelector(selectorRightCol);

    if (!rightColumn && engines[engine].centerColumn) {
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
    }
    if (!rightColumn) {
      console.warn("No right column detected");
    }
    else {
      const box = el("div", { className: `optisearchbox ${isDarkMode() ? "dark" : "bright"}` }, rightColumn);
      if (engine == Ecosia)
        box.style.marginTop = "20px";
      box.style.marginBottom = "20px";
      box.append(panel);
      return box;
    }
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
