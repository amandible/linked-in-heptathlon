// Pulls today's edition and solve time out of a LinkedIn game page's HTML.
// LinkedIn serves the games from two page formats; see test/fixtures/README.md.

// Both formats embed JSON inside the HTML, escaped differently (\" or &quot;).
// Turning both back into plain quotes lets one set of patterns match.
function normalize(html) {
  return html.replace(/&quot;/g, '"').replace(/\\+"/g, '"');
}

const NEW_TIME_MS = /"gameBoardTimeElapsed"\}\}\},"value":\{"\$case":"signedLongValue","signedLongValue":"\$n(\d+)"/;
const NEW_EDITION = /"todaysGameEditionText":"(\d+)"/;
const OLD_RECORD = /"entityUrn":"urn:li:fsd_game:\([^,]+,\d+,(\d+)\)","gameStoredRecord":\{"timeElapsed":(\d+)/;

// An unplayed game in the new format still has a time (0) and default completion flags;
// what marks it is that there's no saved game state.
const NEW_UNPLAYED = /"mostRecentGameState":"\$undefined"/;

// Returns { edition, seconds }, or null if the page has no solved result.
// In the old format an unplayed game has "timeElapsed":null, which OLD_RECORD doesn't match.
// In-progress (started, unsolved) games are deliberately not handled: running the
// bookmarklet mid-game is the player's own lookout.
export function extractResult(html) {
  const text = normalize(html);

  const ms = text.match(NEW_TIME_MS);
  const edition = text.match(NEW_EDITION);
  if (ms && edition) {
    if (NEW_UNPLAYED.test(text) || Number(ms[1]) === 0) return null;
    return { edition: Number(edition[1]), seconds: Number(ms[1]) / 1000 };
  }

  const old = text.match(OLD_RECORD);
  if (old) {
    return { edition: Number(old[1]), seconds: Number(old[2]) };
  }

  return null;
}
