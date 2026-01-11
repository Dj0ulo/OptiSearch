(() => {
  Context.initChat = () => {
    if (isOptiSearch && !Context.isActive("chatgpt")) return;

    Context.chatSessions = [];

    if (typeof BardSession !== "undefined") {
      Context.chatSessions.push(new BardSession());
    }
    if (typeof ChatGPTSession !== "undefined") {
      Context.chatSessions.push(new ChatGPTSession());
    }
    if (typeof ClaudeSession !== "undefined") {
      Context.chatSessions.push(new ClaudeSession());
    }
    if (typeof PerplexitySession !== "undefined") {
      Context.chatSessions.push(new PerplexitySession());
    }

    if (!Context.chatSessions.length) {
      return;
    }
    Context.chatSessions
      .forEach((session) => {
        session.createPanel(
          Context.isActive("directchat") &&
            session.name === Context.get("mainChat")
        );
      });
    Context.isChatIncluded = (name) => {
      return Context.chatSessions.find((s) => s.name === name);
    };
  };
})();
