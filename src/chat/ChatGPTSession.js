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
      text: "Please login to ChatGPT, then refresh :",
      button: "Login to ChatGPT",
    },
    cloudflare: {
      code: 'CHAT_GPT_CLOUDFLARE',
      url: 'https://chat.openai.com/chat',
      text: "Please pass the Cloudflare check on ChatGPT, then refresh :",
      button: "Cloudflare check",
    },
  }
  static get storageKey() {
    return "SAVE_CHATGPT";
  }

  constructor() {
    super('chatgpt');
    this.eventStreamID = null;
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
    await this.fetchModels();
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

  async fetchConversations() {
    this.conversations = await this.backendApi("conversations?offset=0&limit=20");
    return this.conversations;
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug)
      return;

    const res = await this.backendApi(`conversation`, this.config(prompt));
    if (!res.eventStream) {
      res.detail && this.onmessage(runMarkdown(res.detail));
      throw res;
    }
    this.eventStreamID = res.id;
    await this.next();
    this.removeConversation();
  }

  async next() {
    const receivedPacket = await this.receivePacket();
    if (!receivedPacket)
      return;

    /**@type {{done: boolean, packet: string}} */
    const { done, packet } = receivedPacket;

    if (done || !packet || packet.startsWith("data: [DONE]"))
      return;

    this.buffer ??= '';
    this.buffer += packet;
    const startJSON = this.buffer.lastIndexOf(`data: {"message": {"id": `) + 6;
    const toParse = this.buffer.substring(startJSON);
    try {
      const data = JSON.parse(toParse);
      this.buffer = '';
      this.session.conversation = data.conversation_id;
      this.onmessage(runMarkdown(data.message?.content?.parts[0]));
    }
    catch (e) {
      if (!e instanceof SyntaxError)
        throw e;
      // Unable to parse JSON because the whole packet has not been received yet
    }
    return this.next();
  }

  receivePacket() {
    return bgWorker({
      action: 'event-stream',
      id: this.eventStreamID,
    })
  }

  removeConversation() {
    if (ChatGPTSession.debug)
      return;
    return this.backendApi(`conversation/${this.session.conversation}`, {
      is_visible: false
    }, 'PATCH');
  }

  config(prompt) {
    if (!this.session)
      throw "Session has to be fetched first";
    const id = generateUUID();
    const pid = generateUUID();
    return {
      action: "next",
      model: this.models[0].slug,
      parent_message_id: pid,
      messages: [{
        id,
        role: "user",
        content: {
          content_type: "text",
          parts: [prompt],
        }
      }]
    }
  }

  backendApi(service, body, method) {
    if (!method)
      method = body ? "POST" : "GET";
    const params = {
      "headers": {
        "authorization": `Bearer ${this.session.accessToken}`,
        ...(body && { "content-type": "application/json" }),
      },
      "credentials": "include",
      method,
      ...(body && { "body": JSON.stringify(body) }),
    }
    return bgFetch(`https://chat.openai.com/backend-api/${service}`, params);
  }
}