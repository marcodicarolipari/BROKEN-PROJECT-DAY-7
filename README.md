# Lipari Bank Forms

Wizard multi-step per la **Sottoscrizione di una Polizza Assicurativa**.

Progetto Angular 19 Standalone — demo educativa con **3 bug intenzionali** da trovare e correggere.

---

## Setup

```bash
npm install
ng serve
```

Apri [http://localhost:4200](http://localhost:4200) nel browser.
Non è richiesto login — il wizard si apre direttamente.

---

## Navigare il Wizard

Il wizard si compone di **3 step sequenziali**:

| Step | Contenuto |
|------|-----------|
| 1. Dati Personali | Nome, cognome, data di nascita (validatore età ≥ 18), codice fiscale con verifica asincrona |
| 2. Beneficiari | Lista dinamica con FormArray: nome, cognome, CF, percentuale. La somma delle percentuali deve essere 100% |
| 3. PIN | PIN di sicurezza (4–6 cifre) + conferma PIN con cross-field validator |

**Come funziona (quando tutto è corretto):**
1. Compila i dati dello Step 1 e clicca **Avanti**
2. Aggiungi almeno un beneficiario, assicurati che le percentuali sommino a 100, clicca **Avanti**
3. Imposta il PIN, confermalo, clicca **Sottoscrivi Polizza**

**Nota sul Codice Fiscale:**
Il servizio simula una verifica remota con 1 secondo di attesa.
I CF che iniziano con la lettera `X` vengono rifiutati (simulazione di CF non trovato in archivio).

---

## Le 3 Missioni di Debug

---

### MISSIONE 1 — Il pulsante "Avanti" non funziona (Step 1)

**Sintomo:**
Nello Step 1, anche dopo aver compilato correttamente tutti i campi (nome, cognome, data di nascita valida, codice fiscale verificato), cliccando il pulsante **Avanti** non avviene alcuna navigazione allo step successivo. Il wizard rimane bloccato sul primo step oppure si comporta in modo anomalo (vengono mostrati errori inattesi o viene triggerata la logica di submit finale).

**File da ispezionare:**
`src/app/features/insurance/policy-subscription/policy-subscription.component.html`

---

### MISSIONE 2 — I beneficiari aggiunti non compaiono (Step 2)

**Sintomo:**
Nello Step 2, cliccando il pulsante **+ Aggiungi Beneficiario** la logica TypeScript viene eseguita (nessun errore in console, il FormArray interno cresce), ma nella UI non appare alcun nuovo campo per il secondo beneficiario. La lista rimane ferma con il solo beneficiario iniziale, rendendo impossibile aggiungere più beneficiari attraverso l'interfaccia.

**File da ispezionare:**
`src/app/features/insurance/policy-subscription/policy-subscription.component.ts`

---

### MISSIONE 3 — L'errore "I PIN non coincidono" non compare mai (Step 3)

**Sintomo:**
Nello Step 3, inserendo deliberatamente un PIN e una conferma PIN **diversi** (es. `1234` e `5678`), il messaggio di errore **"I PIN non coincidono"** non appare mai — nemmeno dopo aver toccato entrambi i campi. Il validator cross-field `pinMatchValidator` è implementato correttamente e funziona (il form risulta `INVALID` quando i PIN non corrispondono), ma il messaggio nel template non viene mai mostrato.

**File da ispezionare:**
`src/app/features/insurance/policy-subscription/policy-subscription.component.html`

---

## Struttura del Progetto

```
src/app/features/insurance/
├── models/
│   └── policy-form.model.ts          Interfacce PolicyFormData e Beneficiario
├── validators/
│   ├── codice-fiscale.validator.ts   Async validator con debounce 500ms
│   └── pin-match.validator.ts        Cross-field validator (errore sul FormGroup)
├── services/
│   └── tax-code.service.ts           Simula verifica CF remota con delay(1000)
└── policy-subscription/
    ├── policy-subscription.component.ts    Logica wizard + Signals + FormArray
    └── policy-subscription.component.html  Template con 3 bug intenzionali
```

## Tecnologie

- **Angular 19** — Standalone Components, Signals (`signal()`, `signal.set()`, `signal.update()`)
- **Angular Reactive Forms** — `FormGroup`, `FormArray`, `FormControl`, `FormBuilder`
- **Validators** — sync custom, async custom (con debounce), cross-field
- **RxJS** — `timer`, `switchMap`, `of`, `delay`, `map`, `catchError`
- **SCSS** — stili componente con variabili e nesting

---

## Bonus Mission — Feature da Implementare (opzionale, ~1 ora)

Una volta risolti i 3 bug, implementa la seguente feature per consolidare i concetti del giorno.

### Salvataggio automatico in bozza e ripristino

La bozza viene salvata nel `localStorage` del browser dopo 500 ms di inattività.
All'apertura del wizard è possibile ripristinarla oppure eliminarla.
Per sicurezza, PIN e conferma PIN non vengono salvati e devono essere reinseriti.
La bozza contiene dati personali accessibili agli script dello stesso sito e agli
utenti del browser su quel dispositivo; eliminarla sui dispositivi condivisi.

Il wizard non salva nessuno stato tra sessioni: se l'utente chiude il browser a metà compilazione, perde tutto il lavoro.

**Cosa implementare:**

Aggiungi un meccanismo di "salvataggio in bozza" che persiste automaticamente i dati del form nel `localStorage` ogni volta che un qualsiasi campo viene modificato (con un debounce di almeno 500ms per non scrivere ad ogni tasto). Quando il wizard viene aperto, se esiste una bozza salvata, deve essere mostrata una sezione "Hai una bozza in sospeso" con la data/ora dell'ultimo salvataggio e un pulsante "Ripristina bozza" che ripopola il form con i dati salvati. Un pulsante "Elimina bozza" permette di scartarla.

La logica di salvataggio deve essere implementata come un servizio separato `PolicyDraftService` iniettabile, non inline nel componente.

I beneficiari del `FormArray` devono essere salvati e ripristinati correttamente (il numero di beneficiari e i loro dati devono corrispondere alla bozza).

**Criteri di accettazione:**

- Modificando qualsiasi campo del form, dopo 500ms i dati vengono scritti nel `localStorage`.
- Riaprendo il wizard con una bozza presente, compare la sezione con data/ora e pulsanti.
- "Ripristina bozza" ripopola tutti i campi del form inclusi i beneficiari nel FormArray.
- "Elimina bozza" rimuove i dati dal `localStorage` e nasconde la sezione.
- Il salvataggio e il ripristino sono gestiti da `PolicyDraftService`, non dal componente direttamente.
- Nessun bug risolto in precedenza viene reintrodotto.

---

*LipariBank Prompt Bootcamp — Reactive Forms & Validation Logic — Day 07*
