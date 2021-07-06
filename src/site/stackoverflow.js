const QUERIES = {
  "acceptedAnswer": ".accepted-answer",
  "answer": ".answer",
  "bodyAnswer": ".js-post-body",
  "editions": ".user-info",
  "time": ".user-action-time",
  "details": ".user-details",
  "title": "#question-header h1",
  "attributeAnswerId": "data-answerid"
}
const msgApi = (link) => {
  return {
  }
}
/**
 * 
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
const getStack = (from, doc) => {
  const body = doc.body;
  // link
  const isPointing = from.link.search('#:~:text');
  if (isPointing !== -1) {
    from.link = from.link.substring(0, isPointing);
  }

  const res = {
    title: doc.querySelector(QUERIES.title).textContent,
  }

  const acceptedAnswer = body.querySelector(QUERIES.acceptedAnswer) || body.querySelector(QUERIES.answer);

  if (!acceptedAnswer) {
    return res;
  }

  res.link = `${from.link}#${acceptedAnswer.getAttribute(QUERIES.attributeAnswerId)}`;

  // body
  const bodyAnswer = acceptedAnswer.querySelector(QUERIES.bodyAnswer);
  Array.from(bodyAnswer.querySelectorAll('.snippet'))
    .forEach(s => {
      if(s.previousElementSibling.outerHTML === "<p></p>")
        s.previousElementSibling.remove();
      if(s.nextElementSibling.outerHTML === "<p></p>")
        s.nextElementSibling.remove();

      s.classList.remove("snippet");
      // s.className = "code-snippet";

      // el("a", {textContent: "Try it Yourself »"}, s);
    })
  res.html = acceptedAnswer.querySelector(QUERIES.bodyAnswer).innerHTML;

  // editions
  const editions = acceptedAnswer.querySelectorAll(QUERIES.editions);
  editions.forEach(e => {
    const time = e.querySelector(QUERIES.time);
    if (time)
      time.style.display = "inline-block";
  });

  let time = editions[editions.length - 1].querySelector(QUERIES.time);
  if (time) {
    time = time.outerHTML;
  }
  let details = editions[editions.length - 1].querySelector(QUERIES.details);
  const a = details.querySelector("a")
  if (a) {
    details = a;
  }
  details.style.display = "inline-block";

  res.author = {
    name: details.outerHTML,
    answered: time
  }

  if (editions.length > 1) {
    let name = editions[0].querySelector(QUERIES.details).querySelector("a");
    res.editor = {
      name: name?.outerHTML ?? res.author.name,
      answered: editions[0].querySelector(QUERIES.time).outerHTML
    }
  }

  return res;
}

function setStack(answer) {
  const body = el("div", { className: 'stackbody' });

  if (!answer.html) {
    body.innerHTML = `No answer on this question. You have the answer ? <a href="${answer.link}#post-form">Submit it !</a>`;
    body.style.margin = '1rem 0px';
    return { body };
  }

  body.innerHTML = answer.html;

  const foot = document.createElement("div");
  foot.className = "stackfoot";
  let foothtml = answer.author.name + (answer.author.answered ? ` – ${answer.author.answered}` : '');
  if (answer.editor) {
    foothtml += "<br>";
    if (answer.editor.name != answer.author.name)
      foothtml += answer.editor.name;
    foothtml += ` – ${answer.editor.answered}`;
  }
  foot.innerHTML = foothtml;

  return { body, foot };
}

Sites.stackoverflow.msgApi = msgApi;
Sites.stackexchange.msgApi = msgApi;
Sites.superuser.msgApi = msgApi;

Sites.stackoverflow.get = getStack;
Sites.stackexchange.get = getStack;
Sites.superuser.get = getStack;

Sites.stackoverflow.set = setStack;
Sites.stackexchange.set = setStack;
Sites.superuser.set = setStack;