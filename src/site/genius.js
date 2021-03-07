Sites.genius.msgApi = () => ({})

Sites.genius.get = (from, doc) => {
  const body = doc.querySelector("body");

  const lyricsDiv = body.querySelector('.Lyrics__Root-sc-1ynbvzw-0');
  Array.from(lyricsDiv?.querySelectorAll('a')).forEach(a => a.outerHTML = a.innerHTML);

  return {
    title: doc.title.split('|')[0].trim(),
    lyrics: lyricsDiv?.innerHTML,
  }
}

Sites.genius.set = msg => ({
  body: el('div',{className: 'geniusBody', innerHTML: msg.lyrics})
})