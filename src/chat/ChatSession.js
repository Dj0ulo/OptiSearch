class ChatSession {
  static debug = false;
  static #abstractError = "ChatSession is an abstract classes that cannot be instantiated.";
  static #abstractMethodError = "This method should be inherited";
  static #nameError = "The inherited class from ChatSession should be given a name";
  static undefinedError = "⚠️ Oups, an error occured. Please try again. ⚠️";
  static #svgs = {
    send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" class="h-4 w-4 m-1 md:m-0" stroke-width="2"><path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" fill="currentColor"></path></svg>',
    chat: '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"/><path d="M8 10.5H16" stroke-linecap="round"/><path d="M8 14H13.5" stroke-linecap="round"/></svg>',
    emptyBookmark: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="21" height="21" viewBox="0 0 24 24"><path d="M 6 2 C 4.8444444 2 4 2.9666667 4 4 L 4 22.039062 L 12 19.066406 L 20 22.039062 L 20 20.599609 L 20 4 C 20 3.4777778 19.808671 2.9453899 19.431641 2.5683594 C 19.05461 2.1913289 18.522222 2 18 2 L 6 2 z M 6 4 L 18 4 L 18 19.162109 L 12 16.933594 L 6 19.162109 L 6 4 z"></path></svg>',
    filledBookmark: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="21" height="21" viewBox="0 0 24 24"><path d="M 6 2 C 4.8444444 2 4 2.9666667 4 4 L 4 22.039062 L 12 19.066406 L 20 22.039062 L 20 20.599609 L 20 4 C 20 3.4777778 19.808671 2.9453899 19.431641 2.5683594 C 19.05461 2.1913289 18.522222 2 18 2 L 6 2 z"></path></svg>',
  }
  
  static errors = {};

  static MODE_TEXT = 0;
  static MODE_DISCUSSION = 1;

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
  actionButton = null;
  lastError = null;
  mode = ChatSession.MODE_TEXT;
  sendingAllowed = true;
  deleteConversationAfter = true;

  discussion = {
    el: el('div', { className: 'discussion-container' }),
    /** @type {MessageContainer[]} */
    messageContainers: [],
    isScrolledToBottom: true,
    get length() {
      return this.messageContainers.length;
    },
    appendMessage(messageContainer) {
      this.messageContainers.push(messageContainer);
      this.el.appendChild(this.messageContainers.at(-1).el);
      this.el.scrollTop = this.el.scrollHeight;
    },
    setLastMessageHTML(html) {
      this.isScrolledToBottom = Math.abs(this.el.scrollTop + this.el.offsetHeight - this.el.scrollHeight) <= 1;
      if (this.messageContainers.length >= 0) {
        this.messageContainers.at(-1).html = html;
      }
      if (this.isScrolledToBottom) {
        this.el.scrollTop = this.el.scrollHeight;
      }
    },
  }


  responseContainer = el("div");

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
      this.onmessage(ChatSession.infoHTML('🔍 Searching for: <strong>setInterval()</strong>'));
      await new Promise(r => setTimeout(r, 2000));
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
      this.allowSend();
      return;
    }
  }

  /**
   * Remove the conversation
   * @returns {Promise} Server result of the remove request
   */
  removeConversation() {
    if (this.constructor === ChatSession)
      throw ChatSession.#abstractMethodError;
  }

  createPanel(directchat = true) {
    const { body, foot, panel, footHr } = this.#panelBlueprint();
    this.panel = panel;

    hideElement(footHr);

    body.appendChild(this.responseContainer);

    this.actionButton = el('button', { type: 'button', className: 'chatgpt-button' }, body);

    const chatContainer = el('div', { className: 'chat-container' });
    chatContainer.appendChild(this.discussion.el);
    hideElement(chatContainer);

    const inputContainer = el('div', { className: 'input-container' }, chatContainer);
    const updateInputContainerVisibility = () => {
      if (!!this.actionButton.textContent) {
        hideElement(inputContainer);
        return;
      }
      displayElement(inputContainer);
    }
    updateInputContainerVisibility();

    const textArea = el('textarea', {}, inputContainer);
    const infoContainer = el('div', { className: 'info-container' }, inputContainer);
    const maxCharContainer = el('div', { className: 'max-char-container', textContent: '0/1000' }, infoContainer);
    const MAX_CHAR = 2000;
    const updateMaxChar = () => {
      maxCharContainer.textContent = `${textArea.value.length}/${MAX_CHAR}`;
    }
    updateMaxChar();
    const sendTextArea = () => {
      if (!this.sendingAllowed) return;
      this.#setupAndSend(textArea.value);
      textArea.value = '';
      updateMaxChar();
    }
    textArea.addEventListener('input', () => {
      if (textArea.value.length > MAX_CHAR) {
        textArea.value = textArea.value.slice(0, MAX_CHAR);
      }
      updateMaxChar();
    });
    textArea.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendTextArea();
      }
    });
    const sendButton = el('div', {
      type: 'button',
      className: 'send-button',
      title: 'Send message',
      innerHTML: ChatSession.#svgs.send,
    }, infoContainer);
    sendButton.addEventListener('click', sendTextArea);

    const leftButtonsContainer = el('div', { className: 'left-buttons-container' });
    insertAfter(leftButtonsContainer, $('.ai-name', this.panel));

    const bookmark = el('div', {
      title: `Save conversation in ${this.properties.name}`,
      className: 'save-conversation-button',
    }, leftButtonsContainer);

    const setDeleteConversationAfter = async (value) => {
      if (value) {
        this.deleteConversationAfter = true;
        bookmark.innerHTML = ChatSession.#svgs.emptyBookmark;
      } else {
        if (await Context.handleNotPremium()) return;
        this.deleteConversationAfter = false;
        bookmark.innerHTML = ChatSession.#svgs.filledBookmark;
      }
    };
    setDeleteConversationAfter(true);

    bookmark.addEventListener('click', () => {
      setDeleteConversationAfter(!this.deleteConversationAfter);
    });

    const continueChat = el('div', {
      title: 'Continue the conversation',
      className: 'continue-chat-button',
      innerHTML: ChatSession.#svgs.chat,
    }, leftButtonsContainer);

    const switchConversationMode = async () => {
      if (await Context.handleNotPremium()) return;

      if (this.mode === ChatSession.MODE_DISCUSSION) {
        return;
      }
      if (this.discussion.length === 0) {
        this.#setCurrentAction(null);
        textArea.value = parseSearchParam();
      }
      this.mode = ChatSession.MODE_DISCUSSION;
      this.responseContainer.innerHTML = '';
      this.responseContainer.appendChild(chatContainer);
      displayElement(chatContainer);
      hideElement(continueChat);
      hideElement(footHr);
      hideElement(foot);
    }
    continueChat.addEventListener('click', switchConversationMode);

    this.onmessage = async (bodyHTML, footHTML) => {
      this.discussion.setLastMessageHTML(bodyHTML);
      if (this.mode === ChatSession.MODE_DISCUSSION) {
        updateInputContainerVisibility();
        return;
      }

      this.responseContainer.innerHTML = bodyHTML;
      prettifyCode(this.responseContainer);
      if (!footHTML) {
        hideElement(footHr);
        return;
      }
      displayElement(footHr);
      foot.innerHTML = footHTML;

      const showmore = $('.showmore', foot);
      if (!showmore) {
        return;
      }
      showmore.addEventListener('click', () => {
        showmore.parentElement.classList.remove('less');
        showmore.remove();
      });
    };

    this.allowSend = () => {
      this.sendingAllowed = true;
      textArea.disabled = false;
      textArea.placeholder = 'Ask me anything...';
      displayElement(sendButton);
    }
    this.disableSend = () => {
      this.sendingAllowed = false;
      textArea.disabled = true;
      textArea.placeholder = `${this.properties.name} is answering...`;
      hideElement(sendButton);
    }

    this.onErrorMessage = (error) => {
      if (!error)
        error = ChatSession.undefinedError;
      warn(error);
      this.onmessage(ChatSession.infoHTML(error));
    }

    if (directchat)
      this.#setupAndSend();
    else
      this.#setCurrentAction('send');
    return this.panel;
  }

  //---------------PRIVATE METHODS---------------------------

  async #setupAndSend(prompt) {
    if (!this.sendingAllowed) return;
    
    prompt = prompt ?? parseSearchParam();

    this.#setCurrentAction(null);
    this.disableSend();
    this.discussion.appendMessage(new MessageContainer(Message.USER, escapeHtml(prompt)));
    this.discussion.appendMessage(new MessageContainer(MessageContainer.BOT));
    this.onmessage(ChatSession.infoHTML(`Waiting for <strong>${this.properties.name}</strong>...`));
    try {
      if (!this.canSend())
        await this.init();
      await this.send(prompt);
    }
    catch (error) {
      this.lastError = error;
      if (error && error.code && error.text) {
        this.#setCurrentAction('window');
        this.onmessage(ChatSession.infoHTML(error.text));
      }
      else {
        err(error.error || error);
        this.onmessage(ChatSession.infoHTML(ChatSession.undefinedError));
      }
    }
  }

  #setCurrentAction(action) {
    this.allowSend();
    const btn = this.actionButton;
    if (action)
      displayElement(btn);
    switch (action) {
      case 'send':
        btn.textContent = `Ask ${this.properties.name}`;
        btn.onclick = () => this.#setupAndSend();
        break;
      case 'refresh':
        btn.textContent = 'Refresh';
        btn.onclick = () => this.#setupAndSend();
        break;
      case 'window':
        btn.textContent = this.lastError.button;
        btn.onclick = () => {
          bgWorker({ action: 'window', url: this.lastError.url });
          this.#setCurrentAction('refresh');
        }
        break;
      default:
        btn.onclick = null;
        btn.textContent = '';
        hideElement(btn);
    }
  }

  #panelBlueprint() {
    const panel = el("div", { className: `${Context.PANEL_CLASS} optichat ${WhichChat}` });
    panel.dataset.chat = this.name;

    panel.innerHTML = `
    <div class="optiheader">
      <div class="watermark">OptiSearch</div>
      <div class="ai-name">
        <img alt="${this.properties.name} icon" width=32 height=32 src="${chrome.runtime.getURL(this.properties.icon)}" />
        <a href="${this.properties.href}" class="title chat-title">${this.properties.name}</a>
      </div>
    </div>
    <hr>
    `;

    const body = el("div", { className: 'optibody' });
    panel.append(body);

    const footHr = el('hr', { className: 'optifoot-hr' }, panel);
    const foot = el("div", { className: 'optifoot' });
    panel.append(foot);

    return { body, foot, panel, footHr };
  }
}

class Message {
  static USER = 0;
  static BOT = 1;
  constructor(author = Message.BOT, text = '') {
    this.author = author;
    this.text = text;
  }
}

class MessageContainer extends Message {
  constructor(author = Message.BOT, html = '') {
    super(author, html);
    this.box = el('div', { className: `box-message-container ${author === Message.USER ? 'user' : 'bot'}` });
    this.bubble = el('div', { className: `message-container` }, this.box);
    this.html = html;
  }
  /**
   * @param {string} html
   */
  set html(html) {
    this.text = html;
    this.bubble.innerHTML = html;
    if (this.bubble.children.length === 1 && this.bubble.firstChild.tagName === 'P')
      this.bubble.innerHTML = this.bubble.firstChild.innerHTML;
    prettifyCode(this.bubble);
  }
  get html() {
    return this.text;
  }
  get el() {
    return this.box;
  }
}