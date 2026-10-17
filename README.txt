LDM GUI.146 — ONLINE WORKSPACE / PASSWORD ONLY

Visitor: compose artwork freely. Expand LDM / ONLINE ARTWORK / CONNECT, enter the shared remote password, CONNECT, and SUBMIT from INBOX. Visitors never enter a Desktop URL, printer LAN code or administrator password.

ADMIN SETUP — REQUIRED ONCE
Edit online-config.json. Set desktop_url to your real public artwork-gateway HTTPS origin, for example https://your-name.example.com (replace the example). Use no path, query or fragment. Do not use the LAN URL http://192.168.x.x:5426. Do not store passwords, access codes or tokens in this public file.

The address is intentionally blank because no public tunnel address has been supplied. While blank, visitors can compose/save locally, but CONNECT is disabled and the page explains that submissions are not configured.

Your Desktop GUI.146 must have ONLINE ARTWORK enabled with origin https://mrbulp.github.io, remote password protection enabled, and a running HTTPS tunnel to 127.0.0.1:5430 ONLY. The existing Desktop admin permission/approval settings apply after connection. No cloud inbox/storage.

Replace the website files with this package. Keep index.html, online-config.json, .nojekyll and static/ together. Commit and Push origin. Works at /LDM/ and /ldm/. The old ?desktop= parameter and browser-saved endpoint are ignored. Future address changes require editing only online-config.json and publishing it. Desktop GUI.146 remains unchanged.
