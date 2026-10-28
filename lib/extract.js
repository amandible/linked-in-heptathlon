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

// Returns { edition, seconds }, or null if the page has no recognizable result.
// TODO: unplayed and in-progress games haven't been seen yet; they may need handling here.
export function extractResult(html) {
  const text = normalize(html);

  const ms = text.match(NEW_TIME_MS);
  const edition = text.match(NEW_EDITION);
  if (ms && edition) {
    return { edition: Number(edition[1]), seconds: Number(ms[1]) / 1000 };
  }

  const old = text.match(OLD_RECORD);
  if (old) {
    return { edition: Number(old[1]), seconds: Number(old[2]) };
  }

  return null;
}
