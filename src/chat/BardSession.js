class BardSession extends ChatSession {
  static errors = {
    session: {
      code: 'BARD_SESSION',
      url: 'https://accounts.google.com/',
      text: "Please login to Google, then refresh :",
      button: "Login to Google",
    },
    country: {
      code: 'BARD_COUNTRY',
      url: 'https://support.google.com/bard/answer/13575153',
      text: "Sorry, Google Bard is not yet available in your country...",
      button: "List of supported countries",
    },
  }
  static get storageKey() {
    return "SAVE_BARD";
  }

  constructor() {
    super('bard');
    this.socketID = null;
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
    const data = parseData(html);
    if (!('oPEP7c' in data))
      throw BardSession.errors.session;
    if (data['rtQCxc'] === -120)
      throw BardSession.errors.country;
    this.session = {
      'at': Object.values(data).find(v => typeof v === 'string' && v.match(/[^:]+:\d+/)),
    };
    return this.session;
  }




  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug) {
      return;
    }
    try{
      const raw = await bgFetch("https://bard.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20230507.20_p2&rt=c", {
        headers: {
          "accept": "*/*",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "pragma": "no-cache",
        },
        body: this.config(prompt),
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      let i = raw.indexOf('[[');
      i = raw.indexOf(',', i);
      i = raw.indexOf(',', i + 1);
      const unescaped = raw.slice(i + 2, raw.indexOf('\n', i) - 3)
        .replaceAll('\\"', '"')
        .replaceAll('\\"', '"');
      const parsed = JSON.parse(`"${JSON.parse(unescaped)[0][0].replaceAll('"', '\\"')}"`);
      this.onmessage(runMarkdown(parsed));
    } catch (e) {
      console.error(e);
      this.onmessage(ChatSession.infoHTML('⚠️&nbsp;Sorry, an error occured. Please try again.'));
    }
  }

  config(prompt) {
    return Object.entries({
      'f.req': [null, JSON.stringify([[prompt], null, ["", "", ""]])],
      'at': this.session.at,
    })
      .map(([k, v]) => `${k}=${encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v)}`)
      .join('&');
  }
}
