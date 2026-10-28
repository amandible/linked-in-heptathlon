// Probe: paste into the DevTools console on any linkedin.com page while logged in.
// Fetches each game page (same as visiting it) and pulls today's edition and solve time
// from the data embedded in the HTML. Prototype for the bookmarklet.
//
// LinkedIn currently serves the games from two different page stacks (seen 2026-10-26):
//   new stack (queens, tango, zip, patches, wend):
//     "gameBoardTimeElapsed" ... "signedLongValue":"$n<milliseconds>", "todaysGameEditionText":"<n>"
//   old stack (crossclimb, mini-sudoku):
//     "entityUrn":"urn:li:fsd_game:(<member>,<gameTypeId>,<edition>)",
//     "gameStoredRecord":{"timeElapsed":<seconds>, ...}
// Unknown yet: what either stack shows for a game that's unplayed or in progress.

const GAMES = ['queens', 'tango', 'zip', 'crossclimb', 'mini-sudoku', 'patches', 'wend'];

async function probe() {
  const results = {};
  for (const slug of GAMES) {
    const html = (await fetch('/games/' + slug + '/', { credentials: 'include' }).then(r => r.text()))
      .replace(/&quot;/g, '"')
      .replace(/\\+"/g, '"');
    const newMs = html.match(/"gameBoardTimeElapsed"\}\}\},"value":\{"\$case":"signedLongValue","signedLongValue":"\$n(\d+)"/);
    const newEdition = html.match(/"todaysGameEditionText":"(\d+)"/);
    const old = html.match(/"entityUrn":"urn:li:fsd_game:\([^,]+,\d+,(\d+)\)","gameStoredRecord":\{"timeElapsed":(\d+)/);
    if (newMs && newEdition) {
      results[slug] = { edition: Number(newEdition[1]), seconds: Number(newMs[1]) / 1000 };
    } else if (old) {
      results[slug] = { edition: Number(old[1]), seconds: Number(old[2]) };
    } else {
      results[slug] = null;
    }
  }
  return results;
}

probe().then(r => console.table(r));
