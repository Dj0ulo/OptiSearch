class BingChatSession extends ChatSession {
  properties = {
    name: "Copilot",
    link: "https://copilot.microsoft.com/",
    icon: "src/images/copilot.png",
    local_icon: "copilot.png",
    href: "https://copilot.microsoft.com/",
  }
  static errors = {
    session: {
      code: 'BING_CHAT_SESSION',
      url: 'https://login.live.com/login.srf?wa=wsignin1.0&wreply=https%3A%2F%2Fwww.bing.com%2Ffd%2Fauth%2Fsignin%3Faction%3Dinteractive%26provider%3Dwindows_live_id%26return_url%3Dhttps%3A%2F%2Fwww.bing.com%2F%3Fwlexpsignin%3D1%26src%3DEXPLICIT',
      text: _t("Please login to Bing with your Microsoft account, then refresh"),
      button: _t("Login to $AI$", "Bing"),
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
    this.session = { conversationId: session.id };
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

    if(!this.socketID) {
      this.socketID = await this.createSocket();
      const { packet } = await this.socketReceive();
      if (packet !== '{eventWebSocket:"open"}') {
        this.onErrorMessage();
        err(`Error with Bing Copilot: first packet received is ${packet}`);
        return;
      }
    }

    await this.socketSend(await this.config(prompt));
    this.rawMessage = "";
    return this.next();
  }

  createPanel(directchat = true) {
    super.createPanel(directchat);

    this.bingIconElement = $('img', $('.ai-name', this.panel));
    const updateIconButton = (mode = 'balanced') => {
      const displayName = Settings['AI Assitant']['bingConvStyle'].options[mode].name;
      this.bingIconElement.title = displayName;
      $('.optiheader', this.panel).dataset['bingConvStyle'] = mode;
    }
    updateIconButton();

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
     * @param {*} body 
     * @returns 
     */
    const parseResponseBody = (body) => {
      switch (body.event) {
        case "received": return;
        case "startMessage": return;
        case "appendText": 
          this.rawMessage += body.text;
          break;
        case "partCompleted": return;
        case "titleUpdate": return;
        case "done": 
          this.allowSend();
          return 'close';
        default: return;
      }
      let text = this.rawMessage;
      if (!text) return;

      const bodyHTML = runMarkdown(text);
        
      this.onMessage(
        bodyHTML,
      );
    }

    const response = JSON.parse(packet);
    const doClose = parseResponseBody(response);

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
    const url = 'wss://copilot.microsoft.com/c/api/chat?api-version=2';
    const res = await BingChatSession.offscreenAction({
      action: "socket",
      url,
      toSend: JSON.stringify({ event: "setOptions", supportedCards: ["image"], ads: null }),
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
      toSend: JSON.stringify(body),
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

    return {
      event: "send",
      conversationId: this.session.conversationId,
      content: [{ type: "text", text: prompt }],
      mode: "chat",
    };
  }
}
