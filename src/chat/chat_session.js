class ChatSession {
  static debug = false;
  static #abstractError = "ChatSession is an abstract classes that cannot be instantiated.";
  static #abstractMethodError = "This method should be inherited";
  static #nameError = "The inherited class from ChatSession should be given a name";
  static #undefinedError = "⚠️ Oups, an error occured. Please try again. ⚠️";
  static Svg = {
    send: {"viewBox":"0 0 16 16","children":[{"tagName":"path","d":"M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z","fill":"currentColor"}]},
    chat: {"viewBox":"0 0 24 24", "fill": "none", "stroke-width": "2", "children":[{"tagName":"path","d":"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"},{"tagName":"path","d":"M8 10.5H16","stroke-linecap":"round"},{"tagName":"path","d":"M8 14H13.5","stroke-linecap":"round"}]},
    // The following icons come from https://www.veryicon.com/icons/miscellaneous/feather-v423
    emptyBookmark: {"viewBox":"0 0 24 24","children":[{"tagName":"path","d":"M 6 2 C 4.8444444 2 4 2.9666667 4 4 L 4 22.039062 L 12 19.066406 L 20 22.039062 L 20 20.599609 L 20 4 C 20 3.4777778 19.808671 2.9453899 19.431641 2.5683594 C 19.05461 2.1913289 18.522222 2 18 2 L 6 2 z M 6 4 L 18 4 L 18 19.162109 L 12 16.933594 L 6 19.162109 L 6 4 z"}]},
    filledBookmark: {"viewBox":"0 0 24 24","children":[{"tagName":"path","d":"M 6 2 C 4.8444444 2 4 2.9666667 4 4 L 4 22.039062 L 12 19.066406 L 20 22.039062 L 20 20.599609 L 20 4 C 20 3.4777778 19.808671 2.9453899 19.431641 2.5683594 C 19.05461 2.1913289 18.522222 2 18 2 L 6 2 z"}]},
    emptySet: {"viewBox":"0 0 1024 1024","children":[{"tagName":"path","d":"M512 981.333333C251.733333 981.333333 42.666667 772.266667 42.666667 512S251.733333 42.666667 512 42.666667s469.333333 209.066667 469.333333 469.333333-209.066667 469.333333-469.333333 469.333333z m0-853.333333c-213.333333 0-384 170.666667-384 384s170.666667 384 384 384 384-170.666667 384-384-170.666667-384-384-384z"},{"tagName":"path","d":"M814.933333 857.6c-12.8 0-21.333333-4.266667-29.866666-12.8L179.2 238.933333c-17.066667-17.066667-17.066667-42.666667 0-59.733333s42.666667-17.066667 59.733333 0l601.6 601.6c17.066667 17.066667 17.066667 42.666667 0 59.733333-4.266667 12.8-17.066667 17.066667-25.6 17.066667z"}]},
    magnifyingGlass: {"viewBox":"0 0 1024 1024","children":[{"tagName":"path","d":"M469.333333 853.333333c-213.333333 0-384-170.666667-384-384s170.666667-384 384-384 384 170.666667 384 384-170.666667 384-384 384z m0-682.666666c-166.4 0-298.666667 132.266667-298.666666 298.666666s132.266667 298.666667 298.666666 298.666667 298.666667-132.266667 298.666667-298.666667-132.266667-298.666667-298.666667-298.666666z"},{"tagName":"path","d":"M896 938.666667c-12.8 0-21.333333-4.266667-29.866667-12.8L682.666667 742.4c-17.066667-17.066667-17.066667-42.666667 0-59.733333s42.666667-17.066667 59.733333 0l183.466667 183.466666c17.066667 17.066667 17.066667 42.666667 0 59.733334-8.533333 8.533333-17.066667 12.8-29.866667 12.8z"}]},
    play: {"children":[{"tagName":"path","d":"M213.333333 938.666667c-8.533333 0-12.8 0-21.333333-4.266667-12.8-8.533333-21.333333-21.333333-21.333333-38.4V128c0-17.066667 8.533333-29.866667 21.333333-38.4 12.8-8.533333 29.866667-8.533333 42.666667 0l597.333333 384c12.8 8.533333 21.333333 21.333333 21.333333 34.133333s-8.533333 29.866667-21.333333 34.133334l-597.333333 384c-4.266667 8.533333-12.8 12.8-21.333334 12.8zM256 204.8v610.133333L733.866667 512 256 204.8z"}],"viewBox":"0 0 1024 1024"},
    pause: {"children":[{"tagName":"path","d":"M512 981.333333C251.733333 981.333333 42.666667 772.266667 42.666667 512S251.733333 42.666667 512 42.666667s469.333333 209.066667 469.333333 469.333333-209.066667 469.333333-469.333333 469.333333z m0-853.333333c-213.333333 0-384 170.666667-384 384s170.666667 384 384 384 384-170.666667 384-384-170.666667-384-384-384z"},{"tagName":"path","d":"M426.666667 682.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667V384c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666666 42.666667v256c0 25.6-17.066667 42.666667-42.666666 42.666667zM597.333333 682.666667c-25.6 0-42.666667-17.066667-42.666666-42.666667V384c0-25.6 17.066667-42.666667 42.666666-42.666667s42.666667 17.066667 42.666667 42.666667v256c0 25.6-17.066667 42.666667-42.666667 42.666667z"}],"viewBox":"0 0 1024 1024"},
    user: {"children":[{"tagName":"path","d":"M853.333333 938.666667c-25.6 0-42.666667-17.066667-42.666666-42.666667v-85.333333c0-72.533333-55.466667-128-128-128H341.333333c-72.533333 0-128 55.466667-128 128v85.333333c0 25.6-17.066667 42.666667-42.666666 42.666667s-42.666667-17.066667-42.666667-42.666667v-85.333333c0-119.466667 93.866667-213.333333 213.333333-213.333334h341.333334c119.466667 0 213.333333 93.866667 213.333333 213.333334v85.333333c0 25.6-17.066667 42.666667-42.666667 42.666667zM512 512c-119.466667 0-213.333333-93.866667-213.333333-213.333333s93.866667-213.333333 213.333333-213.333334 213.333333 93.866667 213.333333 213.333334-93.866667 213.333333-213.333333 213.333333z m0-341.333333c-72.533333 0-128 55.466667-128 128s55.466667 128 128 128 128-55.466667 128-128-55.466667-128-128-128z"}],"viewBox":"0 0 1024 1024"},
  }
  
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
        title: 'Send message',
      });
      setSvg(sendButton, ChatSession.Svg.send);
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
        textArea.placeholder = 'Ask me anything...';
      });
      this.listen('disableSend', () => {
        textArea.disabled = true;
        textArea.placeholder = `${this.properties.name} is answering...`;
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
        title: `Save conversation in ${this.properties.name}`,
        className: 'save-conversation-button',
      });
      this.setDeleteConversationAfter = async (value) => {
        if (!value && await Context.handleNotPremium()) return;
        this.deleteConversationAfter = value;
        setSvg(bookmark, ChatSession.Svg[value ? 'emptyBookmark' : 'filledBookmark']);
      };
      this.setDeleteConversationAfter(true);
      bookmark.addEventListener('click', () => {
        this.setDeleteConversationAfter(!this.deleteConversationAfter);
      });
      return bookmark;
    }

    const buildChatButton = () => {
      const continueChat = el('div', {
        title: 'Continue the conversation',
        className: 'continue-conversation-button',
      });
      setSvg(continueChat, ChatSession.Svg.chat);
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
        setSvg(playPauseButton, ChatSession.Svg[Context.get('directchat') ? 'pause' : 'play'])
        playPauseButton.title = Context.get('directchat') ? `Pause auto-generation` : `Enable auto-generation`;
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
    this.onMessage(ChatSession.infoHTML(`Waiting for <strong>${this.properties.name}</strong>...`));
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
        btn.textContent = `Ask ${this.properties.name}`;
        btn.onclick = () => this.setupAndSend();
        break;
      case 'refresh':
        btn.textContent = 'Refresh';
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
