Context.bangs = () => {
  if (Context.engineName === DuckDuckGo) return;

  const regexp = /[?|&]q=((%21|!)[^&]*)/;
  const reg = window.location.href.match(regexp);
  if (!reg) return;

  debug(reg[1]);
  window.location.href = `https://duckduckgo.com/?q=${reg[1]}`;
};

Context.calculator = () => {
  if (window.location.href.search(/[?|&]q=calculator(&?|$)/) === -1) return;

  Context.appendPanel(el("iframe", {
    className: Context.PANEL_CLASS,
    id: "opticalculator",
    src: "https://www.desmos.com/scientific",
  }));
};

Context.plot = (rep) => {
  Context.appendPanel(el("div", {
    className: Context.PANEL_CLASS,
    id: "optiplot",
  }));

  plotFun({
    expr: rep.expr,
    vars: rep.vars,
  }, "optiplot");
};

Context.compute = (rep) => {
  const panel = el("div", { className: Context.PANEL_CLASS });

  let str = "$" + math.parse(rep.expr).toTex() + "~";
  let answer = rep.answer;
  if (typeof answer == "number") {
    str += "=~" + answer.toPrecision(4);
  } else if (typeof answer == "boolean") {
    str += ":~" + answer;
  } else if (rep.answer.entries) {
    answer = answer.entries[0];
    str += "=~" + answer;
  }
  str += "$";


  const expr = el("div", { id: "optiexpr", textContent: str }, panel);
  toTeX(expr);
  panel.appendChild(createCopyButton(answer.toString()));
  Context.appendPanel(panel);
};

Context.plotOrCompute = () => {
  const rep = isMathExpr(Context.searchString);
  if (!rep) return;

  if (rep.vars.length > 0) {
    Context.isActive("plot") && Context.plot(rep);
  }
  else if (typeof rep.answer === "number" || typeof rep.answer === "boolean" || rep.answer.entries) {
    Context.isActive("calculator") && Context.compute(rep);
  }
};

Context.chatgpt = async () => {
  const body = el("div");

  const inputContainer = el("div", { className: "text-area-container" }, body);
  const inputArea = el("textarea", {
    value: Context.searchString,
  }, inputContainer);

  const send = el("button", {
    innerHTML: `<svg viewBox="0 0 20 20">
<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
</svg>`,
    title: "Send to ChatGPT"
  }, inputContainer);
  inputContainer.addEventListener("click", () => {
    inputArea.focus();
  });
  inputArea.addEventListener("input", (event) => {
    event.target.style.height = "";
    event.target.style.height = event.target.scrollHeight + "px"
  });
  inputArea.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send.click();
    }
  });
  const disableInputArea = (invisible = false) => {
    inputContainer.classList.add("sent");
    inputArea.disabled = true;
    invisible && (inputContainer.style.display = 'none');
  }

  const textContainer = el("div", { textContent: "" }, body);
  textContainer.style.display = "none";


  const panel = Context.panelFromSite({
    title: Settings.Tools.chatgpt.name,
    link: Settings.Tools.chatgpt.link,
    body,
  });
  panel.querySelector('img').src = chrome.runtime.getURL(Settings.Tools.chatgpt.icon);
  Context.appendPanel(panel);

  const formatText = (text) => markdown(escapeHtml(text.trim()))
  const test = false;
  try {
    !test && await Context.gpt.init();
    send.onclick = async () => {
      disableInputArea();
      textContainer.style.display = "block";
      if (!test) {
        const text = await Context.gpt.send(inputArea.value, (text) => {
          textContainer.innerHTML = formatText(text);
          Context.prettifyCode(body, true);
        });
        debug(text);
        Context.gpt.removeConversation();
      } else {
        const text = `This is a test`;
        textContainer.innerHTML = formatText(text);
        Context.prettifyCode(body, true);
      }
    }
  }
  catch (error) {
    disableInputArea(true);
    const texts = {};
    if (error === ChatGPTSession.ERROR_CLOUDFLARE) {
      texts.p = "Please pass the Cloudflare check on ChatGPT, then refresh this page :";
      texts.button = "Cloudflare check";
    }
    else {
      texts.p = "Please login to ChatGPT, then refresh this page :";
      texts.button = "Login to ChatGPT";
    }
    el("p", {
      textContent: texts.p,
    }, body);
    el("div", {
      type: "button",
      className: "chatgpt-button",
      textContent: texts.button,
    }, body).addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: 'window', url: Settings.Tools.chatgpt.link }, r => {
        console.log(r);
      });
    })
  }
};
