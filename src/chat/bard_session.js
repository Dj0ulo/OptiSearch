class BardSession extends ChatSession {
  properties = {
    name: "Bard",
    link: "https://bard.google.com",
    icon: "src/images/bard.png",
    local_icon: "bard.png",
    href: "https://bard.google.com",
  }
  static errors = {
    session: {
      code: 'BARD_SESSION',
      url: 'https://accounts.google.com/',
      text: "Please login to Google, then refresh :",
      button: "Login to Google",
    },
    captcha: {
      code: 'BARD_CAPTCHA',
      url: 'https://bard.google.com/',
      text: "Too many requests. Please solve the captcha and refresh :",
      button: "Solve Google Bard captcha",
    },
  }
  static get storageKey() {
    return "SAVE_BARD";
  }

  constructor() {
    super('bard');
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    const parseData = (html) => {
      let str = 'window.WIZ_global_data = ';
      let beg = html.indexOf(str) + str.length;
      let end = html.indexOf('</script>', beg);
      const raw = html.slice(beg, end);
      return JSON.parse(raw.slice(0, raw.lastIndexOf('}') + 1));
    };

    const html = await bgFetch('https://bard.google.com/', { credentials: "include" });
    if (html.status && html.status == 429)
      throw BardSession.errors.captcha;
    const data = parseData(html);
    if (!('oPEP7c' in data))
      throw BardSession.errors.session;
    this.session = {
      'at': Object.values(data).find(v => typeof v === 'string' && v.match(/[^:]+:\d+/)),
      'bl': Object.values(data).find(v => typeof v === 'string' && v.startsWith('boq_assistant'))
    };
    return this.session;
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug) {
      return;
    }
    const askBard = () => this.api('assistant.lamda.BardFrontendService/StreamGenerate', {}, [
      null,
      JSON.stringify([
        [prompt],
        null,
        (this.session.conversation ?? ["", "", ""])
      ]),
    ]);

    const cleanResponse = (response) => {
      let i = response.indexOf('[[');
      i = response.indexOf(',', i);
      i = response.indexOf(',', i + 1);
      if (response.slice(i + 1, i + 5) === 'null')
        throw "Output is null";
      if (response.slice(i + 1, i + 2) !== '"')
        throw "Invalid output";
      return JSON.parse(
        response.slice(i + 2, response.indexOf('\n', i) - 3)
          .replace(/\\(\\)?/g, (_, backslash) => backslash ?? '')
      );
    };
  
    let result = null;
    try {
      result = cleanResponse(await askBard());
    } catch (e) {
      if (e == "Output is null") {
        this.onErrorMessage(`Please make sure you have access to <a href="https://bard.google.com/">Google Bard</a>`);
        return;
      } else {
        warn(e);
      }
    }
    if (!result) {
      this.onErrorMessage();
      return;
    }
    this.allowSend();
    try {
      this.session.conversation = result[1];

      const responses = result[4];
      const firstResponse = responses[0];
      this.session.conversation.push(firstResponse[0]);
      let images = firstResponse[4];
      let text = runMarkdown(firstResponse[1][0]);
      images?.forEach(img => {
        const [substr, source, url, title] = [img[2], img[1][0][0], img[3][0][0], img[7][2]].map(escapeHtml);
        text = text.replace(substr, `<a href="${source}" style="display: inline-block;"><img src="${url}" alt="${title}" title="${title}"/></a>`);
      });
      this.onMessage(text);
    } catch (e) {
      warn(e);
      this.onErrorMessage(`⚠️&nbsp;An error occured while parsing the response&nbsp:<br/>${e}`);
    }
  }

  removeConversation() {
    if (ChatSession.debug || !this.session || !this.session.conversation || this.session.conversation.length === 0)
      return;

    return this.api('batchexecute', { 'rpcids': 'GzXR5e', 'source-path': '/' }, [
      [['GzXR5e', `["${this.session.conversation[0]}"]`, null, 'generic']]
    ]);
  }

  api(method, params, fReq) {
    params = {
      bl: this.session.bl,
      rt: "c",
      ...params,
    }
    return bgFetch(`https://bard.google.com/_/BardChatUi/data/${method}?${this.encodeURIParams(params)}`, {
      headers: {
        "accept": "*/*",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        "pragma": "no-cache",
      },
      body: this.encodeURIParams({
        'f.req': fReq,
        'at': this.session.at,
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
  }

  encodeURIParams(params) {
    return Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v)}`)
      .join('&');
  }
}
