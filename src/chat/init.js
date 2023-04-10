(async () => {
  const chatSessions = [new BingChatSession()];
  if(typeof ChatGPTSession !== 'undefined')
    chatSessions.push(new ChatGPTSession());
  const save = await loadSettings();
  const directchat = save['directchat'];
  chatSessions.forEach(chatSession => chatSession.createPanel(directchat));
  Context.aichat = (name) => {
    if(!$('.optichat'))
      chatSessions.slice().reverse().forEach(chatSession => Context.appendPanel(chatSession.panel, true));
    chatSessions.forEach(({ panel }) => {
      if (name === panel.dataset.chat)
        panel.parentElement.style.display = '';
      else
        panel.parentElement.style.display = 'none';
    });
  };
})();
