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
- Run `npm install` once after updating (it adds `compression`, which makes pages and data download smaller).
- New database indexes are created automatically the first time the server starts. The first start after the update can be slow for a minute.
- The admin overview is prepared when the server starts and old results are shown instantly while new ones load.
- If the panel is still slow, look at the terminal for lines starting with `Slow request:`. They show which request is slow and how many milliseconds it took.
- Keep your database and your server close to each other. A server on your own computer talking to a database in another continent adds delay to every query. In MongoDB Atlas, pick the region nearest to you and your visitors.
