Sites.reddit.refactorLink = (link) => {
  return 'https://corsproxy.io/?' + encodeURIComponent(link.replace("www", "old"));
};

/**
 * @param {*} from
 * @param {Document} doc
 * @returns
 */
Sites.reddit.get = (from, doc) => {
  const selectors = {
    title: "a.title",
    answer: ".comment",
    answerBody: ".usertext-body",
    author: "p.tagline .author",
    time: "p.tagline time",
  };
  const res = {};
  res.link = from.baseLink;
  res.title = $(selectors.title, doc).textContent;

  const acceptedAnswer = $(selectors.answer, doc);
  if (!acceptedAnswer) {
    return res;
  }

  const answerBody = $(selectors.answerBody, acceptedAnswer);

  res.html = answerBody.innerHTML;
  res.author = {
    name: $(selectors.author, acceptedAnswer)?.outerHTML,
    time: $(selectors.time, acceptedAnswer)?.outerHTML,
  }

  return res;
};

Sites.reddit.set = (answer) => {
  const body = el("div", { className: 'stackbody' });

  if (!answer.html) {
    body.innerHTML = `No answer on this question... If you know the answer, <a href="${answer.link}">submit it</a>!`;
    body.style.margin = '1em 0px';
    return { body };
  }

  body.innerHTML = answer.html;

  const foot = document.createElement("div");
  foot.className = "stackfoot";
  let foothtml = answer.author.name + (answer.author.time ? ` – ${answer.author.time}` : '');
  foot.innerHTML = foothtml;

  return { body, foot };
};
