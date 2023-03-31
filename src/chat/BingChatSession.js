class BingChatSession extends ChatSession {
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
  }
  static get storageKey() {
    return "SAVE_BINGCHAT";
  }

  constructor() {
    super('bingchat');
    this.socketID = null;
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    const session = await bgFetch(`https://www.bing.com/turing/conversation/create`, {
      credentials: "include",
    });
    if (session.result?.value === 'UnauthorizedRequest')
      throw BingChatSession.errors.session;
    if (session.result?.value === 'Forbidden')
      throw BingChatSession.errors.forbidden;
    this.session = session;
    return this.session;
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug)
      return;

    this.socketID = await BingChatSession.createSocket();
    const { packet } = await this.socketReceive();
    if (packet !== '{}\x1e')
      throw `Error with Bing Chat: first packet received is ${packet}`;

    await this.socketSend({ "type": 6 });
    await this.socketSend(this.config(prompt));
    return this.next();
  }

  async next() {
    /**@type {{packet: string, readyState: number}} */
    const { packet, readyState } = await this.socketReceive();

    if (readyState === WebSocket.CLOSED)
      return;

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
          msg = body.item?.messages?.find(m => !m.messageType && m.author === 'bot');
          if (!msg)
            msg = body.item?.messages?.find(m => m.messageType === 'InternalSearchResult' && m.author === 'bot');
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
      const learnMore = msg.adaptiveCards && msg.adaptiveCards[0]?.body[1]?.text;
      let text = msg.text || msg.spokenText;
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

    return this.next();
  }

  static async createSocket() {
    return (await bgWorker({
      action: "websocket",
      url: `wss://sydney.bing.com/sydney/ChatHub`,
      toSend: JSON.stringify({ "protocol": "json", "version": 1 }) + '\x1e',
    })).socketID;
  }

  socketSend(body) {
    if (this.socketID == null)
      throw "Need socket ID to send";
    return bgWorker({
      action: "websocket",
      socketID: this.socketID,
      toSend: JSON.stringify(body) + '\x1e',
    });
  }

  socketReceive() {
    if (this.socketID == null)
      throw "Need socket ID to receive";
    return bgWorker({
      action: "websocket",
      socketID: this.socketID,
    });
  }

  config(prompt) {
    if (!this.session)
      throw "Session has to be fetched first";
    const { conversationSignature, clientId, conversationId } = this.session;

    const timestamp = () => {
      const r = (n) => n < 10 ? "0" + n : n;
      let t = (new Date).getTimezoneOffset(), u = Math.floor(Math.abs(t / 60)), f = Math.abs(t % 60), i;
      t < 0 ? i = "+" + r(u) + ":" + r(f) : t > 0 ? i = "-" + r(u) + ":" + r(f) : t == 0 && (i = "Z");
      const n = new Date
        , e = n.getDate()
        , o = n.getMonth() + 1
        , s = n.getFullYear()
        , h = n.getHours()
        , c = n.getMinutes()
        , l = n.getSeconds();
      return r(s) + "-" + r(o) + "-" + r(e) + "T" + r(h) + ":" + r(c) + ":" + r(l) + i
    }
    return {
      "arguments": [
        {
          "source": "cib",
          "optionsSets": [
            "nlu_direct_response_filter",
            "deepleo",
            "disable_emoji_spoken_text",
            "responsible_ai_policy_235",
            "enablemm",
            "galileo",
            "deepleofreq",
            "saharafreq",
            "cpcttl1d",
            "cachewriteext",
            "e2ecachewrite",
            "dv3sugg"
          ],
          "allowedMessageTypes": [
            "Chat",
            "InternalSearchQuery",
            "InternalSearchResult",
            // "Disengaged",
            // "InternalLoaderMessage",
            // "RenderCardRequest",
            // "AdsQuery",
            // "SemanticSerp",
            // "GenerateContentQuery",
            // "SearchQuery"
          ],
          "sliceIds": [
            "anidtest",
            "321bic62ups0",
            "styleqnatg",
            "creatorv2c",
            "sydpayajax",
            "sydperfinput",
            "toneexpcf",
            "321toppfp3pp3",
            "323freps0",
            "303hubcancls0",
            "321jobsgndv0",
            "cache0321s0",
            "ssoverlap100",
            "ssploff",
            "sssreduceoff",
            "sswebtop3",
            "saharasscf",
            "316cache_sss0",
            "316e2ecache"
          ],
          "verbosity": "verbose",
          "isStartOfSession": true,
          "message": {
            "timestamp": timestamp(),
            "author": "user",
            "inputMethod": "Keyboard",
            "text": prompt,
            "messageType": "Chat"
          },
          conversationSignature,
          "participant": {
            "id": clientId,
          },
          conversationId
        }
      ],
      "invocationId": "0",
      "target": "chat",
      "type": 4
    }
  }
}
