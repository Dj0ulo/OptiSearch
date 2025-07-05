class BingChatSession extends ChatSession {
  properties = ChatSession.chatProperties.bingchat;
  static get storageKey() {
    return "SAVE_BINGCHAT";
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
    const session = await BingChatSession.offscreenAction({ action: "session" });
    this.session = { conversationId: session.id };
    this.session.isStartOfSession = true;
    return this.session;
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
    const { conversationId } = this.session;
    return BingChatSession.offscreenAction({
      action: "delete",
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
