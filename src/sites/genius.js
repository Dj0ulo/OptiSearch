Sites.genius.msgApi = () => ({})

/**
 * 
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.genius.get = (from, doc) => {
  const body = doc.querySelector("body");

  console.log(from);
  let lyricsDiv = body.querySelector('.Lyrics__Root-sc-1ynbvzw-0, .Lyrics__Root-sc-1ynbvzw-1, .lyrics');
  console.log(lyricsDiv);
  console.log(body);
  if(!lyricsDiv)
    return;
  Array.from(lyricsDiv?.querySelectorAll('a')).forEach(a => a.outerHTML = a.innerHTML);
  
  let lyrics = "";
  if (lyricsDiv.classList.contains('Lyrics__Root-sc-1ynbvzw-0') || lyricsDiv.classList.contains('Lyrics__Root-sc-1ynbvzw-1')) {
    lyrics = Array.from(lyricsDiv.querySelectorAll('.Lyrics__Container-sc-1ynbvzw-7, .Lyrics__Container-sc-1ynbvzw-8'))
      .map(e => e.innerHTML)
      .join('<br><br>');
    lyrics = `<p>${lyrics}</p>`;
  } else {
    lyrics = lyricsDiv?.innerHTML;
  }

  return {
    title: doc.title.split('|')[0].trim(),
    lyrics,
  }
}

Sites.genius.set = msg => ({
  body: el('div', { className: 'geniusBody', innerHTML: msg.lyrics })
})