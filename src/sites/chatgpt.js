class ChatGPTSession {
  static DEBUG = false;
  static LOCAL_STORAGE = "SAVE_CHATGPT";
  static URL_SESSION = "https://chat.openai.com/api/auth/session";
  static ERROR_CLOUDFLARE = "ChatGPT Error: Cloudflare check";
  static ERROR_SESSION = "ChatGPT Error: User not logged in";
  constructor() {
    this.messages = []
    this.conversation_id = null
  }
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  async init() {
    if(ChatGPTSession.DEBUG)
      return;
    await this.fetchSession();
    await this.fetchModels();
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
  async fetchSession() {
    const r = await bgFetch(ChatGPTSession.URL_SESSION);
    if(r.status === 403)
      throw ChatGPTSession.ERROR_CLOUDFLARE;
    if (!r.accessToken)
      throw ChatGPTSession.ERROR_SESSION;
    this.session = r;
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
  async send(question, callback) {
    if(ChatGPTSession.DEBUG){
      const txt = await bgFetch("https://raw.githubusercontent.com/googlearchive/code-prettify/master/README.md");
      debug(txt);
      callback(txt);
      return txt;
    }

    const id = ChatGPTSession.generateUUID();
    const pid = ChatGPTSession.generateUUID();
    const res = await this.backendApi(`conversation`, {
      action: "next",
      model: this.models[0].slug,
      parent_message_id: pid,
      messages: [{
        id,
        role: "user",
        content: {
          content_type: "text",
          parts: [question],
        }
      }]
    });
    return new Promise(resolve => {
      if (!res.eventStream) {
        res.detail && callback(res.detail);
        throw res;
      }
      this.messages.push({ id, pid, eventStreamIndex: res.index, text: "", buffer: "", question, callback });
      resolve(this.next(this.messages.length - 1));
    });
  }
  next(messageIndex = 0) {
    return new Promise((resolve, reject) => {
      if (this.messages.length <= messageIndex)
        throw "Error invalid message index";

      const msg = this.messages[messageIndex];

      chrome.runtime.sendMessage({
        action: "event-stream",
        index: msg.eventStreamIndex,
      }, r => {
        if (r.isError || !r.value) {
          reject("Error with ChatGPT: " + r)
          return;
        }
        if (r.value.startsWith("data: [DONE]")) {
          resolve(msg.text);
          return;
        }

        msg.buffer += r.value;
        const startJSON = msg.buffer.lastIndexOf(`data: {"message": {"id": `) + 6;
        const toParse = msg.buffer.substr(startJSON);
        try {
          const data = JSON.parse(toParse);
          this.conversation_id = data.conversation_id;
          const text = data.message.content.parts[0];
          msg.text = text;
          msg.buffer = "";
          msg.callback(text);
        }
        catch (e) {
          if (!e instanceof SyntaxError)
            // Unable to parse JSON because the whole packet has not been received yet
            throw e;
        }
        resolve(this.next(messageIndex));
      })
    })
  }
  lastText() {
    return this.messages.at(-1).text;
  }
  removeConversation() {
    if(ChatGPTSession.DEBUG)
      return;
    return this.backendApi(`conversation/${this.conversation_id}`, {
      is_visible: false
    }, 'PATCH');
  }
}