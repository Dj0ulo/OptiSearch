(async () => {
  const save = await loadSettings();
  if (WhichExtension === 'optisearch' && !save['chatgpt'])
    return;

  if (typeof BingChatSession !== 'undefined')
    Context.chatSession = new BingChatSession();
  else if (typeof BardSession !== 'undefined')
    Context.chatSession = new BardSession();
  else if (typeof ChatGPTSession !== 'undefined')
    Context.chatSession = new ChatGPTSession();

  if(!Context.chatSession)
    return;
  Context.chatSession.createPanel(save['directchat']);
})();
