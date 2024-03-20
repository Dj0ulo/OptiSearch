class BardSession extends ChatSession {
  properties = {
    name: "Gemini",
    link: "https://gemini.google.com",
    icon: "src/images/bard.png",
    local_icon: "bard.png",
    href: this.urlPrefix,
  };
  static errors = {
    session: {
      code: "BARD_SESSION",
      url: "https://accounts.google.com/",
      text: _t("Please login to $AI$, then refresh", "Google"),
      button: _t("Login to $AI$", "Google"),
    },
  };
  static accountConfigKeys = {
    index: 'QrtxK',
    email: 'oPEP7c',
    at: 'SNlM0e',
    bl: 'cfb2h',
  }
  static get storageKey() {
    return "SAVE_BARD";
  }
  get urlPrefix() {
    return `https://gemini.google.com/u/${Context.get("googleAccount")}`;
  }

  constructor() {
    super("bard");
  }

  async init() {
    if (ChatSession.debug) return;
    await this.fetchSession();
  }

  async fetchSession() {
    const { at, bl, hasNotBard } = await BardSession.fetchAccountData(Context.get("googleAccount"));
    if (hasNotBard) {
      this.chooseGoogleAccount();
      return null;
    }
    this.session = { at, bl };
    return this.session;
  }

  static async fetchAvailableAccounts(offset = 0) {
    const testCount = 8;
    const accounts = await Promise.all(
      [...Array(testCount).keys()].map(async (i) => {
        try {
          const { index, name, email, hasNotBard, img32 } = await BardSession.fetchAccountData(
            offset + i
          );
          if (i + offset != index) {
            return null;
          }
          return {
            index: parseInt(index),
            name,
            email,
            hasBard: !hasNotBard,
            img32,
          };
        } catch (error) {
          if (error.code === "BARD_CAPTCHA" || error.code === "BARD_SESSION") {
            return null;
          }
          throw error;
        }
      })
    );
    if (accounts.at(-1) !== null) {
      return [
        ...accounts.filter((a) => !!a),
        ...(await BardSession.fetchAvailableAccounts(offset + testCount)),
      ];
    }
    return accounts.filter((a) => !!a);
  }

  static async fetchAccountData(user_id = 0) {
    const parseData = (html) => {
      let str = "window.WIZ_global_data = ";
      let beg = html.indexOf(str) + str.length;
      let end = html.indexOf("</script>", beg);
      const raw = html.slice(beg, end);
      const data = JSON.parse(raw.slice(0, raw.lastIndexOf("}") + 1));
      if (!(BardSession.accountConfigKeys.email in data)) {
        throw BardSession.errors.session;
      }
      const res = {
        name: parseStr(html, /<div class="gb_zb">(.*?)<\/div>/),
        img32: parseStr(html, /(https:\/\/lh3\.googleusercontent\.com\/[^\s'"]*?s32[^\s'"]*)/),
        img64: parseStr(html, /(https:\/\/lh3\.googleusercontent\.com\/[^\s'"]*?s64[^\s'"]*)/),
      };
      Object.entries(BardSession.accountConfigKeys).forEach(([k, v]) => res[k] = data[v]);
      res.hasNotBard = false;
      return res;
    };
    const url = `https://gemini.google.com/u/${user_id}/`;
    const r = await bgFetch(url, { credentials: "include", redirect: "manual" });
    if (r.status !== undefined && r.status !== 200) {
      switch (r.status) {
        case 0: // redirected, which means that the user is not logged in at this account index
          throw BardSession.errors.session;
        case 429:
          throw {
            code: "BARD_CAPTCHA",
            url,
            text: _t("Too many requests. Please solve the captcha and refresh"),
            button: _t("Solve Google Gemini captcha"),
          };
        default:
          throw BardSession.errors.session;
      }
    }
    return parseData(r);
  }

  async send(prompt) {
    super.send(prompt);
    if (ChatSession.debug) {
      return;
    }

    const fetchResponse = () => {
      return this.api("assistant.lamda.BardFrontendService/StreamGenerate", {}, [
        null,
        JSON.stringify([[prompt], null, this.session.conversation ?? ["", "", ""]]),
      ]);
    };

    const parseRawResponse = (raw) => {
      const sectionsRegex = /(\d+)\s*\[\s*\[/g;
      const sections = [...raw.matchAll(sectionsRegex)];
      const blockObjects = sections.map((section, i) => {
        const start = section.index + section[1].length;
        const end = sections[i + 1]?.index ?? raw.length;
        try {
          return JSON.parse(raw.slice(start, end));
        } catch {
          if (e instanceof SyntaxError) return null;
        }
      });
      return blockObjects
        .filter((obj) => obj && obj[0] && typeof obj[0][2] === "string") // filter the relevant objects
        .map((obj) => JSON.parse(obj[0][2])) // parse them
        .find((obj) => obj[4] && obj[4].length); // find the first one that has some answers
    };

    const parseConversationId = (jsonResp) => jsonResp[1];
    const parseAnswersList = (jsonResp) => jsonResp[4];
    const parseSourcesAnswer = (answer) => {
      if (!answer[2]) return [];
      const sources = answer[2][0];
      if (!sources) return [];
      return sources.map((s, i) => {
        const href = escapeHtml(s[2][0]);
        return {
          start: s[0],
          end: s[1],
          href,
          html: `<a href="${href}" class="source superscript">${i+1}</a>`,
        };
      }).filter(({href}) => href);
    };
    const parseTextAnswer = (answer) => answer[1][0];
    const parseImagesAnswer = (answer) => {
      let images = answer[4];
      if (!images) return [];
      return images.map(img => {
        const [substr, source, url, title] = [img[2], img[1][0][0], img[3][0][0], img[7][2]].map(escapeHtml);
        return {
          substr,
          html: `
            <a href="${source}" class="bard-image-link">
              <img src="${url}" alt="${title}" title="${title}"/>
            </a>`.trim(),
        };
      });
    };

    const buildMessage = (answer) => {
      let text = parseTextAnswer(answer);
      let offset = 0;
      const sources = parseSourcesAnswer(answer);
      sources.forEach(({end}, i) => {
        const position = text.slice(0, end + offset).lastIndexOf(' ');
        if (position === -1) return;
        text = text.slice(0, position) + `\uF8FD${i}\uF8FE` + text.slice(position);
        offset += 3;
      });
      let bodyHTML = runMarkdown(text).replace(/\uF8FD(\d+)\uF8FE/g, (_, i) => sources[i]?.html);
      parseImagesAnswer(answer).forEach(({substr, html}) => {
        bodyHTML = bodyHTML.replace(substr, html);
      });
      return [bodyHTML, sources];
    };

    let formattedResponse = null;
    try {
      const rawResponse = await fetchResponse();
      formattedResponse = parseRawResponse(rawResponse);
    } catch (e) {
      if (e == "Output is null") {
        this.chooseGoogleAccount();
        return;
      } else {
        warn(e);
      }
    }

    if (!formattedResponse) {
      this.onErrorMessage();
      return;
    }
    this.allowSend();

    try {
      const answersList = parseAnswersList(formattedResponse);
      const firstAnswer = answersList[0];
      this.session.conversation = parseConversationId(formattedResponse);
      this.session.conversation.push(firstAnswer[0]);
      this.onMessage(...buildMessage(firstAnswer));
    } catch (e) {
      this.onErrorMessage(_t("An error occured while parsing the response:<br>$error$", e));
    }
  }

  async chooseGoogleAccount(isError = true) {
    const accounts = await BardSession.fetchAvailableAccounts();
    const htmlMessage = `
      ${
        isError
          ? _t(
              'This Google account does not have access to Gemini yet, please visit <a href="$url$">this link</a> to activate it or choose another Google account for Gemini',
              this.urlPrefix
            )
          : _t("Choose a Google account for Gemini")
      }
      <br>
      <select name="google-account" class="chatgpt-button">
      ${accounts.map((a, i) => `
        <option value="${i}" ${a.index == Context.get('googleAccount') ? 'selected' : ''}>
          ${a.email}
        </option>
      `
        )
        .join("")}
      </select>
    `;
    if (isError) {
      this.handleActionError({
        code: "BARD_ACCOUNT",
        text: htmlMessage,
        action: "refresh",
      });
    } else {
      this.setCurrentAction("refresh");
      this.onMessage(htmlMessage);
    }
    const input = $("[name=google-account]", this.panel);
    input.value = Context.get("googleAccount");
    input.addEventListener("change", () => Context.set("googleAccount", parseInt(input.value)));
  }

  removeConversation() {
    if (
      ChatSession.debug ||
      !this.session ||
      !this.session.conversation ||
      this.session.conversation.length === 0
    )
      return;

    return this.api("batchexecute", { rpcids: "GzXR5e", "source-path": "/" }, [
      [["GzXR5e", `["${this.session.conversation[0]}"]`, null, "generic"]],
    ]);
  }

  api(method, params, fReq) {
    params = {
      bl: this.session.bl,
      rt: "c",
      ...params,
    };
    return bgFetch(
      `${this.urlPrefix}/_/BardChatUi/data/${method}?${this.encodeURIParams(params)}`,
      {
        headers: {
          accept: "*/*",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          pragma: "no-cache",
        },
        body: this.encodeURIParams({
          "f.req": fReq,
          at: this.session.at,
        }),
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
  }

  encodeURIParams(params) {
    return Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(typeof v === "object" ? JSON.stringify(v) : v)}`)
      .join("&");
  }

  createPanel(directchat = true) {
    super.createPanel(directchat);

    const rightButtonsContainer = $(".right-buttons-container", this.panel);
    const accountButton = el(
      "div",
      { className: "bust", title: _t("Switch Google account") },
      rightButtonsContainer
    );
    setSvg(accountButton, SVG.user);
    accountButton.addEventListener("click", () => {
      this.clear();
      this.chooseGoogleAccount(false);
    });
  }
}
