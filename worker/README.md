# verify-preview Worker

Personalises the link preview for `threatdrill.app/verify?c=CODE` (see the
header comment in `verify-preview.js`). No build step; deploy from the
Cloudflare dashboard.

## Deploy (about 5 minutes, once)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**.
   Name it `verify-preview`, click **Deploy** (it deploys the hello-world stub).
2. Click **Edit code**, replace everything with the contents of
   `verify-preview.js`, click **Deploy**.
3. Back on the Worker's page → **Settings** → **Domains & Routes** → **Add** →
   **Route**: zone `threatdrill.app`, route `threatdrill.app/verify*`. Save.
4. **DNS** → make sure the `threatdrill.app` (and `www`) records are
   **Proxied** (orange cloud). GitHub Pages works behind the proxy with
   SSL/TLS mode **Full**. If they're "DNS only", routes never run.

## Check

```
curl -s "https://threatdrill.app/verify?c=96284674BA" | grep -o '<title>[^<]*'
```
should print `Joseph Rash completed OT/ICS Security Foundations — ThreatDrill`.
Then paste the URL into https://www.linkedin.com/post-inspector/ to refresh
LinkedIn's cached card.

## Update

Edit the file here, then paste it into the Worker's editor and Deploy again.
