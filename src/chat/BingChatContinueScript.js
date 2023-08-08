(async () => {
  const conv = JSON.parse(document.getElementById('BingChatContinueScript').dataset.conv);
  if (!conv)
    return;

  const CIB = await waitFor(window, 'CIB');

  const chat = CIB.manager.chat;
  chat.conversation.updateId(conv.conversationId, conversationExpiry(), conv.clientId, conv.conversationSignature);

  const actionBar = CIB.vm.actionBar;
  actionBar.inputText = conv.inputText;
  actionBar.textInput.value = conv.inputText;
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
