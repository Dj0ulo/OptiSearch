class ChatGPTSession extends ChatSession {
  properties = {
    name: "ChatGPT",
    link: "https://chat.openai.com/chat",
    icon: "src/images/chatgpt.png",
    local_icon: "chatgpt.png",
    href: "https://chat.openai.com/chat",
  }
  static errors = {
    session: {
      code: 'CHAT_GPT_SESSION',
      url: 'https://chat.openai.com/chat',
      text: _t("Please login to $AI$, then refresh", "ChatGPT"),
      button: _t("Login to $AI$", "ChatGPT"),
    },
    cloudflare: {
      code: 'CHAT_GPT_CLOUDFLARE',
      url: 'https://chat.openai.com/chat',
      text: _t("Please pass the Cloudflare check on ChatGPT, then refresh"),
      button: _t("Cloudflare check"),
    },
  }
  static get storageKey() {
    return "SAVE_CHATGPT";
  }

  constructor() {
    super('chatgpt');
    this.socketID = null;
    this.eventStreamID = null;
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
    await Promise.all([
      this.fetchModels(),
      this.registerWebSocket(),
    ]);
  }

  async fetchSession() {
    const session = await bgFetch('https://chat.openai.com/api/auth/session', {
      credentials: "include",
    });
    if (session.error) {
      if (session.error === 'RefreshAccessTokenError')
        throw ChatGPTSession.errors.session;
      throw session.error;
    }
    if (session.status === 403)
      throw ChatGPTSession.errors.cloudflare;
    if (!session.accessToken)
      throw ChatGPTSession.errors.session;
    this.session = session;
    return this.session;
  }

  async fetchModels() {
    this.models = (await this.backendApi("models")).models;
    return this.models;
  }

  async registerWebSocket() {
    const url = (await this.backendApi("register-websocket", null, 'POST')).wss_url;
    this.socketID = await this.createSocket(url);
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug)
      return;

    const requirements = await this.backendApi('sentinel/chat-requirements', {});
    this.session.sentinelToken = requirements.token;
    const res = await this.backendApi('conversation', this.config(prompt));
    if (res.eventStream) {
      this.eventStreamID = res.id;
    }
    await this.next();
  }

  async next() {
    const fetchPackets = async () => {
      const streamData = await this.readStream();
      if (!streamData) return [];
      let packetBody = null;
      if (this.eventStreamID !== null) {
        if (streamData.done) return ["DONE"];
        if (!streamData.data) return [];
        packetBody = streamData.data;
      } else {
        if (streamData.readyState === WebSocket.CLOSED) return ["DONE"];
        if (!streamData.packet) return [];
        packetBody = atob(JSON.parse(streamData.packet).body);
      }
      return packetBody
        .split('\n\n')
        .map((p, i) => {
          if (!p) return null;
          let packet = p;
          if (i === 0 && !p.startsWith('data: ')) {
            packet = this.halfPacket + packet;
            this.halfPacket = "";
          }
          packet = packet.substring(6);
          if (packet === "[DONE]") return "DONE";
          try { 
            return JSON.parse(packet);
          }
          catch (e) { 
            if (!e instanceof SyntaxError) throw e 
            this.halfPacket = p;
          }
          return null;
        })
        .filter(p => !!p);
    };

    const handlePacket = (data) => {
      if (data === "DONE") {
        this.allowSend();
        return true;
      }

      this.session.conversation_id = data.conversation_id;
      if (data.error) {
        this.onErrorMessage(data.error);
        return true;
      }
      if (!data.message) {
        return false;
      }

      this.session.parent_message_id = data.message.id;
      const text = data.message.content?.parts[0];
      if (text) {
        this.onMessage(runMarkdown(text));
      }
      return false;
    }

    const packets = await fetchPackets();

    for (const packet of packets) {
      if (handlePacket(packet)) return;
    }
    return this.next();
  }

  async createSocket(url) {
    const res = await bgWorker({
      action: "websocket",
      url,
    });
    if (!('socketID' in res)) {
      throw "Socket ID not returned";
    }
    return res.socketID;
  }

  readStream() {
    if (this.eventStreamID !== null) {
      return bgWorker({
        action: 'event-stream',
        id: this.eventStreamID,
      });
    }

    if (this.socketID !== null) {
      return bgWorker({
        action: "websocket",
        socketID: this.socketID,
      });
    }

    throw "Need socket or event stream ID to send";
  }

  removeConversation() {
    if (ChatGPTSession.debug || !this.session || !this.session.conversation_id)
      return;
    return this.backendApi(`conversation/${this.session.conversation_id}`, {
      is_visible: false
    }, 'PATCH');
  }

  config(prompt) {
    if (!this.session)
      throw "Session has to be fetched first";
    const id = generateUUID();
    const pid = this.session.parent_message_id ? this.session.parent_message_id : generateUUID();
    return {
      action: "next",
      ...(this.session.conversation_id && { conversation_id: this.session.conversation_id }),
      messages: [{
        id,
        author: { role: "user" },
        content: {
          content_type: "text",
          parts: [prompt],
        }
      }],
      parent_message_id: pid,
      model: this.models[0].slug,
      websocket_request_id: generateUUID(),
    }
  }

  backendApi(service, body, method) {
    if (!method)
      method = body ? "POST" : "GET";
    const params = {
      "headers": {
        "authorization": `Bearer ${this.session.accessToken}`,
        ...(service === "conversation" && this.session.sentinelToken && { "openai-sentinel-chat-requirements-token": this.session.sentinelToken}),
        ...(body && { "content-type": "application/json" }),
      },
      "credentials": "include",
      method,
      ...(body && { "body": JSON.stringify(body) }),
    }
    return bgFetch(`https://chat.openai.com/backend-api/${service}`, params);
  }
}