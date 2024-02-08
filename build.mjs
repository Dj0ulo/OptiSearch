#!node
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const names = ['optisearch', 'bingchat', 'bard'];

const usage = 
`Usage: node build.mjs [name] [-f] [-b <build_dir>] [-z <output_zip>] [-t]

name: [ ${names.join(' | ')} ]
-f: build for Firefox
-b: copy the files to <build_dir>
-z: create the output zip file to <output_zip>
-t: tidy up build dir`;

const ADDITIONAL_FILES = {
  'optisearch': [],
  'bingchat': ['src/chat/bingchat/*'],
  'bard': [],
}
const ADDITIONAL_FILES_V2 = {
  'optisearch': [],
  'bingchat': ['src/rule_resources/rules.js'],
  'bard': [],
}
const OFFSCREEN_DOC = {
  'optisearch': null,
  'bingchat': 'src/chat/bingchat/firefox_background.html',
  'bard': null,
}
const PERMISSION_V2 = {
  'optisearch': ["https://extensionpay.com/*"],
  'bingchat': ["https://extensionpay.com/*"],
  'bard': ["https://extensionpay.com/*"],
}


let name = '';

(async function main() {
  name = names.find(n => parseArg(n));
  if (!name) {
    errorUsage();
  }
  
  const firefox = parseArg('-f');
  buildManifest(`manifest_${name}.json`, firefox);
  console.log(`${name} manifest for ${firefox ? 'Firefox' : 'Chrome'} created`);

  const mf = readJsonFile('manifest.json');

  if (fs.existsSync('_locales')) {
    fs.rmSync('_locales', { recursive: true });
  }
  if (mf.default_locale){
    makeLocalesDir(`src/_locales.json`)
  }

  const isCopyToBuildDir = parseArg('-b');
  const buildDir = typeof isCopyToBuildDir === 'string' ? isCopyToBuildDir : `build/${name}`;
  const makeZip = parseArg('-z');

  if (isCopyToBuildDir || makeZip) {
    copyToBuildDir(buildDir);
    console.log(`Source copied to "${buildDir}" directory`);
  }

  if (makeZip) {
    const out = typeof makeZip === 'string' ? makeZip : `versions/${name}_${mf.version}${firefox ? '_firefox' : ''}.zip`;
    await zipDir(buildDir, out);
    console.log(`Extension zipped into "${out}"`);
  }

  if (parseArg('-t')) {
    fs.rmSync(buildDir, { recursive: true });
    console.log(`Directory "${buildDir}" cleaned`);
  }

  console.log();
})();


/**
 * Builds the manifest.json file from a manifest file in version 3.
 * This function does not exhaustively copy all possible fields.
 * @param {string} pathManifestV3 Path to the manifest file in version 3.
 * @param {boolean} firefox build for Firefox
 */
function buildManifest(pathManifestV3, firefox = false) {
  if (!firefox) {
    fs.copyFileSync(pathManifestV3, 'manifest.json');
    return;
  }

  const mfv3 = readJsonFile(pathManifestV3);
  const mfv2 = { manifest_version: 2 };
  const fields = ['name', 'version', 'description', 'default_locale', 'author', 'icons',
    'background', 'content_scripts'];

  fields.forEach(f => {
    if (!(f in mfv3))
      return;
    mfv2[f] = mfv3[f];
  });

  if ('action' in mfv3) {
    mfv2['browser_action'] = mfv3['action'];
  }
  if(OFFSCREEN_DOC[name]) {
    mfv2['background'] = { page: OFFSCREEN_DOC[name] };
  } else if ('background' in mfv3) {
    const scripts = parseBackgroundScripts(mfv3['background']['service_worker'])
    mfv2['background'] = { scripts };
  }

  if ('permissions' in mfv3) {
    mfv2['permissions'] = [];
    const permissions = mfv2['permissions'];
    mfv3['permissions'].forEach(p => {
      if (p.startsWith('declarativeNetRequest')) {
        !permissions.includes('webRequest') && permissions.push('webRequest');
        !permissions.includes('webRequestBlocking') && permissions.push('webRequestBlocking');
      } else if (p !== 'offscreen') {
        permissions.push(p);
      }
    });
  }

  if ('host_permissions' in mfv3) {
    mfv2['permissions'] ??= [];
    mfv2['permissions'] = [...mfv2['permissions'], ...mfv3['host_permissions']];
  }
  if (PERMISSION_V2[name]) {
    mfv2['permissions'] = [...mfv2['permissions'], ...PERMISSION_V2[name]];
  }

  if ('web_accessible_resources' in mfv3) {
    mfv2['web_accessible_resources'] = [];
    mfv3['web_accessible_resources'].forEach(war => {
      mfv2['web_accessible_resources'] = [...mfv2['web_accessible_resources'], ...war['resources']];
    });
  }

  // Write the version 2 manifest file
  fs.writeFileSync('manifest.json', JSON.stringify(mfv2, null, 4));
}

/**
 * Parse files from manifest.json and copy them to the build folder.
 * @param {string} buildDir 
 */
function copyToBuildDir(buildDir) {
  const mf = readJsonFile('manifest.json');

  // get content script js and web-accessible resources
  const contentScripts = mf['content_scripts'];
  let scripts = [];
  for (let cs of contentScripts) {
    scripts = scripts.concat(cs['js']);
  }

  let resources = [];
  for (let res of mf['web_accessible_resources']) {
    if (typeof res === 'object') {
      resources = resources.concat(res['resources']);
    } else {
      resources.push(res);
    }
  }

  // add additional files as resources to enable directory
  for (let file of ADDITIONAL_FILES[name]) {
    resources.push(file);
  }
  if (mf.manifest_version === 2) {
    for (let file of ADDITIONAL_FILES_V2[name]) {
      resources.push(file);
    }
  }

  let popupHtml = '';
  if ('action' in mf) {
    popupHtml = mf['action']['default_popup'];
  } else if ('browser_action' in mf) {
    popupHtml = mf['browser_action']['default_popup'];
  }

  let files = [];
  if ('background' in mf) {
    if ('service_worker' in mf['background']) {
      files.push(mf['background']['service_worker']);
      files.push(...parseBackgroundScripts(mf['background']['service_worker']));
    }
    if ('scripts' in mf['background']) {
      files = files.concat(mf['background']['scripts']);
    }
    if ('page' in mf['background']) {
      files.push(mf['background']['page']);
      files.push(...parseBackgroundScripts(mf['background']['page']));
    }
  }

  files = files.concat(scripts);

  if ('declarative_net_request' in mf) {
    for (let r of mf['declarative_net_request']['rule_resources']) {
      files.push(r['path']);
    }
  }

  files = files.concat(Object.values(mf['icons']));

  // loop in resources and add them to files, if one is directory, add all files in it
  for (let resource of resources) {
    if (resource.slice(-1) === '*' && fs.lstatSync(resource.slice(0, -1)).isDirectory()) {
      const dir = resource.slice(0, -1);
      for (let file of fs.readdirSync(dir)) {
        if (fs.lstatSync(path.join(dir, file)).isFile()) {
          files.push(path.join(dir, file));
        }
      }
    } else {
      files.push(resource);
    }
  }
  // get parent dir of popupHtml
  const popupParentDir = path.dirname(popupHtml);

  // add popupParentDir files to files
  for (let file of fs.readdirSync(popupParentDir)) {
    files.push(path.join(popupParentDir, file));
  }

  if (buildDir.slice(-1) !== '/') {
    buildDir += '/';
  }
  // delete all files in src folder
  if (fs.existsSync(buildDir))
    fs.rmSync(buildDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  // copy files to src folder, conserve the folder structure, creates directory based on the path of the file
  fs.copyFileSync('manifest.json', path.join(buildDir, 'manifest.json'));
  if(fs.existsSync('_locales'))
    copyDir('_locales', path.join(buildDir, '_locales'));
  fs.mkdirSync(path.join(buildDir, 'src'));

  for (let file of files) {
    const directory = path.join(buildDir, path.dirname(file));
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    const filename = path.basename(file);
    fs.copyFileSync(file, path.join(directory, filename));
  }
}

function makeLocalesDir(localesFile) {
  fs.mkdirSync('_locales');
  const json = readJsonFile(localesFile);
  const locales = {};
  for (let [key, types] of Object.entries(json)) {
    for (let [lang, value] of Object.entries(types.message ?? types)) {
      locales[lang] ??= {};
      locales[lang][key.replaceAll(/[^\w]/g, '_')] = { 
        message: value,
        ...(types.placeholders ? { placeholders: types.placeholders } : {}),
      };
    }
  }
  Object.entries(locales).forEach(([lang, entries]) => {
    fs.mkdirSync(`_locales/${lang}`);
    const jsonToSave = {};
    for (let [key, value] of Object.entries(entries)) {
      jsonToSave[key] = value;
    }
    fs.writeFileSync(`_locales/${lang}/messages.json`, JSON.stringify(jsonToSave, null, 4));
  })
}

/**
 * Parse all imports from a background loader
 */
function parseBackgroundScripts(backgroundLoaderPath) {
  const backgroundLoader = fs.readFileSync(backgroundLoaderPath, 'utf8');
  const dirBackgroundLoader = path.dirname(backgroundLoaderPath);
  const regexImportFiles = /(?!import|src).*?["'`](.*?)["'`]/g;
  return (backgroundLoader.match(regexImportFiles) ?? [])
    .map(f => `${dirBackgroundLoader}/${f.replace(regexImportFiles, '$1')}`)
    .filter(f => fs.existsSync(f))
}

function readJsonFile(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}


/**
 * Copy a directory recursively
 * @param {string} src 
 * @param {string} dest 
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function zipDir(dir, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const output = fs.createWriteStream(out);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);
  archive.directory(dir, false);
  await archive.finalize();
}

function parseArg(argName) {
  const index = process.argv.indexOf(argName);
  if (index === -1) {
    if (argName.length === 2 && argName[0] === '-') {
      return !!process.argv.find(arg => arg[0] === '-' && arg.includes(argName[1]));
    }
    return false;
  }
  if (process.argv[index][0] === '-' && index < process.argv.length - 1 && process.argv[index + 1][0] !== '-') {
    return process.argv[index + 1];
  }
  return true;
}

function errorUsage() {
  console.log(usage);
  process.exit(1);
}
