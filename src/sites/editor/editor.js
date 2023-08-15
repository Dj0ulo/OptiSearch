(async () => {
  adoptStyleSheet();

  ['url-template', 'url-html'].map((id) => {
    const inputEl = document.querySelector(`input[name="${id}"]`);
    if (localStorage[id])
      inputEl.value = localStorage[id];

    inputEl.parentElement.onsubmit = async (event) => {
      event.preventDefault();
      const val = inputEl.value.trim();
      localStorage[id] = val;
      inputEl.value = val;
      if (id === 'url-template')
        return;
        
      try {
        localStorage[id.slice(4)] = await get(val);
      } catch (e) {
        console.error(e);
        return;
      }
      displayBox(optisearchbox(await get(localStorage['url-template']), localStorage['url-html'], localStorage['html']));
    };
    return inputEl;
  });

  if (localStorage['html']) {
    displayBox(optisearchbox(await get(localStorage['url-template']), localStorage['url-html'], localStorage['html']));
  }

  function displayBox(box) {
    $('.optisearchbox').innerHTML = box.innerHTML;
  }
})();
