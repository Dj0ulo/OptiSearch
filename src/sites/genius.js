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
  $$('a', lyricsDiv).forEach(a => a.outerHTML = a.innerHTML);
  $$('[class^=LyricsHeader__Container]', lyricsDiv).forEach(h => h.parentNode.removeChild(h));

  let lyrics = "";
  if (lyricsDiv.classList.contains('lyrics'))
    lyrics = lyricsDiv?.innerHTML;
  else {
    lyrics = $$('[class^=Lyrics__Container]', lyricsDiv)
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