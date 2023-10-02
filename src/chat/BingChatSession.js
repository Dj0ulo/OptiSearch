class BingChatSession extends ChatSession {
  properties = {
    name: "Bing",
    link: "https://www.bing.com/search",
    icon: "src/images/bingchat.png",
    local_icon: "bingchat.png",
    href: "https://www.bing.com/search?form=MY0291&OCID=MY0291&q=Bing+AI&showconv=1",
  }
  static errors = {
    session: {
      code: 'BING_CHAT_SESSION',
      url: 'https://login.live.com/login.srf?wa=wsignin1.0&wreply=https%3A%2F%2Fwww.bing.com%2Ffd%2Fauth%2Fsignin%3Faction%3Dinteractive%26provider%3Dwindows_live_id%26return_url%3Dhttps%3A%2F%2Fwww.bing.com%2F%3Fwlexpsignin%3D1%26src%3DEXPLICIT',
      text: "Please login to Bing with your Microsoft account, then refresh :",
      button: "Login to Bing",
    },
    forbidden: {
      code: 'BING_CHAT_FORBIDDEN',
      url: 'https://www.bing.com/new?form=MY028Z&OCID=MY028Z',
      text: "Unfortunately you don't have access to Bing Chat yet, please register to the waitlist",
      button: "Register to the waitlist",
    },
    captcha: {
      code: 'BING_CHAT_CAPTCHA',
      url: 'https://www.bing.com/search?form=MY0291&OCID=MY0291&q=Bing+AI&showconv=1',
      text: "Please solve the captcha on Bing by starting a conversation and refresh the page:",
      button: "Solve the captcha",
    },
  }
  static get storageKey() {
    return "SAVE_BINGCHAT";
  }

  constructor() {
    super('bingchat');
    this.socketID = null;
    this.uuid = generateUUID(); // for conversation continuation
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    const sessionURL = await this.parseSessionFromURL();
    if (sessionURL) {
      this.isContinueSession = true;
      this.session = sessionURL;
      return this.session;
    }

    const session = await BingChatSession.offscreenAction({ action: "session" });
    if (session.result?.value === 'UnauthorizedRequest')
      throw BingChatSession.errors.session;
    if (session.result?.value === 'Forbidden')
      throw BingChatSession.errors.forbidden;
    this.session = session;
    this.session.isStartOfSession = true;
    return this.session;
  }

  async parseSessionFromURL() {
    if (!window.location.hostname.endsWith('.bing.com'))
      return;
    const continuesession = new URL(window.location.href).searchParams.get('continuesession');
    if (!continuesession)
      return;
    const session = await bgWorker({ action: 'session-storage', type: 'get', key: continuesession });
    if (!session || session.inputText !== parseSearchParam())
      return;
    return session;
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug) {
      return;
    }

    bgWorker({
      action: 'session-storage', type: 'set', key: this.uuid,
      value: { ...this.session, inputText: prompt }
    });

    this.socketID = await this.createSocket();
    const { packet } = await this.socketReceive();
    if (packet !== '{}\x1e') {
      this.onErrorMessage();
      err(`Error with Bing Chat: first packet received is ${packet}`);
      return;
    }

    await this.socketSend({ "type": 6 });
    await this.socketSend(await this.config(prompt));
    return this.next();
  }

  createPanel(directchat = true) {
    super.createPanel(directchat);

    const svgChat = `<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 0C16.0228 0 20.5 4.47715 20.5 10C20.5 15.5228 16.0228 20 10.5 20C8.8817 20 7.31782 19.6146 5.91286 18.888L2.08704 19.9553C1.42212 20.141 0.73258 19.7525 0.54691 19.0876C0.48546 18.8676 0.48549 18.6349 0.54695 18.4151L1.61461 14.5922C0.88637 13.186 0.5 11.6203 0.5 10C0.5 4.47715 4.97715 0 10.5 0ZM10.5 1.5C5.80558 1.5 2 5.30558 2 10C2 11.4696 2.37277 12.8834 3.07303 14.1375L3.22368 14.4072L2.11096 18.3914L6.09755 17.2792L6.36709 17.4295C7.62006 18.1281 9.0322 18.5 10.5 18.5C15.1944 18.5 19 14.6944 19 10C19 5.30558 15.1944 1.5 10.5 1.5ZM7.25 11H11.7483C12.1625 11 12.4983 11.3358 12.4983 11.75C12.4983 12.1297 12.2161 12.4435 11.85 12.4932L11.7483 12.5H7.25C6.83579 12.5 6.5 12.1642 6.5 11.75C6.5 11.3703 6.78215 11.0565 7.14823 11.0068L7.25 11H11.7483H7.25ZM7.25 7.5H13.7545C14.1687 7.5 14.5045 7.83579 14.5045 8.25C14.5045 8.6297 14.2223 8.9435 13.8563 8.9932L13.7545 9H7.25C6.83579 9 6.5 8.6642 6.5 8.25C6.5 7.8703 6.78215 7.55651 7.14823 7.50685L7.25 7.5H13.7545H7.25Z" fill="white"></path></svg>`;
    const continueChat = el('a', {
      href: `https://www.bing.com/search?form=MY0291&OCID=MY0291&q=Bing+AI&showconv=1&continuesession=${this.uuid}`,
      title: 'Continue your conversation with Bing',
      className: 'continue-chat-button',
      innerHTML: `${svgChat} <span>Chat !</span>`,
      style: 'display: none;'
    });
    const titleEl = $('.ai-name', this.panel);
    insertAfter(continueChat, titleEl);

    const leftButtonsContainer = el('div', { className: 'left-buttons-container' });
    // insertAfter(leftButtonsContainer, titleEl)

    const allowInternalSearchButton = el('div', {
      className: 'bing-internal-search-button headerhover',
      title: 'Bing Internal Search',
    }, leftButtonsContainer);

    el('img', { 
      src: chrome.runtime.getURL('src/images/bing_search_allowed.png'),
      className: 'bing-internal-search-allowed',
    }, allowInternalSearchButton);
    el('img', { 
      src: chrome.runtime.getURL('src/images/bing_search_forbidden.png'),
      className: 'bing-internal-search-forbidden',
    }, allowInternalSearchButton);

    allowInternalSearchButton.toggleClass = () => {
      allowInternalSearchButton.classList.toggle('allowed', Context.save['bingInternalSearch']);
      allowInternalSearchButton.classList.toggle('forbidden', !Context.save['bingInternalSearch']);
    };
    allowInternalSearchButton.toggleClass();
    allowInternalSearchButton.onclick = () => {
      Context.save['bingInternalSearch'] = !Context.isActive('bingInternalSearch');
      saveSettings(Context.save);
      allowInternalSearchButton.toggleClass();
    };



    const hueAngle = {
      'creative': 63,
      'precise': -52,
      'balanced': 0,
    }[Context.save['bingConvStyle']];

    const iconEl = $('img', $('.ai-name', this.panel));
    iconEl.title = `Bing Chat: ${Settings['AI Assitant']['bingConvStyle'].options[Context.save['bingConvStyle']].name} conversation style`;
    iconEl.style.filter = `hue-rotate(${hueAngle}deg)`;

    $('.continue-chat-button', this.panel).style.filter = iconEl.style.filter;

    return this.panel;
  }

  async next() {
    const res = await this.socketReceive();
    if (!res) {
      return;
    }
    /**@type {{packet: string, readyState: number}} */
    const { packet, readyState } = res;
    this.session.isStartOfSession = false;

    /**
     * body.type: 1 = Invocation, 2 = StreamItem, 3 = Completion, 4 = StreamInvocation, 5 = CancelInvocation, 6 = Ping, 7 = Close
     * @param {*} body 
     * @returns 
     */
    const parseResponseBody = (body) => {
      let msg = null;
      switch (body.type) {
        case 1: msg = body.arguments[0]?.messages && body.arguments[0]?.messages[0]; break;
        case 2:
          if (!body.item) {
            this.onErrorMessage();
            return;
          }
          if (body.item.result) {
            if (body.item.result.value === 'Throttled') {
              this.onErrorMessage("⚠️&nbsp;Sorry, you've reached the limit of messages you can send to Bing within 24 hours. Check back soon!");
              return;
            }
            if (body.item.result.value === 'UnauthorizedRequest') {
              this.onErrorMessage(body.item.result?.message);
              return;
            }
            if (body.item.result.error) {
              if (body.item.result.error === 'UnauthorizedRequest')
                throw BingChatSession.errors.session;
              if (body.item.result.error === 'Forbidden')
                throw BingChatSession.errors.forbidden;
              if (body.item.result.value === 'CaptchaChallenge')
                throw BingChatSession.errors.captcha;
            }
            if (body.item.result?.message) {
              msg = body.item.result.message;
              break;
            }
          }
          if (!body.item.messages) {
            this.onErrorMessage();
            return;
          }
          msg = body.item.messages.find(m => !m.messageType && m.author === 'bot');
          if (!msg)
            msg = body.item.messages.find(m => m.messageType === 'InternalSearchResult' && m.author === 'bot');
          break;
        case 6:
          this.socketSend({ "type": 6 });
          return;
        case 3: case 7:
          this.allowSend();
          break;
        default: return;
      }
      const validTypes = ['InternalSearchQuery', 'InternalSearchResult', undefined];
      if (!(msg && validTypes.some(t => t === msg.messageType)))
        return;

      if (msg.messageType === 'InternalSearchQuery') {
        this.onmessage(ChatSession.infoHTML(`🔍 ${msg.text.replace(/`([^`]*)`/, '<strong>$1</strong>')}`));
        return;
      }
      if (msg.messageType === 'InternalSearchResult') {
        const results = msg.groundingInfo?.web_search_results;
        if (!results) return;
        const resultsHTML = '<ul>' + results.map(r => `<li>${r.snippets.map(s => `<p>${s}
        <a href="${r.url}" title="${r.title}" class="source superscript">${r.index}</a></p>`).join('\n')}</li>`).join('\n')
          + '</ul>';
        this.onmessage(resultsHTML);
        return;
      }
      const refText = msg.adaptiveCards && msg.adaptiveCards[0]?.body[0]?.text;
      const refs = refText?.split('\n')
        .map(s => s.match(/\[(\d+)]: (http[^ ]+) \"(.*)\"/)) // parse links
        .filter(r => !!r).map(([_, n, href, title]) => ({ n, href, title }));
      const learnMore = msg.adaptiveCards && msg.adaptiveCards[0]?.body.find(x => x.text && x.text.startsWith("Learn more:"))?.text;
      let text = msg.text || msg.spokenText;
      if (!text) return;
      const sources = {};
      if (learnMore) {
        [...learnMore.matchAll(/\[(\d+)\. [^\]]+\]\(([^ ]+)\) ?/g)].forEach(([_, n, href]) => sources[href] = n);
        text = text.replace(/\[\^(\d+)\^\]/g, '\uF8FD$1\uF8Fe');
      }

      const bodyHTML = runMarkdown(text).replace(/\uF8FD(\d+)\uF8FE/g, (_, nRef) => {
        const ref = refs.find(r => r.n == nRef);
        const nSource = sources[ref.href];
        return ref ? `<a href="${ref.href}" title="${ref.title}" class="source superscript">${nSource}</a>` : '';
      });
      const maxVisible = 2;
      const invisible = Math.max(0, Object.keys(sources).length - maxVisible);
      const footHTML = Object.keys(sources).length === 0 ? '' : `<div class="learnmore less" 
          >Learn more&nbsp: ${Object.entries(sources).map(([href, n], i) =>
        `<a class="source" href="${href}" ${i >= maxVisible ? 'more' : ''}>${n}. ${new URL(href).host}</a>`).join('\n')}
          <a class="showmore source" title="Show more" invisible=${invisible}>+${invisible} more</a></div>`;
      this.onmessage(bodyHTML, footHTML);
    }
    packet.split('\x1e')
      .slice(0, -1)
      .map(json => json.replaceAll('\n', '\\n'))
      .map(json => {
        try {
          return JSON.parse(json);
        } catch (e) {
          console.warn(e, json);
          return;
        }
      }).map(parseResponseBody);

    if (readyState === WebSocket.CLOSED)
      return;

    return this.next();
  }

  removeConversation() {
    if (ChatSession.debug || !this.session)
      return;
    const { conversationSignature, clientId, conversationId } = this.session;

    return bgFetch('https://sydney.bing.com/sydney/DeleteSingleConversation', {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        conversationSignature,
        "participant": {
          "id": clientId
        },
        "source": "cib",
        "optionsSets": [
          "autosave"
        ]
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
  }

  async createSocket() {
    let url = 'wss://sydney.bing.com/sydney/ChatHub';
    if ('sec_access_token' in this.session) {
      url += `?sec_access_token=${encodeURIComponent(this.session['sec_access_token'])}`;
    }
    const res = await BingChatSession.offscreenAction({
      action: "socket",
      url,
      toSend: JSON.stringify({ "protocol": "json", "version": 1 }) + '\x1e',
    });
    if (!('socketID' in res)) {
      throw "Socket ID not returned";
    }
    return res.socketID;
  }

  socketSend(body) {
    if (this.socketID == null)
      throw "Need socket ID to send";
    return BingChatSession.offscreenAction({
      action: "socket",
      socketID: this.socketID,
      toSend: JSON.stringify(body) + '\x1e',
    });
  }

  socketReceive() {
    if (this.socketID == null)
      throw "Need socket ID to receive";
    return BingChatSession.offscreenAction({
      action: "socket",
      socketID: this.socketID,
    });
  }

  static async offscreenAction(params) {
    if (onChrome()) {
      await bgWorker({ action: "setup-bing-offscreen" });
    }
    return await bgWorker({
      ...params,
      target: 'offscreen',
    });
  }

  async config(prompt) {
    if (!this.session)
      throw "Session has to be fetched first";
    const { conversationSignature, clientId, conversationId, isStartOfSession } = this.session;

    const timestamp = () => {
      const pad0 = (n) => n < 10 ? "0" + n : n;
      let t = (new Date).getTimezoneOffset(), hOff = Math.floor(Math.abs(t / 60)), mOff = Math.abs(t % 60);
      let end = '';
      if (t < 0)
        end = "+" + pad0(hOff) + ":" + pad0(mOff);
      else if (t > 0)
        end = "-" + pad0(hOff) + ":" + pad0(mOff);
      else if (t == 0)
        end = "Z";
      const now = new Date;
      const d = now.getDate(), mo = now.getMonth() + 1, y = now.getFullYear(),
        h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      return `${pad0(y)}-${pad0(mo)}-${pad0(d)}T${pad0(h)}:${pad0(m)}:${pad0(s)}${end}`;
    }

    const { sliceIds, optionsSets } = {
      sliceIds: ["gbacf","emovoicecf","norbingchrome","sydconfigoptt","825memdarks0","0529streamw","streamw","178gentech","824fluxhi52s0","0825agicert","821iypapyrust","821fluxv13"],
      optionsSets: ["nlu_direct_response_filter","deepleo","disable_emoji_spoken_text","responsible_ai_policy_235","enablemm","clgalileo","gencontentv3","cpcandi","cpcatral6","cpcatro50","cpcfmql","cpcgnddi","cpcmattr2","cpcmcit2","e2ecacheread","nocitpass","streamw","rctechalwlst","agicert","iypapyrus","rewards"]
    };

    const convStyle = {
      'creative': "h3imaginative",
      'precise': "h3precise",
    }[Context.save['bingConvStyle']];

    if (convStyle) {
      optionsSets.push(convStyle);
    }

    if (!Context.isActive('bingInternalSearch')) {
      prompt = '#nosearch ' + prompt;
    }

    return {
      arguments: [{
        source: "cib",
        sliceIds,
        optionsSets,
        allowedMessageTypes: [
          "Chat",
          "InternalSearchQuery",
          "InternalSearchResult",
        ],
        verbosity: "verbose",
        isStartOfSession,
        message: {
          timestamp: timestamp(),
          author: "user",
          inputMethod: "Keyboard",
          text: prompt,
          messageType: "Chat"
        },
        conversationSignature,
        participant: {
          id: clientId,
        },
        conversationId
      }],
      invocationId: "0",
      target: "chat",
      type: 4,
    }
  }
}
