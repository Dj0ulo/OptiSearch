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
    // executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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
        p.on('console', () => p.logs.some((l) => l.text === "Hello !" && resolve()));
      })));

      await Promise.all(pages.map(p => {
        if (p.engineName === "DuckDuckGo")
          return p.goto(`${p.engine.link}/?q=setinterval%20js%20w3schools`);
        if (p.engineName === "Baidu")
          return p.goto(`${p.engine.link}/s?wd=setinterval%20js%20w3schools`);
        return p.goto(`${p.engine.link}/search?q=setinterval%20js%20w3schools`);
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
      p.assertEqual(await el.get("value", p), "setinterval js w3schools");
    }));
    it('Result row', async () => await ap(async p => {
      const els = await p.$$(p.engine.resultRow);
      p.assertOk(els.length > 0, "Failed to parse results row");
    }));
    it('W3Schools panel', async () => await ap(async p => {
      const els = await p.$$(".w3body.optibody");
      p.assertOk(els.length > 0, 'No w3schools panel found');
    }));
  });

  // after(async () => await browser.close());
});



