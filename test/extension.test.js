import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { extensionFiles } from '../lib/extension.js';
import { bookmarkletSource } from '../lib/bookmarklet.js';

const options = { name: 'Pat', key: 'k123', siteUrl: 'https://example.test/' };
const files = extensionFiles(options);

test('manifest is MV3 with only activeTab and scripting', () => {
  const manifest = JSON.parse(files['manifest.json']);
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting']);
  assert.equal(manifest.host_permissions, undefined);
  assert.ok(files[manifest.background.service_worker]);
});

test('clicking the button injects grab.js into the clicked tab', () => {
  let listener;
  const injected = [];
  const chrome = {
    action: { onClicked: { addListener: fn => { listener = fn; } } },
    scripting: { executeScript: details => injected.push(details) },
  };
  vm.runInNewContext(files['background.js'], { chrome });
  listener({ id: 42 });
  // Objects made inside the sandbox have its prototypes; compare as plain JSON.
  assert.deepEqual(JSON.parse(JSON.stringify(injected)), [{ target: { tabId: 42 }, files: ['grab.js'] }]);
  assert.ok(files['grab.js']);
});

test('grab.js is the bookmarklet code', () => {
  assert.equal(files['grab.js'], bookmarkletSource(options) + '\n');
});

test('README names the player and site but not the key', () => {
  assert.match(files['README.txt'], /for Pat/);
  assert.match(files['README.txt'], /https:\/\/example\.test\//);
  assert.ok(!files['README.txt'].includes('k123'));
});
