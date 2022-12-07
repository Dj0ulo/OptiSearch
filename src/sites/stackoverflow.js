Sites.stackexchange.msgApi = (_) => ({});

/**
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.stackexchange.get = (from, doc) => {
  const QUERIES = {
    "acceptedAnswerClass": "accepted-answer",
    "answer": ".answer",
    "bodyAnswer": ".js-post-body",
    "editions": ".user-info",
    "time": ".user-action-time",
    "details": ".user-details",
    "title": "#question-header h1",
    "attributeAnswerId": "data-answerid",
    "snippet": ".snippet",
    "voteCount": '.js-vote-count[itemprop="upvoteCount"]',
  }

  const body = doc.body;
  // link
  const isPointing = from.link.search('#:~:text');
  if (isPointing !== -1) {
    from.link = from.link.substring(0, isPointing);
  }

  const title = doc.querySelector(QUERIES.title);
  if (!title)
    return;

  const res = {
    title: title.textContent,
    icon: doc.querySelector(`[rel="shortcut icon"]`).href,
    answers: [],
  }
  const answers = $$(QUERIES.answer, body);
  if (answers.length === 0)
    return res;

  /**
   * 
   * @param {HTMLElement} answer 
   * @returns 
   */
  const parseAnswer = (answer) => {
    const resAns = {};
    resAns.link = `${from.link}#${answer.getAttribute(QUERIES.attributeAnswerId)}`;

    // body
    const bodyAnswer = answer.querySelector(QUERIES.bodyAnswer);
    $$(QUERIES.snippet, bodyAnswer).forEach(s => {
      if (s.previousElementSibling.outerHTML === "<p></p>")
        s.previousElementSibling.remove();
      if (s.nextElementSibling.outerHTML === "<p></p>")
        s.nextElementSibling.remove();

      s.classList.remove("snippet");
      // s.className = "code-snippet";
      // el("a", {textContent: "Try it Yourself »"}, s);
    })
    resAns.html = answer.querySelector(QUERIES.bodyAnswer).innerHTML;

    // editions
    const editions = answer.querySelectorAll(QUERIES.editions);
    editions.forEach(e => {
      const time = e.querySelector(QUERIES.time);
      if (time)
        time.style.display = "inline-block";
    });

    let time = editions[editions.length - 1].querySelector(QUERIES.time);
    if (time) {
      time.textContent.replace("answered", "");
      time = time.outerHTML;
    }
    let details = editions[editions.length - 1].querySelector(QUERIES.details);
    const a = details.querySelector("a")
    if (a) {
      details = a;
    }
    details.style.display = "inline-block";

    resAns.author = {
      name: details.outerHTML,
      answered: time,
    }

    if (editions.length > 1) {
      let name = editions[0].querySelector(QUERIES.details).querySelector("a");
      resAns.editor = {
        name: name?.outerHTML ?? resAns.author.name,
        answered: editions[0].querySelector(QUERIES.time).outerHTML,
      }
    }

    resAns.voteCount = answer.querySelector(QUERIES.voteCount).dataset.value;
    resAns.isAccepted = answer.classList.contains(QUERIES.acceptedAnswerClass);
    return resAns;
  }

  res.answers = answers.map(parseAnswer);
  return res;
}
const ACCEPTED_SVG = `<svg aria-hidden="true" class="svg-icon iconCheckmarkLg" width="36" height="36" viewBox="0 0 36 36"><path d="m6 14 8 8L30 6v8L14 30l-8-8v-8Z"></path></svg>`;
const UPARROW_SVG = `<svg aria-hidden="true" class="svg-icon iconArrowUpLg" width="36" height="36" viewBox="0 0 36 36"><path d="M2 25h32L18 9 2 25Z"></path></svg>`;
const DOWNARROW_SVG = `<svg aria-hidden="true" class="svg-icon iconArrowDownLg" width="36" height="36" viewBox="0 0 36 36"><path d="M2 11h32L18 27 2 11Z"></path></svg>`;

Sites.stackexchange.set = (msg, updatePanel) => {
  console.log(msg);
  const body = el("div", { className: 'stackbody' });
  if (!msg.answers.length === 0) {
    body.innerHTML = `No answer on this question... If you know the answer, <a href="${msg.link}#post-form">submit it</a>!`;
    body.style.margin = '1rem 0px';
    return { body };
  }

  const header = el("div", { className: "stackheader" });
  const foot = el("div", { className: "stackfoot" });

  const voteCount = el("span", { className: "stack-votecount" }, header);
  const voteContainer = el("span", { className: "stack-vote-buttons-container" }, header);
  el("span", { className: "stack-vote-button up", innerHTML: UPARROW_SVG }, voteContainer);
  el("span", { className: "stack-vote-button down", innerHTML: DOWNARROW_SVG }, voteContainer);

  const indexAnswerContainer = el("div", { className: "stack-index-container" }, header);
  const leftArrow = el("span", { className: "left arrowbutton", textContent: "◂" }, indexAnswerContainer);
  const indexAnswer = el("span", { className: "stack-index" }, indexAnswerContainer);
  const rightArrow = el("span", { className: "right arrowbutton", textContent: "▸" }, indexAnswerContainer);

  const accepted = el("span", { className: "stack-accepted", innerHTML: ACCEPTED_SVG }, header).querySelector("svg");

  msg.answers.forEach((a, i) => {
    el("div", { className: "stackanswer", innerHTML: a.html }, body).dataset.index = i;
    el("div", {
      className: "stackanswer",
      innerHTML: `<span>${a.author.name}</span>${(a.author.answered ? " – " + a.author.answered : "")}`
    }, foot).dataset.index = i;
  });

  let n = 0;
  const answersElements = [...$$(`.stackanswer`, body), ...$$(`.stackanswer`, foot)];
  const changeAnswer = (i) => {
    answersElements.forEach(e => {
      if (e.dataset.index == i)
        e.classList.remove("hiddenAnswer");
      else
        e.classList.add("hiddenAnswer");
    });
    indexAnswer.textContent = `${i + 1}/${msg.answers.length}`;
    if (msg.answers[i].isAccepted) {
      accepted.classList.remove("stackhidden");
    } else {
      accepted.classList.add("stackhidden");
    }
    voteCount.textContent = msg.answers[i].voteCount;
  }
  changeAnswer(n);

  leftArrow.onclick = () => { n = (n - 1 + msg.answers.length) % msg.answers.length; changeAnswer(n); };
  rightArrow.onclick = () => { n = (n + 1) % msg.answers.length; changeAnswer(n); };

  return { header, body, foot };
}