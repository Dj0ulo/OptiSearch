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
      const response = await fetch("https://copilot.microsoft.com/c/api/conversations", {
        method: "POST",
        body: null,
        credentials: "include",
      });
      return await response.json();
    case 'delete':
      return await fetch(`https://copilot.microsoft.com/c/api/conversations/${message.conversationId}`, {
        method: "DELETE",
        credentials: "include",
      }).then(r => r.text());
    default:
      return handleActionWebsocket(message);
  }
}
