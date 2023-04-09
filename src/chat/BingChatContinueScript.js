(async () => {
  const conv = JSON.parse(document.getElementById('BingChatContinueScript').dataset.conv);
  if (!conv)
    return;
  
  const CIB = await waitFor(window, 'CIB');

  // if this key appear in actionBar, that means Bing Chat is ready to discuss
  await waitFor(CIB.vm.actionBar, '$debounce$handleInputTextChanged');

  const chat = CIB.manager.chat;
  chat.conversation.updateId(conv.conversationId, conversationExpiry(), conv.clientId, conv.conversationSignature);

  const actionBar = CIB.vm.actionBar;
  actionBar.inputText = new URL(window.location.href).searchParams.get('q');
  actionBar.submitInputText();

  function waitFor(obj, key) {
    return new Promise(resolve => {
      if (obj[key])
        resolve(obj[key]);
      else
        setTimeout(() => resolve(waitFor(obj, key)), 250);
    });
  }

  function conversationExpiry() {
    const date = new Date;
    return date.setMinutes(date.getMinutes() + chat.config.sydney.expiryInMinutes), date;
  }
})();
