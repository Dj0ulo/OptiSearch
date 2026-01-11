class PerplexitySession extends ChatSession {
  properties = ChatSession.chatProperties.perplexity;
  static errors = {
    session: {
      code: "PERPLEXITY_SESSION",
      url: "https://www.perplexity.ai",
      text: _t("Please login to $AI$, then refresh", "Perplexity"),
      button: _t("Login to $AI$", "Perplexity"),
    },
  };
  static get storageKey() {
    return "SAVE_PERPLEXITY";
  }

  constructor() {
    super("perplexity");
    this.eventStreamID = null;
    this.currentText = "";
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    // We check if we are logged in by trying to access a restricted endpoint or simply the main page
    // The HAR shows requests to /rest/user/session could be used, but let's try a simple check first.
    // Based on HAR, requests use cookies and headers.
    // Let's assume session is valid if we can make a request.
    this.session = {
      // Perplexity seems to use source: "default" and other static params in the HAR
      source: "default",
      mode: "concise",
      model_preference: "turbo"
    };
    return this.session;
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug) return;

    this.currentText = "";

    const body = {
      params: {
        last_backend_uuid: null,
        read_write_token: "", // HAR shows this, might be needed or generated
        attachments: [],
        language: navigator.language || "en-US",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        search_focus: "internet",
        sources: ["web"],
        frontend_uuid: generateUUID(),
        mode: this.session.mode,
        model_preference: this.session.model_preference,
        is_related_query: false,
        is_sponsored: false,
        prompt_source: "user",
        query_source: "connect",
        is_incognito: false,
        local_search_enabled: false,
        use_schematized_api: true,
        send_back_text_in_streaming_api: false,
        supported_block_use_cases: ["answer_modes", "media_items", "knowledge_cards", "inline_entity_cards", "place_widgets", "finance_widgets", "prediction_market_widgets", "sports_widgets", "flight_status_widgets", "news_widgets", "shopping_widgets", "jobs_widgets", "search_result_widgets", "inline_images", "inline_assets", "placeholder_cards", "diff_blocks", "inline_knowledge_cards", "entity_group_v2", "refinement_filters", "canvas_mode", "maps_preview", "answer_tabs", "price_comparison_widgets", "preserve_latex", "generic_onboarding_widgets", "in_context_suggestions"],
        client_coordinates: null,
        mentions: [],
        skip_search_enabled: true,
        is_nav_suggestions_disabled: false,
        followup_source: "link",
        source: "default",
        always_search_override: false,
        override_no_search: false,
        should_ask_for_mcp_tool_confirmation: true,
        supported_features: ["browser_agent_permission_banner_v1.1"],
        version: "2.18"
      },
      query_str: prompt
    };

    const url = "https://www.perplexity.ai/rest/sse/perplexity_ask";
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
      console.error("Perplexity: Unexpected response", res);
      if(res.status === 403 || res.status === 401)
          throw PerplexitySession.errors.session;
      throw PerplexitySession.errors.session;
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
        
        const parts = buffer.split("\r\n\r\n"); // Perplexity uses \r\n\r\n
        buffer = parts.pop(); // Keep the last part

        for (const part of parts) {
            if (!part.trim()) continue;
            
            const lines = part.split("\r\n");
            let eventType = null;
            let data = null;
            
            for (const line of lines) {
                if (line.startsWith("event: ")) {
                    eventType = line.substring(7).trim();
                } else if (line.startsWith("data: ")) {
                    try {
                        data = JSON.parse(line.substring(6));
                    } catch (e) {
                        // Ignore
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
      if (event.type === 'message') {
          if (event.data.backend_uuid) {
            this.session.backend_uuid = event.data.backend_uuid;
          }
          if (event.data.read_write_token) {
            this.session.read_write_token = event.data.read_write_token;
          }

          // Perplexity sends the full answer or chunks in 'text' field or 'answer' field inside data
          // Looking at HAR, it seems to send complex JSON objects.
          // We need to look for the "answer" field in the structured_answer or similar.
          // From HAR: "structured_answer": [{"type": "markdown", "text": "...", "chunks": [...]}]
          
          if (event.data.text) {
              try {
                  const textData = JSON.parse(event.data.text);
                  // Sometimes text is stringified JSON, sometimes it might be direct text?
                  // HAR shows: "text": "[{\"step_type\": \"...\" ... {\"step_type\": \"FINAL\", \"content\": {\"answer\": \"{\\\"answer\\\": \\\"...\\\" ...
                  // It seems complicated.
                  
                  // Let's try to extract the final answer part.
                  const lastStep = textData.findLast(step => step.step_type === 'FINAL');
                  if (lastStep && lastStep.content && lastStep.content.answer) {
                      const answerData = JSON.parse(lastStep.content.answer);
                      if (answerData.answer) {
                          this.currentText = answerData.answer;
                          this.onMessage(runMarkdown(this.currentText));
                      }
                  } else {
                      // Maybe intermediate steps updates?
                      // We can ignore or show status.
                  }
              } catch (e) {
                  // If it's not JSON, maybe it's the answer? Unlikely based on HAR.
              }
          }
      }
  }

  async removeConversation() {
    if (!this.session || !this.session.backend_uuid) return;

    const body = {
      entry_uuid: this.session.backend_uuid,
      read_write_token: this.session.read_write_token,
    };

    const url = "https://www.perplexity.ai/rest/thread/delete_thread_by_entry_uuid?version=2.18&source=default";
    await bgFetch(url, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "x-app-apiversion": "2.18",
        "x-app-apiclient": "default",
      },
      body: JSON.stringify(body),
    });
    this.session.backend_uuid = null;
  }
}
