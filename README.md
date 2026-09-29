# Punto Fermo · Demo portale presenze

Demo interattiva del sistema di timbrature e gestione turni per la catena di piadinerie **Punto Fermo** (15 punti vendita reali nel bresciano, 80 collaboratori simulati). Tutti i dati sono simulati e vivono nel browser: ricaricando la pagina si torna allo scenario iniziale.

## Cosa contiene

**Tablet Kiosk (punto vendita)**
- Orologio live, selezione filiale, stato Online/Offline con coda delle timbrature
- Mirino di scansione QR e pulsanti demo per simulare i badge
- Azioni contestuali: Inizio turno, Inizio/Fine pausa, Fine turno
- Segnale acustico, blocco schermo di 5 s e protezione da doppia timbratura (60 s)

**Dashboard Admin (sede / store manager)**
- **Live Ops**: KPI presenti, in pausa, ritardi > 10 min, assenti; avvisi per filiale; feed timbrature in tempo reale
- **Pianificazione turni**: matrice settimanale con template trascinabili, ore vs monte contrattuale, fabbisogno pranzo/cena, duplica settimana, pubblica
- **Foglio ore & report**: confronto programmato/timbrature, ritardi, causali (Ferie, ROL, Malattia, Recupero), export simulati
  - Area riservata (PIN demo **1234**): ore eccedenti, ripartizione banca ore/liquidazione, foglio ore eccedenti con totale ore da recuperare
- **Anagrafica**: 80 collaboratori con ricerca e filtri, modifica scheda, nuovo dipendente, disattivazione, badge QR
- **Sedi**: i 15 punti vendita reali con indirizzo e telefono; nuova sede, modifica, presidio minimo e stato (aperta, in apertura, chiusa)

## Percorso consigliato per la presentazione

1. **Kiosk** → "Marco Rossi" (sede Brescia · Città) → *Inizio turno*; poi rileggi lo stesso badge per mostrare il blocco anti doppia timbratura.
2. Metti il tablet **Offline**, timbra "Giulia Verdi", torna **Online**: la timbratura arriva in sede.
3. **Dashboard Admin → Live Ops**: la timbratura compare nel feed; avviso di Brescia · Via Cremona sotto presidio.
4. **Pianificazione turni**: Luca Bianchi oltre monte ore, mercoledì "1/2 a Pranzo!"; trascina un turno per sistemare.
5. **Foglio ore** → *Sblocca dati riservati* (PIN 1234) → foglio ore eccedenti e totale da recuperare.
6. **Anagrafica** → *Nuovo dipendente*, poi *Badge QR*.
7. **Sedi** → *Nuova sede* (es. in apertura), poi assegna il nuovo dipendente alla sede.

## Pubblicazione su Vercel

Il sito è statico: la pagina pubblicata è `public/index.html`. Le impostazioni di build sono già in `vercel.json` (build `npm run build`, output `public`), quindi nel progetto **puntofermo** basta collegare il repository con il preset **Other**.

## Modificare la demo

Il codice sorgente è in `src/app.jsx` (React), `src/shell.html` (stili e librerie da CDN) e `src/logo.png` (logo, incorporato nella pagina in fase di build).

```bash
npm install
npm run build   # rigenera public/index.html
```

Librerie caricate da CDN: React 18.3.1, Tailwind CSS 3.4 (play CDN), lucide-react 0.263.1, Google Fonts.
