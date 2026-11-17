# RouteWise — Telegram bot + Mini App

A booking bot for a small service business. The form opens **inside Telegram**,
not in Chrome or Safari, and the booking comes straight back to the bot.

Everything here is free: Telegram charges nothing, and GitHub Pages hosts the
form for nothing. The only thing you need is a laptop to run `bot.js`, or a free
hosting account so it keeps running when your laptop sleeps.

```
docs/index.html    the Mini App — the booking form customers see
docs/config.js     prices, technicians, areas. The only file you edit per business
bot.js             the bot. No libraries, needs Node 18+
bookings.json      created on the first booking
```

---

## Setup, about 15 minutes

### 1. Make the bot

In Telegram, message **@BotFather**:

1. `/newbot` → give it a name and a username ending in `bot`
2. Copy the **token** it gives you. Treat it like a password.

### 2. Put the form online

The Mini App must be on an `https://` address. GitHub Pages is the easy free one.

1. Make a new **public** GitHub repo and push this folder to it.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch**,
   Branch: `main`, Folder: **`/docs`** → Save.
3. Wait about a minute. Your address is
   `https://YOUR-NAME.github.io/YOUR-REPO/`
4. Open it in a browser. You should see the booking form with a green
   **Continue** button at the bottom. That button only appears outside Telegram,
   which is how you know the fallback works.

### 3. Tell BotFather about the Mini App

Still in @BotFather:

```
/mybots → pick your bot → Bot Settings → Menu Button → Configure Menu Button
```

Paste the same `https://...github.io/...` address.

### 4. Run the bot

```bash
cd routewise-telegram
BOT_TOKEN=123456:ABC... WEBAPP_URL=https://YOUR-NAME.github.io/YOUR-REPO/ node bot.js
```

Now message your bot `/start`. A **📅 Book a slot** button appears at the bottom
of the chat. Tap it and the form slides up inside Telegram.

### 5. Get booking alerts on your own phone

1. Message the bot `/id`. It replies with a number.
2. Put that number in `docs/config.js` → `business.ownerChatId`.
3. Restart the bot.

Every new booking now also pings you, and `/bookings` lists what is coming up.

---

## Setting it up for a real business

Open **`docs/config.js`**. Everything is in there:

| What | Where |
|---|---|
| Business name, PayNow, warranty | `business` |
| Services and prices | `services` — `price(units)` is a function, so charge however you like |
| Technicians, their areas each day | `technicians` → `areaByDay` |
| Nearby radius and discount | `technicians` → `radiusKm`, `discount` |
| Start times, gap between jobs, days ahead | `hours` |

Area names in `areaByDay` must match a `name` in the `sectors` list exactly.

Push the change to GitHub and restart the bot. That is the whole job.

---

## How the pieces fit

```
customer taps "Book a slot"
        ↓
Mini App opens inside Telegram  (docs/index.html)
        ↓  tg.sendData(JSON)
bot receives web_app_data       (bot.js)
        ↓
checks the slot is still free, recalculates the price,
saves to bookings.json, confirms to the customer,
pings the owner
```

Two things worth knowing:

- **A `web_app` button on the reply keyboard is the only kind that can send data
  back to the bot.** Inline buttons and the menu button can open the Mini App but
  cannot `sendData`. That is why `/start` sends that keyboard.
- **The bot recalculates the price.** Never trust a number that came from a phone.

---

## Known limits of this first version

- **The form cannot see existing bookings.** It is a static page with no backend,
  so it offers every time slot. The bot catches clashes when the booking arrives
  and asks the customer to pick again. Fine at a few bookings a day; fix it when
  it starts to annoy people.
- **`bookings.json` is a file, not a database.** Good for one business. Move to a
  real database before you take on several.
- **The bot stops when your laptop sleeps.** For a real pilot, run it on a free
  tier somewhere (Render, Fly.io, Railway) or a cheap VPS.
- **No reminders yet.** The confirmation promises one. Add a scheduled job that
  reads `bookings.json` each evening and messages tomorrow's customers.
- **No AI chat.** The bot answers common questions with simple keyword matching
  in `answer()`. Swapping that for a real AI call is about 20 lines, but the API
  costs money — budget a few dollars a month per business.

## If something does not work

| What you see | Usually means |
|---|---|
| Button does nothing | `WEBAPP_URL` is not `https://`, or Pages has not finished publishing |
| Form opens but is blank | `config.js` did not load — check it sits next to `index.html` |
| Booking never reaches the bot | You opened the Mini App from the menu button, not the **Book a slot** keyboard button |
| `fetch is not defined` | Node is older than 18 |
