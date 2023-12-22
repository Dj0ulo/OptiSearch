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
      text: "Please login to Google, then refresh&nbsp;:",
      button: "Login to Google",
    },
    captcha: {
      code: 'BARD_CAPTCHA',
      url: 'https://bard.google.com/',
      text: "Too many requests. Please solve the captcha and refresh&nbsp;:",
      button: "Solve Google Bard captcha",
    },
  }
  static accountConfigKeys = {
    index: 'QrtxK',
    hasNotBard: 'u21JSd',
    email: 'oPEP7c',
    at: 'SNlM0e',
    bl: 'cfb2h',
  }
  static get storageKey() {
    return "SAVE_BARD";
  }
  get urlPrefix() {
    return `https://bard.google.com/u/${Context.save['googleAccount']}`;
  }

  constructor() {
    super('bard');
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    const { at, bl, hasNotBard } = await BardSession.fetchAccountData(Context.save['googleAccount']);
    if (hasNotBard) {
      this.errorNoBardAccess();
      return null;
    }
    this.session = { at, bl };
    return this.session;
  }

  static async fetchAvailableAccounts(offset = 0) {
    const testCount = 8;
    const accounts = await Promise.all([...Array(testCount).keys()].map(async i => {
      try {
        const { index, name, email, hasNotBard, img32 } = await BardSession.fetchAccountData(offset + i);
        if (i + offset != index) {
          return null;
        }
        return {
          index: parseInt(index),
          name,
          email,
          hasBard: !hasNotBard,
          img32
        };
      } catch (error) {
        if (error === BardSession.errors.captcha || error === BardSession.errors.session) {
          return null;
        }
        throw error;
      }
    }));
    if (accounts.at(-1) !== null) {
      return [
        ...accounts.filter(a => !!a),
        ...(await BardSession.fetchAvailableAccounts(offset + testCount))
      ];
    }
    return accounts.filter(a => !!a);
  }

  static async fetchAccountData(user_id=0) {
    const parseData = (html) => {
      let str = 'window.WIZ_global_data = ';
      let beg = html.indexOf(str) + str.length;
      let end = html.indexOf('</script>', beg);
      const raw = html.slice(beg, end);
      const data = JSON.parse(raw.slice(0, raw.lastIndexOf('}') + 1));
      if (!(BardSession.accountConfigKeys.email in data)) {
        throw BardSession.errors.session;
      }
      const res = {
        name: parseStr(html, /<div class="gb_zb">(.*?)<\/div>/),
        img32: parseStr(html, /(https:\/\/lh3\.googleusercontent\.com\/[^\s'"]*?s32[^\s'"]*)/),
        img64: parseStr(html, /(https:\/\/lh3\.googleusercontent\.com\/[^\s'"]*?s64[^\s'"]*)/),
      };
      Object.entries(BardSession.accountConfigKeys).forEach(([k, v]) => res[k] = data[v]);
      return res;
    };
    const r = await bgFetch(`https://bard.google.com/u/${user_id}/`, { credentials: "include" });
    if (r.status && r.status == 429) {
      throw BardSession.errors.captcha;
    }
    return parseData(r);
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

    const cleanResponse = (raw) => {
      let i = 0;
      try {
        i = raw.indexOf('[[');
        i = raw.indexOf(',', i);
        i = raw.indexOf(',', i + 1);
      } catch (e) {
        throw "Output is null";
      }
      if (raw.slice(i + 1, i + 5) === 'null')
        throw "Output is null";
      if (raw.slice(i + 1, i + 2) !== '"')
        throw "Invalid output";
      return JSON.parse(
        raw.slice(i + 2, raw.indexOf('\n', i) - 3)
          .replace(/\\(\\)?/g, (_, backslash) => backslash ?? '')
      );
    };

    const parseMessage = (responses) => {
      const firstResponse = responses[0];
      this.session.conversation.push(firstResponse[0]);
      let images = firstResponse[4];
      let text = runMarkdown(firstResponse[1][0]);
      images?.forEach(img => {
        const [substr, source, url, title] = [img[2], img[1][0][0], img[3][0][0], img[7][2]].map(escapeHtml);
        text = text.replace(substr, `<a href="${source}" style="display: inline-block;"><img src="${url}" alt="${title}" title="${title}"/></a>`);
      });
      return text;
    }
  
    let res = null;
    try {
      res = cleanResponse(await askBard());
    } catch (e) {
      if (e == "Output is null") {
        this.errorNoBardAccess();
        return;
      } else {
        warn(e);
      }
    }

    if (!res) {
      this.onErrorMessage();
      return;
    }
    this.allowSend();

    try {
      this.session.conversation = res[1];
      this.onMessage(parseMessage(res[4]));
    } catch (e) {
      this.onErrorMessage(`⚠️&nbsp;An error occured while parsing the response&nbsp:<br/>${e}`);
    }
  }

  async errorNoBardAccess() {
    const accounts = await BardSession.fetchAvailableAccounts();
    this.handleActionError({
      code: 'BARD_ACCOUNT',
      text: `
      This Google account has not access to Bard yet, please <a href="${this.urlPrefix}">activate it</a>
      or choose another Google account for Bard&nbsp;:
      <br>
      <select id="google-account">
      ${accounts.map((a, i) => `
        <option value="${i}" ${a.index == Context.save['googleAccount'] ? 'selected' : ''}>
          ${a.hasBard ? '✅' : '❌'} ${a.email}
        </option>
      `).join('')}
      </select>
      `,
      action: "refresh",
    });
    const input = $$("#google-account");
    input.value = Context.save['googleAccount'];
    input.addEventListener("change", () => {
      Context.save['googleAccount'] = parseInt(input.value);
      saveSettings(Context.save);
    });
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
    return bgFetch(`${this.urlPrefix}/_/BardChatUi/data/${method}?${this.encodeURIParams(params)}`, {
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
