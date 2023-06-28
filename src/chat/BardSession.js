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
      const raw = await bgFetch(`https://bard.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${this.session.bl}&rt=c`, {
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
      if (raw.slice(i + 1, i + 5) === 'null')
        throw "Output is null";
      if (raw.slice(i + 1, i + 2) !== '"')
        throw "Invalid output";
      const unescaped = raw.slice(i + 2, raw.indexOf('\n', i) - 3)
        .replaceAll('\\"', '"')
        .replaceAll('\\"', '"');

        
      let res = JSON.parse(unescaped);
      // Hack to parse the correct string in the messy response (which structure may change with the Bard API modifications)
      res = parseJSONStrings(res)
        .filter(x => !x.match(/^[a-z]+_[a-f0-9]+$/))
        .reduce((a, b) => a.length > b.length ? a : b)
      res = JSON.parse(`"${res.replaceAll('"', '\\"')}"`);
      res = runMarkdown(res);
      this.onmessage(res);
    } catch (e) {
      warn(e);
      this.onmessage(ChatSession.infoHTML('⚠️&nbsp;An error occured.&nbsp;⚠️<br/>Please <a href="https://bard.google.com/">make sure you have access to Google Bard</a>.'));
    }

    /**
     * Recursively parse all strings inside a JS object
     * @param {object} jsonObject 
     * @returns {string[]} Array of all strings contained inside the object
     */
    function parseJSONStrings(jsonObject) {
      var stringsArray = [];

      function parseObject(obj) {
        for (var key in obj) {
          if (typeof obj[key] === 'string') {
            stringsArray.push(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            parseObject(obj[key]);
          }
        }
      }

      parseObject(jsonObject);
      return stringsArray;
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
