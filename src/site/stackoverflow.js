const queries = {
  "acceptedAnswer": ".accepted-answer",
  "answer": ".answer",
  "bodyAnswer": ".js-post-body",
  "editions": ".user-info",
  "time": ".user-action-time",
  "details": ".user-details",
  "title": "#question-header h1",
  "attributeAnswerId" : "data-answerid"
}
const msgApi = (link) => {
  return {
  }
}
const getStack = (from, doc) => {
  const body = doc.querySelector('body');
  const acceptedAnswer = body.querySelector(queries.acceptedAnswer) || body.querySelector(queries.answer);

  const editions = acceptedAnswer.querySelectorAll(queries.editions);
  editions.forEach(e => {
    const time = e.querySelector(queries.time);
    if (time)
      time.style.display = "inline-block";
  });

  let time = editions[editions.length - 1].querySelector(queries.time);
  if (time)
    time = time.outerHTML;

  let details = editions[editions.length - 1].querySelector(queries.details);
  const a = details.querySelector("a")
  if(a)
    details = a;
  details.style.display = "inline-block";

  const author = {
    name: details.outerHTML,
    answered: time
  }

  let editor = null;
  if (editions.length > 1) {
    let name = editions[0].querySelector(queries.details).querySelector("a");
    editor = {
      name: name ? name.outerHTML : author.name,
      answered: editions[0].querySelector(queries.time).outerHTML
    }
  }

  return {
    title: doc.querySelector(queries.title).textContent,
    link: `${from.link}#${acceptedAnswer.getAttribute(queries.attributeAnswerId)}`,
    site: from.site,
    html: acceptedAnswer.querySelector(queries.bodyAnswer).innerHTML,
    author: author,
    editor: editor
  }
}

function setStack(answer) {
  const bodyPanel = document.createElement("div");
  bodyPanel.className = "stackbody";
  bodyPanel.innerHTML = answer.html;

  const footPanel = document.createElement("div");
  footPanel.className = "stackfoot";
  let foothtml = answer.author.name + (answer.author.answered ? ` – ${answer.author.answered}` : '');
  if (answer.editor) {
    foothtml += "<br>";
    if (answer.editor.name != answer.author.name)
      foothtml += answer.editor.name;
    foothtml += ` – ${answer.editor.answered}`;
  }
  footPanel.innerHTML = foothtml;

  return {
    body: bodyPanel,
    foot: footPanel
  };
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