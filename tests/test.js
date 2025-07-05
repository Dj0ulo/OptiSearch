const puppeteer = require('puppeteer');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

/** @type {puppeteer.Page} */
let page = null;
let engines = null;

let { ElementHandle, Page } = puppeteer;

/**
 * Set value on a select element
 * @param {string} value
 * @returns {Promise<Undefined>}
 */
ElementHandle.prototype.select = async function (value) {
  await this._page.evaluateHandle((el, value) => {
    const event = new Event("change", { bubbles: true });
    event.simulated = true;
    el.querySelector(`option[value="${value}"]`).selected = true;
    el.dispatchEvent(event);
  }, this, value);
};

/**
 * Check if element is visible in the DOM
 * @returns {Promise<Boolean>}
 **/
ElementHandle.prototype.isVisible = async function () {
  return (await this.boundingBox() !== null);
};

/**
 * Get element attribute
 * @param {string} attr
 * @returns {Promise<String>}
 */
ElementHandle.prototype.get = async function (attr, page) {
  const handle = await page.evaluateHandle((el, attr) => el[attr], this, attr);
  return await handle.jsonValue();
};


Page.prototype.assertEqual = function (actual, expected) {
  assert.equal(actual, expected, `"${this.engineName}": {${actual}==${expected}}`);
}
Page.prototype.assertOk = function (value, message) {
  assert.ok(value, `"${this.engineName}": ${message}`);
}

const EXTENSION_PATH = __dirname+"/..";

const read = (file) => new Promise((resolve, reject) => {
  fs.readFile(path.join(EXTENSION_PATH, file), { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(data);
  });
});



/** @type {puppeteer.Browser} */
let browser = null;

const boot = async () => {
  browser = await puppeteer.launch({
    headless: false, // extension are allowed only in head-full mode
    defaultViewport: null,
    devtools: true,
    // slowMo: true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--enable-automation',
      `--window-size=1920,1080`,
    ]
  });
}

/** @type {puppeteer.Page[]} */
let pages = [];

async function ap(testFun) {
  await Promise.all(pages.map(testFun));
}


// Type of test
describe('OptiPanel', function () {
  this.timeout(2000000); // default is 2 seconds and that may not be enough to boot browsers and pages.
  before(async () => {
    await boot();
    engines = JSON.parse(await read(`./src/engines.json`));
  });

  // Part of the app
  describe('Engines selector', async () => {
    before(async () => {
      pages = await Promise.all(Object.entries(engines).filter(([e, v]) => v.active).map(async ([e, v]) => {
        const p = await browser.newPage();
        p.logs = [];
        p.engine = v;
        p.engineName = e;
        p.on('console', message => {
          const text = message.text();
          if (text.startsWith("%c[OptiSearch]")) {
            p.logs.push({
              type: message.type(),
              text: text.substring("%c[OptiSearch] font-weight: bold; ".length),
            });
          }
        });
        return p;
      }));

      const helloPromises = Promise.all(pages.map(p => new Promise(resolve => {
        p.on('console', () => p.logs.length && resolve());
      })));

      await Promise.all(pages.map(p => {
        if (p.engineName === "DuckDuckGo")
          return p.goto(`${p.engine.link}/?q=setinterval%20js%20stackoverflow`);
        if (p.engineName === "Baidu")
          return p.goto(`${p.engine.link}/s?wd=setinterval%20js%20stackoverflow`);
        return p.goto(`${p.engine.link}/search?q=setinterval%20js%20stackoverflow`);
      }));

      await helloPromises;
    });

    // Functionality
    it('Right Column', async () => await ap(async p => {
      const el = await p.$(p.engine.rightColumn);
      p.assertOk(el);
    }));
    it('Search string', async () => await ap(async p => {
      const el = await p.$(p.engine.searchBox);
      p.assertEqual(await el.get("value", p), "setinterval js stackoverflow");
    }));
    it('Result row', async () => await ap(async p => {
      const els = await p.$$(p.engine.resultRow);
      p.assertOk(els.length > 0, "Failed to parse results row");
    }));
    it('Stackoverflow panel', async () => await ap(async p => {
      const els = await p.$(".stackbody.optibody");
      p.assertOk(els.length > 0, 'No Stackoverflow panel found');
    }));
  });

  // after(async () => await browser.close());
});

describe('Chat tests', function () {
  this.timeout(2000000);
  /** @type {puppeteer.Browser} */
  let browser = null;
  /** @type {puppeteer.Page} */
  let page = null;
  let extensions = {};

  const reloadPage = async () => {
    await page.reload({ waitUntil: 'networkidle2' });
  };

  const switchTo = async (chatName) => {
    await page.click("[optichat].main .ai-selected");
    await page.$$("[optichat].main .ai-dropdown-option");
    await page.click(`[optichat].main .ai-dropdown-option[data-value="${chatName}"]`);
  };

  const checkMainChat = async (chatName) => {
    const mainPanel = await page.waitForSelector(`[optichat="${chatName}"].main`, { timeout: 500 });
    assert.ok(mainPanel, `${chatName} panel should have main class after selection`);

    // Check that the parent has the correct data attribute
    const parentData = await page.evaluate(el => el.parentElement.dataset.optisearchMainChat, mainPanel);
    assert.equal(parentData, chatName, `Parent should have data-optisearch-main-chat="${chatName}"`);
  };

  before(async () => {
    const extensionNames = ['optisearch', 'bard', 'bingchat'];
    const extensionPaths = extensionNames.map(e => path.join(__dirname, '..', 'build', e));

    browser = await puppeteer.launch({
      headless: false, // extension are allowed only in head-full mode
      devtools: true,
      pipe: true,
      enableExtensions: true,
      args: [
        '--enable-automation',
        `--window-size=1920,1080`,
      ]
    });

    const extensionIds = await Promise.all(extensionPaths.map(e => browser.installExtension(e)));
    extensionNames.forEach((e, i) => {
      extensions[e] = {
        path: extensionPaths[i],
        id: extensionIds[i],
      }
    })

    page = await browser.newPage();
    await page.setViewport({ width: 1929, height: 1080 });
    await page.goto('https://duckduckgo.com/?q=setinterval+js&optisearch-test-mode=1', { waitUntil: 'networkidle2' });
  });

  it('should load all 3 extension panels', async () => {
    const optisearchPanel = await page.waitForSelector('.optisearch-box[optichat="chatgpt"]', { timeout: 15000 });
    assert.ok(optisearchPanel, 'Optisearch panel not found');

    const bingchatPanel = await page.waitForSelector('.bingchat-box[optichat="bingchat"]', { timeout: 15000 });
    assert.ok(bingchatPanel, 'Bing Chat panel not found');

    const bardPanel = await page.waitForSelector('.bard-box[optichat="bard"]', { timeout: 15000 });
    assert.ok(bardPanel, 'Bard panel not found');

    await page.click("[optichat].main .ai-selected");

    const dropDownExtensions = await page.$$("[optichat].main .ai-dropdown-option.has-extension");
    assert.equal(dropDownExtensions.length, 3, "Should show that the 3 extensions are installed");

    await page.click(`[optichat].main .ai-dropdown-option[data-value="bingchat"]`);
  });

  it('should exist only one main panel', async () => {
    const panels = await page.$$('[optichat]');
    assert.equal(panels.length, 3, 'There should be exactly 3 [optichat] panels');

    const mainPanels = await page.$$('[optichat].main');
    assert.equal(mainPanels.length, 1, 'There should be exactly one main panel');

    const mainPanel = mainPanels[0];
    const mainChat = await page.evaluate(el => el.parentElement.dataset.optisearchMainChat, mainPanel);
    const optichat = await page.evaluate(el => el.getAttribute('optichat'), mainPanel);

    assert.equal(optichat, mainChat, 'optichat attribute should match parent data-optisearch-main-chat');
  });

  it('should set main class and data-optisearch-main-chat when selecting a panel', async () => {
    await switchTo('bard');
    await checkMainChat('bard');
    await reloadPage();
    await checkMainChat('bard');

    await switchTo('bingchat');
    await checkMainChat('bingchat');
    await reloadPage();
    await checkMainChat('bingchat');
    
    await switchTo('chatgpt');
    await checkMainChat('chatgpt');
    await reloadPage();
    await checkMainChat('chatgpt');
  });

  it('should still have a main panel after uninstalling optisearch and refreshing', async () => {
    await switchTo('chatgpt');
    await checkMainChat('chatgpt');

    await browser.uninstallExtension(extensions.optisearch.id);

    const pages = await browser.pages();
    await new Promise(resolve => setTimeout(resolve, 500));
    const targetPage = pages.find(p => p.url().includes("https://www.optisearch.io/uninstall.html"));
    await targetPage.close();

    // Refresh the page
    await reloadPage();

    // Check that there is still a main panel
    const panels = await page.$$('[optichat]');
    assert.equal(panels.length, 2, 'There should be 2 [optichat] panels after uninstalling optisearch');

    const mainPanels = await page.$$('[optichat].main');
    assert.equal(mainPanels.length, 1, 'There should still be exactly one main panel after uninstalling optisearch');

    const mainPanelOptichat = await page.evaluate(el => el.getAttribute('optichat'), mainPanels[0]);
    assert.ok(['bingchat', 'bard'].includes(mainPanelOptichat), 'Main panel should be one of the remaining extensions');
  });

  describe('Auto-generate', () => {
    it('should have the auto-generate button', async () => {
      const playPauseDiv = await page.$('[optichat].main .right-buttons-container > .play-pause');
      assert.ok(
        playPauseDiv,
        "There should be an auto-generate buttons",
      );
      assert.ok(
        await page.$('[optichat].main .right-buttons-container > .play-pause > svg'),
        "The auto-generate button should contain a svg",
      );
      const title = await page.evaluate(el => el.getAttribute('title'), playPauseDiv);
      assert.equal(title, 'Enable auto-generation', "The play-pause button should have the correct title");
    });

    it('should start when hitting auto generate', async () => {
      await switchTo("bingchat");
      const playPauseDiv = await page.$('[optichat].main .right-buttons-container > .play-pause');
      playPauseDiv.click();
      assert.ok(
        await page.waitForSelector('[optichat].main.asked', { timeout: 10000 }), 
        "It has been asked by clicking on auto-generate"
      );

      await reloadPage();
      assert.ok(
        await page.waitForSelector('[optichat].main.asked', { timeout: 10000 }),
        "It should auto asked even after reload",
      );

      await switchTo("bard");
      assert.ok(
        await page.$('[optichat].main:not(.asked)'),
        "Gemini should not have started",
      );
      await reloadPage();
  
      assert.ok(
        await page.$("[optichat=bingchat]:not(.asked)"),
        "Copilot should not have started because it should disable directchat when switching to another chat"
      );

    });
  });

  after(async () => {
    if (browser) {
      // await browser.close();
    }
  });
});



