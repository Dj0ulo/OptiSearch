Sites.stackexchange.msgApi = (_) => ({});
Sites.stackexchange.credentials = "include";

/**
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.stackexchange.get = (from, doc) => {
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

  const body = doc.body;
  // link
  const isPointing = from.link.search('#:~:text');
  if (isPointing !== -1) {
    from.link = from.link.substring(0, isPointing);
  }

  const title = doc.querySelector(QUERIES.title);
  if (!title) {
    if (!body.innerHTML.includes("_cf_chl_opt")) return;

    // this is a Cloudflare challenge page
    return {
        isCloudflareChallenge: true,
        title: _t("Robot check ✓"),
    };
  }

  const res = {
    title: title.textContent,
    icon: doc.querySelector(`[rel="shortcut icon"]`).href
  }

  const acceptedAnswer = body.querySelector(QUERIES.answer); // always answer with most upvotes

  if (!acceptedAnswer) {
    return res;
  }

  res.link = `${from.link}#${acceptedAnswer.getAttribute(QUERIES.attributeAnswerId)}`;

  // body
  const bodyAnswer = acceptedAnswer.querySelector(QUERIES.bodyAnswer);
  Array.from(bodyAnswer.querySelectorAll('.snippet'))
    .forEach(s => {
      if (s.previousElementSibling.outerHTML === "<p></p>")
        s.previousElementSibling.remove();
      if (s.nextElementSibling.outerHTML === "<p></p>")
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

Sites.stackexchange.set = (answer) => {
  const body = el("div", { className: 'stackbody' });

  if (answer.isCloudflareChallenge) {
    body.innerHTML = `
      <p 
        data-i18n="To see answers from $host$ you first need to <a href='$link$'> verify that you are not a robot</a>."
        data-i18n-args="${new URL(answer.link).host},${answer.link}" 
      />
      <p 
        data-i18n="Then <a href='$link$'>refresh this page</a>." 
        data-i18n-args="${window.location.href}" 
      />
    `;
    renderDocText(body);

    $("a", body).addEventListener("click", (e) => {
      e.preventDefault();
      window.open(answer.link, 'newwindow', 'width=800,height=800,focused=true'); 
      return false;
    });
    return { body };
  }

  if (!answer.html) {
    body.innerHTML = `
      <p 
        data-i18n="No answer on this question... If you know the answer, <a href='$link$#post-form'>submit it</a>!"
        data-i18n-args="${answer.link}" 
      />
    `;
    renderDocText(body);
    return { body };
  }

  body.innerHTML = answer.html;

  const foot = document.createElement("div");
  foot.className = "stackfoot";
  let foothtml = answer.author.name + (answer.author.answered ? ` – ${answer.author.answered}` : '');
  foot.innerHTML = foothtml;

  return { body, foot };
}