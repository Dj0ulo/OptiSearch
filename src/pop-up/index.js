const ARROW_LEFT = '&#9654;';
const ARROW_DOWN = '&#9660;';

const CLASS_CHECKDIV = 'checkdiv'

document.addEventListener("DOMContentLoaded", async () => {
  const save = await loadSettings();
  const engines = await loadEngines();

  console.log('oh', engines)

  const liEng = document.querySelector("#engines")
  Object.values(engines).forEach(e => {
    if (e.active) {
      const div = el("div", {
        className: "engine",
        onclick: () => chrome.tabs.create({ active: true, url: e.link })
      }, liEng);

      el("img", {src: e.icon}, div);
    }
  })

  const list = el('ul', null, document.body)

  //options
  Object.keys(Options).forEach(category => {
    const menu = el('li', {className: "menu"}, list);
    const title = el("span", {className: "menu_title"}, menu);
    el("span", {className: "arrow", innerHTML: ARROW_LEFT, value: "down"}, title);
    el("span", {textContent: category}, title);
    hline(title);

    const sublist = el("ul", {className: "sublist", style: "display: block"}, menu);

    Object.entries(Options[category]).forEach(([o, spec]) => {
      const li = el("li",{id: o}, sublist);

      const d = el("div", {
        className: "optiondiv",
        style: "display: inline-block"
      }, li);
      const spanImg = el("span", {className: "titleOption", innerHTML: spec.name}, d);
      spanImg.prepend(el("img", {width: 14, height: 14, src: spec.icon}));

      const checkDiv = el("div", {
        className: CLASS_CHECKDIV,
        style: "display: inline-block"
      }, d)

      el('input', {
        className: "checkbox", 
        type: "checkbox",
        checked: save[o],
        onchange: (ev) => {
          save[o] = ev.target.checked;
          saveSettings(save);
        }
      }, checkDiv)
    })
  })

  document.querySelectorAll("a").forEach(ln => {
    ln.onclick = () => chrome.tabs.create({ active: true, url: ln.href })
  })

});