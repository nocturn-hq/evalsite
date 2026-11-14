# Setup
1. `npm install`  2. copy `.env.example` to `.env` and fill it in  3. `npm start`
Countries: edit `data/countries.txt` (one per line), then run `npm run countries` to rebuild `public/countries.json`.
The account whose Gmail matches ADMIN_EMAIL becomes admin; open /mawira.html (this page used to be admin.html).

Accounts: sign up needs a username (3-20 letters, numbers, underscores), a Gmail, and a strong password (8+ characters with lowercase, uppercase, number and symbol) typed twice. Log in with either the username or the Gmail. There is no device limit.

Tasks: the admin panel has three places to post work. "Add videos" takes many YouTube links at once (one per line, optional `link | title`), with a reward in KES, a description and an optional video length in seconds. "Surveys, apps & banner" posts surveys and app-testing tasks. "Manage tasks" shows how many users finished each one and lets you hide, show or delete it.
Videos play in the order you add them. When a video ends, its reward is added to the user's balance automatically, once per user. The server checks that at least 85% of the video length has passed since play was pressed, so skipping ahead does not pay. Setting the length in seconds makes that check strongest.

## Admin panel (open /mawira.html as an admin)
- Overview: KPIs with week-over-week change, trend chart (logins, signups, tasks, payouts; 7 to 90 days), top countries, top tasks, recent money and admin activity.
- Users: search, filter, sort, paging, bulk ban/unban, CSV export. Click a user for a side drawer: adjust balance (with a reason), admin note, ban, reset password (one-time password), make/remove admin, delete.
- Submissions: read survey/app answers, remove a bad one (optionally take the reward back) so the person can redo it.
- Manage tasks: search, filter, bulk show/hide/delete, edit, reorder videos.
- Add videos (with live link preview), add survey/app tasks.
- Money ledger (every balance change), audit log (every admin action), leaderboard, referrals.
- Settings: banner, payout date, invite reward amounts, pause sign-ups.
- Ctrl/Cmd+K command palette, `/` to search, dark and light theme.


Invites: each friend who joins with a link pays the inviter 80 KES by default. On first start the server sets this to 80 once; after that it can still be changed in the admin panel under Settings. The new member bonus stays at 20 KES.

## Admin password and wallpaper
- The first time you open /mawira.html (logged in as admin) it asks you to create a secret admin password. After that, every visit asks for it. It is kept as a hash, not as plain text, and unlocks the panel for 12 hours or until you close the tab or press Lock panel. Five wrong tries lock it for 15 minutes.
- Change it in Settings, Admin password. Forgot it? Add `RESET_ADMIN_PASSWORD=true` to `.env`, restart once, open /mawira.html and create a new one, then remove that line.
- Settings, Wallpaper picture: upload a picture and it appears behind the landing page hero and on the login page. Remove it to go back to the plain green look. A picture saved there is used before any `public/img/hero.jpg` file.

## Dashboard design (updated)
The dashboard uses `public/dashboard.html` with its own stylesheet `public/css/dashboard.css` (loaded after style.css and extra.css, so no other page changes). The logo is `public/img/logo.png`. The flag in the top bar comes from the country chosen at signup. Videos, surveys and app testing work as before; the three tiles under "Ways to earn" switch between them, and an empty one shows a "currently no ... available" message.
The invite reward comes from Settings in the admin panel (referral bonus). Set it there to change it, for example to 84 KES.

## Speed
- Run `npm install` once after updating (`compression` makes pages and data download smaller).
- Fonts are now served from this site (`public/fonts`), not from Google. Stylesheets and scripts are cached for a year by the browser; the pages add a `?v=` code that changes whenever a file changes, so updates still show at once.
- The admin panel keeps the answers it just loaded for 20 seconds, starts loading the next page while the mouse is over its menu item, and starts its first requests in parallel. Any change you save clears that cache, so you never see stale numbers after an edit.
- Slow whole-collection totals (overview, leaderboard, ledger totals) are worked out once and reused for 1 to 5 minutes. The Refresh button on Overview forces a fresh calculation.
- User search uses lowercase matching so MongoDB can use its indexes. Unfiltered user and ledger counts come from collection metadata (instant).
- Look in the terminal for lines starting with `Slow request:` to see which request is slow.
- Keep your database and server in the same region (in Atlas, pick the region nearest your server and visitors). A server in one continent talking to a database in another adds delay to every query. On free hosting that sleeps, the first visit after a quiet period is slow whatever the code does.

## Storage (keeping MongoDB small)
- MongoDB already compresses data on disk, so savings come from storing less. The server also compresses traffic between itself and Atlas.
- Old login-day rows expire after 100 days, admin audit rows after 180 days, unfinished watch timers after 2 days. The number of login days per person is kept on the user, so nothing visible is lost. The money ledger is never deleted.
- Rows that never change no longer store `updatedAt`; empty-string defaults and duplicate indexes were removed.
- The wallpaper is shrunk in the browser to under about 560 KB (WebP when possible) and stored as raw bytes, not base64 text. An older wallpaper is converted automatically on first start.
- On first start the server runs a one-time clean-up: it drops indexes that are no longer used, builds the new ones, and counts login days from the old rows. Do not stop the server during that first start.

## Security notes
- Set a long random `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. The server refuses to start with the example value. Changing it logs everyone out once.
- Login: 20 tries per 15 minutes per visitor address, and 8 wrong passwords in a row lock that address and account pair for 15 minutes. Sign-up: 10 per hour per address. The whole API: 600 requests per minute per address. If your host puts a proxy in front of the server (Render, Railway and Fly are detected automatically), set `TRUST_PROXY=1` so these limits see the real visitor address.
- Resetting a user's password in the admin panel also logs out every device that user was signed in on.
- Browser protections (a Content-Security-Policy that only allows the YouTube player from other sites, no framing, no content-type guessing) are sent on every page.
- Not done yet: email verification. Anyone can sign up with any Gmail address they type, whether or not they own it. Do this before paying out real money to referrals at scale.
- Always set the video length in seconds when you add videos. Without it the server has to trust the length the player reports, so a cheater could shorten it.

## Support chat
- A round chat button (your chat icon) sits at the bottom right of every page. Logged-out visitors see a welcome and Log in / Create account buttons. Logged-in users get a small window with a welcome message and quick questions; the expand button makes it full screen (Esc shrinks, then closes).
- Admin: open Support chat in the panel menu (a number shows unread messages). On a laptop it is two columns like WhatsApp Web; on a phone you see the list of people and tapping one opens that chat full screen, with a back arrow. Search a username or Gmail to start a chat with someone who has not written yet.
- In a chat: reply to a message (quote), react (love, like, funny, done, great, fast), copy, delete/unsend, typing indicator, sent and read ticks, day dividers. Double-click a message for a quick love; press and hold on a phone, or click the small arrow, for the menu.
- Files: `public/js/chat.js`, `public/css/chat.css`, the admin view in `public/js/admin.js` (V.chats), routes at the end of `server.js` and `ChatMsg` in `models.js`. Messages expire after 60 days. The page checks for news every 2.5 seconds while a chat is open and every 20 seconds (users) or 15 seconds (admin menu number) otherwise. No new packages.
