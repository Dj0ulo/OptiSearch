Sites.unity.msgApi = (_) => ({});

/**
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.unity.get = (from, doc) => {
    const QUERIES = {
        title: ".question-title",
        answer: ".answer",
        bodyAnswer: ".answer-body",
        author: ".author-info",
        time: ".post-info",
    }

    const body = doc.body;
    // link
    const isPointing = from.link.search('#:~:text');
    if (isPointing !== -1) {
        from.link = from.link.substring(0, isPointing);
    }

    const res = {
        title: doc.querySelector(QUERIES.title).textContent,
    }

    const acceptedAnswer = body.querySelector(QUERIES.answer);

    if (!acceptedAnswer) {
        return res;
    }

    res.link = from.link;

    // body
    const bodyAnswer = acceptedAnswer.querySelector(QUERIES.bodyAnswer);
    bodyAnswer.childNodes.forEach(c => {
        if(c.outerHTML === "<p></p>")
            c.remove();
    })
    res.html = bodyAnswer.innerHTML;

    // author
    res.author = acceptedAnswer.querySelector(QUERIES.author).outerHTML;
    return res;
}

Sites.unity.set = (answer) => {
    const body = el("div", { className: 'stackbody' });

    if (!answer.html) {
        body.innerHTML = `No answer on this question... If you know the answer, <a href="${answer.link}#answer-form">submit it</a>!`;
        body.style.margin = '1rem 0px';
        return { body };
    }

    body.innerHTML = answer.html;

    const foot = document.createElement("div");
    foot.className = "stackfoot";
    const foothtml = answer.author;
    foot.innerHTML = foothtml;

    return { body, foot };
}
