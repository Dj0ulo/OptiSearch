const Author = {
  User: 0,
  Bot: 1,
}

class Message {
  static USER = 0;
  static BOT = 1;
  constructor(author = Author.Bot, text = '') {
    this.author = author;
    this.text = text;
  }
}

class MessageContainer extends Message {
  constructor(author, html) {
    super(author, html);
    this.box = el('div', { className: `box-message-container ${author === Author.User ? 'user' : 'bot'}` });
    this.bubble = el('div', { className: `message-container` }, this.box);
    this.html = html;
  }
  /**
   * @param {string} html
   */
  set html(html) {
    this.text = html;
    this.bubble.innerHTML = html;
    if (this.bubble.children.length === 1 && this.bubble.firstChild.tagName === 'P')
      this.bubble.innerHTML = this.bubble.firstChild.innerHTML;
    prettifyCode(this.bubble);
  }
  get html() {
    return this.text;
  }
  get el() {
    return this.box;
  }
}

class Discussion {
    el = el('div', { className: 'discussion-container' })
    /** @type {MessageContainer[]} */
    messageContainers = []
    isScrolledToBottom = true
    get length() {
      return this.messageContainers.length;
    }
    appendMessage(messageContainer) {
      this.messageContainers.push(messageContainer);
      this.el.appendChild(this.messageContainers.at(-1).el);
      this.el.scrollTop = this.el.scrollHeight;
    }
    setLastMessageHTML(html) {
      this.isScrolledToBottom = Math.abs(this.el.scrollTop + this.el.offsetHeight - this.el.scrollHeight) <= 1;
      if (this.messageContainers.length === 0) {
        this.appendMessage(new MessageContainer(Author.Bot, html));
      } else {
        this.messageContainers.at(-1).html = html;
      }
      if (this.isScrolledToBottom) {
        this.el.scrollTop = this.el.scrollHeight;
      }
    }
    clear() {
      this.el.innerHTML = '';
      this.messageContainers = [];
      this.isScrolledToBottom = true;
    }
}
