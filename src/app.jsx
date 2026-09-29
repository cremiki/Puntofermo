const { useState, useEffect, useMemo, useRef, useCallback } = React;
const {
  ScanLine, QrCode, Coffee, LogIn, LogOut, Wifi, WifiOff, Lock, Unlock, CalendarDays, Users, Activity,
  Clock, FileText, FileSpreadsheet, Copy, Send, AlertTriangle, CheckCircle2, X, ChevronLeft, ChevronRight,
  Search, Printer, PiggyBank, Wallet, Store, Timer, Volume2, VolumeX, Tablet, LayoutDashboard, BadgeCheck,
  Play, Hourglass, Save, KeyRound, MapPin, Eraser, Bell, Phone, RefreshCw, Delete, Pencil, UserPlus, Mail, Briefcase, Plus,
} = LucideReact;

/* ───────────────────────── utilities ───────────────────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const pad = (n) => String(n).padStart(2, "0");
const hm = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(Math.round(min) % 60)}`;
const fmtH = (h) => (Number.isInteger(h) ? `${h}h` : `${String(h.toFixed(1)).replace(".", ",")}h`);
const fmtDur = (min) => { if (min < 0) return "−" + fmtDur(-min); const m = Math.round(min); const h = Math.floor(m / 60); const r = m % 60; return h ? `${h}h ${pad(r)}'` : `${r}'`; };
const timeOf = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const GIORNI_LUNGHI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

/* ───────────────────────── mock data ───────────────────────── */
// Punti vendita reali (fonte: puntofermo.net). "min" = presidio minimo per aprire il servizio.
const FILIALI = [
  { id: "bs-citta", nome: "Brescia · Città", indirizzo: "Corso Mameli 2", cap: "25122", citta: "Brescia", tel: "030 41424", min: 3, stato: "aperta" },
  { id: "bs-cavour", nome: "Brescia · Corso Cavour", indirizzo: "Corso Cavour 12", cap: "25121", citta: "Brescia", tel: "030 6365346", min: 3, stato: "aperta" },
  { id: "bs-cafe", nome: "Brescia · Café", indirizzo: "Via Dalmazia 111", cap: "25125", citta: "Brescia", tel: "030 220680", min: 2, stato: "aperta" },
  { id: "bs-corfu", nome: "Brescia · Via Corfù", indirizzo: "Via Corfù 88", cap: "25124", citta: "Brescia", tel: "030 224181", min: 2, stato: "aperta" },
  { id: "bs-acqui", nome: "Brescia · Via Divisione Acqui", indirizzo: "Via Divisione Acqui 6", cap: "25100", citta: "Brescia", tel: "030 46779", min: 3, stato: "aperta" },
  { id: "bs-cremona", nome: "Brescia · Via Cremona", indirizzo: "Via Cremona 44", cap: "25131", citta: "Brescia", tel: "030 5055523", min: 3, stato: "aperta" },
  { id: "bs-mella", nome: "Brescia · Via Del Mella", indirizzo: "Via del Mella 70", cap: "25131", citta: "Brescia", tel: "366 6761463", min: 2, stato: "aperta" },
  { id: "bs-crotte", nome: "Brescia · Via Crotte", indirizzo: "Via Ponte Crotte 25/B", cap: "25127", citta: "Brescia", tel: "030 318494", min: 2, stato: "aperta" },
  { id: "gussago", nome: "Gussago", indirizzo: "Via Pianette 53", cap: "25064", citta: "Gussago", tel: "030 2524252", min: 2, stato: "aperta" },
  { id: "concesio", nome: "Concesio", indirizzo: "Via Europa 242/B", cap: "25062", citta: "Concesio", tel: "030 2180285", min: 2, stato: "aperta" },
  { id: "mazzano", nome: "Mazzano", indirizzo: "Via Padana Superiore 72", cap: "25080", citta: "Mazzano", tel: "030 0978439", min: 2, stato: "aperta" },
  { id: "rovato", nome: "Rovato", indirizzo: "Via Toscana 8", cap: "25038", citta: "Rovato", tel: "030 7243038", min: 2, stato: "aperta" },
  { id: "chiari", nome: "Chiari", indirizzo: "Via Brescia 35", cap: "25032", citta: "Chiari", tel: "030 5052508", min: 2, stato: "aperta" },
  { id: "salo", nome: "Salò", indirizzo: "P.zza Vittorio Emanuele II 15", cap: "25087", citta: "Salò", tel: "0365 520792", min: 2, stato: "aperta" },
  { id: "ponte-legno", nome: "Ponte di Legno", indirizzo: "Via XXIV Maggio 15", cap: "25056", citta: "Ponte di Legno", tel: "0364 901073", min: 2, stato: "aperta" },
];
const isOpen = (f) => (f.stato || "aperta") === "aperta";
const STATO_SEDE = {
  aperta: { label: "Aperta", cls: "bg-emerald-100 text-emerald-800" },
  apertura: { label: "In apertura", cls: "bg-sky-100 text-sky-800" },
  chiusa: { label: "Chiusa", cls: "bg-slate-200 text-slate-600" },
};
const filialeNome = (id) => FILIALI.find((f) => f.id === id)?.nome ?? id;

const SHIFTS = {
  P: { code: "P", label: "Pranzo", range: "11:30–15:00", h: 3.5, segs: [[690, 900]], cls: "bg-amber-100 text-amber-900 border-amber-300", dot: "bg-amber-500" },
  PR: { code: "PR", label: "Preparazione", range: "15:00–18:30", h: 3.5, segs: [[900, 1110]], cls: "bg-sky-100 text-sky-900 border-sky-300", dot: "bg-sky-500" },
  C: { code: "C", label: "Cena", range: "18:30–23:30", h: 5, segs: [[1110, 1410]], cls: "bg-rose-100 text-rose-900 border-rose-300", dot: "bg-rose-500" },
  S: { code: "S", label: "Spezzato", range: "11:30–15 · 18:30–23:30", h: 8.5, segs: [[690, 900], [1110, 1410]], cls: "bg-orange-100 text-orange-900 border-orange-300", dot: "bg-orange-500" },
  R: { code: "R", label: "Riposo", range: "giornata libera", h: 0, segs: [], cls: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};
// minimo pranzo / cena per giorno (Lun..Dom)
const REQ_PRANZO = [2, 2, 2, 2, 3, 3, 3];
const REQ_CENA = [2, 2, 2, 3, 3, 3, 3];

const DUOMO = [
  { nome: "Marco", cognome: "Rossi", ruolo: "Piadista", ore: 40, week: ["R", "S", "S", "C", "S", "C", "P"] },
  { nome: "Giulia", cognome: "Verdi", ruolo: "Cassa", ore: 30, week: ["C", "P", "R", "C", "C", "S", "R"] },
  { nome: "Luca", cognome: "Bianchi", ruolo: "Jolly", ore: 40, week: ["S", "R", "C", "S", "S", "P", "S"] },
  { nome: "Sara", cognome: "Colombo", ruolo: "Piadista", ore: 30, week: ["P", "C", "R", "R", "P", "S", "C"] },
  { nome: "Davide", cognome: "Ferrari", ruolo: "Cassa", ore: 20, week: ["R", "R", "C", "C", "R", "C", "C"] },
  { nome: "Elena", cognome: "Ricci", ruolo: "Piadista", ore: 40, week: ["S", "C", "R", "S", "C", "PR", "S"] },
  { nome: "Andrea", cognome: "Galli", ruolo: "Jolly", ore: 20, week: ["PR", "PR", "PR", "R", "P", "P", "R"] },
];
const NOMI = ["Alessandro", "Francesca", "Matteo", "Chiara", "Lorenzo", "Martina", "Simone", "Federica", "Riccardo", "Valentina", "Stefano", "Alessia", "Nicola", "Silvia", "Paolo", "Ilaria", "Giorgio", "Beatrice", "Fabio", "Laura", "Tommaso", "Serena", "Emanuele", "Roberta", "Filippo", "Anna", "Pietro", "Camilla", "Daniele", "Sofia"];
const COGNOMI = ["Russo", "Esposito", "Romano", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi", "Moretti", "Barbieri", "Fontana", "Santoro", "Mariani", "Rinaldi", "Caruso", "Ferrara", "Marchetti", "Leone", "Longo", "Gentile", "Martinelli", "Vitale", "Serra", "Coppola", "De Santis", "Bruno", "Pellegrini", "Grasso"];
const RUOLI = ["Piadista", "Piadista", "Cassa", "Jolly"];
const MONTI = [40, 30, 20, 40, 30];

function generateWeek(ore, rng) {
  const rest = ore >= 40 ? 1 : ore >= 30 ? 2 : 3;
  const days = [0, 1, 2, 3, 4, 5, 6];
  const restDays = [];
  while (restDays.length < rest) { const d = Math.floor(rng() * 5); if (!restDays.includes(d)) restDays.push(d); } // riposi Lun–Ven
  let budget = ore;
  const out = days.map(() => "R");
  const order = days.filter((d) => !restDays.includes(d)).sort(() => rng() - 0.5);
  order.forEach((d, i) => {
    const left = order.length - i - 1;
    const opts = ["S", "C", "P", "PR"].sort(() => rng() - 0.5).sort((a, b) => SHIFTS[b].h - SHIFTS[a].h);
    const pick = opts.find((c) => SHIFTS[c].h + left * 3.5 <= budget) || "R";
    out[d] = pick; budget -= SHIFTS[pick].h;
  });
  return out;
}

function buildEmployees() {
  const list = DUOMO.map((d, i) => ({ id: `PF-${pad(i + 1).padStart(4, "0")}`, ...d, filiale: "bs-citta" }));
  for (let i = 0; i < 73; i++) {
    const n = NOMI[i % 30];
    const c = COGNOMI[(i * 7 + Math.floor(i / 30) * 11 + 3) % 30];
    const ore = MONTI[(i * 3) % 5];
    const rng = mulberry32(hash(n + c + i));
    list.push({ id: `PF-${String(i + 8).padStart(4, "0")}`, nome: n, cognome: c, ruolo: RUOLI[(i * 5 + 1) % 4], ore, filiale: FILIALI[1 + (i % (FILIALI.length - 1))].id, week: generateWeek(ore, rng) });
  }
  list.forEach((e, i) => {
    const r = mulberry32(hash(e.id + "anag"));
    const y = 2016 + Math.floor(r() * 10);
    e.telefono = `+39 3${4 + Math.floor(r() * 5)}${Math.floor(r() * 10)} ${String(1000000 + Math.floor(r() * 8999999)).replace(/(\d{3})(\d{4})$/, "$1 $2")}`;
    e.email = `${e.nome}.${e.cognome}`.toLowerCase().replace(/\s/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@puntofermo.it";
    e.assunzione = `${y}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 27))}`;
    e.contratto = r() < 0.72 ? "Indeterminato" : r() < 0.6 ? "Determinato" : "Apprendistato";
    e.attivo = true;
    e.weekOrig = [...e.week];
  });
  return list;
}
const EMPLOYEES = buildEmployees();
const isActive = (e) => e.attivo !== false;
const empName = (e) => `${e.nome} ${e.cognome}`;
let byId = Object.fromEntries(EMPLOYEES.map((e) => [e.id, e]));

// stato live iniziale (sera, servizio cena in corso)
function initialLive(now) {
  const live = {};
  const events = [];
  const tNow = now.getTime();
  EMPLOYEES.forEach((e) => {
    const r = mulberry32(hash(e.id + "live"));
    const x = r();
    let stato = x < 0.52 ? "turno" : x < 0.64 ? "pausa" : "fuori";
    live[e.id] = { stato };
    if (stato !== "fuori") {
      const inAt = tNow - (40 + Math.floor(r() * 150)) * 60000;
      events.push({ id: `${e.id}-in`, emp: e.id, type: "in", at: inAt });
      if (stato === "pausa") events.push({ id: `${e.id}-p`, emp: e.id, type: "pausa", at: tNow - (3 + Math.floor(r() * 18)) * 60000 });
    } else if (r() < 0.35) {
      const outAt = tNow - (15 + Math.floor(r() * 140)) * 60000;
      events.push({ id: `${e.id}-out`, emp: e.id, type: "out", at: outAt });
    }
  });
  // scenario sede Città
  const duomo = { "PF-0001": "fuori", "PF-0002": "turno", "PF-0003": "pausa", "PF-0004": "turno", "PF-0005": "turno", "PF-0006": "fuori", "PF-0007": "fuori" };
  Object.entries(duomo).forEach(([id, s]) => (live[id] = { stato: s }));
  live["PF-0006"] = { stato: "ritardo", since: tNow - 7 * 60000 };
  // scenario via Cremona: sotto presidio
  const bo = EMPLOYEES.filter((e) => e.filiale === "bs-cremona");
  bo.forEach((e, i) => { live[e.id] = { stato: i === 0 ? "turno" : "fuori" }; });
  if (bo[1]) live[bo[1].id] = { stato: "ritardo", since: tNow - 18 * 60000 };
  if (bo[2]) live[bo[2].id] = { stato: "assente", causale: "Malattia" };
  const pr = EMPLOYEES.filter((e) => e.filiale === "rovato");
  if (pr[0]) live[pr[0].id] = { stato: "ritardo", since: tNow - 12 * 60000 };
  const to = EMPLOYEES.filter((e) => e.filiale === "chiari");
  if (to[1]) live[to[1].id] = { stato: "assente", causale: "Ferie" };
  const rn = EMPLOYEES.filter((e) => e.filiale === "salo");
  if (rn[0]) live[rn[0].id] = { stato: "assente", causale: "Malattia" };
  const clean = events.filter((ev) => ["turno", "pausa"].includes(live[ev.emp].stato) || ev.type === "out");
  // eventi coerenti per la sede Città
  const dEvents = [
    { id: "d1", emp: "PF-0002", type: "in", at: tNow - 76 * 60000 },
    { id: "d2", emp: "PF-0004", type: "in", at: tNow - 74 * 60000 },
    { id: "d3", emp: "PF-0005", type: "in", at: tNow - 71 * 60000 },
    { id: "d4", emp: "PF-0003", type: "in", at: tNow - 612 * 60000 },
    { id: "d5", emp: "PF-0003", type: "pausa", at: tNow - 9 * 60000 },
    { id: "d6", emp: "PF-0007", type: "out", at: tNow - 216 * 60000 },
  ];
  const all = clean.filter((ev) => byId[ev.emp].filiale !== "bs-citta").concat(dEvents).sort((a, b) => b.at - a.at);
  return { live, events: all.slice(0, 60) };
}

/* ───────────────────────── shared UI ───────────────────────── */
function Toasts({ toasts, dismiss }) {
  return (
    <div className="fixed z-[80] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-in pointer-events-auto w-full sm:w-[360px] rounded-xl shadow-lg border px-4 py-3 flex gap-3 items-start bg-white ${t.tone === "error" ? "border-red-300" : t.tone === "warn" ? "border-amber-300" : "border-emerald-300"}`}>
          <span className={`mt-0.5 ${t.tone === "error" ? "text-red-600" : t.tone === "warn" ? "text-amber-600" : "text-emerald-600"}`}>
            {t.tone === "error" || t.tone === "warn" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900">{t.title}</div>
            {t.body && <div className="text-[13px] text-slate-600 mt-0.5">{t.body}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Chiudi notifica"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, children, width = "max-w-md" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl pop-in`}>{children}</div>
    </div>
  );
}

const STATO_META = {
  turno: { label: "In turno", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  pausa: { label: "In pausa", cls: "bg-amber-100 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  fuori: { label: "Fuori servizio", cls: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  ritardo: { label: "In ritardo", cls: "bg-orange-100 text-orange-800 ring-orange-200", dot: "bg-orange-500" },
  assente: { label: "Assente", cls: "bg-red-100 text-red-700 ring-red-200", dot: "bg-red-500" },
};
function StatoPill({ stato }) {
  const m = STATO_META[stato];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${m.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />{m.label}</span>;
}
const EVENT_META = {
  in: { label: "Inizio turno", cls: "bg-emerald-600 text-white", icon: LogIn },
  pausa: { label: "Inizio pausa", cls: "bg-amber-400 text-amber-950", icon: Coffee },
  finepausa: { label: "Fine pausa", cls: "bg-teal-600 text-white", icon: Play },
  out: { label: "Fine turno", cls: "bg-red-600 text-white", icon: LogOut },
};

/* fake-but-plausible QR (deterministic) */
function FakeQR({ value, size = 168 }) {
  const N = 25;
  const rng = mulberry32(hash(value));
  const cells = [];
  const finder = (r, c) => {
    for (const [fr, fc] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
      const y = r - fr, x = c - fc;
      if (y >= -1 && y <= 7 && x >= -1 && x <= 7) {
        if (y < 0 || x < 0 || y > 6 || x > 6) return 0;
        const edge = y === 0 || y === 6 || x === 0 || x === 6;
        const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        return edge || core ? 1 : 0;
      }
    }
    return -1;
  };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let v = finder(r, c);
    if (v === -1) v = r === 6 ? (c % 2 === 0 ? 1 : 0) : c === 6 ? (r % 2 === 0 ? 1 : 0) : rng() < 0.47 ? 1 : 0;
    if (v) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" fill="#111827" />);
  }
  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} width={size} height={size} role="img" aria-label={`Codice QR ${value}`} className="max-w-full">
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#ffffff" />
      {cells}
    </svg>
  );
}

function Logo({ dark, className = "h-8" }) {
  return <img src={window.PF_LOGO} alt="Punto Fermo · Piadineria artigianale" className={`${className} w-auto max-w-full select-none ${dark ? "logo-white" : ""}`} draggable="false" />;
}

/* ───────────────────────── sound ───────────────────────── */
let audioCtx = null;
function chime(kind = "ok") {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === "ok" ? [880, 1318.5] : kind === "warn" ? [440, 330] : [660];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t0 = audioCtx.currentTime + i * 0.14;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      o.connect(g).connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.3);
    });
  } catch (e) { /* audio non disponibile */ }
}

/* ───────────────────────── KIOSK ───────────────────────── */
const COOLDOWN_SCREEN = 5;   // secondi di blocco schermo dopo una timbratura
const COOLDOWN_SAME = 60;    // secondi anti doppia timbratura per lo stesso badge

function Kiosk({ now, live, punch, online, setOnline, queue, kioskBranch, setKioskBranch, toast }) {
  const [phase, setPhase] = useState("idle"); // idle | scanning | identified | done | error | dup
  const [empId, setEmpId] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [cool, setCool] = useState(0);
  const [muted, setMuted] = useState(false);
  const lastPunch = useRef({});
  const idleTimer = useRef(null);

  const staff = EMPLOYEES.filter((e) => e.filiale === kioskBranch && isActive(e));
  const demo = staff.slice(0, 3);
  const emp = empId ? byId[empId] : null;
  const stato = emp ? live[emp.id].stato : null;
  const kState = stato === "ritardo" || stato === "assente" ? "fuori" : stato;

  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool((c) => +(c - 0.1).toFixed(1)), 100); return () => clearTimeout(t); }, [cool]);
  useEffect(() => { if (phase === "done" && cool <= 0) { setPhase("idle"); setEmpId(null); } }, [cool, phase]);
  useEffect(() => {
    clearTimeout(idleTimer.current);
    if (phase === "identified" || phase === "error" || phase === "dup") idleTimer.current = setTimeout(() => { setPhase("idle"); setEmpId(null); }, 15000);
    return () => clearTimeout(idleTimer.current);
  }, [phase]);
  useEffect(() => { setPhase("idle"); setEmpId(null); }, [kioskBranch]);

  const scan = (id) => {
    if (phase === "scanning" || (phase === "done" && cool > 0)) return;
    setPhase("scanning"); setEmpId(id);
    setTimeout(() => {
      if (!id) { setPhase("error"); if (!muted) chime("warn"); return; }
      const last = lastPunch.current[id];
      if (last && (Date.now() - last) / 1000 < COOLDOWN_SAME) { setPhase("dup"); if (!muted) chime("warn"); return; }
      setPhase("identified"); if (!muted) chime("beep");
    }, 850);
  };

  const act = (type) => {
    const res = punch(emp.id, type, "kiosk");
    lastPunch.current[emp.id] = Date.now();
    setLastAction({ type, ...res });
    setPhase("done"); setCool(COOLDOWN_SCREEN);
    if (!muted) chime("ok");
  };

  const secsSince = empId && lastPunch.current[empId] ? Math.max(0, Math.ceil(COOLDOWN_SAME - (Date.now() - lastPunch.current[empId]) / 1000)) : 0;
  const hh = pad(now.getHours()), mm = pad(now.getMinutes()), ss = pad(now.getSeconds());
  const dateLabel = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="kiosk-bg min-h-[calc(100vh-64px)] px-4 py-6 sm:py-10 flex justify-center">
      <div className="w-full max-w-5xl">
        {/* tablet bezel */}
        <div className="rounded-[34px] bg-[#16110d] p-3 sm:p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] ring-1 ring-white/10">
          <div className="rounded-[24px] overflow-hidden bg-[#1f1813] text-amber-50">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-white/10 bg-[#241b15]">
              <div className="flex items-center gap-4 min-w-0">
                <Logo dark />
                <div className="hidden sm:block h-10 w-px bg-white/10" />
                <label className="flex items-center gap-2 min-w-0">
                  <MapPin size={16} className="text-amber-400 shrink-0" />
                  <select id="kiosk-branch" value={kioskBranch} onChange={(e) => setKioskBranch(e.target.value)} className="bg-transparent font-display text-xl uppercase tracking-wide text-white focus:outline-none focus:ring-2 focus:ring-amber-400 rounded cursor-pointer">
                    {FILIALI.filter((f) => f.stato !== "chiusa").map((f) => <option key={f.id} value={f.id} className="text-slate-900">{f.nome}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <div className="font-display text-5xl sm:text-6xl leading-none tabular-nums text-white">{hh}<span className="blink text-amber-400">:</span>{mm}<span className="text-2xl text-amber-200/60 ml-1">{ss}</span></div>
                  <div className="text-xs capitalize text-amber-100/60 mt-1">{dateLabel}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setOnline(!online); }} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${online ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40 hover:bg-emerald-500/25" : "bg-red-500/15 text-red-300 ring-red-400/40 hover:bg-red-500/25"}`} aria-pressed={online}>
                    {online ? <Wifi size={14} /> : <WifiOff size={14} />} {online ? "Online" : `Offline${queue.length ? ` · ${queue.length} in coda` : ""}`}
                  </button>
                  <button onClick={() => setMuted(!muted)} className="flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 ring-white/15 text-amber-100/70 hover:bg-white/5">
                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {muted ? "Audio off" : "Audio on"}
                  </button>
                </div>
              </div>
            </div>

            {!online && (
              <div className="bg-red-600/90 text-white text-sm px-6 py-2 flex items-center gap-2"><WifiOff size={15} /> Connessione assente: le timbrature vengono salvate sul tablet e inviate appena torna la rete.</div>
            )}

            {/* body */}
            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-6 p-5 sm:p-7">
              {/* camera */}
              <div className="flex flex-col gap-4">
                <div className="relative aspect-[4/3] w-full max-w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#2b2119] via-[#1a1410] to-[#0d0a08] ring-1 ring-white/10">
                  <div className="absolute inset-0 cam-noise opacity-40" />
                  <div className="absolute top-3 left-3 flex items-center gap-2 text-[11px] uppercase tracking-widest text-amber-100/70"><span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Fotocamera frontale</div>
                  <div className="absolute top-3 right-3 text-[11px] tabular-nums text-amber-100/50">720p · 30fps</div>
                  {/* viewfinder */}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className={`relative h-[58%] aspect-square ${phase === "identified" || phase === "done" ? "vf-ok" : phase === "error" || phase === "dup" ? "vf-err" : "vf"}`}>
                      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                      {(phase === "idle" || phase === "scanning") && <div className={`scanline ${phase === "scanning" ? "fast" : ""}`} />}
                      <div className="absolute inset-0 grid place-items-center">
                        {phase === "idle" && <QrCode size={64} className="text-amber-100/20" />}
                        {phase === "scanning" && emp && <div className="opacity-80 pop-in"><FakeQR value={emp.id} size={120} /></div>}
                        {phase === "scanning" && !emp && <div className="opacity-60 pop-in"><FakeQR value="XX-UNKNOWN" size={120} /></div>}
                        {(phase === "identified" || phase === "done") && <CheckCircle2 size={72} className="text-emerald-400 pop-in" />}
                        {(phase === "error" || phase === "dup") && <AlertTriangle size={64} className="text-red-400 pop-in" />}
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3 text-center text-sm text-amber-50/80 bg-gradient-to-t from-black/60 to-transparent">
                    {phase === "idle" && "Avvicina il badge QR al riquadro"}
                    {phase === "scanning" && "Lettura in corso…"}
                    {phase === "identified" && "Badge riconosciuto"}
                    {phase === "done" && "Timbratura registrata"}
                    {phase === "error" && "Badge non valido"}
                    {phase === "dup" && "Timbratura già registrata"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-amber-100/50 mb-2">Demo · simula la lettura di un badge</div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {demo.map((e) => {
                      const s = live[e.id].stato;
                      return (
                        <button key={e.id} onClick={() => scan(e.id)} disabled={phase === "scanning" || (phase === "done" && cool > 0)}
                          className="text-left rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-3 py-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                          <div className="flex items-center gap-2 text-sm font-semibold text-white"><ScanLine size={15} className="text-amber-400" /> {empName(e)}</div>
                          <div className="text-xs text-amber-100/60 mt-1 flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${STATO_META[s].dot}`} />{STATO_META[s === "ritardo" ? "fuori" : s].label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {demo.length === 0 && <div className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-amber-100/70">Nessun collaboratore assegnato a questa sede. Aggiungilo da Dashboard Admin → Anagrafica.</div>}
                  <button onClick={() => scan(null)} disabled={phase === "scanning" || (phase === "done" && cool > 0)} className="mt-2 text-xs text-amber-100/50 hover:text-amber-100 underline underline-offset-4 disabled:opacity-40">Simula badge non riconosciuto</button>
                </div>
              </div>

              {/* action panel */}
              <div className="rounded-2xl bg-[#2a2019] ring-1 ring-white/10 p-5 sm:p-6 flex flex-col min-h-[340px]">
                {phase === "idle" && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 fade-in">
                    <div className="h-16 w-16 rounded-full bg-amber-500/15 grid place-items-center"><QrCode size={30} className="text-amber-300" /></div>
                    <div className="font-display text-4xl uppercase text-white leading-none">Buon servizio!</div>
                    <p className="text-amber-100/70 max-w-xs">Inquadra il tuo badge personale per iniziare o chiudere il turno, oppure per la pausa.</p>
                    <div className="grid grid-cols-2 gap-2 w-full mt-2 text-left">
                      {Object.entries({ turno: "In turno", pausa: "In pausa" }).map(([k, l]) => (
                        <div key={k} className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-[11px] uppercase tracking-wider text-amber-100/50">{l} ora</div>
                          <div className="font-display text-3xl text-white tabular-nums">{staff.filter((e) => live[e.id].stato === k).length}<span className="text-base text-amber-100/40"> / {staff.length}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {phase === "scanning" && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 fade-in">
                    <RefreshCw size={34} className="text-amber-300 animate-spin" />
                    <div className="text-amber-100/80">Verifica badge…</div>
                  </div>
                )}
                {phase === "error" && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 fade-in">
                    <AlertTriangle size={44} className="text-red-400" />
                    <div className="font-display text-3xl uppercase text-white">Badge non riconosciuto</div>
                    <p className="text-amber-100/70 max-w-xs">Il codice non appartiene a nessun collaboratore di {filialeNome(kioskBranch)}. Chiedi allo Store Manager di ristampare il badge.</p>
                    <button onClick={() => setPhase("idle")} className="mt-2 rounded-xl px-5 py-3 bg-white/10 hover:bg-white/15 font-semibold">Torna alla scansione</button>
                  </div>
                )}
                {phase === "dup" && emp && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 fade-in">
                    <Hourglass size={44} className="text-amber-300" />
                    <div className="font-display text-3xl uppercase text-white">Hai appena timbrato, {emp.nome}</div>
                    <p className="text-amber-100/70 max-w-xs">Per evitare doppie timbrature puoi timbrare di nuovo tra <b className="text-white tabular-nums">{secsSince}s</b>. L'ultima operazione è già salvata.</p>
                    <button onClick={() => { setPhase("idle"); setEmpId(null); }} className="mt-2 rounded-xl px-5 py-3 bg-white/10 hover:bg-white/15 font-semibold">OK</button>
                  </div>
                )}
                {phase === "identified" && emp && (
                  <div className="flex-1 flex flex-col gap-4 slide-up">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-red-600 grid place-items-center font-display text-2xl text-white">{emp.nome[0]}{emp.cognome[0]}</div>
                      <div>
                        <div className="font-display text-4xl sm:text-5xl uppercase leading-none text-white">Ciao {emp.nome}!</div>
                        <div className="text-sm text-amber-100/70 mt-1">{emp.ruolo} · stato attuale: <b className="text-white">{STATO_META[kState].label}</b></div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-3 justify-center">
                      {kState === "fuori" && (
                        <button onClick={() => act("in")} className="kbtn bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-900/50 min-h-[140px] text-4xl"><LogIn size={40} /> Inizio turno</button>
                      )}
                      {kState === "turno" && (
                        <>
                          <button onClick={() => act("pausa")} className="kbtn bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-amber-900/50 min-h-[104px] text-3xl"><Coffee size={34} /> Inizio pausa</button>
                          <button onClick={() => act("out")} className="kbtn bg-red-600 hover:bg-red-500 text-white shadow-red-950/60 min-h-[104px] text-3xl"><LogOut size={34} /> Fine turno</button>
                        </>
                      )}
                      {kState === "pausa" && (
                        <button onClick={() => act("finepausa")} className="kbtn bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-900/50 min-h-[140px] text-4xl"><Play size={38} /> Fine pausa</button>
                      )}
                    </div>
                    <button onClick={() => { setPhase("idle"); setEmpId(null); }} className="self-center text-sm text-amber-100/60 hover:text-white">Non sono {emp.nome} · annulla</button>
                  </div>
                )}
                {phase === "done" && emp && lastAction && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 pop-in">
                    <div className="h-20 w-20 rounded-full bg-emerald-500 grid place-items-center ring-8 ring-emerald-500/20"><CheckCircle2 size={44} className="text-white" /></div>
                    <div className="font-display text-4xl uppercase text-white leading-none">{EVENT_META[lastAction.type].label}</div>
                    <div className="text-amber-100/80">{empName(emp)} · ore <b className="text-white tabular-nums">{timeOf(now)}</b></div>
                    {lastAction.lateMin > 0 && <div className="text-sm rounded-lg bg-orange-500/20 text-orange-200 px-3 py-1.5">Ingresso registrato con {lastAction.lateMin}' di ritardo</div>}
                    {!online && <div className="text-sm rounded-lg bg-red-500/20 text-red-200 px-3 py-1.5 flex items-center gap-2"><WifiOff size={14} /> Salvata sul tablet, verrà inviata alla sede</div>}
                    <div className="w-full max-w-xs mt-3">
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber-400 transition-[width] duration-100 ease-linear" style={{ width: `${(cool / COOLDOWN_SCREEN) * 100}%` }} /></div>
                      <div className="text-xs text-amber-100/50 mt-1.5 tabular-nums">Schermo pronto tra {Math.ceil(cool)}s</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-amber-100/40 mt-4">Simulazione: la fotocamera è rappresentata da un mirino; usa i pulsanti demo per leggere un badge. Le timbrature compaiono in tempo reale nella Dashboard Admin.</p>
      </div>
    </div>
  );
}

/* ───────────────────────── ADMIN: LIVE OPS ───────────────────────── */
function Kpi({ label, value, icon: Icon, tone, sub }) {
  const tones = {
    green: "text-emerald-700 bg-emerald-50 ring-emerald-200",
    amber: "text-amber-700 bg-amber-50 ring-amber-200",
    orange: "text-orange-700 bg-orange-50 ring-orange-200",
    red: "text-red-700 bg-red-50 ring-red-200",
  };
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold">{label}</div>
        <div className="font-display text-5xl leading-none mt-2 text-slate-900 tabular-nums">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1.5">{sub}</div>}
      </div>
      <div className={`h-10 w-10 rounded-lg grid place-items-center ring-1 ${tones[tone]}`}><Icon size={20} /></div>
    </div>
  );
}

function LiveOps({ now, live, events, online, queue, toast, kioskBranch }) {
  const [branch, setBranch] = useState("all");
  const [dismissed, setDismissed] = useState([]);
  const [feedFilter, setFeedFilter] = useState("all");
  const inScope = (e) => (branch === "all" || e.filiale === branch);
  const staff = EMPLOYEES.filter((e) => inScope(e) && isActive(e));
  const count = (s) => staff.filter((e) => live[e.id].stato === s).length;
  const lateMin = (e) => Math.floor((now.getTime() - live[e.id].since) / 60000);
  const late = staff.filter((e) => live[e.id].stato === "ritardo" && lateMin(e) > 10);
  const lateAll = staff.filter((e) => live[e.id].stato === "ritardo");

  const branches = FILIALI.filter((f) => isOpen(f) && (branch === "all" || f.id === branch)).map((f) => {
    const s = EMPLOYEES.filter((e) => e.filiale === f.id && isActive(e));
    const pres = s.filter((e) => live[e.id].stato === "turno").length;
    return { ...f, staff: s.length, pres, pausa: s.filter((e) => live[e.id].stato === "pausa").length, late: s.filter((e) => live[e.id].stato === "ritardo" && lateMin(e) > 10).length, ass: s.filter((e) => live[e.id].stato === "assente").length };
  });

  const alerts = [];
  branches.forEach((b) => { if (b.pres < b.min) alerts.push({ id: `pres-${b.id}`, tone: "red", title: `${b.nome}: sotto presidio minimo di apertura`, body: `${b.pres} in turno su ${b.min} richiesti per il servizio cena.`, branch: b.nome }); });
  late.forEach((e) => alerts.push({ id: `late-${e.id}`, tone: "orange", title: `${filialeNome(e.filiale)} · Ritardo: +${lateMin(e)} min`, body: `${empName(e)} (${e.ruolo}) non ha ancora timbrato l'ingresso.`, branch: filialeNome(e.filiale) }));
  if (!online && (branch === "all" || branch === kioskBranch)) alerts.push({ id: "offline-kiosk", tone: "slate", title: `${filialeNome(kioskBranch)}: tablet offline`, body: `${queue.length} timbrature in attesa di sincronizzazione. I dati della filiale potrebbero non essere aggiornati.`, branch: filialeNome(kioskBranch) });
  const shownAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  const feed = events.filter((ev) => inScope(byId[ev.emp]) && (feedFilter === "all" || ev.type === feedFilter)).slice(0, 18);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-slate-900 leading-none">Live Ops</h1>
          <p className="text-sm text-slate-500 mt-1.5">Presenze in tempo reale · aggiornato alle {timeOf(now)} · servizio cena</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Store size={16} className="text-slate-500" />
          <select id="liveops-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="sel">
            <option value="all">Tutte le {FILIALI.filter(isOpen).length} sedi aperte</option>
            {FILIALI.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi label="Presenti · in turno" value={count("turno")} icon={Users} tone="green" sub={`su ${staff.length} collaboratori`} />
        <Kpi label="In pausa" value={count("pausa")} icon={Coffee} tone="amber" sub="pausa pasto in corso" />
        <Kpi label="Ritardi > 10 min" value={late.length} icon={Timer} tone="orange" sub={`${lateAll.length - late.length} entro la tolleranza`} />
        <Kpi label="Assenti" value={count("assente")} icon={AlertTriangle} tone="red" sub="malattia · ferie non pianificate" />
      </div>

      {shownAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {shownAlerts.map((a) => (
            <div key={a.id} className={`slide-up flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ring-1 ${a.tone === "red" ? "bg-red-50 ring-red-200" : a.tone === "orange" ? "bg-orange-50 ring-orange-200" : "bg-slate-100 ring-slate-300"}`}>
              <span className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${a.tone === "red" ? "bg-red-600 text-white" : a.tone === "orange" ? "bg-orange-500 text-white" : "bg-slate-700 text-white"}`}>{a.tone === "slate" ? <WifiOff size={18} /> : <AlertTriangle size={18} />}</span>
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold text-slate-900 text-sm">{a.title}</div>
                <div className="text-[13px] text-slate-600">{a.body}</div>
              </div>
              <button onClick={() => toast({ title: `Chiamata avviata verso ${a.branch}`, body: "Lo Store Manager riceve anche una notifica push." })} className="btn-ghost"><Phone size={15} /> Contatta filiale</button>
              <button onClick={() => setDismissed((d) => [...d, a.id])} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Archivia avviso"><X size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="grid xl:grid-cols-[1.1fr_1fr] gap-6">
        <section className="rounded-xl bg-white ring-1 ring-slate-200 min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Store size={16} className="text-orange-600" /> Stato filiali</h2>
            <span className="text-xs text-slate-500">presidio min. per la cena</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="px-4 py-2 font-semibold">Filiale</th><th className="px-2 py-2 font-semibold">Presidio</th><th className="px-2 py-2 font-semibold text-center">Pausa</th><th className="px-2 py-2 font-semibold text-center">Ritardi</th><th className="px-2 py-2 font-semibold text-center">Assenti</th></tr></thead>
              <tbody>
                {branches.map((b) => {
                  const ok = b.pres >= b.min;
                  return (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap"><span className={`inline-block h-2 w-2 rounded-full mr-2 ${ok ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />{b.nome}{b.id === kioskBranch && !online && <WifiOff size={13} className="inline ml-1.5 text-slate-400" />}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, (b.pres / Math.max(b.min, 1)) * 100)}%` }} /></div>
                          <span className={`tabular-nums text-xs font-semibold ${ok ? "text-slate-700" : "text-red-600"}`}>{b.pres}/{b.min}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-slate-600">{b.pausa}</td>
                      <td className={`px-2 py-2.5 text-center tabular-nums ${b.late ? "text-orange-600 font-semibold" : "text-slate-400"}`}>{b.late}</td>
                      <td className={`px-2 py-2.5 text-center tabular-nums ${b.ass ? "text-red-600 font-semibold" : "text-slate-400"}`}>{b.ass}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-white ring-1 ring-slate-200 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Activity size={16} className="text-orange-600" /> Feed timbrature <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span></h2>
            <div className="flex gap-1 text-xs">
              {[["all", "Tutte"], ["in", "Ingressi"], ["pausa", "Pause"], ["out", "Uscite"]].map(([k, l]) => (
                <button key={k} onClick={() => setFeedFilter(k)} className={`px-2.5 py-1 rounded-full ${feedFilter === k ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{l}</button>
              ))}
            </div>
          </div>
          <ol className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {feed.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">Nessuna timbratura per questo filtro.</li>}
            {feed.map((ev) => {
              const e = byId[ev.emp]; const m = EVENT_META[ev.type]; const Ico = m.icon;
              return (
                <li key={ev.id} className={`px-4 py-2.5 flex items-center gap-3 ${ev.fresh ? "flash" : ""}`}>
                  <span className="font-mono text-xs tabular-nums text-slate-500 w-11 shrink-0">{timeOf(new Date(ev.at))}</span>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold shrink-0 ${m.cls}`}><Ico size={12} />{m.label}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-800 truncate">{empName(e)} <span className="text-slate-400">· {e.ruolo}</span></div>
                    <div className="text-xs text-slate-500 truncate">{filialeNome(e.filiale)}{ev.lateMin > 0 && <span className="text-orange-600 font-medium"> · ritardo +{ev.lateMin}'</span>}{ev.synced && <span className="text-slate-400"> · inviata da coda offline</span>}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── ADMIN: PIANIFICAZIONE ───────────────────────── */
function weekRange(offset) {
  const monday = new Date(2026, 8, 28 + offset * 7);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const f = (d) => d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  const isoWeek = 40 + offset;
  return { label: `Settimana ${isoWeek} · ${f(monday)} – ${f(sunday)} ${sunday.getFullYear()}`, days: GIORNI.map((g, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return `${g} ${d.getDate()}`; }) };
}
function seedPlan(branchId, offset) {
  const staff = EMPLOYEES.filter((e) => e.filiale === branchId);
  const plan = {};
  staff.forEach((e) => {
    if (offset === 0) plan[e.id] = [...e.week];
    else if (offset === -1) plan[e.id] = branchId === "bs-citta" ? { "PF-0001": ["S", "S", "R", "C", "S", "C", "P"], "PF-0002": ["C", "P", "R", "C", "S", "S", "R"], "PF-0003": ["S", "R", "C", "S", "C", "P", "S"], "PF-0004": ["P", "C", "P", "R", "P", "S", "C"], "PF-0005": ["R", "R", "C", "C", "R", "C", "C"], "PF-0006": ["S", "C", "R", "S", "C", "PR", "S"], "PF-0007": ["PR", "PR", "P", "R", "P", "P", "R"] }[e.id] : generateWeek(e.ore, mulberry32(hash(e.id + "prev")));
    else plan[e.id] = Array(7).fill(null);
  });
  return plan;
}

function Planning({ toast, plans, setPlans, published, setPublished }) {
  const [branch, setBranch] = useState("bs-citta");
  const [offset, setOffset] = useState(0);
  const [active, setActive] = useState("P");
  const [dragOver, setDragOver] = useState(null);
  const key = `${branch}|${offset}`;
  const plan = plans[key] || seedPlan(branch, offset);
  const staff = EMPLOYEES.filter((e) => e.filiale === branch && isActive(e));
  const wr = weekRange(offset);
  const status = published[key];

  const setCell = (empId, day, code) => {
    setPlans((p) => { const cur = p[key] || seedPlan(branch, offset); return { ...p, [key]: { ...cur, [empId]: (cur[empId] || (offset === 0 ? [...byId[empId].week] : Array(7).fill(null))).map((c, i) => (i === day ? code : c)) } }; });
    setPublished((s) => ({ ...s, [key]: "bozza" }));
  };
  const rowOf = (id) => plan[id] || (offset === 0 ? byId[id].week : Array(7).fill(null));
  const hoursOf = (id) => rowOf(id).reduce((s, c) => s + (c ? SHIFTS[c].h : 0), 0);
  const coverage = GIORNI.map((_, d) => {
    let pr = 0, ce = 0;
    staff.forEach((e) => { const c = rowOf(e.id)[d]; if (c === "P" || c === "S") pr++; if (c === "C" || c === "S") ce++; });
    return { pr, ce };
  });
  const over = staff.filter((e) => hoursOf(e.id) > e.ore);
  const gaps = coverage.filter((c, d) => c.pr < REQ_PRANZO[d] || c.ce < REQ_CENA[d]).length;

  const duplicate = () => {
    const prevKey = `${branch}|${offset - 1}`;
    const prev = plans[prevKey] || seedPlan(branch, offset - 1);
    const hasData = Object.values(prev).some((w) => w.some(Boolean));
    if (!hasData) { toast({ tone: "warn", title: "Settimana precedente vuota", body: "Non ci sono turni da copiare. Pianifica prima la settimana precedente." }); return; }
    setPlans((p) => ({ ...p, [key]: JSON.parse(JSON.stringify(prev)) }));
    setPublished((s) => ({ ...s, [key]: "bozza" }));
    toast({ title: "Settimana duplicata", body: `Copiati i turni di ${staff.length} collaboratori dalla settimana ${39 + offset}.` });
  };
  const publish = () => {
    setPlans((p) => ({ ...p, [key]: plan }));
    setPublished((s) => ({ ...s, [key]: "pubblicato" }));
    if (over.length || gaps) toast({ tone: "warn", title: "Turni pubblicati con avvisi", body: `${over.length ? `${over.length} dipendente oltre monte ore` : ""}${over.length && gaps ? " · " : ""}${gaps ? `${gaps} giorni sottocoperti` : ""}. ${staff.length} collaboratori notificati.` });
    else toast({ title: "Turni pubblicati", body: `${staff.length} collaboratori di ${filialeNome(branch)} hanno ricevuto la notifica.` });
  };

  const templates = ["P", "PR", "C", "S", "R"];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-slate-900 leading-none">Pianificazione turni</h1>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => setOffset(offset - 1)} className="icon-btn" aria-label="Settimana precedente"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-slate-700 tabular-nums">{wr.label}</span>
            <button onClick={() => setOffset(offset + 1)} className="icon-btn" aria-label="Settimana successiva"><ChevronRight size={16} /></button>
            <span className={`ml-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status === "pubblicato" ? "bg-emerald-100 text-emerald-700" : status === "bozza" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{status === "pubblicato" ? "Pubblicata" : status === "bozza" ? "Bozza non pubblicata" : offset < 0 ? "Archiviata" : "Da pubblicare"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select id="plan-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="sel">{FILIALI.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          <button onClick={duplicate} className="btn-ghost"><Copy size={15} /> Duplica settimana precedente</button>
          <button onClick={publish} className="btn-primary"><Send size={15} /> Salva / Pubblica</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[210px_1fr] gap-5">
        <aside className="rounded-xl bg-white ring-1 ring-slate-200 p-4 h-fit lg:sticky lg:top-4">
          <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold mb-1">Shift template</div>
          <p className="text-xs text-slate-500 mb-3">Seleziona un turno e clicca le celle, oppure trascinalo sulla griglia.</p>
          <div className="flex flex-row flex-wrap lg:flex-col gap-2">
            {templates.map((c) => {
              const s = SHIFTS[c];
              return (
                <button key={c} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", c); setActive(c); }} onClick={() => setActive(c)}
                  className={`text-left rounded-lg border px-3 py-2 cursor-grab active:cursor-grabbing transition ${s.cls} ${active === c ? "ring-2 ring-offset-1 ring-slate-900 scale-[1.02]" : "opacity-90 hover:opacity-100"}`}>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-[11px] opacity-80 tabular-nums">{s.range}{s.h ? ` · ${fmtH(s.h)}` : ""}</div>
                </button>
              );
            })}
            <button onClick={() => setActive(null)} className={`text-left rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-600 flex items-center gap-2 text-sm ${active === null ? "ring-2 ring-offset-1 ring-slate-900" : ""}`}><Eraser size={14} /> Svuota cella</button>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            Fabbisogno minimo: pranzo {REQ_PRANZO[0]} (Ven–Dom {REQ_PRANZO[6]}), cena {REQ_CENA[0]} (Gio–Dom {REQ_CENA[6]}). Il turno spezzato copre entrambi.
          </div>
        </aside>

        <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-x-auto min-w-0">
          <table className="w-full min-w-[860px] text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                <th className="sticky left-0 bg-white z-10 text-left px-4 py-3 font-semibold border-b border-slate-200">Dipendente</th>
                {wr.days.map((d, i) => <th key={d} className={`px-1.5 py-3 font-semibold border-b border-slate-200 ${i >= 4 ? "text-orange-700" : ""}`}>{d}</th>)}
                <th className="px-3 py-3 font-semibold border-b border-slate-200 text-right">Ore</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Nessun collaboratore in questa sede. Assegnalo da Anagrafica → Nuovo dipendente o Modifica.</td></tr>}
              {staff.map((e) => {
                const h = hoursOf(e.id); const isOver = h > e.ore; const pct = Math.min(100, (h / e.ore) * 100);
                return (
                  <tr key={e.id} className={isOver ? "bg-red-50/60" : ""}>
                    <td className="sticky left-0 z-10 px-4 py-2 border-b border-slate-100 bg-inherit" style={{ background: isOver ? "#fef6f6" : "#fff" }}>
                      <div className="font-medium text-slate-800 whitespace-nowrap">{empName(e)}</div>
                      <div className="text-[11px] text-slate-500">{e.ruolo} · {e.ore}h</div>
                    </td>
                    {GIORNI.map((g, d) => {
                      const c = rowOf(e.id)[d]; const s = c ? SHIFTS[c] : null; const k = `${e.id}-${d}`;
                      return (
                        <td key={d} className="px-1 py-1.5 border-b border-slate-100">
                          <button
                            onClick={() => setCell(e.id, d, active)}
                            onDragOver={(ev) => { ev.preventDefault(); setDragOver(k); }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={(ev) => { ev.preventDefault(); setDragOver(null); setCell(e.id, d, ev.dataTransfer.getData("text/plain")); }}
                            title={`${empName(e)} · ${GIORNI_LUNGHI[d]}${s ? ` · ${s.label}` : ""}`}
                            className={`w-full h-12 rounded-md border text-[11px] leading-tight transition hover:scale-[1.03] ${s ? s.cls : "border-dashed border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500"} ${dragOver === k ? "ring-2 ring-orange-500" : ""}`}>
                            {s ? (<><div className="font-semibold">{s.label}</div>{s.h > 0 && <div className="opacity-75 tabular-nums">{fmtH(s.h)}</div>}</>) : "+"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 border-b border-slate-100 text-right whitespace-nowrap">
                      <div className={`font-semibold tabular-nums flex items-center justify-end gap-1 ${isOver ? "text-red-600" : "text-slate-800"}`}>{isOver && <AlertTriangle size={14} />}{fmtH(h)} / {e.ore}h</div>
                      <div className="mt-1 h-1 w-24 ml-auto rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${isOver ? "bg-red-500" : h >= e.ore * 0.85 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} /></div>
                      {isOver && <div className="text-[10px] text-red-600 mt-0.5">+{fmtH(h - e.ore)} oltre contratto</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td className="sticky left-0 z-10 bg-slate-900 px-4 py-3 text-[11px] uppercase tracking-wider font-semibold">Fabbisogno copertura</td>
                {coverage.map((c, d) => {
                  const okP = c.pr >= REQ_PRANZO[d], okC = c.ce >= REQ_CENA[d];
                  return (
                    <td key={d} className="px-1 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        <span className={`rounded px-1.5 py-1 text-[10.5px] font-semibold text-center ${okP ? "bg-emerald-500/90" : "bg-red-500 animate-pulse"}`}>{okP ? `Pranzo ${c.pr}/${REQ_PRANZO[d]}` : `${c.pr}/${REQ_PRANZO[d]} a Pranzo!`}</span>
                        <span className={`rounded px-1.5 py-1 text-[10.5px] font-semibold text-center ${okC ? "bg-emerald-500/90" : "bg-red-500 animate-pulse"}`}>{okC ? `Cena ${c.ce}/${REQ_CENA[d]}` : `${c.ce}/${REQ_CENA[d]} a Cena!`}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right text-xs">
                  <div className="font-semibold tabular-nums">{fmtH(staff.reduce((s, e) => s + hoursOf(e.id), 0))}</div>
                  <div className="text-slate-400">pianificate</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── ADMIN: FOGLIO ORE ───────────────────────── */
const MESI = [{ m: 6, label: "Luglio 2026" }, { m: 7, label: "Agosto 2026" }, { m: 8, label: "Settembre 2026" }];
function buildTimesheet(emp, month) {
  const rng = mulberry32(hash(emp.id + "m" + month));
  const days = new Date(2026, month + 1, 0).getDate();
  const today = new Date(2026, 8, 29);
  const rows = [];
  // causali pianificate per mese
  const causali = {};
  const workDays = [];
  const wk = emp.weekOrig || emp.week;
  const hire = emp.assunzione ? new Date(emp.assunzione + "T00:00:00") : new Date(2000, 0, 1);
  for (let d = 1; d <= days; d++) { const dt = new Date(2026, month, d); const wd = (dt.getDay() + 6) % 7; if (wk[wd] !== "R" && dt >= hire) workDays.push(d); }
  if (month === 7) workDays.filter((d) => d >= 10 && d <= 16).forEach((d) => (causali[d] = "Ferie"));
  if (month === 6) { const d = workDays[Math.floor(rng() * workDays.length)]; causali[d] = "ROL"; }
  if (month === 8) { const a = workDays.find((d) => d >= 8); causali[a] = "Malattia"; const b = workDays.find((d) => d >= 18); causali[b] = "ROL"; }
  // recupero ore dalla banca ore (giornata di riposo compensativo)
  const recDay = { 7: 20, 8: 22 }[month];
  if (recDay) { const r = workDays.find((d) => d >= recDay && !causali[d] && wk[(new Date(2026, month, d).getDay() + 6) % 7] !== "S"); if (r) causali[r] = "Recupero"; }
  for (let d = 1; d <= days; d++) {
    const date = new Date(2026, month, d);
    const wd = (date.getDay() + 6) % 7;
    const code = date < hire ? "R" : wk[wd];
    const sh = SHIFTS[code];
    const plannedMin = sh.h * 60;
    const future = date > today;
    const row = { d, wd, code, plannedMin, future, preHire: date < hire, punches: [], workedMin: 0, lateMin: 0, causale: causali[d] || null };
    if (!future && code !== "R" && !row.causale) {
      const late = rng() < 0.2 ? 3 + Math.floor(rng() * 20) : 0;
      const extra = rng() < 0.34 ? 5 + Math.floor(rng() * 45) : 0;
      sh.segs.forEach(([a, b], i) => {
        const inT = a + (i === 0 ? late : Math.floor(rng() * 4) - 2) - (i === 0 && !late ? Math.floor(rng() * 5) : 0);
        const outT = b + (i === sh.segs.length - 1 ? extra : Math.floor(rng() * 4)) ;
        row.punches.push([inT, outT]);
        if (outT > b) (row.overs = row.overs || []).push({ planEnd: b, out: outT, min: outT - b });
        row.workedMin += outT - Math.max(inT, a);
      });
      row.lateMin = late;
    }
    rows.push(row);
  }
  return rows;
}

// riepilogo mensile della banca ore: minuti netti oltre turno e recuperi goduti
function monthExtra(rows) {
  const past = rows.filter((r) => !r.future);
  return {
    extra: past.reduce((s, r) => s + Math.max(0, r.workedMin - r.plannedMin), 0),
    rec: past.filter((r) => r.causale === "Recupero").reduce((s, r) => s + r.plannedMin, 0),
  };
}
// saldo a inizio mese: saldo di apertura luglio + mesi precedenti interamente in banca ore
function openingBalance(emp, month) {
  let bal = 240 + (hash(emp.id + "open") % 8) * 30;
  MESI.filter((m) => m.m < month).forEach((m) => { const x = monthExtra(buildTimesheet(emp, m.m)); bal += x.extra - x.rec; });
  return Math.max(0, bal);
}

function PinModal({ open, onClose, onOk }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => { if (open) { setPin(""); setErr(false); } }, [open]);
  const press = (k) => {
    setErr(false);
    if (k === "del") return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, 4); setPin(next);
    if (next.length === 4) setTimeout(() => { if (next === "1234") { onOk(); } else { setErr(true); setPin(""); } }, 180);
  };
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("del"); else if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });
  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-xl bg-slate-900 text-amber-400 grid place-items-center"><KeyRound size={22} /></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Chiudi"><X size={18} /></button>
        </div>
        <h3 className="font-display text-3xl uppercase mt-4 text-slate-900 leading-none">Area riservata direzione</h3>
        <p className="text-sm text-slate-500 mt-2">Inserisci il PIN a 4 cifre per visualizzare le ore eccedenti. <span className="text-slate-400">PIN demo: 1234</span></p>
        <div className={`flex justify-center gap-3 my-6 ${err ? "shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => <span key={i} className={`h-4 w-4 rounded-full border-2 transition ${pin.length > i ? "bg-slate-900 border-slate-900 scale-110" : err ? "border-red-400" : "border-slate-300"}`} />)}
        </div>
        {err && <p className="text-center text-sm text-red-600 -mt-3 mb-3">PIN errato. Riprova.</p>}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) => k === "" ? <span key={i} /> : (
            <button key={i} onClick={() => press(k)} className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition font-display text-2xl text-slate-800 grid place-items-center" aria-label={k === "del" ? "Cancella cifra" : k}>{k === "del" ? <Delete size={20} /> : k}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function Timesheet({ toast }) {
  const [month, setMonth] = useState(8);
  const [branch, setBranch] = useState("bs-citta");
  const staff = EMPLOYEES.filter((e) => e.filiale === branch && isActive(e));
  const [empId, setEmpId] = useState("PF-0003");
  const emp = (byId[empId] && byId[empId].filiale === branch && isActive(byId[empId]) ? byId[empId] : staff[0]) || EMPLOYEES.find(isActive);
  const [unlocked, setUnlocked] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [bankPct, setBankPct] = useState(100);
  const [rate, setRate] = useState("11,80");
  const [allocated, setAllocated] = useState({});
  const rows = useMemo(() => buildTimesheet(emp, month), [emp.id, month, emp.assunzione]);
  const mLabel = MESI.find((x) => x.m === month).label;

  const past = rows.filter((r) => !r.future);
  const planned = past.reduce((s, r) => s + r.plannedMin, 0);
  const ordinary = past.reduce((s, r) => s + Math.min(r.workedMin, r.plannedMin), 0);
  const extra = past.reduce((s, r) => s + Math.max(0, r.workedMin - r.plannedMin), 0);
  const lates = past.filter((r) => r.lateMin > 0);
  const lateTot = lates.reduce((s, r) => s + r.lateMin, 0);
  const caus = (c) => past.filter((r) => r.causale === c);
  const extraDays = past.filter((r) => r.workedMin - r.plannedMin > 0).length;
  const bankMin = Math.round((extra * bankPct) / 100);
  const liqMin = extra - bankMin;
  const rateNum = parseFloat(String(rate).replace(",", ".")) || 0;
  const allocKey = `${emp.id}|${month}`;
  const opening = useMemo(() => openingBalance(emp, month), [emp.id, month, emp.assunzione]);
  const recRows = past.filter((r) => r.causale === "Recupero");
  const recMin = recRows.reduce((s, r) => s + r.plannedMin, 0);
  const daRecuperare = opening + bankMin - recMin;
  // righe del foglio eccedenze: giornate con ore oltre turno o recupero, con subtotali settimanali
  const ledgerRows = (() => {
    let prog = opening; const out = []; let wk = null; let wkSum = 0; let wkStart = null;
    const flush = () => { if (wk !== null && wkSum !== 0) out.push({ kind: "week", key: `w${wk}`, label: `Settimana dal ${wkStart}`, sum: wkSum }); wkSum = 0; };
    past.forEach((r) => {
      const monday = r.d - r.wd;
      if (monday !== wk) { flush(); wk = monday; wkStart = `${pad(Math.max(1, monday))}/${pad(month + 1)}`; }
      const net = Math.max(0, r.workedMin - r.plannedMin);
      if (r.causale === "Recupero") { const v = -r.plannedMin; prog += v; wkSum += v; out.push({ kind: "rec", key: `r${r.d}`, r, net: v, prog }); }
      else if (net > 0) {
        const gross = (r.overs || []).reduce((s, o) => s + o.min, 0);
        const v = Math.round((net * bankPct) / 100); prog += v; wkSum += v;
        out.push({ kind: "day", key: `d${r.d}`, r, gross, comp: Math.max(0, gross - net), net, v, prog });
      }
    });
    flush();
    return out;
  })();
  const fileBase = `${emp.cognome}_${emp.nome}_${pad(month + 1)}-2026`.replace(/\s/g, "");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-slate-900 leading-none">Foglio ore & report</h1>
          <p className="text-sm text-slate-500 mt-1.5">Confronto tra turni programmati e timbrature del tablet</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => toast({ title: "PDF firmabile pronto", body: `FoglioOre_${fileBase}.pdf · simulazione: nessun file scaricato.` })} className="btn-ghost"><FileText size={15} /> Esporta PDF firmabile</button>
          <button onClick={() => toast({ title: "Tracciato paghe esportato", body: `Paghe_${fileBase}.xlsx · ${fmtDur(ordinary)} ordinarie${unlocked ? "" : " (dati riservati esclusi)"}.` })} className="btn-ghost"><FileSpreadsheet size={15} /> Esporta XLSX paghe</button>
          {unlocked ? (
            <button onClick={() => { setUnlocked(false); toast({ title: "Area riservata bloccata" }); }} className="btn-dark"><Unlock size={15} /> Blocca dati riservati</button>
          ) : (
            <button onClick={() => setPinOpen(true)} className="btn-dark"><Lock size={15} /> Sblocca dati riservati direzione</button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select id="ts-month" value={month} onChange={(e) => setMonth(+e.target.value)} className="sel">{MESI.map((m) => <option key={m.m} value={m.m}>{m.label}</option>)}</select>
        <select id="ts-branch" value={branch} onChange={(e) => { setBranch(e.target.value); setEmpId((EMPLOYEES.find((x) => x.filiale === e.target.value && isActive(x)) || {}).id); }} className="sel">{FILIALI.filter((f) => EMPLOYEES.some((x) => x.filiale === f.id && isActive(x))).map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <select id="ts-emp" value={emp.id} onChange={(e) => setEmpId(e.target.value)} className="sel">{staff.map((e) => <option key={e.id} value={e.id}>{empName(e)} · {e.ore}h</option>)}</select>
        <span className="text-xs text-slate-500 ml-1">{emp.ruolo} · contratto {emp.ore}h/settimana · matricola {emp.id}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat"><div className="stat-l">Ore programmate</div><div className="stat-v">{fmtDur(planned)}</div><div className="stat-s">giorni fino a oggi</div></div>
        <div className="stat"><div className="stat-l">Ore ordinarie lavorate</div><div className="stat-v">{fmtDur(ordinary)}</div><div className="stat-s">{planned ? Math.round((ordinary / planned) * 100) : 0}% del programmato</div></div>
        <div className="stat"><div className="stat-l">Ritardi</div><div className={`stat-v ${lates.length ? "text-orange-600" : ""}`}>{lates.length}</div><div className="stat-s">{lateTot}' totali · {lates.filter((r) => r.lateMin > 10).length} oltre 10'</div></div>
        <div className="stat"><div className="stat-l">Causali assenza</div><div className="stat-v">{caus("Ferie").length + caus("ROL").length + caus("Malattia").length}<span className="text-lg text-slate-400"> gg</span></div><div className="stat-s">Ferie {caus("Ferie").length} · ROL {caus("ROL").length} · Malattia {caus("Malattia").length}{caus("Recupero").length ? ` · Recupero ${caus("Recupero").length}` : ""}</div></div>
      </div>

      {unlocked && (
        <section className="rounded-xl bg-slate-900 text-white p-5 slide-up">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-amber-400 font-semibold flex items-center gap-1.5"><Unlock size={13} /> Dati riservati direzione</div>
              <div className="font-display text-5xl mt-2 tabular-nums">{fmtDur(extra)}</div>
              <div className="text-sm text-slate-400">ore eccedenti effettive in {mLabel.toLowerCase()} · {extraDays} giornate</div>
            </div>
            <div className="flex-1 min-w-[260px] max-w-xl">
              <label htmlFor="bank-slider" className="text-sm text-slate-300 flex justify-between"><span>Ripartizione</span><span className="tabular-nums">{bankPct}% banca ore · {100 - bankPct}% liquidazione</span></label>
              <input id="bank-slider" type="range" min="0" max="100" step="10" value={bankPct} onChange={(e) => setBankPct(+e.target.value)} className="w-full mt-2 accent-amber-400" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-lg bg-white/5 ring-1 ring-white/10 p-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5"><PiggyBank size={14} className="text-amber-400" /> Accumulo in Banca Ore</div>
                  <div className="font-display text-3xl tabular-nums mt-1">{fmtDur(bankMin)}</div>
                  <div className="text-[11px] text-slate-500">da recuperare a fine mese: {fmtDur(daRecuperare)}</div>
                </div>
                <div className="rounded-lg bg-white/5 ring-1 ring-white/10 p-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5"><Wallet size={14} className="text-amber-400" /> Liquidazione interna</div>
                  <div className="font-display text-3xl tabular-nums mt-1">€ {((liqMin / 60) * rateNum).toFixed(2).replace(".", ",")}</div>
                  <label className="text-[11px] text-slate-500 flex items-center gap-1">{fmtDur(liqMin)} × € <input id="rate" value={rate} onChange={(e) => setRate(e.target.value)} className="w-14 bg-transparent border-b border-slate-600 text-slate-200 focus:outline-none focus:border-amber-400" />/h</label>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mt-3">
                <span className="text-xs text-slate-400">{allocated[allocKey] ? `Registrato il 29/09 alle ${allocated[allocKey]}` : "Non ancora registrato"}</span>
                <button onClick={() => { const t = timeOf(new Date()); setAllocated((a) => ({ ...a, [allocKey]: t })); toast({ title: "Ripartizione registrata", body: `${empName(emp)}: ${fmtDur(bankMin)} in banca ore, ${fmtDur(liqMin)} in liquidazione.` }); }} className="rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm px-4 py-2 flex items-center gap-2"><Save size={15} /> Conferma ripartizione</button>
              </div>
            </div>
          </div>
        </section>
      )}


      {unlocked && (
        <section className="rounded-xl bg-white ring-1 ring-amber-300 min-w-0 slide-up">
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-amber-200 bg-amber-50/70 rounded-t-xl">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-amber-700 font-semibold flex items-center gap-1.5"><Lock size={12} /> Riservato direzione</div>
              <h2 className="font-display text-3xl uppercase text-slate-900 leading-none mt-1">Foglio ore eccedenti · {mLabel}</h2>
              <p className="text-sm text-slate-600 mt-1">{empName(emp)} · ore eseguite oltre il turno programmato, al netto dei ritardi del giorno</p>
            </div>
            <button onClick={() => toast({ title: "Foglio eccedenze esportato", body: `Eccedenze_${fileBase}.pdf · totale da recuperare ${fmtDur(daRecuperare)} (simulazione).` })} className="btn-ghost"><FileText size={15} /> Esporta foglio eccedenze</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
            {[
              ["Saldo inizio mese", fmtDur(opening), "riportato dai mesi precedenti", "text-slate-900"],
              ["+ Ore oltre turno", `+${fmtDur(bankMin)}`, bankPct < 100 ? `${bankPct}% di ${fmtDur(extra)} · resto in liquidazione` : `${extraDays} giornate con eccedenza`, "text-amber-700"],
              ["− Recuperi goduti", recMin ? `−${fmtDur(recMin)}` : "0'", recRows.length ? recRows.map((r) => `${GIORNI[r.wd]} ${pad(r.d)}/${pad(month + 1)}`).join(", ") : "nessun recupero nel mese", "text-emerald-700"],
            ].map(([l, v, s, c]) => (
              <div key={l} className="bg-white px-4 py-3">
                <div className="stat-l">{l}</div>
                <div className={`font-display text-3xl tabular-nums mt-1 ${c}`}>{v}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s}</div>
              </div>
            ))}
            <div className="bg-slate-900 px-4 py-3 text-white col-span-2 md:col-span-1">
              <div className="text-[11px] uppercase tracking-[0.12em] text-amber-400 font-semibold">= Totale ore da recuperare</div>
              <div className="font-display text-4xl tabular-nums mt-1">{fmtDur(daRecuperare)}</div>
              <div className="text-xs text-slate-400 mt-0.5">pari a {(daRecuperare / 60).toFixed(2).replace(".", ",")} ore · {daRecuperare >= 210 ? `≈ ${Math.floor(daRecuperare / 210)} turni pranzo di recupero` : "meno di un turno pranzo"}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Giorno</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Turno previsto</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Fine prevista → uscita reale</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Oltre turno</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Ritardi da compensare</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-amber-700">Ore da recuperare</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Progressivo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 text-slate-500"><td className="px-4 py-2 italic" colSpan={6}>Saldo riportato al 1° {mLabel.toLowerCase()}</td><td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-700">{fmtDur(opening)}</td></tr>
                {ledgerRows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nessuna ora oltre turno registrata in questo mese.</td></tr>}
                {ledgerRows.map((x) => x.kind === "week" ? (
                  <tr key={x.key} className="bg-slate-50 text-xs"><td className="px-4 py-1.5 text-slate-500" colSpan={5}>Subtotale {x.label.toLowerCase()}</td><td className={`px-3 py-1.5 text-right tabular-nums font-semibold ${x.sum < 0 ? "text-emerald-700" : "text-amber-700"}`}>{x.sum < 0 ? "−" : "+"}{fmtDur(Math.abs(x.sum))}</td><td /></tr>
                ) : x.kind === "rec" ? (
                  <tr key={x.key} className="border-t border-slate-100 bg-emerald-50/50">
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums font-medium text-slate-700">{GIORNI[x.r.wd]} {pad(x.r.d)}/{pad(month + 1)}</td>
                    <td className="px-3 py-2"><span className={`inline-flex rounded border px-1.5 py-0.5 text-xs ${SHIFTS[x.r.code].cls}`}>{SHIFTS[x.r.code].label}</span></td>
                    <td className="px-3 py-2 text-xs text-emerald-800" colSpan={3}>Recupero goduto: turno non lavorato, scalato dalla banca ore</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700">−{fmtDur(-x.net)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-800">{fmtDur(x.prog)}</td>
                  </tr>
                ) : (
                  <tr key={x.key} className="border-t border-slate-100">
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums font-medium text-slate-700">{GIORNI[x.r.wd]} {pad(x.r.d)}/{pad(month + 1)}</td>
                    <td className="px-3 py-2"><span className={`inline-flex rounded border px-1.5 py-0.5 text-xs ${SHIFTS[x.r.code].cls}`}>{SHIFTS[x.r.code].label} · {fmtH(SHIFTS[x.r.code].h)}</span></td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-slate-600">{(x.r.overs || []).map((o) => `${hm(o.planEnd)} → ${hm(o.out)}`).join(" · ") || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">+{x.gross}'</td>
                    <td className="px-3 py-2 text-right tabular-nums text-orange-700">{x.comp ? `−${x.comp}'` : ""}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-700">+{fmtDur(x.v)}{bankPct < 100 && <span className="block text-[10px] font-normal text-slate-400">su {x.net}' netti</span>}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-slate-800">{fmtDur(x.prog)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="px-4 py-3 font-semibold" colSpan={5}>Totale ore da recuperare al {past.length ? `${pad(past[past.length - 1].d)}/${pad(month + 1)}` : ""}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-amber-300 text-xs">{bankMin - recMin >= 0 ? "+" : "−"}{fmtDur(Math.abs(bankMin - recMin))} nel mese</td>
                  <td className="px-4 py-3 text-right tabular-nums font-display text-2xl text-amber-300">{fmtDur(daRecuperare)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="px-4 sm:px-5 py-3 text-xs text-slate-500 border-t border-slate-100">Le ore oltre turno sono conteggiate dall'uscita reale rispetto alla fine prevista del turno; i minuti di ritardo dello stesso giorno vengono compensati. La quota destinata alla liquidazione non entra nel totale da recuperare.</p>
        </section>
      )}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-x-auto min-w-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Giorno</th>
              <th className="text-left px-3 py-2.5 font-semibold">Turno programmato</th>
              <th className="text-left px-3 py-2.5 font-semibold">Timbrature tablet</th>
              <th className="text-right px-3 py-2.5 font-semibold">Ore ordinarie</th>
              <th className="text-left px-3 py-2.5 font-semibold">Scostamento / causale</th>
              {unlocked && <th className="text-right px-4 py-2.5 font-semibold text-amber-700 bg-amber-50">Ore eccedenti / extra effettive</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const sh = SHIFTS[r.code]; const date = new Date(2026, month, r.d);
              const ord = Math.min(r.workedMin, r.plannedMin); const ex = Math.max(0, r.workedMin - r.plannedMin);
              const weekend = r.wd >= 5;
              return (
                <tr key={r.d} className={`border-t border-slate-100 ${r.future ? "text-slate-400" : ""} ${weekend ? "bg-orange-50/30" : ""}`}>
                  <td className="px-4 py-2 whitespace-nowrap tabular-nums"><span className="font-medium text-slate-700">{GIORNI[r.wd]} {pad(r.d)}</span><span className="text-slate-400">/{pad(month + 1)}</span>{date.toDateString() === new Date(2026, 8, 29).toDateString() && <span className="ml-2 text-[10px] font-semibold uppercase text-orange-600">oggi</span>}</td>
                  <td className="px-3 py-2">{r.preHire ? <span className="text-xs text-slate-400 italic">Non ancora in forza</span> : <span className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-xs ${sh.cls}`}>{sh.label}{sh.h > 0 && <span className="opacity-70 tabular-nums">{sh.range}</span>}</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums text-slate-600">{r.future ? "—" : r.punches.length ? r.punches.map(([a, b]) => `${hm(a)}–${hm(b)}`).join(" · ") : r.code === "R" ? "" : "nessuna"}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-800">{!r.future && ord > 0 ? fmtDur(ord) : r.causale ? <span className="text-slate-400">{fmtDur(r.plannedMin)}*</span> : ""}</td>
                  <td className="px-3 py-2">
                    {r.causale && <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.causale === "Ferie" ? "bg-sky-100 text-sky-800" : r.causale === "ROL" ? "bg-violet-100 text-violet-800" : r.causale === "Recupero" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{r.causale}</span>}
                    {r.lateMin > 0 && <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.lateMin > 10 ? "bg-orange-100 text-orange-800" : "bg-amber-50 text-amber-700"}`}>Ritardo +{r.lateMin}'</span>}
                    {!r.causale && !r.lateMin && !r.future && r.code !== "R" && <span className="text-xs text-emerald-700">Regolare</span>}
                  </td>
                  {unlocked && <td className="px-4 py-2 text-right tabular-nums bg-amber-50/60 font-semibold text-amber-800">{ex > 0 ? `+${ex}'` : ""}</td>}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900 text-white text-sm">
            <tr>
              <td className="px-4 py-3 font-semibold" colSpan={3}>Totale {mLabel}</td>
              <td className="px-3 py-3 text-right tabular-nums font-semibold">{fmtDur(ordinary)}</td>
              <td className="px-3 py-3 text-slate-300 text-xs">{lates.length} ritardi · {lateTot}'</td>
              {unlocked && <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-300">+{fmtDur(extra)}</td>}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-slate-500">* Ore coperte da causale (ferie, ROL, malattia), non conteggiate come lavorate. {!unlocked && "Le ore oltre il turno programmato sono visibili solo nell'area riservata."}</p>

      <PinModal open={pinOpen} onClose={() => setPinOpen(false)} onOk={() => { setPinOpen(false); setUnlocked(true); toast({ title: "Area riservata sbloccata", body: "Colonna ore eccedenti e pannello banca ore visibili." }); }} />
    </div>
  );
}


/* ───────────────────────── scheda dipendente (modifica / nuovo) ───────────────────────── */
function nextMatricola() {
  const max = EMPLOYEES.reduce((m, e) => Math.max(m, parseInt(e.id.slice(3), 10)), 0);
  return `PF-${String(max + 1).padStart(4, "0")}`;
}
const EMPTY_EMP = { nome: "", cognome: "", telefono: "", email: "", filiale: "bs-citta", ruolo: "Piadista", ore: 30, contratto: "Indeterminato", assunzione: "2026-10-01", week: ["R", "R", "R", "R", "R", "R", "R"], attivo: true };

function Field({ label, id, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
  );
}

function EmployeeDrawer({ emp, open, onClose, onSave }) {
  const isNew = !emp;
  const [f, setF] = useState(EMPTY_EMP);
  const [tried, setTried] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF(emp ? { ...emp, week: [...emp.week] } : { ...EMPTY_EMP, week: [...EMPTY_EMP.week] });
    setTried(false); setConfirmOff(false);
  }, [open, emp && emp.id]);
  useEffect(() => { if (!open) return; const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [open]);
  if (!open) return null;

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const weekH = f.week.reduce((s, c) => s + SHIFTS[c].h, 0);
  const errors = {};
  if (!f.nome.trim()) errors.nome = "Inserisci il nome.";
  if (!f.cognome.trim()) errors.cognome = "Inserisci il cognome.";
  if (f.email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.email)) errors.email = "Indirizzo email non valido.";
  if (!f.assunzione) errors.assunzione = "Indica la data di assunzione.";
  const valid = Object.keys(errors).length === 0;
  const matricola = emp ? emp.id : nextMatricola();

  const submit = (e) => {
    e.preventDefault(); setTried(true);
    if (!valid) return;
    if (!isNew && emp.attivo !== false && f.attivo === false && !confirmOff) { setConfirmOff(true); return; }
    onSave({ ...f, nome: f.nome.trim(), cognome: f.cognome.trim(), ore: +f.ore }, isNew ? matricola : emp.id);
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end fade-in" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={submit} className="drawer-in relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 grid place-items-center font-display text-xl text-white">{(f.nome[0] || "?").toUpperCase()}{(f.cognome[0] || "").toUpperCase()}</div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.14em] text-orange-600 font-semibold">{isNew ? "Nuovo dipendente" : "Scheda dipendente"}</div>
              <h3 id="drawer-title" className="font-display text-3xl uppercase leading-none text-slate-900 truncate">{f.nome || f.cognome ? `${f.nome} ${f.cognome}` : "Senza nome"}</h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{matricola}{isNew && " · assegnata al salvataggio"}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Chiudi"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-6">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">Dati anagrafici</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome *" id="f-nome" error={tried && errors.nome}><input id="f-nome" value={f.nome} onChange={(e) => set("nome", e.target.value)} className={`sel ${tried && errors.nome ? "!border-red-400" : ""}`} autoFocus /></Field>
              <Field label="Cognome *" id="f-cognome" error={tried && errors.cognome}><input id="f-cognome" value={f.cognome} onChange={(e) => set("cognome", e.target.value)} className={`sel ${tried && errors.cognome ? "!border-red-400" : ""}`} /></Field>
              <Field label="Telefono" id="f-tel"><input id="f-tel" value={f.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+39 347 123 4567" className="sel" inputMode="tel" /></Field>
              <Field label="Email aziendale" id="f-email" error={tried && errors.email}><input id="f-email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="nome.cognome@puntofermo.it" className={`sel ${tried && errors.email ? "!border-red-400" : ""}`} inputMode="email" /></Field>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-2">Contratto e filiale</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Filiale" id="f-fil" hint={!isNew && emp.filiale !== f.filiale ? `Trasferimento da ${filialeNome(emp.filiale)}` : null}>
                <select id="f-fil" value={f.filiale} onChange={(e) => set("filiale", e.target.value)} className="sel">{FILIALI.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
              </Field>
              <Field label="Tipo di contratto" id="f-contr">
                <select id="f-contr" value={f.contratto} onChange={(e) => set("contratto", e.target.value)} className="sel"><option>Indeterminato</option><option>Determinato</option><option>Apprendistato</option></select>
              </Field>
              <Field label="Data di assunzione" id="f-ass" error={tried && errors.assunzione}><input id="f-ass" type="date" value={f.assunzione} onChange={(e) => set("assunzione", e.target.value)} className="sel" /></Field>
              <div />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Ruolo</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Ruolo">
                {["Piadista", "Cassa", "Jolly"].map((r) => (
                  <button type="button" key={r} role="radio" aria-checked={f.ruolo === r} onClick={() => set("ruolo", r)} className={`h-10 rounded-lg text-sm font-semibold ring-1 transition ${f.ruolo === r ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-300 hover:ring-slate-400"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Monte ore settimanale</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Monte ore">
                {[20, 30, 40].map((h) => (
                  <button type="button" key={h} role="radio" aria-checked={+f.ore === h} onClick={() => set("ore", h)} className={`h-10 rounded-lg text-sm font-semibold ring-1 transition ${+f.ore === h ? "bg-orange-600 text-white ring-orange-600" : "bg-white text-slate-700 ring-slate-300 hover:ring-slate-400"}`}>{h}h <span className="font-normal opacity-75">{h === 40 ? "full-time" : "part-time"}</span></button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1 flex items-center gap-2 w-full">Turno tipo settimanale</legend>
            <p className="text-xs text-slate-500 -mt-1">Base di partenza per la Pianificazione turni: la settimana in corso lo usa finché non la modifichi a mano.</p>
            <div className="grid grid-cols-7 gap-1.5">
              {GIORNI.map((g, d) => {
                const c = f.week[d]; const sh = SHIFTS[c];
                return (
                  <div key={g} className="flex flex-col gap-1 min-w-0">
                    <span className={`text-[11px] text-center font-semibold ${d >= 4 ? "text-orange-700" : "text-slate-500"}`}>{g}</span>
                    <select id={`f-week-${d}`} aria-label={`Turno tipo ${GIORNI_LUNGHI[d]}`} value={c} onChange={(e) => set("week", f.week.map((x, i) => (i === d ? e.target.value : x)))} className={`h-11 w-full rounded-md border text-[11px] font-semibold text-center appearance-none cursor-pointer px-0.5 ${sh.cls}`}>
                      {Object.values(SHIFTS).map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className={`text-sm flex items-center gap-2 ${weekH > f.ore ? "text-red-600" : "text-slate-600"}`}>
              {weekH > f.ore && <AlertTriangle size={14} />}
              <span className="tabular-nums font-semibold">{fmtH(weekH)} / {f.ore}h</span>
              <span className="text-xs">{weekH > f.ore ? `supera il monte ore di ${fmtH(weekH - f.ore)}` : weekH === 0 ? "nessun turno impostato" : `${fmtH(f.ore - weekH)} ancora disponibili`}</span>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold mb-1">Stato</legend>
            <label htmlFor="f-attivo" className="flex items-center justify-between gap-4 rounded-lg ring-1 ring-slate-200 px-4 py-3 cursor-pointer">
              <span>
                <span className="block text-sm font-semibold text-slate-800">{f.attivo ? "Attivo" : "Disattivato"}</span>
                <span className="block text-xs text-slate-500">{f.attivo ? "Il badge funziona sul tablet e il dipendente compare nei turni." : "Il badge viene rifiutato dal tablet e il dipendente esce da turni e presenze."}</span>
              </span>
              <input id="f-attivo" type="checkbox" checked={f.attivo !== false} onChange={(e) => { set("attivo", e.target.checked); setConfirmOff(false); }} className="sr-only peer" />
              <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 peer-checked:bg-emerald-500 transition after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500" />
            </label>
          </fieldset>
        </div>

        {confirmOff && (
          <div className="mx-5 sm:mx-6 mb-3 rounded-lg bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-800 slide-up">
            Stai disattivando {f.nome}: il badge {matricola} non timbrerà più. Premi di nuovo <b>Salva modifiche</b> per confermare.
          </div>
        )}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <span className="text-xs text-slate-500">{tried && !valid ? <span className="text-red-600">Completa i campi evidenziati.</span> : "* campi obbligatori"}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annulla</button>
            <button type="submit" className={confirmOff ? "btn-dark !bg-red-600 hover:!bg-red-700" : "btn-primary"}><Save size={15} /> {isNew ? "Crea dipendente" : confirmOff ? "Conferma disattivazione" : "Salva modifiche"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ───────────────────────── ADMIN: ANAGRAFICA ───────────────────────── */
function BadgeCard({ emp, rev }) {
  return (
    <div className="mx-auto w-[300px] max-w-full rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 bg-white">
      <div className="relative bg-brand px-5 pt-5 pb-12 text-white overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[10px] border-white/10" />
        <Logo dark className="h-9" />
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/75 mt-2">Badge collaboratore</div>
      </div>
      <div className="-mt-9 px-5 pb-5">
        <div className="h-16 w-16 rounded-full bg-slate-900 ring-4 ring-white grid place-items-center font-display text-2xl text-white">{emp.nome[0]}{emp.cognome[0]}</div>
        <div className="mt-2 font-display text-3xl uppercase leading-none text-slate-900">{emp.nome}<br />{emp.cognome}</div>
        <div className="text-sm text-slate-600 mt-1">{emp.ruolo} · {filialeNome(emp.filiale)}</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="rounded-lg ring-1 ring-slate-200 p-1"><FakeQR value={`${emp.id}-r${rev}`} size={116} /></div>
          <div className="text-xs text-slate-500 leading-relaxed">
            <div className="font-mono font-semibold text-slate-800 text-sm">{emp.id}</div>
            <div>Rev. {rev} · emesso 29/09/2026</div>
            <div className="mt-1">Inquadra il codice sul tablet di filiale per timbrare.</div>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 text-slate-400 text-[10px] px-5 py-2 flex justify-between"><span>Personale · non cedibile</span><span>puntofermo.it</span></div>
    </div>
  );
}

function Anagrafica({ live, toast, saveEmployee }) {
  const [q, setQ] = useState("");
  const [fil, setFil] = useState("all");
  const [ruolo, setRuolo] = useState("all");
  const [page, setPage] = useState(0);
  const [badge, setBadge] = useState(null);
  const [revs, setRevs] = useState({});
  const [editing, setEditing] = useState(null); // null chiuso · "new" · oggetto dipendente
  const [justSaved, setJustSaved] = useState(null);
  const PER = 6;
  const list = EMPLOYEES.filter((e) => (fil === "all" || e.filiale === fil) && (ruolo === "all" || e.ruolo === ruolo) && `${empName(e)} ${e.id}`.toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const p = Math.min(page, pages - 1);
  const slice = list.slice(p * PER, p * PER + PER);
  useEffect(() => setPage(0), [q, fil, ruolo]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-slate-900 leading-none">Anagrafica dipendenti</h1>
          <p className="text-sm text-slate-500 mt-1.5">{EMPLOYEES.filter(isActive).length} collaboratori attivi su {FILIALI.length} sedi · {EMPLOYEES.filter((e) => isActive(e) && e.ore === 40).length} full-time, {EMPLOYEES.filter((e) => isActive(e) && e.ore < 40).length} part-time{EMPLOYEES.some((e) => !isActive(e)) && ` · ${EMPLOYEES.filter((e) => !isActive(e)).length} disattivati`}</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary"><UserPlus size={16} /> Nuovo dipendente</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="emp-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca nome o matricola" className="sel w-full pl-9" />
        </label>
        <select id="emp-branch" value={fil} onChange={(e) => setFil(e.target.value)} className="sel"><option value="all">Tutte le filiali</option>{FILIALI.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <select id="emp-role" value={ruolo} onChange={(e) => setRuolo(e.target.value)} className="sel"><option value="all">Tutti i ruoli</option><option>Piadista</option><option>Cassa</option><option>Jolly</option></select>
      </div>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-x-auto min-w-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50"><tr><th className="text-left px-4 py-2.5 font-semibold">Collaboratore</th><th className="text-left px-3 py-2.5 font-semibold">Filiale</th><th className="text-left px-3 py-2.5 font-semibold">Ruolo</th><th className="text-left px-3 py-2.5 font-semibold">Monte ore</th><th className="text-left px-3 py-2.5 font-semibold">Stato ora</th><th className="px-4 py-2.5" /></tr></thead>
          <tbody>
            {slice.map((e) => (
              <tr key={e.id} className={`border-t border-slate-100 hover:bg-slate-50 ${justSaved === e.id ? "flash" : ""} ${isActive(e) ? "" : "opacity-60"}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 grid place-items-center text-xs font-bold text-white">{e.nome[0]}{e.cognome[0]}</div>
                    <div className="min-w-0"><button onClick={() => setEditing(e)} className="font-medium text-slate-800 hover:text-orange-700 hover:underline underline-offset-2 text-left">{empName(e)}</button><div className="text-xs text-slate-500"><span className="font-mono">{e.id}</span> · {e.contratto}</div></div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{filialeNome(e.filiale)}</td>
                <td className="px-3 py-2.5"><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${e.ruolo === "Piadista" ? "bg-orange-100 text-orange-800" : e.ruolo === "Cassa" ? "bg-sky-100 text-sky-800" : "bg-violet-100 text-violet-800"}`}>{e.ruolo}</span></td>
                <td className="px-3 py-2.5 tabular-nums text-slate-700">{e.ore}h / sett. <span className="text-xs text-slate-400">{e.ore === 40 ? "full-time" : "part-time"}</span></td>
                <td className="px-3 py-2.5">{isActive(e) ? <StatoPill stato={live[e.id].stato} /> : <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-600">Disattivato</span>}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <div className="inline-flex gap-2">
                    <button onClick={() => setEditing(e)} className="btn-ghost"><Pencil size={14} /> Modifica</button>
                    <button onClick={() => setBadge(e)} disabled={!isActive(e)} className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"><QrCode size={15} /> Badge QR</button>
                  </div>
                </td>
              </tr>
            ))}
            {slice.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Nessun collaboratore corrisponde ai filtri.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-slate-500 tabular-nums">{list.length ? `${p * PER + 1}–${Math.min(list.length, p * PER + PER)} di ${list.length}` : "0 risultati"}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p - 1)} disabled={p === 0} className="icon-btn disabled:opacity-30" aria-label="Pagina precedente"><ChevronLeft size={16} /></button>
          {Array.from({ length: pages }).map((_, i) => (Math.abs(i - p) < 3 || i === 0 || i === pages - 1) ? (
            <button key={i} onClick={() => setPage(i)} className={`h-8 min-w-8 px-2 rounded-md tabular-nums ${i === p ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"}`}>{i + 1}</button>
          ) : (Math.abs(i - p) === 3 ? <span key={i} className="px-1 text-slate-400">…</span> : null))}
          <button onClick={() => setPage(p + 1)} disabled={p >= pages - 1} className="icon-btn disabled:opacity-30" aria-label="Pagina successiva"><ChevronRight size={16} /></button>
        </div>
      </div>

      <EmployeeDrawer open={!!editing} emp={editing === "new" ? null : editing} onClose={() => setEditing(null)}
        onSave={(data, id) => {
          const isNew = editing === "new";
          saveEmployee(data, id, isNew);
          setEditing(null); setJustSaved(id);
          if (isNew) { setQ(""); setFil("all"); setRuolo("all"); setTimeout(() => setPage(Math.floor((EMPLOYEES.length - 1) / PER)), 0); }
          setTimeout(() => setJustSaved(null), 2400);
        }} />

      <Modal open={!!badge} onClose={() => setBadge(null)} width="max-w-lg">
        {badge && (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-3xl uppercase text-slate-900 leading-none">Badge QR</h3>
                <p className="text-sm text-slate-500 mt-1">Formato CR80 (85,6 × 54 mm), pronto per la stampa in filiale.</p>
              </div>
              <button onClick={() => setBadge(null)} className="text-slate-400 hover:text-slate-700" aria-label="Chiudi"><X size={18} /></button>
            </div>
            <div className="my-6 pop-in"><BadgeCard emp={badge} rev={revs[badge.id] || 1} /></div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={() => { setRevs((r) => ({ ...r, [badge.id]: (r[badge.id] || 1) + 1 })); toast({ tone: "warn", title: "Nuovo QR generato", body: `Il badge rev. ${revs[badge.id] || 1} di ${empName(badge)} non è più valido sui tablet.` }); }} className="btn-ghost"><RefreshCw size={15} /> Rigenera codice</button>
              <button onClick={() => { toast({ title: "Badge inviato alla stampante", body: `Coda di stampa di ${filialeNome(badge.filiale)} · 1 copia.` }); setBadge(null); }} className="btn-primary"><Printer size={15} /> Invia alla stampante di filiale</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


/* ───────────────────────── ADMIN: SEDI ───────────────────────── */
const EMPTY_SEDE = { nome: "", indirizzo: "", cap: "", citta: "", tel: "", min: 2, stato: "apertura" };

function BranchDrawer({ sede, open, onClose, onSave }) {
  const isNew = !sede;
  const [f, setF] = useState(EMPTY_SEDE);
  const [tried, setTried] = useState(false);
  useEffect(() => { if (open) { setF(sede ? { ...sede } : { ...EMPTY_SEDE }); setTried(false); } }, [open, sede && sede.id]);
  useEffect(() => { if (!open) return; const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [open]);
  if (!open) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const errors = {};
  if (!f.nome.trim()) errors.nome = "Inserisci il nome della sede.";
  else if (FILIALI.some((x) => x.nome.toLowerCase() === f.nome.trim().toLowerCase() && (!sede || x.id !== sede.id))) errors.nome = "Esiste già una sede con questo nome.";
  if (!f.indirizzo.trim()) errors.indirizzo = "Inserisci l'indirizzo.";
  if (!f.citta.trim()) errors.citta = "Inserisci la città.";
  if (f.cap && !/^\d{5}$/.test(f.cap)) errors.cap = "Il CAP ha 5 cifre.";
  const valid = Object.keys(errors).length === 0;
  const staffCount = sede ? EMPLOYEES.filter((e) => e.filiale === sede.id && isActive(e)).length : 0;
  const submit = (e) => { e.preventDefault(); setTried(true); if (valid) onSave({ ...f, nome: f.nome.trim(), indirizzo: f.indirizzo.trim(), citta: f.citta.trim(), min: +f.min }, isNew); };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end fade-in" role="dialog" aria-modal="true" aria-labelledby="sede-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={submit} className="drawer-in relative h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-brand text-white grid place-items-center"><Store size={22} /></div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold">{isNew ? "Nuova sede" : "Scheda sede"}</div>
              <h3 id="sede-title" className="font-display text-3xl uppercase leading-none text-slate-900 truncate">{f.nome || "Senza nome"}</h3>
              {!isNew && <div className="text-xs text-slate-500 mt-0.5">{staffCount} collaboratori attivi assegnati</div>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Chiudi"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-5">
          <Field label="Nome sede *" id="s-nome" error={tried && errors.nome} hint="Come compare su tablet, turni e report (es. Brescia · Via Milano)"><input id="s-nome" value={f.nome} onChange={(e) => set("nome", e.target.value)} className={`sel ${tried && errors.nome ? "!border-red-400" : ""}`} autoFocus /></Field>
          <Field label="Indirizzo *" id="s-ind" error={tried && errors.indirizzo}><input id="s-ind" value={f.indirizzo} onChange={(e) => set("indirizzo", e.target.value)} placeholder="Via, numero civico" className={`sel ${tried && errors.indirizzo ? "!border-red-400" : ""}`} /></Field>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <Field label="CAP" id="s-cap" error={tried && errors.cap}><input id="s-cap" value={f.cap} onChange={(e) => set("cap", e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className="sel" /></Field>
            <Field label="Città *" id="s-citta" error={tried && errors.citta}><input id="s-citta" value={f.citta} onChange={(e) => set("citta", e.target.value)} className={`sel ${tried && errors.citta ? "!border-red-400" : ""}`} /></Field>
          </div>
          <Field label="Telefono" id="s-tel"><input id="s-tel" value={f.tel} onChange={(e) => set("tel", e.target.value)} inputMode="tel" placeholder="030 1234567" className="sel" /></Field>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">Presidio minimo per aprire il servizio</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set("min", Math.max(1, f.min - 1))} className="icon-btn !h-10 !w-10" aria-label="Riduci presidio">−</button>
              <span className="font-display text-4xl tabular-nums w-10 text-center text-slate-900">{f.min}</span>
              <button type="button" onClick={() => set("min", Math.min(6, f.min + 1))} className="icon-btn !h-10 !w-10" aria-label="Aumenta presidio">+</button>
              <span className="text-xs text-slate-500">collaboratori in turno; sotto questa soglia Live Ops segnala l'anomalia</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">Stato</span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Stato sede">
              {Object.entries(STATO_SEDE).map(([k, m]) => (
                <button type="button" key={k} role="radio" aria-checked={f.stato === k} onClick={() => set("stato", k)} className={`h-10 rounded-lg text-sm font-semibold ring-1 transition ${f.stato === k ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-300 hover:ring-slate-400"}`}>{m.label}</button>
              ))}
            </div>
            <span className="text-xs text-slate-500">{f.stato === "aperta" ? "Compare in Live Ops con KPI e avvisi di presidio." : f.stato === "apertura" ? "Puoi già assegnare dipendenti e pianificare i turni; non genera avvisi in Live Ops." : "Esclusa da tablet e Live Ops; lo storico resta nei report."}</span>
            {!isNew && f.stato === "chiusa" && staffCount > 0 && <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> {staffCount} collaboratori sono ancora assegnati a questa sede: trasferiscili da Anagrafica.</span>}
          </div>
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <span className="text-xs text-slate-500">{tried && !valid ? <span className="text-red-600">Completa i campi evidenziati.</span> : "* campi obbligatori"}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annulla</button>
            <button type="submit" className="btn-primary"><Save size={15} /> {isNew ? "Crea sede" : "Salva modifiche"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Sedi({ live, saveBranch }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [justSaved, setJustSaved] = useState(null);
  const list = FILIALI.filter((f) => `${f.nome} ${f.indirizzo} ${f.citta}`.toLowerCase().includes(q.toLowerCase()));
  const byCity = FILIALI.reduce((m, f) => ((m[f.citta] = (m[f.citta] || 0) + 1), m), {});
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-slate-900 leading-none">Sedi</h1>
          <p className="text-sm text-slate-500 mt-1.5">{FILIALI.filter(isOpen).length} punti vendita aperti · {Object.entries(byCity).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(" · ")}</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary"><Plus size={16} /> Nuova sede</button>
      </div>
      <label className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input id="sede-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca sede, via o comune" className="sel w-full pl-9" />
      </label>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-x-auto min-w-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50"><tr><th className="text-left px-4 py-2.5 font-semibold">Sede</th><th className="text-left px-3 py-2.5 font-semibold">Telefono</th><th className="text-center px-3 py-2.5 font-semibold">Collaboratori</th><th className="text-left px-3 py-2.5 font-semibold">Presidio ora</th><th className="text-left px-3 py-2.5 font-semibold">Stato</th><th className="px-4 py-2.5" /></tr></thead>
          <tbody>
            {list.map((f) => {
              const staff = EMPLOYEES.filter((e) => e.filiale === f.id && isActive(e));
              const pres = staff.filter((e) => live[e.id].stato === "turno").length;
              const ok = pres >= f.min;
              const st = STATO_SEDE[f.stato || "aperta"];
              return (
                <tr key={f.id} className={`border-t border-slate-100 hover:bg-slate-50 ${justSaved === f.id ? "flash" : ""} ${f.stato === "chiusa" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setEditing(f)} className="font-medium text-slate-800 hover:text-brand hover:underline underline-offset-2 text-left">{f.nome}</button>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} /> {f.indirizzo}, {f.cap ? `${f.cap} ` : ""}{f.citta}</div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-700 whitespace-nowrap select-all">{f.tel || <span className="text-slate-400">—</span>}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-slate-700">{staff.length}</td>
                  <td className="px-3 py-2.5">
                    {isOpen(f) ? <span className={`tabular-nums text-xs font-semibold ${ok ? "text-emerald-700" : "text-red-600"}`}>{pres} / {f.min} in turno</span> : <span className="text-xs text-slate-400">min. {f.min}</span>}
                  </td>
                  <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => setEditing(f)} className="btn-ghost"><Pencil size={14} /> Modifica</button></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Nessuna sede corrisponde alla ricerca.</td></tr>}
          </tbody>
        </table>
      </div>
      <BranchDrawer open={!!editing} sede={editing === "new" ? null : editing} onClose={() => setEditing(null)}
        onSave={(data, isNew) => { const id = saveBranch(data, isNew ? null : editing.id); setEditing(null); setJustSaved(id); setTimeout(() => setJustSaved(null), 2400); }} />
    </div>
  );
}

/* ───────────────────────── APP ───────────────────────── */
function App() {
  const [mode, setMode] = useState("kiosk");
  const [section, setSection] = useState("live");
  const [now, setNow] = useState(new Date());
  const init = useMemo(() => initialLive(new Date()), []);
  const [live, setLive] = useState(init.live);
  const [events, setEvents] = useState(init.events);
  const [online, setOnlineRaw] = useState(true);
  const [queue, setQueue] = useState([]);
  const [kioskBranch, setKioskBranch] = useState("bs-citta");
  const [toasts, setToasts] = useState([]);
  const [plans, setPlans] = useState({});
  const [published, setPublished] = useState({ "mi-duomo|0": "pubblicato" });

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts.slice(-3), { id, tone: "ok", ...t }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismiss = (id) => setToasts((ts) => ts.filter((x) => x.id !== id));

  const liveRef = useRef(live); liveRef.current = live;
  const onlineRef = useRef(online); onlineRef.current = online;

  const punch = (empId, type) => {
    const cur = liveRef.current[empId];
    const lateMin = type === "in" && cur.stato === "ritardo" ? Math.floor((Date.now() - cur.since) / 60000) : 0;
    const next = { in: "turno", pausa: "pausa", finepausa: "turno", out: "fuori" }[type];
    setLive((l) => ({ ...l, [empId]: { stato: next } }));
    const ev = { id: `k-${Date.now()}`, emp: empId, type, at: Date.now(), lateMin, fresh: true };
    if (onlineRef.current) setEvents((e) => [ev, ...e]);
    else setQueue((q) => [...q, { ...ev, synced: true }]);
    return { lateMin };
  };

  const setOnline = (v) => {
    setOnlineRaw(v);
    if (v && queue.length) {
      setEvents((e) => [...queue, ...e].sort((a, b) => b.at - a.at));
      toast({ title: "Tablet di nuovo online", body: `${queue.length} timbrature sincronizzate con la sede.` });
      setQueue([]);
    } else if (!v) toast({ tone: "warn", title: "Tablet offline (simulazione)", body: "Le timbrature restano in coda sul dispositivo." });
  };

  const [, setVer] = useState(0);
  const saveEmployee = (data, id, isNew) => {
    if (isNew) {
      const e = { ...data, id, week: [...data.week], weekOrig: [...data.week] };
      EMPLOYEES.push(e); byId[id] = e;
      setLive((l) => ({ ...l, [id]: { stato: "fuori" } }));
      toast({ title: "Dipendente creato", body: `${empName(e)} · ${id} assegnato a ${filialeNome(e.filiale)}. Genera il badge QR per le timbrature.` });
    } else {
      const e = byId[id]; const prevFil = e.filiale; const wasActive = isActive(e);
      Object.assign(e, { ...data, week: [...data.week] });
      if (wasActive && !isActive(e)) setLive((l) => ({ ...l, [id]: { stato: "fuori" } }));
      toast({ tone: !isActive(e) && wasActive ? "warn" : "ok", title: !isActive(e) && wasActive ? "Dipendente disattivato" : "Scheda aggiornata", body: prevFil !== e.filiale ? `${empName(e)} trasferito a ${filialeNome(e.filiale)}.` : `${empName(e)} · ${e.ruolo}, ${e.ore}h, ${e.contratto.toLowerCase()}.` });
    }
    setVer((v) => v + 1);
  };

  const saveBranch = (data, id) => {
    if (!id) {
      const base = data.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sede";
      let nid = base, n = 2; while (FILIALI.some((f) => f.id === nid)) nid = `${base}-${n++}`;
      FILIALI.push({ ...data, id: nid });
      toast({ title: "Sede creata", body: `${data.nome} · ${STATO_SEDE[data.stato].label.toLowerCase()}. Assegna i collaboratori da Anagrafica.` });
      setVer((v) => v + 1);
      return nid;
    }
    const f = FILIALI.find((x) => x.id === id);
    Object.assign(f, data);
    if (f.stato === "chiusa" && kioskBranch === id) setKioskBranch(FILIALI.find((x) => x.stato !== "chiusa").id);
    toast({ title: "Sede aggiornata", body: `${f.nome} · presidio minimo ${f.min} · ${STATO_SEDE[f.stato].label.toLowerCase()}.` });
    setVer((v) => v + 1);
    return id;
  };

  const NAV = [
    { id: "live", label: "Live Ops", icon: Activity, hint: "Presenze in tempo reale" },
    { id: "turni", label: "Pianificazione turni", icon: CalendarDays, hint: "Matrice settimanale" },
    { id: "ore", label: "Foglio ore & report", icon: Clock, hint: "Mensile e paghe" },
    { id: "anag", label: "Anagrafica", icon: Users, hint: `${EMPLOYEES.filter(isActive).length} collaboratori` },
    { id: "sedi", label: "Sedi", icon: Store, hint: `${FILIALI.length} punti vendita` },
  ];
  const liveAlerts = FILIALI.filter(isOpen).filter((f) => EMPLOYEES.filter((e) => e.filiale === f.id && isActive(e) && live[e.id].stato === "turno").length < f.min).length;

  return (
    <div className={`min-h-screen ${mode === "kiosk" ? "bg-[#0f0b09]" : "bg-[#f3f4f6]"}`}>
      {/* top bar */}
      <header className={`sticky z-40 h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b ${mode === "kiosk" ? "bg-[#0f0b09]/95 border-white/10" : "bg-white/95 border-slate-200"} backdrop-blur`} style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Logo dark={mode === "kiosk"} />
          <span className={`hidden md:inline text-xs px-2 py-0.5 rounded-full ${mode === "kiosk" ? "bg-white/10 text-amber-100/70" : "bg-slate-100 text-slate-500"}`}>Timbrature & turni · demo</span>
        </div>
        <div className={`flex p-1 rounded-xl ${mode === "kiosk" ? "bg-white/10" : "bg-slate-100"}`} role="tablist" aria-label="Modalità">
          {[["kiosk", "Tablet Kiosk", "(Punto Vendita)", Tablet], ["admin", "Dashboard Admin", "(Sede/Store Manager)", LayoutDashboard]].map(([k, l, sub, Ico]) => (
            <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
              className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-3 py-1.5 text-sm font-semibold transition ${mode === k ? (k === "kiosk" ? "bg-amber-400 text-slate-900 shadow" : "bg-slate-900 text-white shadow") : mode === "kiosk" ? "text-amber-100/70 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}>
              <Ico size={16} /><span className="hidden sm:inline">{l}</span><span className="hidden xl:inline font-normal opacity-70">{sub}</span>
            </button>
          ))}
        </div>
      </header>

      {mode === "kiosk" ? (
        <Kiosk now={now} live={live} punch={punch} online={online} setOnline={setOnline} queue={queue} kioskBranch={kioskBranch} setKioskBranch={setKioskBranch} toast={toast} />
      ) : (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          <nav className="lg:w-64 shrink-0 bg-slate-900 text-slate-300 lg:min-h-full">
            <div className="hidden lg:block px-5 pt-6 pb-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Sede centrale</div>
              <div className="text-white font-semibold mt-1">Direzione operativa</div>
              <div className="text-xs text-slate-500">{FILIALI.filter(isOpen).length} sedi · {EMPLOYEES.filter(isActive).length} collaboratori</div>
            </div>
            <ul className="flex lg:flex-col gap-1 p-2 lg:px-3 overflow-x-auto">
              {NAV.map((n) => {
                const Ico = n.icon; const on = section === n.id;
                return (
                  <li key={n.id} className="shrink-0">
                    <button onClick={() => setSection(n.id)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${on ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`}>
                      <Ico size={18} className={on ? "text-amber-400" : ""} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium whitespace-nowrap">{n.label}</span>
                        <span className="hidden lg:block text-[11px] text-slate-500">{n.hint}</span>
                      </span>
                      {n.id === "live" && liveAlerts > 0 && <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 tabular-nums">{liveAlerts}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="hidden lg:block mx-3 mt-6 rounded-lg bg-white/5 p-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400"><Tablet size={14} /> Tablet {filialeNome(kioskBranch)}</div>
              <div className={`mt-1 font-semibold flex items-center gap-1.5 ${online ? "text-emerald-400" : "text-red-400"}`}>{online ? <Wifi size={13} /> : <WifiOff size={13} />}{online ? "Online · sincronizzato" : `Offline · ${queue.length} in coda`}</div>
            </div>
          </nav>
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
            {section === "live" && <LiveOps now={now} live={live} events={events} online={online} queue={queue} toast={toast} kioskBranch={kioskBranch} />}
            {section === "turni" && <Planning toast={toast} plans={plans} setPlans={setPlans} published={published} setPublished={setPublished} />}
            {section === "ore" && <Timesheet toast={toast} />}
            {section === "anag" && <Anagrafica live={live} toast={toast} saveEmployee={saveEmployee} />}
            {section === "sedi" && <Sedi live={live} saveBranch={saveBranch} />}
          </main>
        </div>
      )}
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
