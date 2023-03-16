class ChatSession {
  static debug = false;
  static #abstractError = "ChatSession is an abstract classes that cannot be instantiated.";
  static #abstractMethodError = "This method should be inherited";
  static #nameError = "The inherited class from ChatSession should be given a name";
  static errors = {};
  get properties() {
    return AIAssistant[this.name];
  }
  static get storageKey() {
    throw ChatSession.#abstractMethodError;
  }

  name = null;
  messages = [];
  session = null;

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
      await new Promise(r => setTimeout(r, 3000));
      this.onmessage(
        `<p><code>setInterval()</code> is a JavaScript method that repeats a block of code at every given timing event. The commonly used syntax of <code>setInterval()</code> is: <code>setInterval(function, milliseconds);</code><a href="https://www.programiz.com/javascript/setInterval" title="Javascript setInterval() - Programiz"><sup>1</sup></a> <a href="https://www.javatpoint.com/javascript-setinterval-method" title="JavaScript setInterval() method - javatpoint"><sup>2</sup></a> <a href="https://developer.mozilla.org/en-US/docs/Web/API/setInterval" title="setInterval() - Web APIs | MDN - Mozilla"><sup>4</sup></a> <a href="https://www.w3schools.com/jsref/met_win_setinterval.asp" title="Window setInterval() Method - W3Schools"><sup>5</sup></a> </p><p>Is there anything else you would like to know about <code>setInterval()</code>?</p>`,
        `Learn more: <a href="https://www.programiz.com/javascript/setInterval">1. www.programiz.com</a> <a href="https://www.javatpoint.com/javascript-setinterval-method">2. www.javatpoint.com</a> <a href="https://developer.mozilla.org/en-US/docs/Web/API/setInterval">3. developer.mozilla.org</a> <a href="https://www.w3schools.com/jsref/met_win_setinterval.asp">4. www.w3schools.com</a>`
      );
      return;
    }
  }

  panel() {
    let lastError = null;

    const body = el("div");
    const foot = el("div");
    const panel = this.panelBlueprint(body, foot);
    const hrFoot = $('.optifoot-hr', panel);
    const responseContainer = el("div", {}, body);
    const actionButton = el('button', { type: 'button', className: 'chatgpt-button' }, body);

    const display = e => e.style.display = '';
    const hide = e => e.style.display = 'none';

    const sendInput = () => this.send(Context.searchString);

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
      Context.prettifyCode(body, true);

      const hr = $('.optifoot-hr', panel);
      if (footHTML) {
        foot.innerHTML = footHTML;
        display(hr);
      } else {
        hide(hr);
      }
    };

    hide(hrFoot);
    if (Context.isActive('directchat'))
      ping();
    else
      setCurrentAction('send');
    Context.appendPanel(panel, true);
  }

  panelBlueprint(body, foot) {
    const panel = el("div", { className: `${Context.PANEL_CLASS}` });

    panel.innerHTML = `
<div class="opticontent">
  <div class="watermark">OptiSearch</div>
  <div class="optiheader">
    <div class="ai-name">
      <img width=32 height=32 src="${chrome.runtime.getURL(this.properties.icon)}" />
      <span class="title chat-title" style="bottom: 10px">${this.properties.name}</span>
      <span class="switch">⇌</span>
    </div>
  </div>
  <hr>
  <div class="optibody"></div>
  <hr class="optifoot-hr">
  <div class="optifoot"></div>
</div>    
    `;
    $('.ai-name', panel).onclick = () => {
      Context.save['aichat'] = this.name === 'bingchat' ? 'chatgpt' : 'bingchat'
      saveSettings(Context.save);
      panel.parentNode.remove()
      Context.aichat();
    }
    if (body) {
      body.classList.add('optibody');
      $('.optibody', panel).replaceWith(body);
    }
    if (foot)
      $('.optifoot', panel).append(foot);

    return panel;
  }

  static infoHTML(content) {
    return `<div class="chat-info">${content}</div>`;
  }
}
