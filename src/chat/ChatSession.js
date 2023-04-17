class ChatSession {
  static debug = false;
  static #abstractError = "ChatSession is an abstract classes that cannot be instantiated.";
  static #abstractMethodError = "This method should be inherited";
  static #nameError = "The inherited class from ChatSession should be given a name";
  static errors = {};
  get properties() {
    return Chat[this.name];
  }
  static get storageKey() {
    throw ChatSession.#abstractMethodError;
  }

  name = null;
  messages = [];
  session = null;
  /**@type {HTMLElement | null} */
  panel = null;

  constructor(name) {
    if (this.constructor === ChatSession)
      throw ChatSession.#abstractError;
    if (!name)
      throw ChatSession.#nameError;
    this.name = name;
  }

  /**
   * Initialize the session by fetching the necessary stuff from the server
   */
  async init() {
    throw ChatSession.#abstractMethodError;
  }

  /**
   * Fetch credentials
   * @returns credentials
   */
  async fetchSession() {
    throw ChatSession.#abstractMethodError;
  }

  /**
   * Send a prompt
   * @param {string} prompt
   * @returns credentials
   */
  async send(prompt) {
    if (this.constructor === ChatSession)
      throw ChatSession.#abstractMethodError;
    if (ChatSession.debug) {
      this.onmessage(ChatSession.infoHTML('🔍 Searching for: <strong>setInterval()</strong>'));
      await new Promise(r => setTimeout(r, 500));
      this.onmessage(
        `<p><code>stdnum</code> is a Python module that provides functions to parse, validate and reformat standard numbers and codes in different formats. It contains a large collection of number formats<a href="https://github.com/arthurdejong/python-stdnum/" title="GitHub - arthurdejong/python-stdnum: A Python library to provide ..." class="source"><sup>1</sup></a> <a href="https://pypi.org/project/python-stdnum/" title="python-stdnum · PyPI" class="source"><sup>2</sup></a>. Basically any number or code that has some validation mechanism available or some common formatting is eligible for inclusion in this library<a href="https://pypi.org/project/python-stdnum/" title="python-stdnum · PyPI" class="source"><sup>2</sup></a>.</p>
        You can find more information about this module at <a href="https://arthurdejong.org/python-stdnum/">https://arthurdejong.org/python-stdnum/</a>
        <a href="https://pypi.org/project/python-stdnum/" title="python-stdnum · PyPI" class="source superscript">2</a>.`,
        `<div class="learnmore" 
        >Learn more&nbsp: <a class="source" href="https://github.com/arthurdejong/python-stdnum/" >1. github.com</a>
<a class="source" href="https://pypi.org/project/python-stdnum/" >2. pypi.org</a>
<a class="source" href="https://arthurdejong.org/python-stdnum/doc/1.8/index" more>3. arthurdejong.org</a>
<a class="source" href="https://pypi.org/project/python-stdnum-do/" more>4. pypi.org</a>
        <a class="showmore source" title="Show more" invisible=2>+ 2 more</a></div>`
      );
      return;
    }
  }

  createPanel(directchat = true) {
    let lastError = null;

    const body = el("div", { className: 'optibody' });
    const foot = el("div", { className: 'optifoot' });
    const panel = this.panelBlueprint(body, foot);
    const hrFoot = $('.optifoot-hr', panel);
    const responseContainer = el("div", {}, body);
    const actionButton = el('button', { type: 'button', className: 'chatgpt-button' }, body);

    const display = e => e.style.display = '';
    const hide = e => e.style.display = 'none';

    const sendInput = () => this.send(Context.parseSearchParam());

    const setCurrentAction = (action) => {
      if (action)
        display(actionButton);
      switch (action) {
        case 'send':
          actionButton.textContent = `Ask ${this.properties.name}`;
          actionButton.onclick = ping;
          break;
        case 'refresh':
          actionButton.textContent = 'Refresh';
          actionButton.onclick = ping;
          break;
        case 'window':
          actionButton.textContent = lastError.button;
          actionButton.onclick = () => {
            bgWorker({ action: 'window', url: lastError.url });
            setCurrentAction('refresh');
          }
          break;
        default:
          actionButton.onclick = null;
          hide(actionButton);
      }
    }

    const ping = async () => {
      setCurrentAction(null);
      this.onmessage(ChatSession.infoHTML(`Waiting for <strong>${this.properties.name}</strong>...`));
      try {
        await this.init();
      }
      catch (error) {
        lastError = error;
        responseContainer.innerHTML = ChatSession.infoHTML(error.text);
        setCurrentAction('window');
        return;
      }
      sendInput();
    }

    this.onmessage = (bodyHTML, footHTML) => {
      responseContainer.innerHTML = bodyHTML;
      prettifyCode(responseContainer, true);

      const hr = $('.optifoot-hr', panel);
      if (footHTML) {
        foot.innerHTML = footHTML;
        const showmore = $('.showmore', foot);
        if (showmore) {
          showmore.onclick = () => {
            showmore.parentElement.classList.remove('less');
            showmore.remove();
          }
        }
        display(hr);
      } else {
        hide(hr);
      }
    };

    hide(hrFoot);
    if (directchat)
      ping();
    else
      setCurrentAction('send');
    this.panel = panel;
    return this.panel;
  }

  panelBlueprint(body, foot) {
    const panel = el("div", { className: `${Context.PANEL_CLASS} optichat ${isOptiSearch ? 'optisearch' : 'bingchat'}` });
    panel.dataset.chat = this.name;

    panel.innerHTML = `
    <div class="optiheader">
      ${isOptiSearch ? `<div class="watermark">OptiSearch</div>` : ''}
      <div class="ai-name">
        <img title="${this.properties.name} Icon" width=32 height=32 src="${chrome.runtime.getURL(this.properties.icon)}" />
        <a href="${this.properties.href}" class="title chat-title">${this.properties.name}</a>
        ${Object.entries(Chat).length > 1 ? '<span class="switchchat headerhover">⇌</span>' : ''}
      </div>
    </div>
    <hr>
    `;
    if (Object.entries(Chat).length > 1) {
      $('.switchchat', panel).onclick = async () => {
        Context.save['aichat'] = this.name === 'bingchat' ? 'chatgpt' : 'bingchat'
        saveSettings(Context.save);
        Context.aichat(Context.save['aichat'], true);
      }
    }
    panel.append(body);
    el('hr', { className: 'optifoot-hr' }, panel);
    panel.append(foot);

    return panel;
  }

  static infoHTML(content) {
    return `<div class="chat-info">${content}</div>`;
  }
}
