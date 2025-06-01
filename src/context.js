class Context {
  static EXTENSION_SELECTOR_PREFIX = WhichExtension;
  static BOX_CLASS = `${Context.EXTENSION_SELECTOR_PREFIX}-box`;
  static BOX_SELECTOR = `.${Context.BOX_CLASS}`;
  static STYLE_ELEMENT_ID = `${Context.EXTENSION_SELECTOR_PREFIX}-style`;
  static DARK_BG_STYLE_ELEMENT_ID = 'dynamic-dark-background-style';
  static MOBILE_CLASS = 'mobile';

  static engines = {};
  static engine = {};
  static processEngine = {};
  static save = {};
  static settingsListeners = {};

  static boxes = [];
  static shadowStyleContent = "";

  static extpay = null;
  static extpayUser = null;

  /** @type {HTMLElement | null} */
  static rightColumnElement = null;
  static set rightColumn(value) {
    Context.rightColumnElement = value;
    if (value)
      value.dataset.optisearchColumn = Context.get('wideColumn');
  }
  static get rightColumn() {
    return Context.rightColumnElement;
  }

  static centerColumn = null;

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
      Context.processEngine[Context.engineName]();
    }

    if (Context.computeIsOnMobile()) {
      debug("On Mobile !");
    } else if (!Context.rightColumn) {
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
    if (isOptiSearch) styles.push('w3schools', 'wikipedia', 'genius');
    const cssContents = await Promise.all(styles.map(s => read(`src/styles/${s}.css`)));
    Context.shadowStyleContent = cssContents.join('\n');

    // Change style based on the search engine
    const globalStyleContent = await read(`src/styles/box.css`) + '\n' + Context.engine.style ?? '';
    el('style', {
      textContent: globalStyleContent.trim().replaceAll('.optisearchbox', Context.BOX_SELECTOR),
      id: `${Context.STYLE_ELEMENT_ID}-${Context.engineName}`
    }, Context.docHead);
  }

  /**
   * Append pannel to the side of the result page
   * @param {Element} panel the content of the panel
   * @returns {Element} the box where the panel is 
   */
  static appendPanel(panel) {
    const buildTopButtons = () => {
      const topButtonsContainer = el('div', { className: 'top-buttons-container headerhover' });
      const star = el('div', { className: 'thumb', title: _t("Rate this extension") }, topButtonsContainer);
      el('a', { textContent: '👍', href: webstore + '/reviews' }, star);
      const crown = el('div', { className: 'star', title: _t("Premium subscription"), textContent: '⭐' }, topButtonsContainer);
      crown.onclick = premiumPresentationPopup;
      Context.addSettingListener('premium', () => {
        crown.onclick = Context.extpayUser.paidAt ? Context.extpay.openPaymentPage : premiumPresentationPopup;
      });
      const heart = el('div', { className: 'heart', title: _t("Donate") }, topButtonsContainer);
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

    const box = el("div", { className: `${Context.BOX_CLASS} ${Context.engineName}` });
    Context.boxes.push(box);
    if (Context.computeIsOnMobile())
      box.classList.add(Context.MOBILE_CLASS);

    const shadow = box.attachShadow({ mode: "open" });
    el("style", { textContent: Context.shadowStyleContent }, shadow);
    const texStyle = $("#MJX-SVG-styles");
    if (texStyle) el("style", { textContent: texStyle.textContent, id: texStyle.id }, shadow);
    shadow.append(panel);

    panel.classList.add("bright");
    $(`.expand-arrow`, panel)?.classList.toggle('rotated', Context.rightColumn.dataset.optisearchColumn === 'wide');   

    Context.appendBoxes([box]);

    Context.updateColor();
    return box;
  }

  static appendBoxes(boxes) {
    const isOnMobile = Context.computeIsOnMobile();
    const firstResultRow = $(Context.engine.resultRow);
    let boxContainer = Context.rightColumn;

    if (isOnMobile)
      boxContainer = firstResultRow ? firstResultRow.parentElement : Context.centerColumn;
    if (!boxContainer)
      return;

    const startEl = $('.optisearch-start', boxContainer);

    boxes.forEach(box => {
      if (isOnMobile && firstResultRow) {
        boxContainer.insertBefore(box, firstResultRow);
        return;
      }

      if (!$('.optichat', box.shadowRoot)) {
        boxContainer.append(box);
        return;
      }

      const order = ['bard', 'bingchat', 'chatgpt'];
      const precedings = order
        .slice(0, order.indexOf(WhichChat))
        .map(e => boxes.filter(b => $(`.optichat.${e}`, b.shadowRoot)))
        .flat();
      if (precedings.length) {
        const lastPrecedingBox = precedings.at(-1);
        insertAfter(box, lastPrecedingBox);
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
    
    const updateWideState = (value, start=false) => {
      if (!start && !$(`style.wide-column-transition`)) {
        el('style', {
          className: 'wide-column-transition',
          textContent: '.optisearch-column { transition: max-width var(--expand-time) linear, min-width var(--expand-time) linear ; }'
        }, Context.docHead);
      }
      Context.rightColumn.dataset.optisearchColumn = value ? 'wide' : 'thin';
      Context.boxes.forEach(box => {
        $(`.expand-arrow`, box.shadowRoot)?.classList.toggle('rotated', value)
      });
    }
    updateWideState(Context.get('wideColumn'), true);
    Context.addSettingListener('wideColumn', updateWideState);

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
    }, Context.rightColumn, { attributes: true });
  }

  static updateColor() {
    const bg = getBackgroundColor();
    const dark = isDarkMode();

    Context.boxes.map(box => box.shadowRoot).forEach(shadowRoot => {
      let style = $(`#${Context.DARK_BG_STYLE_ELEMENT_ID}`, shadowRoot);
      if (!style) {
        style = el('style', { id: Context.DARK_BG_STYLE_ELEMENT_ID });
        shadowRoot.prepend(style);
      }

      const panel = $(`.optipanel`, shadowRoot); 
      if (dark) {
        style.textContent = `
          .dark {background-color: ${colorLuminance(bg, 0.02)}}
          .dark .optibody.w3body .w3-example {background-color: ${colorLuminance(bg, 0.04)}}
        `;
      }
      panel.classList.toggle('dark', dark);
      panel.classList.toggle('bright', !dark);
    });
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
