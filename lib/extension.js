// Builds a player's Chrome extension: a toolbar button that runs the bookmarklet's code
// (lib/bookmarklet.js) on the current tab. Chrome blocks bookmarklets on linkedin.com, but
// extensions are exempt from the page's Content Security Policy. The key is built in.
import { bookmarkletSource } from './bookmarklet.js';

const manifest = {
  manifest_version: 3,
  name: 'Heptathlon',
  version: '1.0',
  description: "Sends today's LinkedIn puzzle times to the heptathlon leaderboard.",
  action: { default_title: "Submit today's heptathlon times" },
  permissions: ['activeTab', 'scripting'],
  background: { service_worker: 'background.js' },
};

const background = `chrome.action.onClicked.addListener(tab => {
  chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['grab.js'] });
});
`;

const readme = ({ name, siteUrl }) => `Heptathlon for Chrome, for ${name}

WHAT IT DOES
When you click its toolbar button on a linkedin.com page, it reads your times for
LinkedIn's seven daily puzzles (in your own browser, using your LinkedIn login) and sends
them to the leaderboard at ${siteUrl}, which then opens. Nothing else is read or sent.

INSTALL (once)
1. Unzip this folder and put it somewhere it can stay; Chrome loads it from there, so
   don't delete or move it afterwards.
2. In Chrome, go to chrome://extensions
3. Turn on "Developer mode" (top right).
4. Click "Load unpacked" and choose this folder.
5. Recommended: pin the button so it's always visible. Click the puzzle-piece icon
   (Extensions) at the right end of Chrome's toolbar, then the pin next to "Heptathlon".
   A Heptathlon button (an "H" icon) then sits in the toolbar next to the address bar.
Chrome may show a reminder about developer-mode extensions; that's expected.

DAILY USE
Finish all seven games, then click the Heptathlon button on any linkedin.com page.
It's in the toolbar if you pinned it; otherwise it's inside the puzzle-piece
(Extensions) menu at the right end of the toolbar.
Games still in progress aren't counted. Clicking again later is harmless: it just
replaces your earlier times.

PRIVACY
This folder contains your personal key, which is your identity on the leaderboard.
Don't share it. If it's lost, ask for a new one.
`;

// Returns { filename: contents } for the extension folder.
export function extensionFiles({ name, key, siteUrl }) {
  return {
    'manifest.json': JSON.stringify(manifest, null, 2) + '\n',
    'background.js': background,
    'grab.js': bookmarkletSource({ key, siteUrl }) + '\n',
    'README.txt': readme({ name, siteUrl }),
  };
}
