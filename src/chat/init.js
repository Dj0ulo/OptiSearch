(() => {
  Context.initChat = () => {
    if (isOptiSearch && !Context.isActive('chatgpt'))
      return;

    Context.chatSession = (() => {
      if (typeof BingChatSession !== 'undefined')
        return new BingChatSession();
      if (typeof BardSession !== 'undefined')
        return new BardSession();
      if (typeof ChatGPTSession !== 'undefined')
        return new ChatGPTSession();
      return null;
    })();

    if (!Context.chatSession)
      return;
    Context.chatSession.createPanel(Context.isActive('directchat'));
  };
})();
