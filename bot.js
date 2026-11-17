#!/usr/bin/env node
/* ============================================================
   RouteWise — Telegram bot
   No libraries. Needs Node 18 or newer.

     BOT_TOKEN=xxx WEBAPP_URL=https://you.github.io/repo/ node bot.js

   Handy:
     node bot.js --whoami     print chat ids as people message you
   ============================================================ */

const fs = require("fs");
const path = require("path");
const C = require("./docs/config.js");

const TOKEN = process.env.BOT_TOKEN || "";
const WEBAPP = (process.env.WEBAPP_URL || "").trim();
const WHOAMI = process.argv.includes("--whoami");
const FILE = path.join(__dirname, "bookings.json");
const API = `https://api.telegram.org/bot${TOKEN}/`;

if (!TOKEN) { console.error("Set BOT_TOKEN first. See README.md"); process.exit(1); }
if (!WEBAPP.startsWith("https://")) {
  console.error("WEBAPP_URL must be a https:// address. Telegram refuses anything else.");
  process.exit(1);
}

/* ---------- tiny helpers ---------- */
const DAYK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; } };
const save = b => fs.writeFileSync(FILE, JSON.stringify(b, null, 2));
const svc = id => C.services.find(s => s.id === id);
const tech = id => C.technicians.find(t => t.id === id);
const hhmm = m => {
  const h = Math.floor(m / 60), x = m % 60, ap = h < 12 ? "AM" : "PM", hh = h % 12 || 12;
  return `${hh}:${String(x).padStart(2, "0")} ${ap}`;
};
const niceDate = iso =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-SG",
    { weekday: "short", day: "numeric", month: "short" });

async function call(method, body) {
  const r = await fetch(API + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!j.ok) console.error(method, "failed:", j.description);
  return j;
}
const send = (chat, text, extra = {}) =>
  call("sendMessage", { chat_id: chat, text, parse_mode: "HTML", ...extra });

/* The reply keyboard. A web_app button here is the ONLY kind that can
   send data back to the bot, which is how the booking reaches us. */
const bookKeyboard = {
  keyboard: [[{ text: "\u{1F4C5} Book a slot", web_app: { url: WEBAPP } }]],
  resize_keyboard: true,
  is_persistent: true
};

/* ---------- what the bot says ---------- */
function priceList() {
  return C.services.map(s => {
    if (!s.perUnit) return `• ${s.label} — S$${s.price(1)}`;
    const ex = [1, 2, 3, 4].map(u => `${u}: S$${s.price(u)}`).join(", ");
    return `• ${s.label} — ${ex}`;
  }).join("\n");
}
function whereThisWeek() {
  return C.technicians.map(t => {
    const days = Object.entries(t.areaByDay)
      .filter(([, a]) => a)
      .map(([d, a]) => `${d[0].toUpperCase() + d.slice(1)} ${a.split(" / ")[0]}`)
      .join(", ");
    return `<b>${t.name}</b>: ${days}`;
  }).join("\n");
}

function answer(text) {
  const t = text.toLowerCase();
  if (/price|cost|how much|rate|\$/.test(t))
    return `Our prices, all in, no transport charge:\n\n${priceList()}\n\nTap <b>Book a slot</b> below and I will show you the times.`;
  if (/open|hour|time|when|close/.test(t))
    return `We work Monday to Saturday, ${hhmm(C.hours.slots[0])} to ${hhmm(C.hours.slots.at(-1) + 60)}. Closed Sunday.\n\nTap <b>Book a slot</b> to see what is free.`;
  if (/where|area|location|cover/.test(t))
    return `We cover all of Singapore. This week:\n\n${whereThisWeek()}\n\nBooking a time when we are already near you is cheaper — tap <b>Book a slot</b>.`;
  if (/pay|paynow|cash|card/.test(t))
    return `PayNow (${C.business.payNow}) or cash after the job. ${C.business.warrantyDays}-day warranty on our work.`;
  if (/leak|water|drip|not cold|cold|spoil|broken|fix/.test(t))
    return `Sorry to hear that. A troubleshooting visit is S$${svc("repair").price(1)}, and we waive it if you go ahead with the repair.\n\nTap <b>Book a slot</b> and pick “Not cold or leaking”.`;
  return `Happy to help. Tap <b>Book a slot</b> below to see our prices and the times we have free.\n\nYou can also ask me about prices, our hours or where we are working this week.`;
}

/* ---------- a booking arrives ---------- */
function clashes(b, all) {
  const gap = C.hours.bufferMin;
  return all.some(x =>
    x.date === b.date && x.tech === b.tech && Math.abs(x.slot - b.slot) < gap);
}

async function onBooking(msg) {
  const chat = msg.chat.id;
  let b;
  try { b = JSON.parse(msg.web_app_data.data); }
  catch { return send(chat, "Something went wrong reading that booking. Please try again."); }

  const s = svc(b.service), t = tech(b.tech);
  if (!s || !t || !/^\d{4}-\d{2}-\d{2}$/.test(b.date || "")) {
    return send(chat, "That booking looked wrong. Please try again.", { reply_markup: bookKeyboard });
  }
  // Price is recalculated here. Never trust a number sent from a phone.
  const units = s.perUnit ? Math.max(1, Math.min(12, parseInt(b.units, 10) || 1)) : 1;
  const base = s.price(units);
  const disc = b.near ? (t.discount || 0) : 0;
  const price = base - disc;

  const all = load();
  if (clashes({ date: b.date, tech: b.tech, slot: b.slot }, all)) {
    return send(chat,
      `Sorry — ${t.name} just got booked for that time. Tap <b>Book a slot</b> and pick another.`,
      { reply_markup: bookKeyboard });
  }

  const rec = {
    id: Date.now().toString(36),
    created: new Date().toISOString(),
    chatId: chat,
    tgUser: msg.from && msg.from.username ? "@" + msg.from.username : "",
    service: b.service, units, date: b.date, slot: b.slot, tech: b.tech,
    near: !!b.near, discount: disc, price,
    name: String(b.name || "").slice(0, 60),
    phone: String(b.phone || "").replace(/\D/g, "").slice(0, 8),
    addr: String(b.addr || "").slice(0, 120),
    postal: String(b.postal || "").slice(0, 6),
    area: String(b.area || "").slice(0, 60),
    optin: !!b.optin,
    status: "booked"
  };
  all.push(rec); save(all);

  const job = s.perUnit ? `${units} unit${units > 1 ? "s" : ""} ${s.label.toLowerCase()}` : s.label;
  const mins = s.mins(units);

  await send(chat,
    `✅ <b>You are booked</b>\n\n` +
    `<b>${niceDate(rec.date)} at ${hhmm(rec.slot)}</b>\n` +
    `${job} · about ${mins < 60 ? mins + " min" : Math.round(mins / 30) / 2 + " hour(s)"}\n` +
    `${t.name} is coming\n` +
    (rec.addr ? `${rec.addr}\n` : "") + `${rec.area} ${rec.postal}\n\n` +
    (disc ? `Nearby discount −S$${disc}\n` : "") +
    `<b>S$${price}</b> on the day — PayNow or cash\n\n` +
    `We will remind you the evening before. Reply here any time to change it.`,
    { reply_markup: bookKeyboard });

  if (C.business.ownerChatId) {
    await send(C.business.ownerChatId,
      `\u{1F514} <b>New booking</b>\n\n` +
      `${niceDate(rec.date)} ${hhmm(rec.slot)} · <b>${t.name}</b>\n` +
      `${rec.name} · +65 ${rec.phone}\n` +
      `${rec.addr || ""} ${rec.area} ${rec.postal}\n` +
      `${job} · S$${price}${disc ? ` (S$${disc} nearby discount)` : ""}` +
      (rec.optin ? `\n\nAgreed to hear about nearby deals.` : ""));
  }
}

/* ---------- owner commands ---------- */
function isOwner(chat) {
  return C.business.ownerChatId && String(chat) === String(C.business.ownerChatId);
}
async function listBookings(chat) {
  const today = new Date().toISOString().slice(0, 10);
  const up = load().filter(b => b.date >= today)
    .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot));
  if (!up.length) return send(chat, "Nothing booked yet.");
  const byDay = {};
  up.forEach(b => (byDay[b.date] = byDay[b.date] || []).push(b));
  const out = Object.entries(byDay).map(([d, list]) =>
    `<b>${niceDate(d)}</b>\n` + list.sort((a, b) => a.slot - b.slot).map(b =>
      `  ${hhmm(b.slot)} ${tech(b.tech).name} · ${b.name} · ${b.area.split(" / ")[0]} · S$${b.price}`
    ).join("\n")).join("\n\n");
  return send(chat, out);
}

/* ---------- the loop ---------- */
async function handle(u) {
  const msg = u.message;
  if (!msg) return;
  const chat = msg.chat.id;

  if (WHOAMI) console.log(`chat id ${chat} — ${msg.from.first_name || ""} ${msg.from.username ? "@" + msg.from.username : ""}`);

  if (msg.web_app_data) return onBooking(msg);

  const text = (msg.text || "").trim();
  if (!text) return;

  if (text === "/start")
    return send(chat,
      `Hello! I am the booking assistant for <b>${C.business.name}</b>.\n\n` +
      `Tap <b>Book a slot</b> below and pick a time. Times when we are already working near you are cheaper.\n\n` +
      `You can also just ask me about prices or our hours.`,
      { reply_markup: bookKeyboard });

  if (text === "/bookings")
    return isOwner(chat) ? listBookings(chat) : send(chat, "That one is for the owner.");

  if (text === "/id") return send(chat, `This chat id is <code>${chat}</code>`);

  return send(chat, answer(text), { reply_markup: bookKeyboard });
}

async function main() {
  await call("setMyCommands", { commands: [
    { command: "start", description: "Start booking" },
    { command: "id", description: "Show this chat id" }
  ]});
  const me = await call("getMe", {});
  console.log(`Running as @${me.result.username}`);
  console.log(`Mini App: ${WEBAPP}`);
  if (!C.business.ownerChatId) console.log("Tip: set ownerChatId in docs/config.js to get booking alerts.");

  let offset = 0;
  for (;;) {
    try {
      const r = await fetch(`${API}getUpdates?timeout=30&offset=${offset}`);
      const j = await r.json();
      if (j.ok) for (const u of j.result) {
        offset = u.update_id + 1;
        try { await handle(u); } catch (e) { console.error("handler:", e.message); }
      }
    } catch (e) {
      console.error("poll:", e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}
main();
