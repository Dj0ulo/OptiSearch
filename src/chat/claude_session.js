class ClaudeSession extends ChatSession {
  properties = ChatSession.chatProperties.claude;
  static errors = {
    session: {
      code: "CLAUDE_SESSION",
      url: "https://claude.ai/login",
      text: _t("Please login to $AI$, then refresh", "Claude"),
      button: _t("Login to $AI$", "Claude"),
    },
  };
  static get storageKey() {
    return "SAVE_CLAUDE";
  }

  constructor() {
    super("claude");
    this.eventStreamID = null;
    this.currentText = "";
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    const organizations = await bgFetch("https://claude.ai/api/organizations");
    if (!organizations || !Array.isArray(organizations) || organizations.length === 0) {
      throw ClaudeSession.errors.session;
    }
    
    // Use the first organization
    this.session = {
      org_uuid: organizations[0].uuid,
      conversation_uuid: null,
      parent_message_uuid: "00000000-0000-4000-8000-000000000000",
    };
    return this.session;
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug) return;

    this.currentText = "";

    if (!this.session.conversation_uuid) {
      await this.createConversation();
    }

    const body = {
      prompt: prompt,
      parent_message_uuid: this.session.parent_message_uuid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attachments: [],
      files: [],
      rendering_mode: "messages",
    };

    const url = `https://claude.ai/api/organizations/${this.session.org_uuid}/chat_conversations/${this.session.conversation_uuid}/completion`;
    const res = await bgFetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "text/event-stream"
      },
      body: JSON.stringify(body),
    });

    if (res.eventStream) {
      this.eventStreamID = res.id;
      await this.readStream();
    } else {
      console.error("Claude: Unexpected response", res);
      throw ClaudeSession.errors.session;
    }
  }

  async createConversation() {
    const uuid = generateUUID();
    const url = `https://claude.ai/api/organizations/${this.session.org_uuid}/chat_conversations`;
    const body = {
        uuid: uuid,
        name: "",
        include_conversation_preferences: true,
        is_temporary: false
    };

    const res = await bgFetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (res.uuid) {
        this.session.conversation_uuid = res.uuid;
    } else {
        this.session.conversation_uuid = uuid;
    }
  }

  async readStream() {
    let buffer = "";

    const fetchPackets = async () => {
        const streamData = await bgWorker({
            action: "event-stream",
            id: this.eventStreamID,
        });

        if (streamData.done) return ["DONE"];
        if (!streamData.data) return [];
        
        buffer += streamData.data;
        const events = [];
        
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); 

        for (const part of parts) {
            if (!part.trim()) continue;
            
            const lines = part.split("\n");
            let eventType = null;
            let data = null;
            
            for (const line of lines) {
                if (line.startsWith("event: ")) {
                    eventType = line.substring(7).trim();
                } else if (line.startsWith("data: ")) {
                    try {
                        data = JSON.parse(line.substring(6));
                    } catch (e) {
                        // Ignore parse errors for partial lines
                    }
                }
            }
            
            if (eventType && data) {
                events.push({ type: eventType, data });
            }
        }
        return events;
    };

    while (true) {
        const events = await fetchPackets();
        if (events.length === 1 && events[0] === "DONE") {
             this.allowSend();
             break;
        }

        for (const event of events) {
            this.handleEvent(event);
        }
    }
  }

  handleEvent(event) {
      if (event.type === 'message_start') {
          if (event.data.message && event.data.message.uuid) {
              this.session.parent_message_uuid = event.data.message.uuid;
          }
      } else if (event.type === 'content_block_delta') {
          if (event.data.delta && event.data.delta.type === 'text_delta') {
              this.currentText += event.data.delta.text;
              this.onMessage(runMarkdown(this.currentText));
          }
      }
  }

  removeConversation() {
    if (!this.session || !this.session.conversation_uuid) return;
    
    const url = `https://claude.ai/api/organizations/${this.session.org_uuid}/chat_conversations/${this.session.conversation_uuid}`;
    bgFetch(url, { method: "DELETE" }).catch(e => console.warn("Failed to delete conversation", e));
    
    this.session.conversation_uuid = null;
    this.session.parent_message_uuid = "00000000-0000-4000-8000-000000000000";
  }
}