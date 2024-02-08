class ChatSession {
  static debug = false;
  static #abstractError = "ChatSession is an abstract classes that cannot be instantiated.";
  static #abstractMethodError = "This method should be inherited";
  static #nameError = "The inherited class from ChatSession should be given a name";
  static #undefinedError = "⚠️ " + _t("Oups, an error occured. Please try again.");

  static errors = {};
  static Mode = {
    Text: 0,
    Discussion: 1,
  };

  events = {};
  dispatch(event, ...data) {
    if (!(event in this.events)) return;
    this.events[event].forEach(ev => ev(...data));
  }
  listen(event, callback) {
    if (!(event in this.events)) this.events[event] = [];
    this.events[event].push(callback);
  }

  static infoHTML(content) {
    return `<div class="chat-info">${content}</div>`;
  }
  static get storageKey() {
    throw ChatSession.#abstractMethodError;
  }

  name = null;
  properties = {};
  session = null;
  /** @type {HTMLElement | null} */
  panel = null;
  currentAction = null;
  actionButton = null;
  lastError = null;
  mode = ChatSession.Mode.Text;
  sendingAllowed = true;
  deleteConversationAfter = true;

  discussion = new Discussion();

  constructor(name) {
    if (this.constructor === ChatSession)
      throw ChatSession.#abstractError;
    if (!name)
      throw ChatSession.#nameError;
    this.name = name;
    window.addEventListener('beforeunload', () => {
      if (this.deleteConversationAfter) {
        this.removeConversation();
      }
    });
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
   * @returns True if we can send a message, false if the nessesary configuration is invalid or has not been fetched yet
   */
  canSend() {
    return !!this.session;
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
      await new Promise(r => setTimeout(r, 2000));
      this.onMessage(ChatSession.infoHTML('🔍 Searching for: <strong>setInterval()</strong>'));
      await new Promise(r => setTimeout(r, 2000));
      this.onMessage(
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
      this.allowSend();
      return;
    }
  }

  /**
   * Remove the conversation
   * @returns {Promise} Server result of the remove request
   */
  removeConversation() {
    if (this.constructor === ChatSession) {
      throw ChatSession.#abstractMethodError;
    }
  }

  createPanel(directchat = true) {

    const buildPanelSkeleton = () => {
      const panel = el("div", { className: `${Context.PANEL_CLASS} optichat ${WhichChat}` });
      panel.dataset.chat = this.name;
  
      const header = el("div", { className: 'optiheader' }, panel);
      header.innerHTML = `
        <div class="ai-name">
          <img alt="${this.properties.name} icon" width=32 height=32 src="${chrome.runtime.getURL(this.properties.icon)}" />
          <a href="${this.properties.href}" class="title chat-title">${this.properties.name}</a>
        </div>
      `;
      el('div', { className: 'right-buttons-container' }, header);
      
      hline(panel);
      el("div", { className: 'optibody' }, panel);
  
      const footHr = el('hr', { className: 'optifoot-hr' }, panel);
      hideElement(footHr);
  
      const foot = el("div", { className: 'optifoot' });
      this.listen('conversationModeSwitched', () => {
        hideElement(footHr);
        hideElement(foot);
      });
      this.listen('onMessage', (_, footHTML) => {
        if(this.mode !== ChatSession.Mode.Text) return;
        if (footHTML) {
          displayElement(footHr);
          foot.innerHTML = footHTML;
          return;
        }
        hideElement(footHr);
      });
  
      panel.append(foot);
  
      return panel;
    }

    const buildCharacterCounter = () => {
      const MAX_CHAR = 2000;
      const maxCharContainer = el('div', { className: 'max-char-container' });
      this.listen('textAreaChange', (value) => {
        if (value.length > MAX_CHAR) {
          value = value.slice(0, MAX_CHAR);
        }
        maxCharContainer.textContent = `${value.length}/${MAX_CHAR}`;
      });
      return maxCharContainer;
    }

    const buildSendButton = () => {
      const sendButton = el('div', {
        type: 'button',
        className: 'send-button',
        title: _t('Send message'),
      });
      setSvg(sendButton, SVG.send);
      this.listen('textAreaChange', (value) => {
        if (!value) {
          sendButton.setAttribute('disabled', '');
        } else {
          sendButton.removeAttribute('disabled');
        }
      });
      this.listen('allowSend', () => displayElement(sendButton));
      this.listen('disableSend', () => hideElement(sendButton));
      sendButton.addEventListener('click', () => this.sendTextArea());
      return sendButton;
    }
    
    const buildInfoContainer = () => {
      const infoContainer = el('div', { className: 'info-container' });
      infoContainer.append(
        buildCharacterCounter(),
        buildSendButton(),
      );
      return infoContainer;
    }

    const buildTextArea = () => {
      const textArea = el('textarea', {});
      const setTextAreaValue = (value) => {
        textArea.value = value;
        this.dispatch('textAreaChange', textArea.value);
      };
      this.sendTextArea = async () => {
        if (!this.sendingAllowed || !textArea.value) return;
        if (await Context.handleNotPremium()) return;
        this.setupAndSend(textArea.value);
        setTextAreaValue('');
      };
      this.listen('allowSend', () => {
        textArea.disabled = false;
        textArea.placeholder = _t('Ask me anything...');
      });
      this.listen('disableSend', () => {
        textArea.disabled = true;
        textArea.placeholder = _t('$AI$ is answering...', this.properties.name);
      });
      this.listen('conversationModeSwitched', () => {
        if (this.discussion.length === 0) {
          setTextAreaValue(parseSearchParam());
        } else {
          setTextAreaValue('');
        }
      });
      textArea.addEventListener('input', () => this.dispatch('textAreaChange', textArea.value));
      textArea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendTextArea();
        }
      });
      return textArea;
    }

    const buildInputContainer = () => {
      const inputContainer = el('div', { className: 'input-container' });
      const updateInputContainerVisibility = () => {
        if (!!this.actionButton.textContent) {
          hideElement(inputContainer);
        } else {
          displayElement(inputContainer);
        }
      };
      updateInputContainerVisibility();
      this.listen('onMessage', updateInputContainerVisibility);
      this.listen('conversationModeSwitched', updateInputContainerVisibility);

      inputContainer.append(
        buildTextArea(),
        buildInfoContainer(),
      );
      return inputContainer;
    }

    const buildChatContainer = () => {
      const chatContainer = el('div', { className: 'response-container' });
      this.listen('conversationModeSwitched', () => chatContainer.className = 'chat-container');
      chatContainer.append(
        this.discussion.el,
        buildInputContainer(),
      );
      return chatContainer;
    }
    
    /** Left buttons **/
    const buildBookmarkButton = () => {
      const bookmark = el('div', {
        title: _t('Save conversation in $AI$', this.properties.name),
        className: 'save-conversation-button',
      });
      this.setDeleteConversationAfter = async (value) => {
        if (!value && await Context.handleNotPremium()) return;
        this.deleteConversationAfter = value;
        setSvg(bookmark, SVG[value ? 'emptyBookmark' : 'filledBookmark']);
      };
      this.setDeleteConversationAfter(true);
      bookmark.addEventListener('click', () => {
        this.setDeleteConversationAfter(!this.deleteConversationAfter);
      });
      return bookmark;
    }

    const buildChatButton = () => {
      const continueChat = el('div', {
        title: _t('Continue the conversation'),
        className: 'continue-conversation-button',
      });
      setSvg(continueChat, SVG.chat);
      continueChat.addEventListener('click', async () => {
        if (await Context.handleNotPremium()) return;
        if (this.mode === ChatSession.Mode.Discussion) {
          return;
        }
        this.mode = ChatSession.Mode.Discussion;
        this.setDeleteConversationAfter(false);
        hideElement(continueChat);
        if (this.discussion.length === 0) {
          this.setCurrentAction(null);
        }
        this.dispatch('conversationModeSwitched', this.mode);
      });

      return continueChat;
    }

    const buildLeftButtonsContainer = () => {
      const leftButtonsContainer = el('div', { className: 'left-buttons-container' });
      leftButtonsContainer.append(
        buildBookmarkButton(),
        buildChatButton(),
      );
      return leftButtonsContainer;
    }

    const buildPauseButton = () => {
      const playPauseButton = el('div', { className: 'play-pause' });
      const setPlayPauseText = () => {
        setSvg(playPauseButton, SVG[Context.get('directchat') ? 'pause' : 'play'])
        playPauseButton.title = Context.get('directchat') ? _t('Pause auto-generation') : _t('Enable auto-generation')
        if (this.currentAction === 'send' && Context.get('directchat')) {
          this.setupAndSend();
        }
      };
      setPlayPauseText();
      playPauseButton.addEventListener('click', () => Context.set('directchat', !Context.get('directchat')));
      Context.addSettingListener('directchat', setPlayPauseText);
      return playPauseButton;
    }

    const buildActionButton = () => {
      return el('button', { type: 'button', className: 'chatgpt-button' });
    }


    this.panel = buildPanelSkeleton();
    this.actionButton = buildActionButton();
    $('.optibody', this.panel).append(
      buildChatContainer(),
      this.actionButton,
    );
    $('.right-buttons-container', this.panel).append(buildPauseButton());
    insertAfter(buildLeftButtonsContainer(), $('.ai-name', this.panel));

    if (directchat) {
      this.setupAndSend();
    } else {
      this.setCurrentAction('send');
    }
    return this.panel;
  }

  onMessage(bodyHTML, footHTML) {
    this.discussion.setLastMessageHTML(bodyHTML);
    this.dispatch('onMessage', bodyHTML, footHTML);
  }

  onErrorMessage(error) {
    this.session = null;
    if (!error)
      error = ChatSession.#undefinedError;
    warn(error);
    this.onMessage(ChatSession.infoHTML(error));
  }

  allowSend() {
    this.sendingAllowed = true;
    this.dispatch('allowSend');
  }

  disableSend() {
    this.sendingAllowed = false;
    this.dispatch('disableSend');
  }

  restartConversation() {
    if (this.session && this.deleteConversationAfter) {
      this.removeConversation();
    }
    this.session = null;
    this.discussion.clear();
    this.setupAndSend();
    if (this.mode === ChatSession.Mode.Discussion) {
      this.dispatch('conversationModeSwitched', this.mode);
    }
  }

  handleActionError(error) {
    this.lastError = error;
    this.session = null;
    if (error && error.code && error.text) {
      this.setCurrentAction(error.action ?? 'window');
      this.onMessage(ChatSession.infoHTML(error.text));
    }
    else {
      err(error.error || error);
      this.onMessage(ChatSession.infoHTML(ChatSession.#undefinedError));
    }
  }

  async setupAndSend(prompt) {
    if (!this.sendingAllowed) return;
    
    prompt = prompt ?? parseSearchParam();

    this.setCurrentAction(null);
    this.disableSend();
    this.discussion.appendMessage(new MessageContainer(Author.User, escapeHtml(prompt)));
    this.discussion.appendMessage(new MessageContainer(Author.Bot, ''));
    this.onMessage(ChatSession.infoHTML(_t("Waiting for <strong>$AI$</strong>...", this.properties.name)));
    try {
      if (!this.canSend()) {
        await this.init();
      }
      if (this.canSend()) {
        await this.send(prompt);
      }
    }
    catch (error) {
      this.handleActionError(error);
    }
  }

  setCurrentAction(action) {
    this.allowSend();
    const btn = this.actionButton;
    this.currentAction = action;
    if (action)
      displayElement(btn);
    switch (action) {
      case 'send':
        btn.textContent = _t('Ask $AI$', this.properties.name);
        btn.onclick = () => this.setupAndSend();
        break;
      case 'refresh':
        btn.textContent = _t('Refresh');
        btn.onclick = () => this.restartConversation();
        break;
      case 'window':
        btn.textContent = this.lastError.button;
        btn.onclick = () => {
          bgWorker({ action: 'window', url: this.lastError.url });
          this.setCurrentAction('refresh');
        }
        break;
      default:
        this.currentAction = null;
        btn.onclick = null;
        btn.textContent = '';
        hideElement(btn);
    }
  }
}
