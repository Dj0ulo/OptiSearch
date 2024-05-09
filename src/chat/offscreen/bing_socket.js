window.parent.postMessage('socket-script-ready', '*');

window.addEventListener('message', async (event) => {
  window.parent.postMessage({
    message: await handleMessage(event.data.message),
    messageId: event.data.messageId,
  }, '*');
});

async function handleMessage(message) {
  switch (message.action) {
    case 'session':
      const response = await fetch(`https://www.bing.com/turing/conversation/create`, {
        credentials: "include",
      });
      const ret = await response.json();
      if (response.headers.has('X-Sydney-Conversationsignature')) {
        ret['conversationSignature'] = response.headers.get('X-Sydney-Conversationsignature');
      }
      if (response.headers.has('X-Sydney-Encryptedconversationsignature')) {
        ret['sec_access_token'] = response.headers.get('X-Sydney-Encryptedconversationsignature');
      }
      return ret;
    case 'delete':
      return (await fetch('https://sydney.bing.com/sydney/DeleteSingleConversation', {
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${message.conversationSignature}`,
        },
        body: JSON.stringify({
          "conversationId": message.conversationId,
          "participant": {
            "id": message.clientId
          },
          "source": "cib",
          "optionsSets": [
            "autosave"
          ]
        }),
        method: "POST",
        mode: "cors",
      })).json();
    default:
      return handleActionWebsocket(message);
  }
}
