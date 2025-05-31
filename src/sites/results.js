(() => {
  Context.parseResults = () => {
    Context.currentPanelIndex = 0;
    Context.panels = [];
    Context.links = [];

    const results = $$(Context.engine.resultRow);
    if (results.length > 0) {
      results.forEach(handleResult);
      return;
    }

    if (Context.engineName === DuckDuckGo) {
      const resultsContainer = $(Context.engine.resultsContainer);
      const observer = new MutationObserver((mutationRecords) => {
        // Handle mutations
        mutationRecords
          .filter(mr => mr.addedNodes.length > 0)
          .map(mr => mr.addedNodes[0])
          .filter(n => n?.matches(Context.engine.resultRow))
          .forEach(handleResult);
      });

      observer.observe(resultsContainer, { childList: true });
    }

    debug("No result detected");
  }

  /**
   * Take the result Element and send a request to the site if it is supported
   * @param {Element} result the result
   */
  async function handleResult(result) {
    if (Context.links.length >= Context.save.maxResults)
      return;

    let linksInResultContainer = [];
    if (Context.engineName === Baidu) {
      linksInResultContainer = [result.getAttribute('mu')];
    } else {
      linksInResultContainer = $$("a", result).map(a => a.href);
    }

    let siteLink = linksInResultContainer.find(l => !l?.startsWith(Context.engine.link) && l !== 'javascript:void(0)');
    let intermediateLink = null;
    if (!siteLink && Context.engineName === Bing) {
      siteLink = $('cite', result)?.textContent;
      intermediateLink = linksInResultContainer[0];
    }
    if (!siteLink)
      return;

    const find = Object.entries(Sites).find(([_, { link }]) => siteLink.search(link) !== -1);
    if (!find)
      return;
    const [siteName, siteProps] = find;
    if (!Context.isActive(siteName))
      return;

    const paramsToSend = {
      action: 'fetch-result',
      engine: Context.engineName,
      link: siteLink,
      site: siteName,
      type: "html",
      credentials: siteProps.credentials,
      ...siteProps.msgApi(siteLink),
    };

    if (intermediateLink) {
      const html = await bgFetch(intermediateLink);
      const start = html.lastIndexOf('"', html.search(siteProps.link)) + 1;
      const end = html.indexOf('"', start);
      siteLink = html.substring(start, end);
      paramsToSend.link = siteLink;
    }

    const isSameURL = (a, b) => a.host === b.host && a.pathname === b.pathname && a.search === b.search;

    const urlLink = new URL(siteLink);
    if (Context.links.some(l => isSameURL(l, urlLink)))
      return;
    const panelIndex = Context.links.length;
    Context.links.push(new URL(siteLink));

    chrome.runtime.sendMessage(paramsToSend, async (resp) => {
      if (!resp)
        return;
      const [msg, text] = resp;
      const site = Sites[msg.site];
      if (!site)
        return;

      let doc;
      switch (msg.type) {
        case 'html': doc = new DOMParser().parseFromString(text, "text/html"); break;
        case 'json': doc = JSON.parse(text); break;
        default: return;
      }

      const siteData = {
        icon: $('[rel="shortcut icon"]', doc)?.href ?? chrome.runtime.getURL(`src/images/${site.icon}`),
        ...msg,
        ...(await site.get(msg, doc))
      };
      const content = site.set(siteData); // set body and foot

      if (content && content.body.innerHTML && siteData.title !== undefined)
        Context.panels[panelIndex] = panelFromSite({ ...siteData, ...content });
      else
        Context.panels[panelIndex] = null;

      updatePanels();
    });
  }

  function panelFromSite({ site, title, link, icon, header, body, foot }) {
    const panel = el("div", { className: `${Context.PANEL_CLASS}` });
    const headPanel = el("div", { className: "optiheader" }, panel);

    const a = el("a", { href: link, className: "result-link" }, headPanel);

    toTeX(el("div", { className: "title result-title", textContent: title }, a), false);

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
        $$('.math-container', body).forEach((e) => toTeX(e, true));
      }

      prettifyCode(body);
      content.append(body);
    }

    // FOOT
    if (foot) {
      foot.classList.add("optifoot")
      foot.id = "output";
      hline(content);
      content.append(foot);
    }

    writeHostOnLinks(link, panel);

    return panel;
  }

  /**
 * Draw the panels in order. Only when the previous are not undefined
 */
  function updatePanels() {
    while (Context.currentPanelIndex < Context.links.length) {
      const panel = Context.panels[Context.currentPanelIndex];
      if (panel === undefined)
        return;
      if (panel !== null)
        Context.appendPanel(panel);

      Context.currentPanelIndex++;
    }
  }

})();