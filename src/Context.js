class Context {
  static PANEL_CLASS = "optipanel";
  static RIGHT_COLUMN_CLASS = 'optisearch-column';
  static WIDE_COLUMN_CLASS = 'optisearch-column-wide';
  static MOBILE_CLASS = 'mobile';

  static engines = {};
  static save = {};

  static boxes = [];

  /** @type {Promise<Boolean> | null} */
  static isPremiumUser = null;

  /** @type {HTMLElement | null} */
  static rightColumnElement = null;
  static set rightColumn(value) {
    Context.rightColumnElement = value;
    if (value)
      Context.rightColumnElement.classList.add(Context.RIGHT_COLUMN_CLASS);
  }
  static get rightColumn() {
    return Context.rightColumnElement;
  }

  static centerColumn = null;

  /** Start the content script, should be run only once */
  static async run() {
    Context.docHead = document.head || document.documentElement;

    Context.save = await loadSettings();
    Context.engines = await loadEngines();
    const matches = Object.entries(Context.engines)
      .find(([_, { regex }]) => window.location.hostname.search(new RegExp(regex)) !== -1);
    if (!matches) {
      debug("Not valid engine");
      return;
    }
    Context.engineName = matches[0];
    Context.engine = Context.engines[Context.engineName];
    if (!Context.engine) {
      debug("Not valid engine");
      return;
    }
    debug(`${Context.engineName} — "${parseSearchParam()}"`);
    if (Context.engineName === Google && new URL(window.location.href).searchParams.get('tbm'))
      return;

    // Update color if the theme has somehow changed
    let prevBg = null;
    setInterval(() => {
      const bg = getBackgroundColor();
      if (bg === prevBg)
        return;
      prevBg = bg;
      Context.updateColor();
    }, 200);

    Context.checkPremiumSubscription();

    Context.initChat();
    await Context.injectStyle();

    Context.execute();
  }

  /** Parse document and execute tools, might be run multiple times if the parsing failed once */
  static async execute() {
    Context.centerColumn = await awaitElement(Context.engine.centerColumn);

    if (Context.engineName === Baidu && Context.centerColumn) {
      let oldSearchParam = parseSearchParam();
      const observer = setObserver(_ => {
        const searchParam = parseSearchParam();
        if (oldSearchParam === searchParam)
          return;
        oldSearchParam = searchParam;
        observer.disconnect();
        Context.execute();
      }, $('#wrapper_wrapper'), { childList: true });
    }

    Context.searchString = parseSearchParam();
    Context.parseRightColumn();

    if (Context.engineName === Ecosia)
      Context.forEcosia();

    if (Context.compuleIsOnMobile()) {
      debug("On Mobile !");
    } else if (!Context.rightColumn) {
      return;
    }
    // Bigger right column
    if (Context.isActive('wideColumn'))
      Context.wideColumn(true, true);

    chrome.runtime.onMessage.addListener((message) => {
      if ('wideColumn' in message) {
        Context.save['wideColumn'] = message.wideColumn;
        Context.wideColumn(message.wideColumn, false);
      }
      return true;
    });

    Context.executeTools();
  }

  static async checkPremiumSubscription() {
    await extpay.getUser()
      .then(user => Context.isPremiumUser = user.paid)
      .catch(_ => {
        err(`Failed to retrieve user subscription state`);
        Context.isPremiumUser = null;
      });
    return Context.isPremiumUser;
  }

  static isActive(tool) {
    return Context.save[tool];
  }

  static async injectStyle() {
    let styles = ['chatgpt', 'panel', 'code-light-theme', 'code-dark-theme'];
    if (isOptiSearch)
      styles = [...styles, ...['w3schools', 'wikipedia', 'genius']];
    const cssContents = await Promise.all(styles.map(s => read(`src/styles/${s}.css`).catch(() => '')));
    el('style', { className: 'optistyle', textContent: cssContents.join('\n') }, Context.docHead);

    if (!Context.engine.style)
      return;

    // Change style based on the search engine
    el('style', {
      textContent: Context.engine.style,
      className: `optistyle-${Context.engineName}`
    }, Context.docHead);
  }

  static executeTools() {
    if (Context.chatSession && Context.chatSession.panel) Context.appendPanel(Context.chatSession.panel, true);
    if (Context.isActive("bangs")) Context.bangs && Context.bangs();
    if (Context.isActive("calculator")) Context.calculator && Context.calculator();
    if (Context.isActive("plot") || Context.isActive("calculator")) Context.plotOrCompute && Context.plotOrCompute();
    if (typeof Sites !== 'undefined') Context.parseResults && Context.parseResults();
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  static appendPanel(panel, prepend = false) {
    const header = $('.optiheader', panel);
    if (header) {
      const rightButtonsContainer = el('div', { className: 'right-buttons-container headerhover' }, header);

      const star = el('div', { className: 'rate', title: 'Rate this extension' }, rightButtonsContainer);
      el('a', { textContent: '\u2605', href: webstore + '/reviews' }, star);
      const heart = el('div', { className: 'donate', title: 'Donate' }, rightButtonsContainer);
      el('a', { textContent: '\u2764', href: donationLink }, heart);

      const expandArrow = el('div', { className: 'new-expand-arrow', textContent: '\u21e5' }, rightButtonsContainer);
      const setTitleExpand = () => expandArrow.title = Context.save['wideColumn'] ? 'Minimize the panel' : 'Expand the panel';
      setTitleExpand();
      expandArrow.addEventListener('click', () => {
        Context.save['wideColumn'] = !Context.save['wideColumn'];
        saveSettings(Context.save);
        Context.wideColumn(Context.save['wideColumn']);
        setTitleExpand();
      })
    }

    const box = el("div", { className: `optisearchbox bright ${Context.engineName}` });
    Context.boxes.push(box);
    if (Context.compuleIsOnMobile())
      box.classList.add(Context.MOBILE_CLASS);
    box.append(panel);

    Context.appendBoxes([box], prepend);

    Context.updateColor();
    return box;
  }

  static appendBoxes(boxes, prepend = false) {
    const isOnMobile = Context.compuleIsOnMobile();
    const firstResultRow = $(Context.engine.resultRow);
    let boxContainer = Context.rightColumn;

    if (isOnMobile)
      boxContainer = firstResultRow ? firstResultRow.parentElement : Context.centerColumn;
    if (!boxContainer)
      return;
    if (prepend)
      boxes = boxes.slice().reverse();

    boxes.forEach(box => {
      if (prepend) {
        // prepend means that it is a chatbox
        const order = ['bard', 'bingchat', 'chatgpt'];
        const precedings = order
          .slice(0, order.indexOf(WhichChat))
          .map(e => $$(`.optichat.${e}`))
          .flat();
        if (precedings.length) {
          const lastPrecedingBox = precedings.at(-1).parentElement;
          insertAfter(box, lastPrecedingBox);
          return;
        }

        boxContainer.prepend(box);
        return;
      }

      if (isOnMobile && firstResultRow) {
        boxContainer.insertBefore(box, firstResultRow);
        return;
      }

      boxContainer.append(box);
    });
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

    if (!Context.centerColumn) {
      warn("No right column detected");
      Context.rightColumn = null;
      return Context.rightColumn;
    }

    // create a right column with the correct attributes
    const [sr] = selectorRightCol.split(',');
    const arr = [...sr.matchAll(/[\.#\[][^\.#,\[]+/g)]
    const attr = { className: 'optisearch-created' };
    arr.map(a => a[0]).forEach(token => {
      switch (token[0]) {
        case '.':
          attr.className ??= '';
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
    insertAfter(Context.rightColumn, Context.centerColumn);
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
      .optisearchbox.dark .optipanel .optibody.w3body .w3-example {background-color: ${colorLuminance(bg, 0.04)}}`;
    }
    for (let p of allPanels) {
      if (dark)
        p.className = p.className.replace("bright", "dark");
      else
        p.className = p.className.replace("dark", "bright");
    }
  }

  static wideColumn(wide = true, start = false) {
    if (!start && !$(`style.${Context.WIDE_COLUMN_CLASS}`)) {
      el('style', {
        className: Context.WIDE_COLUMN_CLASS,
        textContent: '.optisearch-column { transition: max-width var(--expand-time) linear, min-width var(--expand-time) linear ; }'
      }, Context.docHead);
    }
    if (wide)
      Context.rightColumn.classList.add(Context.WIDE_COLUMN_CLASS);
    else
      Context.rightColumn.classList.remove(Context.WIDE_COLUMN_CLASS);
  }

  /** 
   * @returns {boolean} Are we on a mobile device
   */
  static compuleIsOnMobile() {
    if (Context.engineName === DuckDuckGo) {
      const scriptInfo = [...document.querySelectorAll('script')].find(s => s.textContent.includes('isMobile'));
      if (!scriptInfo)
        return false;

      const isMobileMatch = scriptInfo.textContent.match(/"isMobile" *: *(false|true)/);
      if (isMobileMatch && isMobileMatch[1] === 'true')
        return true;

      return false;
    }

    if (!('onMobile' in Context.engine))
      return false;
    else if (typeof (Context.engine.onMobile) === 'number')
      return window.innerWidth < Context.engine.onMobile;
    return !!$(Context.engine.onMobile);
  }

  /**
   * Special method to deal with Ecosia.
   * Because in Ecosia, the main column can be reomoved after few seconds and added again.
   * Also Ecosia is the only engine for which the HTML does not change if it is on mobile 
   * (only @media CSS instructions make it change).
   * This also means that we have to deal with eventual resizing of the page
   */
  static forEcosia() {
    if (Context.engineName !== Ecosia)
      return;

    const searchNav = $(Context.engine.searchNav);
    setObserver(mutations => {
      if (!mutations.some(m => m.removedNodes.length))
        return;
      if (mutations.map(m => [...m.removedNodes]).flat().find(n => n === Context.centerColumn)) {
        Context.centerColumn = $(Context.engine.centerColumn);
        Context.appendBoxes(Context.boxes);
      }
      if (!$(Context.engine.searchNav))
        insertAfter(searchNav, $(Context.engine.searchNavNeighbor));
      if (!$(Context.engine.rightColumn))
        insertAfter(Context.rightColumn, Context.centerColumn);
    }, document.body, { childList: true, subtree: true });

    if (typeof (Context.engine.onMobile) !== 'number')
      return;

    let wasOnMobile = Context.compuleIsOnMobile();
    window.addEventListener("resize", () => {
      const isOnMobile = Context.compuleIsOnMobile();
      if (isOnMobile === wasOnMobile)
        return;
      wasOnMobile = isOnMobile;
      const allBoxes = $$('.optisearchbox');
      allBoxes.forEach(p => p.classList[isOnMobile ? 'add' : 'remove'](Context.MOBILE_CLASS));
      Context.appendBoxes(allBoxes);
    });
  }
}
