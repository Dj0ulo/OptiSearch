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

  const changePopupTab = (id) => {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.style.display = 'none');
    document.getElementById(id).style.display = 'unset';
  }

  const ver = document.querySelector('#version');
  ver.textContent = chrome.runtime.getManifest().version;

  Array.from(document.getElementsByClassName("main")).forEach(b => b.onclick = () => changePopupTab("main"));
  Array.from(document.getElementsByClassName("privacy")).forEach(e => e.onclick = () => changePopupTab("privacy"));

  const donate = document.getElementById("donate");
  donate.onclick = () => chrome.tabs.create({
    active: true,
    url: "https://www.paypal.com/donate?hosted_button_id=VPF2BYBDBU5AA"
  });

  donate.onmouseover = () => {
    const smileys = document.querySelectorAll('.smiley');

    smileys.forEach(smiley => smiley.style.display = "inline-block");

    smileys[0].classList.remove('anim-left');
    smileys[0].classList.add('anim-left');

    smileys[1].classList.remove('anim-right');
    smileys[1].classList.add('anim-right');
  }
  donate.onmouseout = () => {
    document
      .querySelectorAll('.smiley')
      .forEach(smiley => smiley.style.display = "none");
  }

  const [save, engines] = await Promise.all([loadSettings(), loadEngines()]);

  const liEng = document.querySelector("#engines")
  Object.values(engines).forEach((e, i) => {
    if (e.active) {
      const div = el("div", {
        className: "engine",
        style: `--order: ${i + 1};`,
        onclick: () => chrome.tabs.create({ active: true, url: e.link })
      }, liEng);

      el("img", {
        src: e.icon,
        title: Object.keys(engines)[i]
      }, div);
    }
  })

  const optionsContainer = document.getElementById("options-container");
  
  //options
  Object.keys(Settings).forEach((category) => {
    optionsContainer.append(titleSection(category));

    const sublist = el("ul", { className: "sublist", style: "display: block" }, optionsContainer);

    Object.entries(Settings[category]).forEach(([o, spec]) => {
      const li = el("li", { id: o }, sublist);

      const label = el("label", {
        className: "optiondiv",
        style: "display: inline-block"
      }, li);
      const spanImg = el("span", {
        className: "titleOption",
        innerHTML: spec.href ? `<a href=${spec.href}>${spec.name}</a>` : spec.name,
        title: spec.title ?? "",
        style: "padding-bottom: 2px"
      }, label);

      if (spec.icon)
        spanImg.prepend(el("img", { width: 14, height: 14, src: spec.icon }));

      if(typeof spec.default === 'number'){
        el("input", {
          type: "number",
          style: "width: 2rem",
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

      const checkDiv = el("div", {
        className: 'checkdiv',
        style: "display: inline-block"
      }, label)

      el('input', {
        className: "checkbox",
        type: "checkbox",
        checked: save[o],
        onchange: ({ target }) => {
          save[o] = target.checked
          saveSettings(save);
        }
      }, checkDiv)
    })
  })
  if (typeof browser === 'undefined') // if not browser then we are on chrome
    hrefPopUp();
})()