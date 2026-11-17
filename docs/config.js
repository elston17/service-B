/* ============================================================
   RouteWise — business settings
   This one file is read by BOTH the Mini App and the bot.
   Edit this when you set up a new business. Nothing else.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RW_CONFIG = factory();
})(typeof self !== "undefined" ? self : this, function () {
  return {

    business: {
      name: "CoolBreeze Aircon",
      // Chat id of the owner, so new bookings get forwarded to them.
      // Get it by messaging the bot and running:  node bot.js --whoami
      ownerChatId: "",
      payNow: "UEN 53XXXXXXX",
      warrantyDays: 30
    },

    // ---- What they sell -------------------------------------------------
    // price(units) and mins(units) are functions so you can price any way.
    // perUnit: true  -> ask "how many units?"
    // perUnit: false -> a flat visit (e.g. troubleshooting)
    services: [
      { id: "general",  label: "General servicing",  perUnit: true,
        includes: "Filter wash, drainage and gas check",
        price: u => ({1:50, 2:70, 3:85, 4:105})[u] || u * 25,
        mins:  u => u <= 1 ? 30 : u === 2 ? 45 : u === 3 ? 60 : u * 20 },

      { id: "chemwash", label: "Chemical wash",      perUnit: true,
        includes: "Deep clean of the coil, fan and drain pan",
        price: u => u * 80,  mins: u => u * 45 },

      { id: "overhaul", label: "Chemical overhaul",  perUnit: true,
        includes: "Unit taken apart and fully cleaned",
        price: u => u * 160, mins: u => u * 90 },

      { id: "gas",      label: "Gas top-up",         perUnit: true, from: true,
        includes: "Leak check and refill. Final price depends on the unit",
        price: u => u * 80,  mins: u => 30 + u * 10 },

      { id: "repair",   label: "Not cold or leaking", perUnit: false,
        includes: "We find the cause first. Fee waived if you go ahead with the repair",
        price: () => 40,     mins: () => 45 }
    ],

    // ---- Who works, and where they usually are --------------------------
    // areaByDay uses the area names from `sectors` below.
    // null = that person is off that day.
    // radiusKm / discount are the owner's "nearby deal" settings.
    technicians: [
      { id: "r", name: "Rahim", initial: "R", radiusKm: 5, discount: 5,
        bio: "6 years with us",
        areaByDay: { mon:"Jurong", tue:"Tampines / Pasir Ris", wed:"Woodlands",
                     thu:"Bedok / Upper East Coast", fri:"Bukit Batok / Choa Chu Kang",
                     sat:"Bishan / Ang Mo Kio", sun:null } },

      { id: "j", name: "Jun Hao", initial: "J", radiusKm: 5, discount: 5,
        bio: "3 years with us",
        areaByDay: { mon:"Tampines / Pasir Ris", tue:"Jurong", wed:"Bedok / Upper East Coast",
                     thu:"Woodlands", fri:"Bishan / Ang Mo Kio", sat:null, sun:null } }
    ],

    // ---- When they work -------------------------------------------------
    hours: {
      // Start times offered, in minutes from midnight. 540 = 9:00am
      slots: [540, 630, 720, 840, 930, 1020],
      // Minimum gap between two jobs for the same technician, in minutes
      bufferMin: 60,
      // How many days ahead customers can book
      daysAhead: 7,
      closedDays: ["sun"]
    },

    // ---- Singapore postal sectors (first 2 digits of the postal code) ---
    // lat/lng is a rough centre, used to work out who is nearby.
    sectors: [
      { lo: 9,  hi: 11, name: "Tiong Bahru / Bukit Merah",   lat: 1.285, lng: 103.825 },
      { lo: 12, hi: 14, name: "Queenstown / Clementi",        lat: 1.305, lng: 103.785 },
      { lo: 15, hi: 16, name: "Pasir Panjang / Telok Blangah",lat: 1.275, lng: 103.800 },
      { lo: 31, hi: 33, name: "Balestier / Toa Payoh",        lat: 1.330, lng: 103.850 },
      { lo: 34, hi: 37, name: "Macpherson / Potong Pasir",    lat: 1.328, lng: 103.880 },
      { lo: 38, hi: 41, name: "Geylang / Eunos",              lat: 1.318, lng: 103.895 },
      { lo: 42, hi: 45, name: "Katong / Marine Parade",       lat: 1.303, lng: 103.905 },
      { lo: 46, hi: 48, name: "Bedok / Upper East Coast",     lat: 1.324, lng: 103.930 },
      { lo: 49, hi: 50, name: "Loyang / Changi",              lat: 1.365, lng: 103.975 },
      { lo: 51, hi: 52, name: "Tampines / Pasir Ris",         lat: 1.358, lng: 103.950 },
      { lo: 53, hi: 55, name: "Serangoon / Hougang",          lat: 1.365, lng: 103.885 },
      { lo: 56, hi: 57, name: "Bishan / Ang Mo Kio",          lat: 1.360, lng: 103.848 },
      { lo: 58, hi: 59, name: "Upper Bukit Timah",            lat: 1.345, lng: 103.775 },
      { lo: 60, hi: 64, name: "Jurong",                       lat: 1.338, lng: 103.720 },
      { lo: 65, hi: 68, name: "Bukit Batok / Choa Chu Kang",  lat: 1.365, lng: 103.750 },
      { lo: 69, hi: 71, name: "Lim Chu Kang / Tengah",        lat: 1.390, lng: 103.705 },
      { lo: 72, hi: 73, name: "Woodlands",                    lat: 1.437, lng: 103.787 },
      { lo: 75, hi: 76, name: "Yishun / Sembawang",           lat: 1.432, lng: 103.830 },
      { lo: 77, hi: 78, name: "Upper Thomson / Springleaf",   lat: 1.385, lng: 103.825 },
      { lo: 79, hi: 80, name: "Seletar",                      lat: 1.400, lng: 103.870 }
    ]
  };
});
