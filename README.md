# Chain Tracer

First Of All Inspections The Current GitHub Repo That Built In Another's Lovable Project : - https://github.com/crosx-cosmo/rca-crosx



Then : - UPGRADE REDIRECT CHAIN ANALYZER INTO A UNIVERSAL REDIRECT + URL TRACE ENGINE.



Keep the existing premium UI, branding, Light/Dark mode and all current features.



Make the analyzer capable of tracing as many real-world redirect mechanisms as safely possible:



- HTTP 301/302/303/307/308 Location redirects

- JavaScript redirects: window.location, location.href, location.replace, assign, meta/programmatic navigation

- HTML Meta Refresh

- Client-side/browser navigation

- Multi-hop and mixed redirect chains

- Affiliate/tracking redirects

- Redirect masking / cloaked tracking URLs

- HTTP → HTTPS and HTTPS → HTTP transitions

- Query-parameter additions, removals and modifications

- URL shorteners and tracking domains

- Detect redirect loops, chains, dead ends, timeouts and 4xx/5xx responses

- Detect when a 200 response actually contains a client-side redirect

- Continue tracing after detecting a client-side redirect until the true final destination



ARCHITECTURE:

Use server-side tracing for HTTP requests and a controlled headless-browser fallback for client-side/JavaScript redirects. Do not rely on browser-side fetch/CORS.



Security is mandatory:

- Strict SSRF protection

- Block localhost/private/reserved IP ranges

- Validate every destination before following it

- Limit maximum hops

- Per-hop timeout

- Overall analysis timeout

- Prevent infinite loops

- Do not execute arbitrary user-provided code outside the isolated browser context



Return a unified chain to the existing frontend with:

URL → mechanism → status → destination → timing → headers → detected parameters → final destination.



Clearly label each hop:

HTTP Redirect / JavaScript Redirect / Meta Refresh / Browser Navigation / Final Response.



If a redirect cannot be safely followed, show the exact reason instead of falsely reporting the chain as complete.



Do not fake results. Build the real tracing capability and connect it to the existing analyzer UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/af61ac39-014c-4107-9369-28f94f73eb66).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
