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
      text: _t("Please login to Bing with your Microsoft account, then refresh"),
      button: _t("Login to $AI$", "Bing"),
    },
    forbidden: {
      code: 'BING_CHAT_FORBIDDEN',
      url: 'https://www.bing.com/new?form=MY028Z&OCID=MY028Z',
      text: _t("Unfortunately you don't have access to Bing Chat yet, please register to the waitlist"),
      button: _t("Register to the waitlist"),
    },
  }
  static get storageKey() {
    return "SAVE_BINGCHAT";
  }

  async internalSearchActivated() {
    if (Context.get('bingInternalSearch')) return true;
    const notPremium = await Context.checkIfUserStillNotPremium();
    if (notPremium) {
      Context.set('bingInternalSearch', true);
      return true;
    }
    return false;
  }

  /** @type {HTMLImageElement | null} */
  bingIconElement = null;

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
    this.bingIconElement?.classList.add('disabled');

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

    const buildInternalSearchButton = () => {
      const glass = el('div', {
        className: 'bing-search-button',
      });
      const updateInternalSearchButton = async () => {
        const activated = await this.internalSearchActivated();
        glass.textContent = '';
        setSvg(glass, SVG[activated ? 'magnifyingGlass' : 'emptySet'])
        glass.title = activated ? _t("Bing internal search enabled") : _t("Bing internal search disabled");
      };
      updateInternalSearchButton();
      glass.addEventListener('click', async () => {
        if (await Context.handleNotPremium()) return;
        Context.set('bingInternalSearch', !Context.get('bingInternalSearch'));
      });
      Context.addSettingListener('bingInternalSearch', updateInternalSearchButton);
      Context.addSettingListener('premium', updateInternalSearchButton);
      return glass;
    };
    const leftButtonsContainer = $('.left-buttons-container', this.panel);
    leftButtonsContainer.append(buildInternalSearchButton());    

    this.bingIconElement = $('img', $('.ai-name', this.panel));
    const updateIconButton = (mode = 'balanced') => {
      const displayName = Settings['AI Assitant']['bingConvStyle'].options[mode].name;
      this.bingIconElement.title = displayName;
      $('.optiheader', this.panel).dataset['bingConvStyle'] = mode;
    }
    this.bingIconElement.addEventListener('click', async () => {
      if (this.bingIconElement.classList.contains('disabled')) {
        return;
      }

      const modes = ['balanced', 'precise', 'creative'];
      const current = Context.get('bingConvStyle') || modes[0];
      Context.set('bingConvStyle', modes.at((modes.indexOf(current) + 1) % modes.length));
    });
    updateIconButton(Context.get('bingConvStyle'));
    Context.addSettingListener('bingConvStyle', updateIconButton);

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
              this.onErrorMessage("⚠️ " + _t("Sorry, you've reached the limit of messages you can send to Bing within 24 hours. Check back soon!"));
              return;
            }
            if (body.item.result.value === 'UnauthorizedRequest') {
              this.onErrorMessage(body.item.result?.message);
              return;
            }
            if (body.item.result.error) {
              if (body.item.result.error === 'UnauthorizedRequest' || body.item.result.value === 'CaptchaChallenge')
                throw BingChatSession.errors.session;
              if (body.item.result.error === 'Forbidden')
                throw BingChatSession.errors.forbidden;
            }
            if (body.item.result.value !== 'Success' && body.item.result.message) {
              this.onMessage(ChatSession.infoHTML(body.item.result.message));
              return;
            }
          }
          if (!body.item.messages) {
            this.onErrorMessage();
            return;
          }
          msg = body.item.messages.find(m => !m.messageType && m.author === 'bot');
          break;
        case 6:
          this.socketSend({ "type": 6 });
          return;
        case 3: case 7:
          this.allowSend();
          return 'close';
        default: return;
      }
      const validTypes = ['InternalSearchQuery', undefined];
      if (!(msg && validTypes.some(t => t === msg.messageType)))
        return;

      if (msg.messageType === 'InternalSearchQuery') {
        this.onMessage(ChatSession.infoHTML(`🔍 ${msg.text.replace(/`([^`]*)`/, '<strong>$1</strong>')}`));
        return;
      }
      const refText = msg.adaptiveCards && msg.adaptiveCards[0]?.body.find(x => x.text && x.text.startsWith("[1]: http"))?.text;
      const refs = refText?.split('\n')
        .map(s => s.match(/\[(\d+)]: (http[^ ]+) \"(.*)\"/)) // parse links
        .filter(r => !!r).map(([_, n, href, title]) => ({ n, href, title })) ?? [];
      const learnMore = msg.adaptiveCards && msg.adaptiveCards[0]?.body.find(x => x.text && x.text.startsWith("Learn more:"))?.text;
      let text = msg.text || msg.spokenText;
      if (!text) return;
      const sources = {};
      if (learnMore) {
        [...learnMore.matchAll(/\[(\d+)\. [^\]]+\]\(([^ ]+)\) ?/g)].forEach(([_, n, href]) => sources[href] = n);
        text = text.replace(/\[\^(\d+)\^\]/g, '\uF8FD$1\uF8Fe');
      }

      const bodyHTML = runMarkdown(text)
        .replace(/\uF8FD(\d+)\uF8FE/g, (_, nRef) => {
          const ref = refs.find(r => r.n == nRef);
          if (!ref) return '';
          return `<a href="${ref.href}" title="${ref.title}" class="source superscript">${sources[ref.href]}</a>`;
        })
        .replace(/href="(?:\^|<sup>)(\d+)(?:\^|<\/sup>)"/g, (_, nRef) => {
          const ref = refs.find(r => r.n == nRef);
          if (!ref) return '';
          return `href="${ref.href}"`;
        });
      const maxVisible = 2;
      const invisible = Math.max(0, Object.keys(sources).length - maxVisible);
      const footHTML = Object.keys(sources).length === 0 ? '' : `<div class="learnmore less" 
          >${_t("Learn more")}&nbsp: ${Object.entries(sources).map(([href, n], i) =>
        `<a class="source" href="${href}" ${i >= maxVisible ? 'more' : ''}>${n}. ${new URL(href).host}</a>`).join('\n')}
          <a class="showmore source" title="${_t("Show more")}" invisible=${invisible}>${_t("+$n$ more", invisible)}</a></div>`;
          
      this.onMessage(bodyHTML, footHTML);

      $('.showmore', this.panel)?.addEventListener('click', ({ currentTarget }) => {
        currentTarget.parentElement.classList.remove('less');
        currentTarget.remove();
      });
    }
    const doClose = packet.split('\x1e')
      .slice(0, -1)
      .map(json => json.replaceAll('\n', '\\n'))
      .map(json => {
        try {
          return JSON.parse(json);
        } catch (e) {
          console.warn(e, json);
          return;
        }
      })
      .map(parseResponseBody)
      .find(x => x === 'close');

    if (doClose || readyState === WebSocket.CLOSED)
      return;

    return this.next();
  }

  removeConversation() {
    if (ChatSession.debug || !this.session)
      return;
    const { conversationSignature, clientId, conversationId } = this.session;
    return BingChatSession.offscreenAction({
      action: "delete",
      conversationSignature,
      clientId,
      conversationId,
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
      sliceIds: ["tnaenableux", "adssqovr", "tnaenable", "0731ziv2s0", "lessttscf", "creatordevcf", "inosanewsmob", "wrapnoins", "gbacf", "wrapuxslimc", "prehome", "sydtransl", "918raianno", "713logprobss0", "926bof108t525", "806log2sph", "927uprofasys0", "919vidsnips0", "917fluxv14"],
      optionsSets: ["nlu_direct_response_filter", "deepleo", "disable_emoji_spoken_text", "responsible_ai_policy_235", "enablemm", "dv3sugg", "autosave", "iyxapbing", "iycapbing", "saharagenconv5", "bof108t525", "log2sph", "eredirecturl"]
    };

    const convStyle = {
      'creative': ["h3imaginative", "clgalileo", "gencontentv3"],
      'balanced': ["galileo"],
      'precise': ["h3precise", "clgalileo", "gencontentv3"],
    }[Context.get('bingConvStyle')];

    if (convStyle) {
      optionsSets.push(...convStyle);
    }

    if (!(await this.internalSearchActivated())) {
      optionsSets.push("nosearchall");
    }

    return {
      arguments: [{
        source: "cib",
        sliceIds,
        optionsSets,
        allowedMessageTypes: [
          "Chat",
          "InternalSearchQuery",
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
