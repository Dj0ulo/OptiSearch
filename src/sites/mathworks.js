Sites.mathworks.msgApi = (_) => ({});

/**
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.mathworks.get = (from, doc) => {
  const QUERIES = {
    answer: ".answer",
    bodyAnswer: ".content",
    editions: ".contribution",
    time: ".answered-date, .answered-edit-date",
    details: ".author_inline",
    title: ".question_title h1",
  };

  const body = doc.body;

  const isPointing = from.link.search('#:~:text');
  if (isPointing !== -1) {
    from.link = from.link.substring(0, isPointing);
  }

  const title = doc.querySelector(QUERIES.title);
  if (!title) return;

  const res = {
    title: title.textContent,
  }

  const answer = body.querySelector(QUERIES.answer); // top answer

  if (!answer) return res;

  res.link = `${from.link}#${answer.id}`;
  const bodyAnswer = answer.querySelector(QUERIES.bodyAnswer);
  [...bodyAnswer.querySelectorAll('div.CodeBlock')].forEach(codeblock => {
    const pre = document.createElement("pre");
    pre.innerHTML = codeblock.innerHTML;
    codeblock.parentNode.replaceChild(pre, codeblock);
  });

  res.html = bodyAnswer.innerHTML;

  // editions
  const editions = [...answer.querySelectorAll(QUERIES.editions)];
  editions.forEach(e => {
    const time = e.querySelector(QUERIES.time);
      time.style.display = "inline-block";
  });

  let time = editions[0].querySelector(QUERIES.time);
  if (time) {
    time = time.outerHTML;
  }
  let details = editions[0].querySelector(QUERIES.details);
  details.style.display = "inline-block";

  res.author = {
    name: details.outerHTML,
    answered: time
  }

  if (editions.length > 1) {
    let name = editions.at(-1).querySelector(QUERIES.details);
    res.editor = {
      name: name?.outerHTML ?? res.author.name,
      answered: editions.at(-1).querySelector(QUERIES.time).outerHTML
    }
  }

  return res;
}

Sites.mathworks.set = (answer) => {
  const body = el("div", { className: 'stackbody' });

  if (!answer.html) {
    body.innerHTML = `No answer on this question... If you know the answer, <a href="${answer.link}&form_type=community">submit it</a>!`;
    body.style.margin = '1em 0px';
    return { body };
  }

  body.innerHTML = answer.html;

  const foot = document.createElement("div");
  foot.className = "stackfoot";
  let foothtml = answer.author.name + (answer.author.answered ? ` – ${answer.author.answered}` : '');
  foot.innerHTML = foothtml;

  return { body, foot };
}