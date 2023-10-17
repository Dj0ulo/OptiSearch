(async function () {
  document.body.className = WhichExtension;
  $$('a[data-link]').forEach((a) => {
    const extension = a.getAttribute('data-link');
    a.href = webstores[extension][onChrome() ? 'chrome' : 'firefox'];
  })
  const upgradeButton = document.querySelector(".upgrade-button");
  upgradeButton.addEventListener('click', async () => {
    extpay.openPaymentPage();
    setInterval(window.close, 1000);
  });
})();