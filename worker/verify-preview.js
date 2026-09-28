/**
 * ThreatDrill — per-certificate link previews for threatdrill.app/verify
 *
 * GitHub Pages serves verify.html as a static file, so every share of
 * /verify?c=CODE unfurled with the same generic card. This Worker sits in
 * front of that route on Cloudflare: for a request carrying a valid code it
 * looks the certificate up (same public `verify` function the page itself
 * calls) and rewrites the page's <title> and Open Graph / Twitter tags so the
 * card reads "Joseph Rash completed OT/ICS Security Foundations". Everything
 * else — the HTML, the script, the image — is passed through untouched, and
 * any failure falls back to the plain page.
 *
 * Route: threatdrill.app/verify*   (DNS record for threatdrill.app must be
 * proxied — orange cloud — for the route to take effect.)
 */

const VERIFY_ENDPOINT = 'https://xdgffrvdgoncmrbubwvs.supabase.co/functions/v1/verify';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZ2ZmcnZkZ29uY21yYnVid3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDU4OTcsImV4cCI6MjA5ODQyMTg5N30.A-PMBAHh9sYNIetdz3vttx_5AsmxL7gkyVozs0b7UiI';
const CODE_RE = /^[0-9A-F]{10}$/;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const code = (url.searchParams.get('c') || '').trim().toUpperCase();
    const origin = fetch(request); // the static page from GitHub Pages

    if (request.method !== 'GET' || !CODE_RE.test(code)) return origin;

    let cert = null;
    try {
      const r = await fetch(`${VERIFY_ENDPOINT}?c=${code}`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
        cf: { cacheTtl: 300 },
      });
      if (r.ok) {
        const j = await r.json();
        if (j && j.verified) cert = j;
      }
    } catch (e) {
      cert = null;
    }

    const response = await origin;
    if (!cert || !(response.headers.get('content-type') || '').includes('text/html')) return response;

    const who = cert.recipient ? `${cert.recipient} completed ` : 'Verified completion: ';
    const title = `${who}${cert.title} — ThreatDrill`;
    const when = cert.earnedAt
      ? new Date(cert.earnedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const description =
      `Verified ThreatDrill certificate of completion${when ? `, awarded ${when}` : ''}. ` +
      `Cybersecurity training built from live threat intelligence. Course completion, not a professional certification.`;

    const setContent = (value) => ({
      element(el) {
        el.setAttribute('content', value);
      },
    });

    return new HTMLRewriter()
      .on('title', {
        element(el) {
          el.setInnerContent(title);
        },
      })
      .on('meta[property="og:title"]', setContent(title))
      .on('meta[name="twitter:title"]', setContent(title))
      .on('meta[property="og:description"]', setContent(description))
      .on('meta[name="description"]', setContent(description))
      .on('meta[property="og:url"]', setContent(url.toString()))
      .transform(response);
  },
};
