Sites.genius.msgApi = () => ({})

/**
 * 
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.genius.get = (from, doc) => {
  const body = doc.querySelector("body");

  let lyricsDiv = body.querySelector('[class*=Lyrics__Root], .lyrics');
  if (!lyricsDiv)
    return;
  Array.from(lyricsDiv?.querySelectorAll('a')).forEach(a => a.outerHTML = a.innerHTML);

  let lyrics = "";
  if (lyricsDiv.classList.contains('lyrics'))
    lyrics = lyricsDiv?.innerHTML;
  else {
    lyrics = Array.from(lyricsDiv.querySelectorAll('[class^=Lyrics__Container]'))
      .map(e => e.innerHTML)
      .join('<br><br>');
    lyrics = `<p>${lyrics}</p>`;
  }
  return {
    title: doc.title.split('|')[0].trim(),
    lyrics,
  }
}

Sites.genius.set = msg => ({
  body: el('div', { className: 'geniusBody', innerHTML: msg.lyrics })
})