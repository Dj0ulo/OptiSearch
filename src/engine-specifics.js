(function (){
  Context.processEngine[Google] = () => {
    const udm = parseInt(new URL(window.location.href).searchParams.get("udm") || "0", 10);
    if ( udm == 0 || udm == 14 ) return;

    // We are not on the main Google page
    Context.rightColumn.parentNode.removeChild(Context.rightColumn);
    Context.rightColumn = null;
  };
  
  Context.processEngine[Brave] = () => {
    if (Context.computeIsOnMobile()) {
      // Disable on mobile for the moment as it makes the whole page crash
      Context.appendBoxes = () => {};
    }
    if (!$(".optisearch-start")) {
        Context.rightColumn.prepend(el("div", { className: "optisearch-start" }));
    }
  
    setObserver((mutations) => {
        const removedBoxes = getRemovedNodes(mutations)
          .filter((x) => x.nodeType === Node.ELEMENT_NODE && x.matches(Context.BOX_SELECTOR));
        if (removedBoxes.length) {
          Context.appendBoxes(removedBoxes);
        }
      },
      Context.rightColumn,
      { childList: true }
    );
    setObserver((mutations) => {
        if(!getRemovedNodes(mutations).find((x) => x === Context.rightColumn)) {
          return;
        }
        Context.setupRightColumn();
        Context.appendBoxes(Context.boxes);
      },
      Context.rightColumn.parentElement,
      { childList: true }
    );
    const main = document.body.firstElementChild.querySelector("#main");
    const observer = setObserver(() => {
        if (main !== document.body.firstElementChild.querySelector("#main")) {
          observer.disconnect();
          Context.setupRightColumn();
          Context.appendBoxes(Context.boxes);
        }
      },
      main.parentElement,
      { childList: true }
    );
  };

  /**
   * Special method to deal with Ecosia.
   * Because in Ecosia, the main column can be removed after few seconds and added again.
   * Also Ecosia is the only engine for which the HTML does not change if it is on mobile
   * (only @media CSS instructions make it change).
   * This also means that we have to deal with eventual resizing of the page
   */
  Context.processEngine[Ecosia] = () => {
    const searchNav = $(Context.engine.searchNav);
    setObserver((mutations) => {
        if (getRemovedNodes(mutations).some((n) => n === Context.centerColumn || n === Context.rightColumn)) {
          Context.centerColumn = $(Context.engine.centerColumn);
          Context.setupRightColumn();
          Context.appendBoxes(Context.boxes);
        }

        if (!$(Context.engine.searchNav)) {
          insertAfter(searchNav, $(Context.engine.searchNavNeighbor));
        }
      },
      document.body,
      { childList: true, subtree: true }
    );
  
    if (typeof Context.engine.onMobile !== "number") return;
  
    let wasOnMobile = Context.computeIsOnMobile();
    window.addEventListener("resize", () => {
      const isOnMobile = Context.computeIsOnMobile();
      if (isOnMobile === wasOnMobile) return;
      wasOnMobile = isOnMobile;
      const allBoxes = $$(Context.BOX_SELECTOR);
      allBoxes.forEach((p) => p.classList[isOnMobile ? "add" : "remove"](Context.MOBILE_CLASS));
      Context.appendBoxes(allBoxes);
    });
  };

  Context.processEngine[DuckDuckGo] = () => {
    return new Promise((resolve) => {
      if ($(Context.engine.resultRow)) return resolve();

      setObserver((mutations, observer) => {
          if (!$(Context.engine.resultRow)) return;
          observer.disconnect();
          resolve();
        },
        document.body,
        { childList: true, subtree: true }
      );
    });
  };

  function getRemovedNodes(mutations) {
    const removedNodes = [];
    for(const mutation of mutations) {
      removedNodes.push(...mutation.removedNodes);
    }
    return removedNodes;
  }
})();
