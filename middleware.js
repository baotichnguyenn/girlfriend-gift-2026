// Password gate for the Vercel deployment. Vercel runs this before serving any file, so without the password
// nothing of the museum is sent: not the page, not the letters in js/config.js, not the photos.
// The password is the SITE_PASSWORD environment variable in the Vercel project. It is never in the repo.
// Serving the folder locally (python -m http.server) skips this file, so there's no password there.

const COOKIE = 'mou_pass';
const DAYS = 60;

// The cookie holds a hash of the password, never the password. Changing the password signs everyone out.
async function hash(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('museum-of-us:' + text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

const NO_STORE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return gate(503, 'Please key in your password');
  const expected = await hash(password);
  const url = new URL(request.url);

  if (url.pathname === '/unlock' && request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    const attempt = form ? String(form.get('password') || '') : '';
    if (attempt && (await hash(attempt)) === expected) {
      return new Response(null, {
        status: 303,
        headers: { ...NO_STORE, Location: '/', 'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax` }
      });
    }
    return gate(401, 'That’s not it. Try again.');
  }

  if (readCookie(request, COOKIE) === expected) return; // returning nothing lets Vercel serve the file

  const wantsPage = (request.headers.get('accept') || '').includes('text/html');
  return wantsPage ? gate(401) : new Response('Locked', { status: 401, headers: NO_STORE });
}

// The password page, in the museum's own look. Self-contained, because every other file is locked.
function gate(status, message) {
  return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Museum of Us</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Archivo:wght@400;500;600&display=swap">
<style>
:root{
  --ink:#0e0b12; --ink-raise:rgba(21,15,25,.86); --brass:#c9a063; --brass-hi:#e7c88f; --parchment:#efe3cb;
  --mist:#bcb2c4; --hair:rgba(201,160,99,.28); --velvet-hi:#e0889b;
  --f-display:"Bodoni Moda","Didot","Bodoni 72",Georgia,serif; --f-body:"Archivo","Helvetica Neue",Arial,sans-serif;
  color-scheme:dark;
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;display:grid;place-items:center;padding:calc(env(safe-area-inset-top,0px) + 24px) 16px calc(env(safe-area-inset-bottom,0px) + 24px);
  background:radial-gradient(ellipse at 50% 30%,#241a28,var(--ink) 70%);color:var(--parchment);font:400 15px/1.5 var(--f-body);-webkit-font-smoothing:antialiased}
main{width:min(26rem,100%);display:grid;gap:1.1rem}
.eyebrow{margin:0;font:600 .72rem/1.3 var(--f-body);letter-spacing:.2em;text-transform:uppercase;color:var(--brass)}
h1{margin:0;font:400 clamp(2.4rem,9vw,3.4rem)/1.02 var(--f-display);letter-spacing:-.01em}
h1 em{display:block;font-style:italic;color:var(--brass-hi)}
p{margin:0;color:var(--mist);line-height:1.6}
form{display:grid;gap:.7rem;margin-top:.4rem}
label{font:600 .66rem/1 var(--f-body);letter-spacing:.18em;text-transform:uppercase;color:var(--mist)}
input{width:100%;padding:.85rem 1rem;border:0;border-radius:2px;background:var(--ink-raise);color:var(--parchment);font:inherit;font-size:1rem;box-shadow:inset 0 0 0 1px var(--hair)}
input:focus{outline:none;box-shadow:inset 0 0 0 1px var(--brass)}
button{appearance:none;border:0;cursor:pointer;border-radius:2px;padding:.9rem 1.25rem;background:var(--brass);color:var(--ink);font:600 .74rem/1 var(--f-body);letter-spacing:.15em;text-transform:uppercase}
button:hover{background:var(--brass-hi)}
:focus-visible{outline:2px solid var(--brass-hi);outline-offset:3px}
.note{color:var(--velvet-hi)}
</style>
</head>
<body>
<main>
  <p class="eyebrow">A private exhibition · One visitor</p>
  <h1>Museum of Us <em>Open tonight</em></h1>
  <p>Enter the password to step inside.</p>
  <form method="post" action="/unlock">
    <label for="pw">Password</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
    <button type="submit">Step inside</button>
  </form>
  ${message ? `<p class="note" role="alert">${message}</p>` : ''}
</main>
</body>
</html>`, { status, headers: { ...NO_STORE, 'Content-Type': 'text/html; charset=utf-8' } });
}
