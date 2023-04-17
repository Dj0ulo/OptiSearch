(async () => {
  const chatSessions = [];
  if(typeof BingChatSession !== 'undefined')
    chatSessions.push(new BingChatSession());
  if(typeof ChatGPTSession !== 'undefined')
    chatSessions.push(new ChatGPTSession());
  const save = await loadSettings();
  const directchat = save['directchat'];
  chatSessions.forEach(chatSession => chatSession.createPanel(directchat));
  Context.aichat = (name, switchchat = false) => {
    if(!switchchat)
      chatSessions.slice().reverse().forEach(chatSession => Context.appendPanel(chatSession.panel, true));
      
    chatSessions.forEach(({ panel }) => {
      if(!panel.parentElement)
        return;
      panel.parentElement.style.display = (name !== panel.dataset.chat) ?'none' : '';
    });
  };
})();
