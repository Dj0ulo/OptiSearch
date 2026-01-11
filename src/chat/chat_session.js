class ChatSession {
  static chatProperties = {
    'bard': {
      name: "Gemini",
      link: "https://gemini.google.com",
      icon: "src/images/bard.png",
      href: this.urlPrefix,
    },
    'chatgpt': {
      name: "ChatGPT",
      link: "https://chatgpt.com",
      icon: "src/images/chatgpt.png",
      href: "https://chatgpt.com",
    },
    'claude': {
      name: "Claude",
      link: "https://claude.ai",
      icon: "src/images/claude.png",
      href: "https://claude.ai",
    },
    'perplexity': {
      name: "Perplexity",
      link: "https://www.perplexity.ai",
      icon: "src/images/perplexity.png",
      href: "https://www.perplexity.ai",
    },
  };
  static get debug() {
    return !!new URL(location).searchParams.get("optisearch-test-mode");
  };
  static #abstractError = "ChatSession is an abstract classes that cannot be instantiated.";
  static #abstractMethodError = "This method should be inherited";
  static #nameError = "The inherited class from ChatSession should be given a name";
  static #undefinedError = _t("Oups, an error occured. Please try again.");

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
    return !!this.session || ChatSession.debug;
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
      console.warn("Debug mode");
      await new Promise(r => setTimeout(r, 100));
      this.onMessage(
        `<p>Fake response</p>`
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

    const buildLearnMoreSection = (sources) => {
      const visibleCount = 2;
      const invisibleCount = Math.max(0, Object.keys(sources).length - visibleCount);
      const learnMoreSection = el('div', { className: 'learnmore less'});

      el('span', { textContent: `${_t("Learn more")}\xa0: `}, learnMoreSection);

      sources.forEach(({index, href}, i) => {
        const link = el('a', { className: 'source', href, textContent: `${index ?? i+1}. ${new URL(href).host}`}, learnMoreSection);
        if (i >= visibleCount) {
          link.setAttribute('more', '');
        }
        // To make sure they go to next line if there is not enough horizontal space in the panel
        learnMoreSection.append('\n');
      });

      const showMoreButton = el('a', {
        className:'showmore source',
        title: _t("Show more"),
        textContent: _t("+$n$ more", invisibleCount)
      }, learnMoreSection);
      showMoreButton.dataset.invisibleCount = invisibleCount;

      showMoreButton.addEventListener('click', () => {
        showMoreButton.parentElement.classList.remove('less');
        showMoreButton.remove();
      });
      return learnMoreSection;
    }

    const buildFootNote = () => {
      const hr = el('hr', { className: 'optifoot-hr' });
      hideElement(hr);
  
      const foot = el("div", { className: 'optifoot' });
      this.listen('conversationModeSwitched', () => {
        hideElement(hr);
        hideElement(foot);
      });

      this.listen('onMessage', (_, sources) => {
        if(this.mode !== ChatSession.Mode.Text) return;
        foot.replaceChildren();
        if (!sources?.length) {
          hideElement(hr);
          return;
        }
        displayElement(hr);
        foot.append(buildLearnMoreSection(sources));
      });

      this.listen('clear', () => {
        hideElement(hr);
        foot.replaceChildren();
      });
      return [hr, foot];
    };

    const buildChatDropdown = (onChange) => {
      const optionHTML = ({name, icon}) => `
        <img alt="${name} icon" width=32 height=32 src="${chrome.runtime.getURL(icon)}" />
        <span class="title">${name}</span>
      `;
      const dropdown = el('div', { className: 'ai-dropdown' });
      const selected = el('div', {
        className: 'ai-selected',
        innerHTML: optionHTML(this.properties),
      }, dropdown);
      const menu = el('div', { className: 'ai-dropdown-menu' }, dropdown);

      const updateMenuPosition = () => {
          const rect = selected.getBoundingClientRect();
          menu.style.left = `${rect.left}px`;
          menu.style.top = `${rect.bottom}px`;
          menu.style.minWidth = `${rect.width}px`;
      }

      // Build menu options
      Object.entries(ChatSession.chatProperties).forEach(([ai, props]) => {
        const option = el('div', {
          className: 'ai-dropdown-option',
          innerHTML: optionHTML(props), 
        }, menu);
        option.dataset.value = ai;
        option.addEventListener('mouseup', (e) => {
          hideElement(menu);
          onChange(ai, e);
        });

        const link = el('a', {
          href: props.link,
          target: '_blank',
          className: 'ai-option-link',
          innerHTML: '&#x2197;', // Top-right arrow
        }, option);
        link.addEventListener('mouseup', e => e.stopPropagation());
      });

      // Toggle menu
      selected.addEventListener('mousedown', (e) => {
        if (menu.style.display === 'block') {
          hideElement(menu);
        } else {
          menu.style.display = 'block';
          $$('.ai-dropdown-option', menu).forEach(option => {
            if ($(`[optichat=${option.dataset.value}]`)) {
              option.classList.add("has-extension");
            }
          });
          updateMenuPosition();
        }
      });

      window.addEventListener('scroll', () => {
        if (menu.style.display === 'block') {
          updateMenuPosition();
        }
      });

      // Hide menu on outside click
      document.addEventListener('mousedown', (e) => {
        if (!dropdown.contains(e.target) && menu.style.display === 'block') {
          hideElement(menu);
        }
      });

      hideElement(menu);
      return dropdown;
    }

    const buildPanelSkeleton = () => {
      const panel = el("div");
      panel.setAttribute("optichat", this.name);
  
      const header = el("div", { className: 'optiheader' }, panel);

      const aiDropdown = buildChatDropdown((ai, event) => {
        if ($(`[optichat=${ai}]`)) {
          event.preventDefault();
          Context.set("mainChat", ai);
          return;
        } else {
          el('a', { 
            href: webstores['bingchat'],
            target: "_blank",
          }).click();
        }
      });
      header.append(aiDropdown);

      el('div', { className: 'right-buttons-container' }, header);
      
      hline(panel);
      el("div", { className: 'optibody' }, panel);
  
      panel.append(...buildFootNote());
  
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
        this.setupAndSend(textArea.value, false);
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
      this.listen('clear', () => hideElement(inputContainer));

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

    const buildActionButton = () => el('button', { type: 'button', className: 'chatgpt-button action-button' });

    const buildAskButton = () => {
      const askButton = el('button', { type: 'button', className: 'chatgpt-button ask-button', textContent: _t('Ask') });
      askButton.addEventListener('click', () => this.setupAndSend());
      return askButton;     
    }

    this.panel = buildPanelSkeleton();
    this.actionButton = buildActionButton();
    $('.optibody', this.panel).append(
      buildChatContainer(),
      this.actionButton,
    );
    $('.right-buttons-container', this.panel).append(buildPauseButton());
    insertAfter(buildLeftButtonsContainer(), $('.ai-dropdown', this.panel));

    if (directchat) {
      this.setupAndSend();
    } else {
      const askButton = buildAskButton();
      insertAfter(askButton, $('.ai-dropdown', this.panel));
      this.setCurrentAction('send');
    }
    return this.panel;
  }

  onMessage(bodyHTML, sources) {
    this.discussion.setLastMessageHTML(bodyHTML);
    this.dispatch('onMessage', bodyHTML, sources);
  }

  onErrorMessage(error) {
    this.session = null;
    if (!error) {
      error = ChatSession.#undefinedError;
    }
    const isAction = error.button || error.action;
    const message = error.text ?? error;
    if (!isAction) {
      err(message);
    }
    this.onMessage(ChatSession.infoHTML(isAction ? message : `⚠️ ${message}`));
  }

  clear() {
    this.discussion.clear()
    this.dispatch('clear');
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
    this.clear();
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
    }
    this.onErrorMessage(error);
  }

  async setupAndSend(prompt, clearPanel=true) {
    if (!this.sendingAllowed) return;
    
    prompt = prompt ?? parseSearchParam();

    this.panel.classList.add('asked');
    this.setCurrentAction(null, clearPanel);
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

  setCurrentAction(action, clear=true) {
    if (clear) {
      this.clear();
    }
    this.allowSend();
    const btn = this.actionButton;
    this.currentAction = action;
    if (action) {
      this.panel.setAttribute("action", action);
    } else {
      this.panel.removeAttribute("action");
    }
    switch (action) {
      case 'send':
        this.panel.removeAttribute("action");
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
    }
  }
}
