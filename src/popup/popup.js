(async function () {
  /**
   * Create a title and a bar for an section in the options
   * @param {string} name 
   * @returns Element
   */
  const titleSection = (name) => {
    const title = el("span", { className: "menu_title" });
    el("hr", { className: 'flexchild' }, title)
    el("span", { textContent: name }, title);
    el("hr", { className: 'flexchild' }, title)
    return title;
  }

  const manifest = chrome.runtime.getManifest();
  $('#name').textContent = manifest.name;
  $('#version').textContent = manifest.version;
  let webstore = '';
  if (onChrome())
    webstore = manifest.name === 'OptiSearch' ?
      'https://chrome.google.com/webstore/detail/optisearch/bbojmeobdaicehcopocnfhaagefleiae'
      : 'https://chrome.google.com/webstore/detail/bing-chat-gpt-4-in-google/pcnhobmoglanpljipbomknafhdlcgcng';
  else
    webstore = manifest.name === 'OptiSearch' ?
      'https://addons.mozilla.org/fr/firefox/addon/optisearch'
      : 'https://addons.mozilla.org/fr/firefox/addon/bing-chat-gpt-4-in-google';

  $('#title-container img').src = (onChrome() ? '../../' : '') + manifest.icons[128];
  $('.title > a').href = webstore;
  $('#feedback').href = webstore + '/reviews';

  const donate = document.getElementById("donate");
  donate.onclick = () => chrome.tabs.create({
    active: true,
    url: "https://www.paypal.com/donate?hosted_button_id=VPF2BYBDBU5AA"
  });

  const liEng = document.querySelector("#engines");

  const [settings, engines, save] = await Promise.all([getSettings(), loadEngines(), loadSettings()]);
  console.log(settings);

  OrderEngines.forEach((engineName, i) => {
    const e = engines[engineName];
    if (e.active) {
      const div = el("div", {
        className: "engine",
        style: `--order: ${i + 1};`,
        onclick: () => chrome.tabs.create({ active: true, url: e.link })
      }, liEng);

      el("img", {
        src: e.icon,
        title: Object.keys(engines)[i],
        className: 'icon',
      }, div);
    }
  });


  const optionsContainer = document.getElementById("options-container");

  //options
  Object.keys(settings).forEach((category) => {
    optionsContainer.append(titleSection(category));

    const sublist = el("ul", { className: "sublist", style: "display: block" }, optionsContainer);

    Object.entries(settings[category]).forEach(([o, spec]) => {
      const li = el("li", { id: o }, sublist);

      const label = el("label", {
        className: "optiondiv",
        style: "display: inline-block"
      }, li);

      const spanImg = el("span", {
        className: "titleOption",
        innerHTML: spec.href ? `<a href=${spec.href}>${spec.name}</a>` : spec.name,
        title: spec.title ?? "",
      }, label);

      if (spec.local_icon) {
        const img = el("div", { className: "icon" }, spanImg);
        img.style = `background-image: url(../images/${spec.local_icon});
                    background-size: contain;
                    width: 14px;
                    height: 14px;
                    display: inline-block;`;
        spanImg.prepend(img);
      }

      if (typeof spec.default === 'number') {
        el("input", {
          type: "number",
          style: "width: 2em",
          value: save[o],
          min: spec.min,
          max: spec.max,
          onchange: ({ target }) => {
            save[o] = target.value
            saveSettings(save);
          },
        }, label)
        return;
      }
      if (spec.options) {
        if (!Object.values(spec.options).map(o => o.name).includes(save[o])) {
          save[o] = spec.default;
          saveSettings(save);
        }
        const select = el("select", {
          value: save[o],
          onchange: ({ target }) => {
            save[o] = target.value
            saveSettings(save);
          },
        }, label);
        Object.entries(spec.options).forEach(([key, props]) => {
          el('option', { value: key, text: props.name, selected: save[o] === key }, select);
        });
        return;
      }

      const checkDiv = el("div", {
        className: 'checkdiv',
        style: "display: inline-block"
      }, label)

      el('input', {
        className: "checkbox",
        type: "checkbox",
        checked: save[o],
        onchange: ({ target }) => {
          save[o] = target.checked;
          saveSettings(save);
          if (o === 'wideColumn') {
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(({ id }) => chrome.tabs.sendMessage(id, { wideColumn: save[o] }));
            });
          }
        }
      }, checkDiv)
    });

    if (isOptiSearch && category === 'AI Assitant') {
      el('a', {
        className: 'ad',
        innerHTML: 'Get answers from the new <strong>Bing Chat AI</strong> too !',
        href: 'https://chrome.google.com/webstore/detail/bing-chat-gpt-4-in-google/pcnhobmoglanpljipbomknafhdlcgcng'
      }, sublist);
    }

  });

  if (!isOptiSearch) {
    el('a', {
      className: 'ad',
      innerHTML: 'I want answers from <strong>ChatGPT</strong> and <strong>StackOverflow</strong> too !',
      href: 'https://chrome.google.com/webstore/detail/optisearch/bbojmeobdaicehcopocnfhaagefleiae'
    }, optionsContainer);
  }


  if (onChrome()) hrefPopUp();
})();