(async function () {
  const upgradeButton = document.querySelector(".upgrade-button");
  upgradeButton.addEventListener('click', async () => {
    extpay.openPaymentPage();
    setInterval(window.close, 1000);
  });
})();