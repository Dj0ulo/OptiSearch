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
    try {
      const raw = await this.api('assistant.lamda.BardFrontendService/StreamGenerate', {}, [
        null,
        JSON.stringify([
          [prompt],
          null,
          (this.session.conversation ?? ["", "", ""])
        ]),
      ]);
      let i = raw.indexOf('[[');
      i = raw.indexOf(',', i);
      i = raw.indexOf(',', i + 1);
      if (raw.slice(i + 1, i + 5) === 'null')
        throw "Output is null";
      if (raw.slice(i + 1, i + 2) !== '"')
        throw "Invalid output";
      const unescaped = raw.slice(i + 2, raw.indexOf('\n', i) - 3)
        .replaceAll('\\"', '"')
        .replaceAll('\\"', '"');


      const resJSON = JSON.parse(unescaped);
      this.session.conversation = resJSON[1]
      const responses = resJSON[4]
      const firstResponse = responses[0]
      this.session.conversation.push(firstResponse[0]);
      let res = firstResponse[1][0];
      res = JSON.parse(`"${res.replaceAll('"', '\\"')}"`);
      res = runMarkdown(res);
      this.onmessage(res);
    } catch (e) {
      warn(e);
      this.onmessage(ChatSession.infoHTML('⚠️&nbsp;An error occured.&nbsp;⚠️<br/>Please <a href="https://bard.google.com/">make sure you have access to Google Bard</a>.'));
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
