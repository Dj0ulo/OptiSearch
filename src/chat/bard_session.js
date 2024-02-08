class BardSession extends ChatSession {
  properties = {
    name: "Bard",
    link: "https://bard.google.com",
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
    return `https://bard.google.com/u/${Context.get("googleAccount")}`;
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
    const url = `https://bard.google.com/u/${user_id}/`;
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
            button: _t("Solve Google Bard captcha"),
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
    const askBard = () =>
      this.api("assistant.lamda.BardFrontendService/StreamGenerate", {}, [
        null,
        JSON.stringify([[prompt], null, this.session.conversation ?? ["", "", ""]]),
      ]);

    const cleanResponse = (raw) => {
      let i = 0;
      try {
        i = raw.indexOf("[[");
        i = raw.indexOf(",", i);
        i = raw.indexOf(",", i + 1);
      } catch (e) {
        throw "Output is null";
      }
      if (raw.slice(i + 1, i + 5) === "null") throw "Output is null";
      if (raw.slice(i + 1, i + 2) !== '"') throw "Invalid output";
      return JSON.parse(
        raw
          .slice(i + 2, raw.indexOf("\n", i) - 3)
          .replace(/\\(\\)?/g, (_, backslash) => backslash ?? "")
      );
    };

    const parseMessage = (responses) => {
      const firstResponse = responses[0];
      this.session.conversation.push(firstResponse[0]);
      let images = firstResponse[4];
      let text = runMarkdown(firstResponse[1][0]);
      images?.forEach(img => {
        const [substr, source, url, title] = [img[2], img[1][0][0], img[3][0][0], img[7][2]].map(escapeHtml);
        text = text.replace(substr, `<a href="${source}" class="bard-image-link"><img src="${url}" alt="${title}" title="${title}"/></a>`);
      });
      return text;
    };

    let res = null;
    try {
      res = cleanResponse(await askBard());
    } catch (e) {
      if (e == "Output is null") {
        this.chooseGoogleAccount();
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
      this.onErrorMessage("⚠️ " + _t("An error occured while parsing the response:<br>$error$", e));
    }
  }

  async chooseGoogleAccount(isError = true) {
    const accounts = await BardSession.fetchAvailableAccounts();
    const htmlMessage = `
      ${
        isError
          ? _t(
              'This Google account does not have access to Bard yet, please visit <a href="$url$">this link</a> to activate it or choose another Google account for Bard',
              this.urlPrefix
            )
          : _t("Choose a Google account for Bard")
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
      this.discussion.clear();
      this.chooseGoogleAccount(false);
    });
  }
}
