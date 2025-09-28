class Context {
  static EXTENSION_SELECTOR_PREFIX = WhichExtension;
  static BOX_CLASS = `${Context.EXTENSION_SELECTOR_PREFIX}-box`;
  static BOX_SELECTOR = `.${Context.BOX_CLASS}`;
  static STYLE_ELEMENT_ID = `${Context.EXTENSION_SELECTOR_PREFIX}-style`;
  static MOBILE_CLASS = 'mobile';

  static engines = {};
  static engine = {};
  static processEngine = {};
  static save = {};
  static settingsListeners = {};

  static boxes = [];

  static extpay = null;
  static extpayUser = null;

  static get onMobile() {
    return Context.computeIsOnMobile();
  }

  /** @type {HTMLElement | null} */
  static _rightColumnElement = null;
  static set rightColumn(value) {
    Context._rightColumnElement = value;
    if (value)
      value.dataset.optisearchColumn = Context.get('wideColumn');
  }
  static get rightColumn() {
    return Context._rightColumnElement;
  }
  static get boxContainer() {
    const firstResultRow = $(Context.engine.resultRow);
    return Context.onMobile
        ? firstResultRow
            ? firstResultRow.parentElement
            : Context.centerColumn
        : Context.rightColumn;
  }

  static centerColumn = null;

  static get inTestMode() {
    return !!new URL(location).searchParams.get("optisearch-test-mode");
  }

  /** Start the content script, should be run only once */
  static async run() {
    Context.extpay = ExtPay('optisearch');

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
    Context.setupRightColumn();

    if (Context.engineName in Context.processEngine){
      await Context.processEngine[Context.engineName]();
    }

    if (!Context.boxContainer) {
      return;
    }

    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === 'updateSetting') {
        Context.save[message.key] = message.value;
        Context.dispatchUpdateSetting(message.key, message.value);
      }
      sendResponse(true);
    });

    if (Context.chatSession && Context.chatSession.panel) {
      Context.appendPanel(Context.chatSession.panel);
    }
    if (typeof Sites !== 'undefined' && Context.parseResults) {
      Context.parseResults();
    }
  }

  static async checkIfUserStillNotPremium() {
    return Context.get('premium') === false && await Context.checkPremiumSubscription() === false;
  }

  /** 
   * Opens premium popup if the user doesn't have premium features.
   * Useful to use like this at the beginning of an onclick handler from a premium feature:
   * `if (await Context.handleNotPremium()) return;`
   * 
   * @returns {Promise<boolean>} true if the user DOESN'T have premium features
   */
  static async handleNotPremium() {
    if(await Context.checkIfUserStillNotPremium()) {
      premiumPresentationPopup();
      return true;
    }
    return false;
  }

  /**
   * Ask extpay API if the user is a premium user
   * @returns {Promise<true | false | null>} True if the user is a premium user, false otherwise and null if
   * there is an error.
   */
  static async checkPremiumSubscription() {
    await Context.extpay.getUser()
      .then(user => {
        Context.extpayUser = user;
        Context.set('premium', user.paid);
      })
      .catch(_ => {
        err(`Failed to retrieve user subscription state`);
        Context.set('premium', null);
      });
    return Context.get('premium');
  }

  static isActive(tool) {
    return !!Context.get(tool);
  }

  static get(saveKey) {
    return Context.save[saveKey];
  }
  
  static set(saveKey, value) {
    Context.save[saveKey] = value;
    saveSettings(Context.save);
    Context.dispatchUpdateSetting(saveKey, value);
  }

  static addSettingListener(key, callback) {
    Context.settingsListeners[key] ||= [];
    Context.settingsListeners[key].push(callback);
  }

  static dispatchUpdateSetting(key, value) {
    Context.settingsListeners[key]?.forEach(callback => callback(value));
  }

  static async injectStyle() {
    let styles = ['chatgpt', 'panel', 'code-light-theme', 'code-dark-theme'];
    if (isOptiSearch) {
      styles.push('mdn', 'w3schools', 'wikipedia', 'genius');
    }
    let cssContents = await Promise.all(styles.map(s => read(`src/styles/${s}.css`)));
    let allCss = this.addCssParentSelector(cssContents.join('\n'));

    // Engine specifics styles must not have css parent selector added to everything
    if (Context.engine.style) {
      allCss += "\n";
      allCss += Context.engine.style.trim().replaceAll(".optisearchbox", Context.BOX_SELECTOR);
    }
    el('style', { id: Context.STYLE_ELEMENT_ID, textContent: allCss }, Context.docHead);

  }

  static addCssParentSelector(cssContent) {
    const cssRuleRegex = /(?!\s)([^{}%\/\\]+)({[^{}]*})/g; //avoid spaces, comments, @media, @keyframes
    return cssContent.replace(cssRuleRegex, (_, selector, body) => 
      `${selector.split(",").map(s => {
        const sTrim = s.trim();
        if (sTrim[0] === ':') return sTrim;
        if (sTrim.includes('.optisearchbox')) {
          return sTrim.replace('.optisearchbox', Context.BOX_SELECTOR);
        }
        if (sTrim.includes('.dark')) {
          return sTrim.replace('.dark', `${Context.BOX_SELECTOR}.dark`);
        }
        if (sTrim.includes('.bright')) {
          return sTrim.replace('.bright', `${Context.BOX_SELECTOR}.bright`);
        }
        return `${Context.BOX_SELECTOR} ${sTrim}`;
      }).join(", ")} ${body}\n`
    );
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  static appendPanel(panel) {
    const buildTopButtons = () => {
      const topButtonsContainer = el('div', { className: 'top-buttons-container headerhover' });
      const thumb = el('div', { title: _t("Rate this extension") }, topButtonsContainer);
      thumb.dataset.emoji = 'thumb';
      el('a', { textContent: '👍', href: webstore + '/reviews' }, thumb);

      const star = el('div', { title: _t("Premium subscription"), textContent: '⭐' }, topButtonsContainer);
      star.dataset.emoji = "star";
      star.onclick = premiumPresentationPopup;
      Context.addSettingListener('premium', () => {
        star.onclick = Context.extpayUser.paidAt ? Context.extpay.openPaymentPage : premiumPresentationPopup;
      });

      const heart = el('div', { title: _t("Donate") }, topButtonsContainer);
      heart.dataset.emoji = "heart";
      el('a', { textContent: '❤️', href: donationLink }, heart);
      return topButtonsContainer;
    }

    const buildExpandArrow = () => {
      const expandArrow = el('div', { className: 'expand-arrow' });
      setSvg(expandArrow, SVG.chevron);
      const setTitleExpand = () => expandArrow.title = Context.get('wideColumn') ? _t("Minimize the panel") : _t("Expand the panel");
      setTitleExpand();
      expandArrow.addEventListener('click', () => Context.set('wideColumn', !Context.get('wideColumn')));
      Context.addSettingListener('wideColumn', setTitleExpand);
      return expandArrow;
    }
    const header = $('.optiheader', panel);
    if (header) {
      header.prepend(el('div', { className: 'watermark', textContent: _t("optisearchName") }, header));
      header.prepend(buildTopButtons());

      let rightButtonsContainer = $('.right-buttons-container', header);
      if (!rightButtonsContainer) {
        rightButtonsContainer = el('div', { className: 'right-buttons-container' }, header);
      }
      rightButtonsContainer.classList.add('headerhover');
      rightButtonsContainer.append(buildExpandArrow());
    }

    const box = panel;
    box.classList.add(Context.BOX_CLASS, 'bright', EngineTechnicalNames[Context.engineName]);
    Context.boxes.push(box);
    if (Context.computeIsOnMobile()) {
      box.classList.add(Context.MOBILE_CLASS);
    }

    Context.appendBoxes([box]);

    Context.updateColor();
    return box;
  }

  static appendBoxes(boxes) {
    const isOnMobile = Context.computeIsOnMobile();
    const firstResultRow = $(Context.engine.resultRow);
    const boxContainer = Context.boxContainer;
    if (!boxContainer) return;

    const startEl = $('.optisearch-start', boxContainer);

    boxes.forEach(box => {
      const boxChat = box.getAttribute("optichat"); 
      if (boxChat && $(`[optichat=${boxChat}]`, boxContainer)) {
        return;
      }
      const mainChatBox = $("[optichat].mainchat", boxContainer);
      if (mainChatBox) {
        if (Context.get("mainChat") === WhichChat) {
          Context.set("mainChat", WhichChat); // set the colum attribute
        } else {
          Context.set("mainChat", mainChatBox.getAttribute("optichat"))
        }
      } else {
        box.classList.add("mainchat");
      }

      if (isOnMobile && firstResultRow) {
        boxContainer.insertBefore(box, firstResultRow);
        return;
      }

      if (!boxChat) {
        if (Context.engine.canPutBefore) {
          const toInsertBefore = $(Context.engine.canPutBefore, boxContainer);
          if (toInsertBefore) {
            boxContainer.insertBefore(box, toInsertBefore);
            return;
          }
        }
        boxContainer.append(box);
        return;
      }

      if (startEl) {
        insertAfter(box, startEl);
        return;
      }

      boxContainer.prepend(box);
    });
  }

  /**
   * Parse or add right column to the results page.
   * Handle widening mechanism.
   */
  static setupRightColumn() {
    const rightColumnSelector = Context.engine.rightColumn;
    const selectorToDiv = (selector) => {
      const div = el('div');
      const selectorParts = [
        ...selector.split(',')[0].matchAll(/[\.#\[][^\.#,\[]+/g)
      ].map(a => a[0]);
      selectorParts.forEach(token => {
        switch (token[0]) {
          case '.': div.classList.add(token.slice(1)); break;
          case '#': div.id = token.slice(1); break;
          case '[': 
            const match = token.trim().slice(1, -1).match(/([^\]=]+)(?:=['"]?([^\]'"]+))?/);
            if (match) {
              match[2] ? div.setAttribute(match[1], match[2]) : div.toggleAttribute(match[1], true);
            }
        }
      });
      return div;
    }

    Context.rightColumn = $(rightColumnSelector);
    if (!Context.rightColumn) {
      if (!Context.centerColumn) {
        err("No center column detected");
        Context.rightColumn = null;
        return;
      }
      Context.rightColumn = selectorToDiv(rightColumnSelector);
      Context.rightColumn.classList.add('optisearch-created');
      insertAfter(Context.rightColumn, Context.centerColumn);
    }

    Context.setupMultiExtensionsSettingListener();
  }

  static setupMultiExtensionsSettingListener() {
    const updateWideState = (value, start=false) => {
      if (!start && !$(`style.wide-column-transition`)) {
        el('style', {
          className: 'wide-column-transition',
          textContent: '.optisearch-column { transition: max-width var(--expand-time) linear, min-width var(--expand-time) linear ; }'
        }, Context.docHead);
      }
      Context.boxContainer.dataset.optisearchColumn = value ? "wide" : "thin";
    }
    updateWideState(Context.get('wideColumn'), true);
    Context.addSettingListener('wideColumn', updateWideState);

    const transition = window.getComputedStyle(Context.boxContainer)["transition"];
    const expandTransition = "min-width var(--expand-time) linear";
    if (!transition.includes(expandTransition)) {
      Context.boxContainer.style.transition = transition + "," + expandTransition;
    }

    setObserver(mutations => {
      mutations.some(m => {
        if (m.attributeName !== "data-optisearch-column") return;
        if(!m.target.dataset.optisearchColumn) {
          Context.set('wideColumn', Context.get('wideColumn')); // to set again the column attribute
          return;
        }
        const isWide = m.target.dataset.optisearchColumn === 'wide';
        if (Context.get('wideColumn') !== isWide) {
          Context.set('wideColumn', isWide);
        }
      })
    }, Context.boxContainer, { attributes: true });

    const updateMainChat = (value, start=false) => {
      if (!start || WhichChat === value) {
        // If it is the start, all the panels might not be there
        // so we want only the concerned chat to set the column attribute
        Context.boxContainer.dataset.optisearchMainChat = value;
      }
      if (WhichChat !== value) {
        Context.set("directchat", false);
      }
      $$('[optichat]').forEach(box => {
        box.classList.toggle('mainchat', box.getAttribute('optichat') === value);
      });
    }
    updateMainChat(Context.get('mainChat'), true);
    Context.addSettingListener('mainChat', updateMainChat);

    setObserver(mutations => {
      mutations.some(m => {
        if (m.attributeName !== "data-optisearch-main-chat") return;
        if(!m.target.dataset.optisearchMainChat) {
          Context.set('mainChat', Context.get('mainChat')); // to set again the column attribute
          return;
        }
        if (Context.get('mainChat') !== m.target.dataset.optisearchMainChat) {
          Context.set('mainChat', m.target.dataset.optisearchMainChat);
        }
      })
    }, Context.boxContainer, { attributes: true });
  }

  static updateColor() {
    const bg = getBackgroundColor();
    const dark = isDarkMode();

    for (let box of $$(Context.BOX_SELECTOR)) {
      box.classList.toggle('dark', dark);
      box.classList.toggle('bright', !dark);
      box.style.backgroundColor = dark ? colorLuminance(bg, 0.02) : '';
    }
  }

  /** 
   * @returns {boolean} Are we on a mobile device
   */
  static computeIsOnMobile() {
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
}
