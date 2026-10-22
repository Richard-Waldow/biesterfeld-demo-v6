/* The account manager's workday inside the product app: Today (ranked tasks with reasons), Customers (360 view),
   Pipeline (offer lifecycle), Outbound (reorders, product-management pushes, cross-sell, relationships) and Service
   (deliveries, documents, expert questions). Every request and opportunity carries the workflow guide: three stages
   whose steps adapt to the intent, a qualification card and a coaching note. A context chat turns plain sentences
   into proposed record changes that the user confirms.
   Customer, request, opportunity and task are separate records, linked by customer. All of it is synthetic demo data. */
(() => {
  // state shared by every mounted app instance
  const W = { role: 'inside', tiersSent: new Set(), ordered: new Set(), checkedIn: new Set(), won: new Set(), asked2: new Set(), pushSel: {}, pushSent: {}, scarceSel: {}, scarceSent: {}, fab: { r: 22, b: 22 }, done: new Set(), snoozed: {}, cases: {}, chats: {}, log: {}, extra: [], informed: new Set(), pushed: false, asked: false, followups: {}, rh: {}, n: 0, init: false };

  window.BFAE = ctx => {
    const { st, model, L, esc, ph, nf, eur, eurK, tons, wk, when, short, chip, tiles, empty, segChip, ch, meta, NOW, E, hash } = ctx;
    const D = () => ctx.D;
    const T = p => (p ? L(p[0], p[1]) : '');
    const day = n => new Date(+NOW + n * 864e5);
    const nm = c => String(c || '').replace(/ GmbH.*/, '');
    const offerFor = c => D().offers.find(o => o.customer === c);
    const offerId = c => `AN-2026-${4100 + hash(c) % 800}`;
    const endOfDay = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 23, 59);

    // three offers are already with the customer when the demo opens; they get follow-up dates four days after sending
    if (!W.init) {
      W.init = true;
      for (const [c, d] of [['Novaform Automotive GmbH', 4], ['Folienwerk Nordheide GmbH', 9], ['Main-Tauber Fahrzeugteile GmbH', 2]]) { model.status[offerId(c)] = 'sent'; W.followups[offerId(c)] = { sent: day(-d), due: day(4 - d) }; }
      // the offers drafted for today's offer requests wait for the account manager's review
      for (const c of ['Sauerland Haushaltswaren GmbH', 'Harzer Steckverbinder GmbH', 'Bodensee Präzisionsteile GmbH', 'Medplast Tuttlingen GmbH']) model.status[offerId(c)] = 'review';
      ctx.emit();
    }

    // ------------------------------------------------------------------ people, territories, accounts
    const USERS = () => ({ inside: ['Lena Hoffmann', 'LH', L('Inside sales · Engineering Plastics', 'Innendienst · Technische Kunststoffe')], field: ['Carina Weiß', 'CW', L('Field sales · South', 'Außendienst · Süd')], pm: ['Sven Martens', 'SM', L('Product manager · PE, PP, styrenics', 'Produktmanager · PE, PP, Styrole')] });
    const TERR = { nord: [['North', 'Nord'], 'Malte Brandt'], west: [['West', 'West'], 'Jonas Albers'], sued: [['South', 'Süd'], 'Carina Weiß'], ost: [['East', 'Ost'], 'Tobias Richter'] };
    const PREF = { phone: ['phone', ['Phone', 'Telefon']], email: ['envelope-simple', ['Email', 'E-Mail']], whatsapp: ['whatsapp-logo', ['WhatsApp', 'WhatsApp']] };
    // rhythm in weeks; order and contact in days ago
    const ACC = {
      'Rheinform Kunststofftechnik GmbH': { terr: 'west', tier: 'A', rhythm: 4, order: 9, contact: 2, pref: 'email', note: ['Framework agreement, call-offs come through Biesterfeld CRM. Approved grade only.', 'Rahmenvertrag, Abrufe kommen über das Biesterfeld CRM. Nur freigegebene Type.'], buys: ['Zytel 70G30HSL BK031', 'Crastin SK605 BK851'], c2: ['Dr. Uwe Lenz', ['Quality', 'Qualität']] },
      'Novaform Automotive GmbH': { terr: 'sued', tier: 'A', rhythm: 6, order: 30, contact: 4, pref: 'phone', note: ['Prefers a call. Decides with purchasing on Thursdays.', 'Bevorzugt einen Anruf. Entscheidet donnerstags mit dem Einkauf.'], buys: ['Ultramid A3WG6', 'Hostaform C 9021'], c2: ['Sabine Ort', ['Purchasing', 'Einkauf']] },
      'Hanse Closures GmbH': { terr: 'nord', tier: 'A', rhythm: 3, order: 12, contact: 6, pref: 'whatsapp', note: ['WhatsApp for quick questions, email for offers.', 'WhatsApp für kurze Fragen, E-Mail für Angebote.'], buys: ['Marlex 9006', 'PP 7032E3'], c2: ['Kai Ehlers', ['Production planning', 'Produktionsplanung']] },
      'Folienwerk Nordheide GmbH': { terr: 'nord', tier: 'B', rhythm: 8, order: 61, contact: 3, pref: 'email', note: ['Price-driven, compares two suppliers on every order.', 'Preisgetrieben, vergleicht bei jeder Bestellung zwei Lieferanten.'], buys: ['Exceed 1018HA'], c2: ['Birte Lange', ['Managing director', 'Geschäftsführung']] },
      'Elbtal Elektrotechnik GmbH': { terr: 'ost', tier: 'B', rhythm: 8, order: 40, contact: 1, pref: 'email', note: ['Engineering asks a lot; bring in product management early.', 'Die Technik fragt viel; Produktmanagement früh einbinden.'], buys: ['Ultramid A3X2G5', 'Polylac PA-765A'], c2: ['Ronny Fiedler', ['Engineering', 'Entwicklung']] },
      'Medplast Tuttlingen GmbH': { terr: 'sued', tier: 'A', rhythm: 6, order: 20, contact: 0, pref: 'email', note: ['Needs the lot certificate with every delivery.', 'Braucht zu jeder Lieferung das Chargenzertifikat.'], buys: ['Wonderlite PC-110', 'Hostaform C 9021'], c2: ['Eva Mauch', ['Quality', 'Qualität']] },
      'Sauerland Haushaltswaren GmbH': { terr: 'west', tier: 'B', rhythm: 6, order: 25, contact: 12, pref: 'whatsapp', note: ['Accepts natural plus black masterbatch for black parts.', 'Akzeptiert natur plus Schwarz-Masterbatch für schwarze Teile.'], buys: ['Polylac PA-757', 'PP 7032E3'] },
      'Bodensee Präzisionsteile GmbH': { terr: 'sued', tier: 'A', rhythm: 5, order: 18, contact: 1, pref: 'phone', note: ['Never buys from Grupa Azoty.', 'Kauft nie bei Grupa Azoty.'], buys: ['Ultraform N2320 003', 'Ultramid B3EG6'], project: ['New POM gear line from Q2 2027, around 60 t a year (field visit yesterday)', 'Neue POM-Zahnradlinie ab Q2 2027, rund 60 t pro Jahr (Besuch gestern)'], c2: ['Lea Brugger', ['Purchasing', 'Einkauf']] },
      'Weser Getränketechnik GmbH': { terr: 'nord', tier: 'A', rhythm: 4, order: 14, contact: 0, pref: 'email', note: ['PET is under allocation: promise only what product management released.', 'PET ist unter Allokation: nur zusagen, was das Produktmanagement freigegeben hat.'], buys: ['Ramapet N180', 'HMA 016'] },
      'Lippe Kabeltechnik GmbH': { terr: 'west', tier: 'B', rhythm: 8, order: 45, contact: 36, pref: 'email', note: ['Email only, no calls before 10:00.', 'Nur E-Mail, keine Anrufe vor 10 Uhr.'], buys: ['Skypel G130D', 'Ultramid B3S'] },
      'Allgäu Gartengeräte GmbH': { terr: 'sued', tier: 'B', rhythm: 12, order: 70, contact: 1, pref: 'phone', buys: ['PP 7032E3', 'ABS HI121H'], project: ['Planning a garden-tool range for 2027', 'Plant eine Gartengeräte-Serie für 2027'] },
      'Ostsee Sanitär GmbH': { terr: 'ost', tier: 'C', rhythm: 10, order: 52, contact: 1, pref: 'email', buys: ['ABS HI121H', 'Celanex 2002-2'] },
      'Main-Tauber Fahrzeugteile GmbH': { terr: 'sued', tier: 'A', rhythm: 4, order: 16, contact: 2, pref: 'phone', buys: ['Ultramid B3EG6', 'Ryton R-4'] },
      'Harzer Steckverbinder GmbH': { terr: 'nord', tier: 'B', rhythm: 6, order: 22, contact: 15, pref: 'email', buys: ['Crastin SK605 BK851', 'Hytrel 4056'] },
      'Spessart Möbelbeschläge GmbH': { terr: 'sued', tier: 'B', rhythm: 6, order: 77, contact: 41, pref: 'phone', note: ['Regular POM buyer, quiet since August.', 'Regelmäßiger POM-Käufer, seit August ruhig.'], buys: ['Hostaform C 9021'] },
      'Vogtland Spielwaren GmbH': { terr: 'ost', tier: 'C', rhythm: 8, order: 96, contact: 44, pref: 'email', buys: ['Polylac PA-757'] },
      'Emsland Rohrsysteme GmbH': { terr: 'nord', tier: 'B', rhythm: 6, order: 33, contact: 20, pref: 'phone', note: ['Pipe extrusion: PE100 pressure grades only.', 'Rohrextrusion: nur PE100-Drucktypen.'], buys: ['PE100 pipe grade'] },
    };
    // the buying rhythm comes from SAP; the account manager can correct it on the customer page (W.rh), and everything follows
    const acc = c => { const a = ACC[c] || { terr: 'nord', tier: 'C', rhythm: 8, order: 30, contact: 14, pref: 'email', buys: [] }; return W.rh[c] ? { ...a, ...W.rh[c] } : a; };
    const qtyOf = c => acc(c).qty ?? (4 + hash(c) % 5) * 3;
    // check-ins: suggested when the last contact is clearly past this customer's usual contact rhythm, or never if the account manager says so
    const ciWeeks = c => acc(c).ciw ?? 2; // learned from the contact history; the demo data has about two weeks for everyone
    const ciDue = c => acc(c).ci !== 'off' && acc(c).contact >= ciWeeks(c) * 7;
    const allCust = () => [...new Set([...D().customers.map(c => c.name), ...Object.keys(ACC)])];
    const inRole = c => W.role !== 'field' || acc(c).terr === 'sued';
    const CROSS = {
      'Harzer Steckverbinder GmbH': ['PC/ABS V-0', ['Buys PBT GF30; 7 of 9 similar E&E customers also buy PC/ABS V-0 for housings.', 'Kauft PBT GF30; 7 von 9 ähnlichen E&E-Kunden kaufen auch PC/ABS V-0 für Gehäuse.']],
      'Novaform Automotive GmbH': ['PBT GF30 black', ['Buys PA66 GF30 HS; 6 of 8 automotive peers buy PBT GF30 for connectors alongside it.', 'Kauft PA66 GF30 HS; 6 von 8 Automotive-Kunden kaufen dazu PBT GF30 für Stecker.']],
      'Main-Tauber Fahrzeugteile GmbH': ['PA66 GF30 HS', ['Buys PA6 GF30; under-hood parts at similar suppliers move to PA66 GF30 HS.', 'Kauft PA6 GF30; Teile im Motorraum wechseln bei ähnlichen Zulieferern auf PA66 GF30 HS.']],
    };

    // ------------------------------------------------------------------ vocabulary
    const STG = () => [L('Understand & qualify', 'Verstehen & qualifizieren'), L('Respond or offer', 'Antworten oder anbieten'), L('Follow up & resolve', 'Nachfassen & abschließen')];
    const STG_S = () => [L('Understand', 'Verstehen'), L('Respond', 'Antworten'), L('Follow up', 'Nachfassen')];
    const KIND = () => ({ com: [L('Commercial', 'Vertrieb'), 'currency-eur'], svc: [L('Service', 'Service'), 'lifebuoy'], rel: [L('Relationship', 'Beziehung'), 'handshake'] });
    const INT = () => ({ quote: [L('Quote request', 'Angebotsanfrage'), 'c-ai'], calloff: [L('Call-off', 'Abruf'), 'c-ai'], price: [L('Price check', 'Preisinfo'), 'c-cat'], docs: [L('Documents', 'Dokumente'), 'c-sent'],
      delivery: [L('Delivery', 'Lieferung'), 'c-sent'], tech: [L('Technical question', 'Technische Frage'), 'c-review'], future: [L('Future demand', 'Künftiger Bedarf'), 'c-ok'], outbound: [L('Outbound', 'Outbound'), 'c-ok'] });
    const STAT = () => ({ open: [L('Open', 'Offen'), 'c-new'], ready: [L('Answer ready', 'Antwort bereit'), 'c-ready'], waiting: [L('Waiting for expert', 'Wartet auf Experten'), 'c-review'], answered: [L('Answered', 'Beantwortet'), 'c-sent'], done: [L('Done', 'Erledigt'), 'c-sent'],
      qualifying: [L('Qualifying', 'Qualifizierung'), 'c-new'], future: [L('Future demand', 'Künftiger Bedarf'), 'c-ai'], drafted: [L('Offer drafted', 'Angebot entworfen'), 'c-review'], sent: [L('Sent', 'Gesendet'), 'c-sent'], awaiting: [L('Awaiting response', 'Wartet auf Antwort'), 'c-sent'],
      followup: [L('Follow-up due', 'Nachfassen fällig'), 'c-warn'], reviewing: [L('Customer reviewing', 'Kunde prüft'), 'c-sent'], negotiation: [L('Negotiation', 'Verhandlung'), 'c-review'], won: [L('Accepted', 'Angenommen'), 'c-ok'], lost: [L('Lost to competitor', 'An Wettbewerb verloren'), 'c-rej'] });
    const SIG = () => ({ buy: [L('Buying signal', 'Kaufsignal'), 'c-ok', 'trend-up'], explore: [L('Exploring', 'Sondiert'), 'c-cat', 'compass'], hesitate: [L('Hesitation', 'Zögern'), 'c-warn', 'pause-circle'], service: [L('Service', 'Service'), 'c-sent', 'lifebuoy'] });
    const QD = () => ({ product: L('Product', 'Produkt'), qty: L('Quantity', 'Menge'), price: L('Price', 'Preis'), delivery: L('Delivery', 'Lieferung'), intent: L('Intent', 'Absicht'), spec: L('Spec', 'Spezifikation') });
    const CLOSING = ['reviewing', 'awaiting', 'lost', 'won', 'done', 'answered', 'waiting'];
    const statChip = s => chip(STAT()[s]?.[1] || 'c-cat', STAT()[s]?.[0] || s);
    // what a task is for: about half send an offer, half get the information that is still missing
    const GOAL = () => ({ offer: [L('Send offer', 'Angebot senden'), 'file-text'], info: [L('Get information', 'Infos einholen'), 'question'], svc: [L('Service', 'Service'), 'lifebuoy'], rel: [L('Check-in', 'Check-in'), 'handshake'] });
    const goalChip = g => GOAL()[g] ? `<span class="ae-goal g-${g}">${ph(GOAL()[g][1])}${GOAL()[g][0]}</span>` : '';
    const sig = () => USERS()[W.role][0];

    // ------------------------------------------------------------------ sources: where a demand or an action comes from
    const SRCK = () => ({ sap: ['SAP S/4', () => ctx.logo('sap', '#0FAAFF')], visit: [L('Visit note', 'Besuchsnotiz'), () => ph('note-pencil')], rule: [L('Rule', 'Regel'), () => ph('sparkle')], pm: [L('Product management', 'Produktmanagement'), () => ph('package')] });
    const srcLabel = k => SRCK()[k]?.[0] || ch(k).name;
    const srcIcon = k => (SRCK()[k] ? SRCK()[k][1]() : ch(k).icon());
    const ago = d => { const h = (NOW - d) / 3600e3; return h < 20 ? d.toLocaleTimeString(ctx.lang() === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : daysAgo(Math.round(h / 24)); };
    function srcOf(c) {
      const out = [];
      if (c.fromMsgs) for (const m of D().msgs.filter(x => x.customer === c.cust && (c.fromMsgs === true || c.fromMsgs === x.channel))) out.push({ k: m.channel, who: meta(c.cust).contact, at: m.at, title: ctx.subject(m), text: ctx.body(m) });
      if (c.msg) out.push({ k: c.from ? 'visit' : c.channel, who: c.from || meta(c.cust).contact, at: new Date(+NOW - c.at * 3600e3), text: T(c.msg) });
      for (const [k, who, h, title, text] of c.src || []) out.push({ k, who: Array.isArray(who) ? T(who) : who, at: new Date(+NOW - h * 3600e3), title: title && T(title), text: T(text) });
      return out.sort((a, b) => a.at - b.at);
    }
    const srcCard = s => `<div class="ae-src k-${s.k}"><div class="sh">${srcIcon(s.k)}<b>${esc(srcLabel(s.k))}</b><span>${esc(s.who || '')}</span><time>${when(s.at)}</time></div>${s.title ? `<div class="st">${esc(s.title)}</div>` : ''}<p>${esc(s.text).replace(/\n/g, '<br>')}</p></div>`;
    const srcTag = s => (s ? `<span class="ae-srct" title="${esc(L('Source', 'Quelle'))}">${srcIcon(s.k)}${esc(srcLabel(s.k))}${s.who ? ` · ${esc(s.who.replace(/^Dr\. /, ''))}` : ''} · ${ago(s.at)}</span>` : '');

    // ------------------------------------------------------------------ contact details
    const AREA = { Köln: '221', Ingolstadt: '841', Bremen: '421', Buchholz: '4181', Dresden: '351', Tuttlingen: '7461', Lüdenscheid: '2351', Friedrichshafen: '7541', Hameln: '5151', Detmold: '5231', Kempten: '831', Rostock: '381', Wertheim: '9342', Goslar: '5321', Aschaffenburg: '6021', Plauen: '3741', Meppen: '5931' };
    const phone = c => `+49 ${AREA[meta(c).city] || '40'} ${String(100000 + hash(c) % 899999).replace(/(\d{3})(\d{3})/, '$1 $2')}`;
    const mailTo = c => `${meta(c).contact.replace(/^Dr\. /, '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.')}@${meta(c).domain}`;
    // offer type, read from the matched lines
    const otype = o => (o.ms.some(m => m.grade === 'alt') ? ['equiv', L('With an equivalent grade', 'Mit gleichwertiger Type')] : o.ms.some(m => m.s.week > 0) ? ['part', L('Stock now, rest inbound', 'Lager jetzt, Rest im Zulauf')] : ['stock', L('From stock', 'Ab Lager')]);
    const otypeChip = o => { const [k, l] = otype(o); return `<span class="ae-otype o-${k}">${ph(k === 'stock' ? 'warehouse' : k === 'part' ? 'boat' : 'swap')}${esc(l)}</span>`; };

    // ------------------------------------------------------------------ engine facts used in the cases
    const ms = (c, f = () => true) => D().R.matches.filter(m => m.d.customer === c && f(m));
    const left = g => D().R.supply.filter(s => s.grade === g).reduce((a, s) => a + s.left, 0);
    const ppLot = () => D().R.supply.find(s => s.grade === 'PP 7032E3' && s.week > 0);
    const eta = () => { const w = ppLot()?.week || 2; return { old: day(w * 7 - 2), now: day(w * 7 + 1) }; };
    const delayed = () => [...new Set(D().R.matches.filter(m => m.s.grade === 'PP 7032E3' && m.s.week > 0).map(m => m.d.customer))];
    const S3 = (a, b, c) => [...a.map(x => [0, ...x]), ...b.map(x => [1, ...x]), ...c.map(x => [2, ...x])];

    // ------------------------------------------------------------------ requests and opportunities
    function CASES() {
      const allg = offerFor('Allgäu Gartengeräte GmbH'), ost = offerFor('Ostsee Sanitär GmbH'), nova = offerFor('Novaform Automotive GmbH'), fol = offerFor('Folienwerk Nordheide GmbH'), mt = offerFor('Main-Tauber Fahrzeugteile GmbH'), elb = offerFor('Elbtal Elektrotechnik GmbH');
      const e = eta(), pp = ms('Hanse Closures GmbH', m => m.s.grade === 'PP 7032E3').reduce((a, m) => a + m.qty, 0) || 22000;
      const pet = ms('Weser Getränketechnik GmbH'), petStock = pet.filter(m => !m.s.week).reduce((a, m) => a + m.qty, 0), petIn = pet.filter(m => m.s.week).reduce((a, m) => a + m.qty, 0), petWk = pet.find(m => m.s.week)?.s.week || 1;
      const novaPa = ms('Novaform Automotive GmbH', m => /PA66/.test(m.d.material)).reduce((a, m) => a + m.qty, 0);
      const rhein = ms('Rheinform Kunststofftechnik GmbH', m => /Zytel/.test(m.s.grade)).reduce((a, m) => a + m.qty, 0);
      const pp0 = D().R.supply.find(s => s.grade === 'PP 7032E3')?.price || 1.3, tiers = [[1, .12, .14], [3, .06, .09], [5, .02, .07]];
      const tierTxt = de => tiers.map(([t, up, fr]) => `- ${t} t: ${nf(pp0 + up, 2)} €/kg ${de ? 'zzgl.' : 'plus'} ${nf(fr, 2)} €/kg ${de ? 'Fracht' : 'freight'}`).join('\n');
      // a request that asked for an offer: the offer is drafted from the matched lines and goes out with the email
      const offerCase = (id, cust, x) => {
        const o = offerFor(cust), m = D().msgs.filter(y => y.customer === cust), who = meta(cust).contact;
        return { id, type: 'opp', cust, kind: 'com', goal: 'offer', intents: ['quote'], channel: m[0]?.channel || 'email', at: m[0] ? Math.max(1, Math.round((NOW - m[0].at) / 3600e3)) : 5, offer: o?.id, value: o?.value, status: 'drafted', signal: 'buy', fromMsgs: true,
          steps: S3([['Request received', 'Anfrage erhalten'], ['Matched stock and inbound', 'Bestand und Zulauf gematcht']], [['Offer drafted, checks run', 'Angebot entworfen, Prüfungen gelaufen'], [`Send the offer to ${who}`, `Angebot an ${who} senden`]], [['Follow up on day four', 'Nachfassen an Tag vier'], ['Customer decision', 'Entscheidung des Kunden']]), cur: 3,
          next: [`Send the offer to ${who}`, `Angebot an ${who} senden`], act: ['paper-plane-tilt', ['Review & send offer', 'Angebot prüfen & senden'], 'offer'], ...x };
      };
      return [
        { id: 'C-101', type: 'opp', cust: 'Novaform Automotive GmbH', kind: 'com', goal: 'info', intents: ['quote'], channel: 'calls', at: 4 * 24 + 3, offer: nova?.id, value: nova?.value, status: 'followup', signal: 'buy',
          src: [['calls', 'Tobias Brenner', 5 * 24 + 2, ['Call: 24 t PA66 GF30 HS + 8 t POM', 'Anruf: 24 t PA66 GF30 HS + 8 t POM'], [`Call with Tobias Brenner, 6:12 min (transcript)\nTB: We need 24 t PA66 GF30 HS black for ${wk(3)}, plus 8 t POM as usual.\nLH: Zytel is tight right now. Ultramid A3WG6 is an equivalent. Does that work for you?\nTB: Equivalent is fine if the delivery week holds. When exactly would it arrive?\nLH: Part from stock, the rest inbound. I will send you an offer today.`, `Telefonat mit Tobias Brenner, 6:12 Min. (Mitschrift)\nTB: Wir brauchen 24 t PA66 GF30 HS schwarz für ${wk(3)}, dazu 8 t POM wie immer.\nLH: Zytel ist gerade knapp. Ultramid A3WG6 ist gleichwertig. Geht das für Sie?\nTB: Gleichwertig ist ok, wenn die Lieferwoche hält. Wann genau käme die Ware?\nLH: Ein Teil ab Lager, der Rest im Zulauf. Ich schicke Ihnen heute ein Angebot.`]],
            ['rule', ['Follow-up rule', 'Nachfass-Regel'], 2, null, [`Offer ${nova?.id || ''} was sent 4 days ago and no reply is recorded. Follow-ups are due on day four.`, `Angebot ${nova?.id || ''} ging vor 4 Tagen raus, eine Antwort ist nicht erfasst. Nachfassen ist an Tag vier fällig.`]]],
          mail: { subj: [`Your offer ${nova?.id || ''}`, `Ihr Angebot ${nova?.id || ''}`], body: [`Good afternoon Tobias Brenner,\n\na quick follow-up on our offer ${nova?.id || ''} from ${short(day(-4))}: ${tons(novaPa)} Ultramid A3WG6 (equivalent to Zytel 70G30HSL) and 8 t Hostaform C 9021, delivered by ${wk(3)}.\n\nDo the price and the delivery week work for you? If anything is still open before you decide with purchasing on Thursday, I am happy to call.\n\nKind regards\n${sig()}`, `Guten Tag Tobias Brenner,\n\nich hake kurz zu unserem Angebot ${nova?.id || ''} vom ${short(day(-4))} nach: ${tons(novaPa)} Ultramid A3WG6 (gleichwertig zu Zytel 70G30HSL) und 8 t Hostaform C 9021, Lieferung bis ${wk(3)}.\n\nPassen Preis und Lieferwoche für Sie? Wenn vor Ihrer Entscheidung mit dem Einkauf am Donnerstag noch etwas offen ist, rufe ich Sie gern an.\n\nViele Grüße\n${sig()}`] },
          call: [[`Do price and ${wk(3)} work?`, `Passen Preis und ${wk(3)}?`], ['What is still open before they decide?', 'Was ist vor der Entscheidung noch offen?'], ['Who joins the decision with purchasing on Thursday?', 'Wer entscheidet am Donnerstag mit dem Einkauf?']],
          title: ['PA66 GF30 HS 24 t + POM 8 t', 'PA66 GF30 HS 24 t + POM 8 t'],
          steps: S3([['Request received by phone', 'Anfrage telefonisch erhalten'], ['Qualified: grade, 24 t, need week', 'Qualifiziert: Type, 24 t, Bedarfswoche'], ['Matched stock and inbound', 'Bestand und Zulauf gematcht']], [['Offer drafted, checks passed', 'Angebot entworfen, Prüfungen ok'], ['Sent 4 days ago', 'Vor 4 Tagen gesendet']], [['Follow up', 'Nachfassen'], ['Customer decision', 'Entscheidung des Kunden'], ['Won or lost, with the reason', 'Gewonnen oder verloren, mit Grund']]), cur: 5,
          qual: { product: [1, ['Ultramid A3WG6, equivalent accepted', 'Ultramid A3WG6, gleichwertig akzeptiert']], qty: [1, [`${tons(novaPa)} of 24 t PA66 covered now, plus 8 t POM`, `${tons(novaPa)} von 24 t PA66 jetzt gedeckt, plus 8 t POM`]], price: [1, ['List price, margin above the floor', 'Listenpreis, Marge über der Untergrenze']], delivery: [1, [`Need ${wk(3)}, from stock and inbound`, `Bedarf ${wk(3)}, aus Lager und Zulauf`]], intent: [1, ['Buying: asked twice about the date', 'Kaufabsicht: zweimal nach dem Termin gefragt']] },
          coach: ['Buying signal: he asked twice about the delivery week on the call. Confirm that price and date work, then ask what is still open before they decide.', 'Kaufsignal: Er hat im Anruf zweimal nach der Lieferwoche gefragt. Bestätigen, dass Preis und Termin passen, dann fragen, was vor der Entscheidung noch offen ist.'],
          next: ['Call Tobias Brenner about the offer', 'Tobias Brenner zum Angebot anrufen'], why: ['Offer sent 4 days ago, no reply recorded. He prefers calls.', 'Angebot vor 4 Tagen gesendet, keine Antwort erfasst. Er bevorzugt Anrufe.'],
          act: ['phone', ['Call Tobias Brenner', 'Tobias Brenner anrufen'], 'call'],
          answers: { why: [`Ultramid A3WG6 is an equivalent of the PA66 GF30 HS they asked for, and they accept equivalents (shared memory: A3WG6 and Zytel 70G30HSL are equivalent). It is in stock in Hamburg plus inbound, arrives before ${wk(3)} and keeps the margin above the floor. The POM is their approved Hostaform C 9021.`, `Ultramid A3WG6 ist gleichwertig zum angefragten PA66 GF30 HS, und sie akzeptieren Gleichwertiges (gemeinsames Wissen: A3WG6 und Zytel 70G30HSL sind gleichwertig). Es liegt in Hamburg und kommt im Zulauf, trifft vor ${wk(3)} ein und hält die Marge über der Untergrenze. Das POM ist ihr freigegebenes Hostaform C 9021.`] },
          chips: [['I just called. They need another two weeks before deciding.', 'Ich habe gerade angerufen. Sie brauchen noch zwei Wochen für die Entscheidung.'], ['Write an email asking whether they are still interested.', 'Schreib eine E-Mail, ob sie noch Interesse haben.'], ['Why are we offering Ultramid A3WG6?', 'Warum bieten wir Ultramid A3WG6 an?']] },

        { id: 'C-102', type: 'req', cust: 'Medplast Tuttlingen GmbH', kind: 'svc', goal: 'svc', intents: ['docs'], channel: 'email', at: 2, status: 'ready', signal: 'service', path: 'short',
          mail: { subj: ['CoA lot 26-0412 · Wonderlite PC-110', 'CoA Charge 26-0412 · Wonderlite PC-110'], att: ['CoA_26-0412_Wonderlite_PC-110.pdf'],
            body: [`Good morning Dr. Felix Haag,\n\nplease find attached the certificate of analysis for lot 26-0412 (Wonderlite PC-110) from the delivery on ${short(day(-6))}.\n\nFrom now on the certificate is attached to every delivery automatically, so you no longer need to ask for it.\n\nKind regards\n${sig()}`, `Guten Morgen Dr. Felix Haag,\n\nanbei das Analysenzertifikat zur Charge 26-0412 (Wonderlite PC-110) aus der Lieferung vom ${short(day(-6))}.\n\nAb sofort hängt das Zertifikat jeder Lieferung automatisch an, Sie müssen es nicht mehr anfragen.\n\nViele Grüße\n${sig()}`] },
          call: [['The CoA is on its way by email', 'Das CoA ist per E-Mail unterwegs'], ['From now on it comes with every delivery. Does that work?', 'Ab jetzt kommt es mit jeder Lieferung. Passt das so?']],
          title: ['CoA for lot 26-0412 · Wonderlite PC-110', 'CoA zur Charge 26-0412 · Wonderlite PC-110'],
          msg: ['Good morning Ms Hoffmann, could you send us the certificate of analysis for lot 26-0412 (Wonderlite PC-110) from last week\'s delivery? Thank you, F. Haag', 'Guten Morgen Frau Hoffmann, könnten Sie uns das Analysenzertifikat zur Charge 26-0412 (Wonderlite PC-110) aus der Lieferung von letzter Woche schicken? Danke, F. Haag'],
          steps: S3([['Request received by email', 'Anfrage per E-Mail erhalten'], ['Intent: document, no offer needed', 'Absicht: Dokument, kein Angebot nötig']], [['CoA found for lot 26-0412 (SAP QM)', 'CoA zur Charge 26-0412 gefunden (SAP QM)'], ['Send it with a short reply', 'Mit kurzer Antwort senden']], [['Done', 'Erledigt']]), cur: 3,
          coach: ['Service, not sales: answer fast and keep it short. Medplast needs the certificate with every delivery, so it is attached by default from now on.', 'Service, kein Verkauf: schnell und kurz antworten. Medplast braucht das Zertifikat zu jeder Lieferung, deshalb hängt es ab jetzt standardmäßig an.'],
          next: ['Send the CoA to Dr. Felix Haag', 'CoA an Dr. Felix Haag senden'], why: ['Document found and checked against the lot number. Reply drafted.', 'Dokument gefunden und mit der Chargennummer abgeglichen. Antwort entworfen.'],
          act: ['paper-plane-tilt', ['Approve & send CoA', 'CoA freigeben & senden'], 'send'], done: { cur: 4, status: 'done', log: ['CoA for lot 26-0412 sent to Dr. Felix Haag', 'CoA zur Charge 26-0412 an Dr. Felix Haag gesendet'] },
          chips: [['Summarise Medplast before I reply.', 'Fasse Medplast zusammen, bevor ich antworte.']] },

        { id: 'C-103', type: 'req', cust: 'Allgäu Gartengeräte GmbH', kind: 'com', goal: 'info', intents: ['price', 'future'], channel: 'email', at: 20, offer: allg?.id, status: 'open', signal: 'explore',
          mail: { subj: ['Price tiers PP copolymer · 1 / 3 / 5 t', 'Preisstaffel PP-Copolymer · 1 / 3 / 5 t'], att: ['Preisstaffel_PP_7032E3.pdf'],
            body: [`Good afternoon Rita Waibel,\n\nthank you for your request. Here are the tiers for PP copolymer natural (PP 7032E3), FCA Hamburg:\n${tierTxt(false)}\n\nSo I can send you a firm offer, three short questions:\n1. Which quantity is realistic for the first order?\n2. When would you need the first delivery?\n3. Does it go to Kempten or to another site?\n\nKind regards\n${sig()}`, `Guten Tag Rita Waibel,\n\nvielen Dank für Ihre Anfrage. Hier die Staffel für PP-Copolymer natur (PP 7032E3), FCA Hamburg:\n${tierTxt(true)}\n\nDamit ich Ihnen ein festes Angebot machen kann, drei kurze Fragen:\n1. Welche Menge ist für die erste Bestellung realistisch?\n2. Wann bräuchten Sie die erste Lieferung?\n3. Geht die Ware nach Kempten oder an einen anderen Standort?\n\nViele Grüße\n${sig()}`] },
          title: ['Price tiers 1 / 3 / 5 t · PP copolymer', 'Preisstaffel 1 / 3 / 5 t · PP-Copolymer'],
          msg: ['Hello Ms Hoffmann, for our planning: what would 1, 3 or 5 t of PP copolymer natural cost? We are looking at materials for a new garden-tool range for 2027. Rita Waibel', 'Hallo Frau Hoffmann, für unsere Planung: Was würden 1, 3 oder 5 t PP-Copolymer natur kosten? Wir prüfen Werkstoffe für eine neue Gartengeräte-Serie 2027. Rita Waibel'],
          steps: S3([['Request received by email', 'Anfrage per E-Mail erhalten'], ['Intent: price check, exploring', 'Absicht: Preisinfo, sondierend'], ['Missing: date and delivery point', 'Fehlt: Termin und Lieferort']], [['Send tiers 1 / 3 / 5 t', 'Staffel 1 / 3 / 5 t senden']], [['Light check-in in 3 weeks', 'Lockeres Nachfassen in 3 Wochen'], ['Opportunity only once there is a real need', 'Opportunity erst bei echtem Bedarf']]), cur: 3,
          qual: { product: [1, ['PP copolymer natural, PP 7032E3 fits', 'PP-Copolymer natur, PP 7032E3 passt']], qty: [2, ['1, 3 or 5 t: tiers only', '1, 3 oder 5 t: nur Staffel'], ['Which quantity is realistic for the first order?', 'Welche Menge ist für die erste Bestellung realistisch?']], price: [1, ['Tiers from today\'s list price', 'Staffel aus dem heutigen Listenpreis']],
            delivery: [0, ['Date and delivery point unknown', 'Termin und Lieferort unbekannt'], ['When would you need the first lot, and delivered to Kempten?', 'Wann bräuchten Sie die erste Menge, und geliefert nach Kempten?']], intent: [2, ['Exploring for a 2027 range', 'Sondiert für eine Serie 2027'], ['When do you decide on the material for the new range?', 'Wann entscheiden Sie über den Werkstoff für die neue Serie?']] },
          coach: ['Exploring, not buying yet. Send the tiers with a short note and ask about the project timeline. A hard follow-up now would cost goodwill; a check-in in three weeks is enough.', 'Sondiert, kauft noch nicht. Staffel mit kurzer Notiz senden und nach dem Projektzeitplan fragen. Hartes Nachfassen würde jetzt Vertrauen kosten; ein Kontakt in drei Wochen reicht.'],
          next: ['Send the price scale to Rita Waibel', 'Preisstaffel an Rita Waibel senden'], why: ['Only a price question for 1, 3 or 5 t: a scale, not an offer. Quantity and date come later.', 'Nur eine Preisfrage für 1, 3 oder 5 t: Staffel statt Angebot. Menge und Termin kommen später.'],
          act: ['paper-plane-tilt', ['Send tiers', 'Staffel senden'], 'send'], done: { cur: 4, status: 'answered', log: ['Price tiers 1 / 3 / 5 t sent, check-in set in 3 weeks', 'Preisstaffel 1 / 3 / 5 t gesendet, Kontakt in 3 Wochen gesetzt'], task: { in: 21, kind: 'rel', act: ['Check in on the 2027 garden-tool range', 'Zur Gartengeräte-Serie 2027 nachfragen'], why: ['Price tiers sent 3 weeks ago, customer exploring', 'Preisstaffel vor 3 Wochen gesendet, Kunde sondiert'] } },
          answers: { why: ['They are exploring for 2027 and said so. Pushing for an order now reads as pressure and makes it harder to be in the room when they choose the material. Useful information now, a check-in in three weeks.', 'Sie sondieren für 2027 und sagen das auch. Jetzt auf eine Bestellung zu drängen wirkt wie Druck und macht es schwerer, bei der Werkstoffwahl dabei zu sein. Jetzt nützliche Information, in drei Wochen ein Kontakt.'] },
          chips: [['Why not push for an order now?', 'Warum jetzt nicht auf eine Bestellung drängen?']] },

        { id: 'C-104', type: 'req', cust: 'Hanse Closures GmbH', kind: 'svc', goal: 'svc', intents: ['delivery'], channel: null, at: 1, status: 'open', signal: 'service', path: 'short',
          src: [['sap', ['Inbound · ExxonMobil advice', 'Zulauf · Avis ExxonMobil'], 1, ['ETA change: container with PP 7032E3', 'ETA-Änderung: Container mit PP 7032E3'], [`Container MSKU 448812 · PP 7032E3 · ${tons(ppLot()?.qty || 48000)}\nETA Hamburg: ${short(e.old)} → ${short(e.now)}\nAffected customer orders: ${delayed().map(nm).join(', ')}`, `Container MSKU 448812 · PP 7032E3 · ${tons(ppLot()?.qty || 48000)}\nETA Hamburg: ${short(e.old)} → ${short(e.now)}\nBetroffene Kundenaufträge: ${delayed().map(nm).join(', ')}`]]],
          mail: { subj: ['Your PP 7032E3: new arrival date', 'Ihr PP 7032E3: neuer Liefertermin'], body: [`Good morning Merle Jansen,\n\na quick heads-up before you plan around it: the container with your ${tons(pp)} PP 7032E3 now arrives on ${short(e.now)} instead of ${short(e.old)}.\n\nIf you need part of it earlier, we can deliver from stock in Hamburg. Just tell me the quantity.\n\nKind regards\n${sig()}`, `Guten Morgen Merle Jansen,\n\nkurze Info, bevor Sie damit planen: Der Container mit Ihren ${tons(pp)} PP 7032E3 kommt jetzt am ${short(e.now)} statt am ${short(e.old)}.\n\nWenn Sie einen Teil früher brauchen, liefern wir aus dem Lager Hamburg. Sagen Sie mir einfach die Menge.\n\nViele Grüße\n${sig()}`] },
          call: [[`New date: ${short(e.now)} instead of ${short(e.old)}`, `Neuer Termin: ${short(e.now)} statt ${short(e.old)}`], ['Too late for their week? Offer stock from Hamburg right away', 'Zu spät für ihre Woche? Gleich Lagerware aus Hamburg anbieten']],
          title: [`PP 7032E3 container arrives 3 days later`, `PP 7032E3-Container kommt 3 Tage später`],
          steps: S3([['ETA change detected in SAP inbound', 'ETA-Änderung im SAP-Zulauf erkannt'], [`${delayed().length} customer orders affected`, `${delayed().length} Kundenaufträge betroffen`]], [['Update drafted for WhatsApp', 'Info für WhatsApp entworfen'], ['Customer informed', 'Kunde informiert']], [['Done', 'Erledigt']]), cur: 2,
          coach: ['Tell them before they ask. If the new date is too late for their week, offer the stock alternative right away instead of only reporting the delay.', 'Informieren, bevor sie fragen. Wenn der neue Termin für ihre Woche zu spät ist, gleich die Lageralternative anbieten, statt nur die Verspätung zu melden.'],
          next: ['Send the delay update to Merle Jansen', 'Verspätungsinfo an Merle Jansen senden'], why: [`ETA moved from ${short(e.old)} to ${short(e.now)}. Their ${tons(pp)} PP are on that container.`, `ETA von ${short(e.old)} auf ${short(e.now)} verschoben. Ihre ${tons(pp)} PP sind in diesem Container.`],
          draft: [`Hi Ms Jansen, a quick heads-up: the container with your ${tons(pp)} PP 7032E3 now arrives on ${short(e.now)} instead of ${short(e.old)}. If you need part of it earlier, we can deliver from stock in Hamburg. Best, Lena`, `Hallo Frau Jansen, kurze Info vorab: Der Container mit Ihren ${tons(pp)} PP 7032E3 kommt jetzt am ${short(e.now)} statt am ${short(e.old)}. Wenn Sie einen Teil früher brauchen, liefern wir aus dem Lager Hamburg. Viele Grüße, Lena`],
          act: ['whatsapp-logo', ['Review & send update', 'Prüfen & Info senden'], 'send'], done: { cur: 4, status: 'done', log: ['Delay update sent by WhatsApp to Merle Jansen', 'Verspätungsinfo per WhatsApp an Merle Jansen gesendet'] },
          chips: [['Write the update as an email instead.', 'Schreib die Info lieber als E-Mail.']] },

        { id: 'C-105', type: 'opp', cust: 'Folienwerk Nordheide GmbH', kind: 'com', goal: 'info', intents: ['quote'], channel: 'email', at: 9 * 24, offer: fol?.id, value: fol?.value, status: 'negotiation', signal: 'hesitate', fromMsgs: true,
          src: [['calls', 'Ole Petersen', 3 * 24, ['Follow-up call: price objection', 'Nachfassanruf: Preiseinwand'], ['Ole Petersen: "Your offer is 4 % above another one. We decide this week."\nNo competitor named. The delivery date was not discussed.', 'Ole Petersen: „Ihr Angebot liegt 4 % über einem anderen. Wir entscheiden diese Woche.“\nKein Wettbewerber genannt. Der Liefertermin war kein Thema.']]],
          mail: { subj: [`Your offer ${fol?.id || ''}: a firm date instead of a discount`, `Ihr Angebot ${fol?.id || ''}: fester Termin statt Rabatt`], body: [`Good afternoon Ole Petersen,\n\nthank you for being open about the price. Before you decide, two options that give you certainty:\n1. We confirm a firm delivery date for the Exceed 1018HA from inbound today.\n2. You order part now and call off the rest later at today's price.\n\nWhile PE is tight, a firm date is often worth more than a few percent. Would one of the two work for you?\n\nKind regards\n${sig()}`, `Guten Tag Ole Petersen,\n\ndanke für Ihr offenes Wort zum Preis. Bevor Sie entscheiden, zwei Optionen, die Ihnen Sicherheit geben:\n1. Wir bestätigen Ihnen heute einen festen Liefertermin für das Exceed 1018HA aus dem Zulauf.\n2. Sie bestellen einen Teil jetzt und rufen den Rest später zum heutigen Preis ab.\n\nSolange PE knapp ist, ist ein fester Termin oft mehr wert als ein paar Prozent. Passt eine der beiden Varianten?\n\nViele Grüße\n${sig()}`] },
          call: [['Ask what the 4 % compares: same grade, same date?', 'Fragen, womit die 4 % verglichen werden: gleiche Type, gleicher Termin?'], ['Offer a firm date for the inbound stock', 'Festen Termin für die Zulaufmenge anbieten'], ['Split the order: part now, the rest as a call-off at today\'s price', 'Bestellung teilen: ein Teil jetzt, der Rest als Abruf zum heutigen Preis']],
          title: ['LLDPE film 72 t · Exceed 1018HA', 'LLDPE-Folie 72 t · Exceed 1018HA'],
          steps: S3([['Request received by email', 'Anfrage per E-Mail erhalten'], ['Qualified: 72 t, food grade', 'Qualifiziert: 72 t, Lebensmittelqualität'], ['Matched inbound Exceed 1018HA', 'Zulauf Exceed 1018HA gematcht']], [['Offer drafted, checks passed', 'Angebot entworfen, Prüfungen ok'], ['Sent 9 days ago', 'Vor 9 Tagen gesendet']], [['Follow-up call: price objection', 'Nachfassanruf: Preiseinwand'], ['Customer decision', 'Entscheidung des Kunden'], ['Won or lost, with the reason', 'Gewonnen oder verloren, mit Grund']]), cur: 6,
          coach: ['Hesitation on price: they said 4 % above another offer. Before any discount, sell certainty. While PE is tight, a firm date for the inbound stock is worth more than 4 %.', 'Zögern beim Preis: 4 % über einem anderen Angebot. Vor jedem Rabatt Sicherheit verkaufen. Solange PE knapp ist, ist ein fester Termin für die Zulaufmenge mehr wert als 4 %.'],
          next: ['Call Ole Petersen for the decision', 'Ole Petersen wegen der Entscheidung anrufen'], why: ['Price objection 3 days ago, decision expected this week.', 'Preiseinwand vor 3 Tagen, Entscheidung diese Woche erwartet.'],
          act: ['phone', ['Call Ole Petersen', 'Ole Petersen anrufen'], 'call'],
          answers: { discount: [`Three options that keep margin: 1) a firm date for the inbound stock, confirmed today; 2) split the order: part now, the rest as a call-off at today's price; 3) a one-month price hold on part of the volume. A flat 4 % cut would cost about ${eur((fol?.value || 100000) * 0.04)}.`, `Drei Optionen, die Marge halten: 1) ein fester Termin für die Zulaufmenge, heute bestätigt; 2) die Bestellung teilen: ein Teil jetzt, der Rest als Abruf zum heutigen Preis; 3) eine einmonatige Preisbindung auf einen Teil der Menge. Pauschal 4 % weniger würden etwa ${eur((fol?.value || 100000) * 0.04)} kosten.`] },
          chips: [['They chose another supplier. Close this and remind me to call in six weeks.', 'Sie haben einen anderen Lieferanten gewählt. Schließen und in sechs Wochen an einen Anruf erinnern.'], ['What can I offer instead of a discount?', 'Was kann ich statt Rabatt anbieten?']] },

        { id: 'C-106', type: 'req', cust: 'Elbtal Elektrotechnik GmbH', kind: 'com', goal: 'info', intents: ['tech', 'quote'], channel: 'email', at: 26, offer: elb?.id, status: 'open', signal: 'buy',
          mail: { cc: 'sven.martens@biesterfeld-demo.de', subj: ['Lupoy GN5001RFH: V-0 confirmed, glow wire in review', 'Lupoy GN5001RFH: V-0 bestätigt, Glühdraht in Prüfung'], att: ['Datenblatt_Lupoy_GN5001RFH.pdf'],
            body: [`Good afternoon Katrin Vogt,\n\nthank you for your request. Where we stand on Lupoy GN5001RFH (PC/ABS V-0 black):\n- UL 94 V-0 at 1.5 mm: confirmed by the data sheet (attached).\n- GWIT 775 °C: product management is checking the producer's test report. You will have the answer by Wednesday.\n- Availability: 3 t in stock, 18 t more inbound ${wk(5)}. Your 9 t from ${wk(6)} work.\n\nAs soon as the glow-wire value is confirmed, I will send you the offer.\n\nKind regards\n${sig()}`, `Guten Tag Katrin Vogt,\n\nvielen Dank für Ihre Anfrage. Der Stand zu Lupoy GN5001RFH (PC/ABS V-0 schwarz):\n- UL 94 V-0 bei 1,5 mm: laut Datenblatt bestätigt (anbei).\n- GWIT 775 °C: Das Produktmanagement prüft den Prüfbericht des Herstellers. Sie haben die Antwort bis Mittwoch.\n- Verfügbarkeit: 3 t ab Lager, weitere 18 t im Zulauf ${wk(5)}. Ihre 9 t ab ${wk(6)} sind machbar.\n\nSobald der Glühdrahtwert bestätigt ist, schicke ich Ihnen das Angebot.\n\nViele Grüße\n${sig()}`] },
          call: [['V-0 at 1.5 mm is confirmed by the data sheet', 'V-0 bei 1,5 mm ist laut Datenblatt bestätigt'], ['GWIT 775 °C: do not guess. Product management answers by Wednesday', 'GWIT 775 °C: nicht raten. Das Produktmanagement antwortet bis Mittwoch'], ['Can the first 3 t come from stock and the rest a week later?', 'Können die ersten 3 t aus dem Lager kommen und der Rest eine Woche später?']],
          title: ['PC/ABS V-0 for a new housing: glow wire 775 °C?', 'PC/ABS V-0 für ein neues Gehäuse: Glühdraht 775 °C?'],
          msg: [`Hello Ms Hoffmann, for our new charger housing we need PC/ABS V-0 black, about 9 t from ${wk(6)}. Does Lupoy GN5001RFH reach UL 94 V-0 at 1.5 mm and GWIT 775 °C? We need both for the approval. Katrin Vogt`, `Hallo Frau Hoffmann, für unser neues Ladegerätegehäuse brauchen wir PC/ABS V-0 schwarz, etwa 9 t ab ${wk(6)}. Erreicht Lupoy GN5001RFH UL 94 V-0 bei 1,5 mm und GWIT 775 °C? Wir brauchen beides für die Zulassung. Katrin Vogt`],
          steps: S3([['Question received by email', 'Frage per E-Mail erhalten'], ['Data sheet: V-0 at 1.5 mm confirmed', 'Datenblatt: V-0 bei 1,5 mm bestätigt'], ['Gap: GWIT 775 °C not in the library', 'Lücke: GWIT 775 °C nicht in der Bibliothek']], [['Ask product management, with context', 'Produktmanagement fragen, mit Kontext'], ['Verified answer to the customer', 'Geprüfte Antwort an den Kunden']], [['Offer 9 t once the spec fits', 'Angebot über 9 t, sobald die Spezifikation passt']]), cur: 3,
          qual: { product: [1, ['PC/ABS V-0 black, Lupoy GN5001RFH', 'PC/ABS V-0 schwarz, Lupoy GN5001RFH']], qty: [1, ['9 t', '9 t']], price: [1, ['List 3.10 €/kg', 'Liste 3,10 €/kg']], delivery: [2, [`Need ${wk(6)}: 3 t stock, rest inbound ${wk(5)}`, `Bedarf ${wk(6)}: 3 t Lager, Rest Zulauf ${wk(5)}`], ['Can the first 3 t come from stock and the rest a week later?', 'Können die ersten 3 t aus dem Lager kommen und der Rest eine Woche später?']],
            intent: [1, ['Buying, if the spec fits', 'Kaufabsicht, wenn die Spezifikation passt']], spec: [0, ['GWIT 775 °C not verified', 'GWIT 775 °C nicht geprüft'], ['Product management checks the producer\'s test report', 'Produktmanagement prüft den Prüfbericht des Herstellers']] },
          coach: ['Don\'t answer the glow-wire value from memory. The data sheet confirms V-0, not GWIT. Product management has the producer\'s test report; ask with the full thread so nobody explains it twice.', 'Den Glühdrahtwert nicht aus dem Gedächtnis beantworten. Das Datenblatt bestätigt V-0, nicht GWIT. Das Produktmanagement hat den Prüfbericht des Herstellers; mit dem ganzen Verlauf fragen, damit niemand es zweimal erklären muss.'],
          next: ['Ask product management about GWIT', 'Produktmanagement zu GWIT fragen'], why: ['Customer waiting since yesterday; the gap is a single value.', 'Kunde wartet seit gestern; die Lücke ist ein einzelner Wert.'],
          act: ['user-switch', ['Ask product manager', 'Produktmanager fragen'], 'send'], done: { cur: 4, status: 'waiting', log: ['Question sent to Sven Martens with the thread and data sheet', 'Frage mit Verlauf und Datenblatt an Sven Martens gesendet'], toast: ['Sent to Sven Martens with the full context. Customer told to expect an answer by Wednesday.', 'Mit vollem Kontext an Sven Martens gesendet. Kunde weiß: Antwort bis Mittwoch.'] },
          answers: { why: ['Lupoy GN5001RFH is the PC/ABS V-0 black in our range: 3 t in stock, 18 t inbound, list 3.10 €/kg. The data sheet confirms UL 94 V-0 at 1.5 mm. The glow-wire value is the only open point.', 'Lupoy GN5001RFH ist das PC/ABS V-0 schwarz in unserem Sortiment: 3 t Lager, 18 t Zulauf, Liste 3,10 €/kg. Das Datenblatt bestätigt UL 94 V-0 bei 1,5 mm. Offen ist nur der Glühdrahtwert.'] },
          chips: [['The customer says it does not meet their spec. Find out why.', 'Der Kunde sagt, es erfüllt seine Spezifikation nicht. Finde heraus, warum.'], ['Why Lupoy GN5001RFH?', 'Warum Lupoy GN5001RFH?']] },

        { id: 'C-107', type: 'opp', cust: 'Spessart Möbelbeschläge GmbH', kind: 'com', goal: 'info', intents: ['outbound'], channel: null, at: 3, status: 'qualifying', signal: 'explore',
          src: [['sap', ['Order history', 'Kaufhistorie'], 3, ['Reorder overdue', 'Nachbestellung überfällig'], ['Hostaform C 9021: about 6 t every 6 weeks since 2023.\nLast delivery 11 weeks ago (delivery note 80012734).\nThe expected order is 5 weeks overdue.', 'Hostaform C 9021: rund 6 t alle 6 Wochen seit 2023.\nLetzte Lieferung vor 11 Wochen (Lieferschein 80012734).\nDie erwartete Bestellung ist 5 Wochen überfällig.']]],
          mail: { subj: ['Hostaform C 9021 for your fittings', 'Hostaform C 9021 für Ihre Beschläge'], body: [`Good morning Bernd Kraus,\n\nyour last delivery of Hostaform C 9021 was eleven weeks ago; usually you order about every six weeks. How is the fittings season going?\n\nPOM is tight at the moment. If you need material in the coming weeks, just tell me the quantity and I will reserve it for you.\n\nKind regards\n${sig()}`, `Guten Morgen Bernd Kraus,\n\nIhre letzte Lieferung Hostaform C 9021 ist jetzt elf Wochen her, sonst bestellen Sie etwa alle sechs Wochen. Wie läuft die Beschlagsaison bei Ihnen?\n\nPOM ist gerade knapp. Wenn Sie in den nächsten Wochen Material brauchen, sagen Sie mir kurz die Menge, dann reserviere ich sie für Sie.\n\nViele Grüße\n${sig()}`] },
          call: [['"How is the fittings season going?"', '„Wie läuft die Beschlagsaison?“'], ['If volume moved to another supplier: ask why', 'Falls Menge zu einem anderen Lieferanten ging: nach dem Grund fragen'], ['POM is tight: confirm quantities with product management before promising', 'POM ist knapp: Mengen vor einer Zusage mit dem Produktmanagement klären']],
          title: ['Reorder overdue · POM', 'Nachbestellung überfällig · POM'],
          steps: S3([['Signal: POM reorder 5 weeks overdue', 'Signal: POM-Nachbestellung 5 Wochen überfällig'], ['Call: ask how business is going', 'Anruf: nach dem Geschäft fragen']], [['Offer or note', 'Angebot oder Notiz']], [['Next check-in', 'Nächster Kontakt']]), cur: 1,
          coach: ['Open with their business, not a price: "How is the fittings season going?" If volume moved to another supplier, ask why. POM is tight right now, so confirm quantities with product management before you promise any.', 'Mit ihrem Geschäft einsteigen, nicht mit dem Preis: „Wie läuft die Beschlagsaison?“ Falls Menge zu einem anderen Lieferanten ging, nach dem Grund fragen. POM ist gerade knapp, daher Mengen vor einer Zusage mit dem Produktmanagement klären.'],
          next: ['Call Bernd Kraus about POM', 'Bernd Kraus wegen POM anrufen'], why: ['Orders POM every 6 weeks; last order 11 weeks ago.', 'Bestellt POM alle 6 Wochen; letzte Bestellung vor 11 Wochen.'],
          act: ['phone', ['Call Bernd Kraus', 'Bernd Kraus anrufen'], 'call'],
          chips: [['They moved to another supplier on price. Note it and remind me in two months.', 'Sie sind wegen des Preises zu einem anderen Lieferanten. Notieren und in zwei Monaten erinnern.']] },

        { id: 'C-108', type: 'opp', cust: 'Bodensee Präzisionsteile GmbH', kind: 'rel', goal: 'info', intents: ['future'], channel: null, at: 22, status: 'future', signal: 'explore',
          mail: { subj: ['POM data sheets for your new gear line', 'POM-Datenblätter für Ihre neue Zahnradlinie'], att: ['Datenblatt_Ultraform_N2320_003.pdf', 'Datenblatt_Hostaform_C_9021.pdf'],
            body: [`Good afternoon Marco Steiner,\n\nthank you for the tour yesterday with Carina Weiß. As discussed, here are the data sheets for Ultraform N2320 003 and Hostaform C 9021. We are happy to send a 25 kg sample of each for your first trials.\n\nOne question for our planning: who decides on the material in January, and which tests do you need before then?\n\nKind regards\n${sig()}`, `Guten Tag Marco Steiner,\n\nvielen Dank für den Rundgang gestern mit Carina Weiß. Wie besprochen anbei die Datenblätter für Ultraform N2320 003 und Hostaform C 9021. Gern schicken wir Ihnen von beiden ein 25-kg-Muster für erste Versuche.\n\nEine Frage für unsere Planung: Wer entscheidet im Januar über den Werkstoff, und welche Prüfungen brauchen Sie bis dahin?\n\nViele Grüße\n${sig()}`] },
          call: [['Who signs off the material in January?', 'Wer gibt im Januar den Werkstoff frei?'], ['Which tests do they need before then?', 'Welche Prüfungen brauchen sie bis dahin?'], ['Sample: 25 kg of each, to which address?', 'Muster: je 25 kg, an welche Adresse?']],
          title: ['New POM gear line from Q2 2027', 'Neue POM-Zahnradlinie ab Q2 2027'],
          msg: ['Visit note, Carina Weiß: Marco Steiner showed us the hall for a new gear line. Start Q2 2027, POM, around 60 t a year, maybe PA66 GF for housings. Material decision in January. Wants data sheets and a sample.', 'Besuchsnotiz, Carina Weiß: Marco Steiner hat uns die Halle für eine neue Zahnradlinie gezeigt. Start Q2 2027, POM, rund 60 t pro Jahr, evtl. PA66 GF für Gehäuse. Werkstoffentscheidung im Januar. Möchte Datenblätter und ein Muster.'], from: 'Carina Weiß',
          steps: S3([['Visit note captured by field sales', 'Besuchsnotiz vom Außendienst erfasst'], ['Future demand: about 60 t POM a year', 'Künftiger Bedarf: rund 60 t POM pro Jahr']], [['Inside sales briefed', 'Innendienst informiert'], ['Data sheets and a sample offer', 'Datenblätter und Musterangebot']], [['Check-in in 8 weeks', 'Kontakt in 8 Wochen'], ['Quote once the line is specified', 'Angebot, sobald die Linie spezifiziert ist']]), cur: 3,
          coach: ['No quote yet; there is nothing to price. Send data sheets for Ultraform and Hostaform, offer a sample, and ask who signs off the material in January. Never Grupa Azoty for this customer.', 'Noch kein Angebot; es gibt nichts zu bepreisen. Datenblätter für Ultraform und Hostaform senden, ein Muster anbieten und fragen, wer im Januar den Werkstoff freigibt. Für diesen Kunden nie Grupa Azoty.'],
          next: ['Send POM data sheets and offer a sample', 'POM-Datenblätter senden und Muster anbieten'], why: ['Captured by Carina Weiß yesterday; material decision in January.', 'Gestern von Carina Weiß erfasst; Werkstoffentscheidung im Januar.'],
          act: ['file-text', ['Send data sheets', 'Datenblätter senden'], 'send'], done: { cur: 4, status: 'future', log: ['Data sheets for Ultraform N2320 003 and Hostaform C 9021 sent, sample offered', 'Datenblätter Ultraform N2320 003 und Hostaform C 9021 gesendet, Muster angeboten'], task: { in: 56, kind: 'rel', act: ['Check in on the POM gear line', 'Zur POM-Zahnradlinie nachfragen'], why: ['Material decision planned for January', 'Werkstoffentscheidung für Januar geplant'] } },
          chips: [['Plan the next steps for the new line.', 'Plane die nächsten Schritte für die neue Linie.']] },

        { id: 'C-109', type: 'req', cust: 'Weser Getränketechnik GmbH', kind: 'svc', goal: 'svc', intents: ['delivery'], channel: 'email', at: 3, status: 'ready', signal: 'service', path: 'short',
          mail: { subj: [`Your PET for ${wk(2)}`, `Ihr PET für ${wk(2)}`], body: [`Good morning Anja Wolters,\n\nfor ${wk(2)} we have ${tons(petStock + petIn)} Ramapet N180 planned for you: ${tons(petStock)} from stock in Hamburg, ${tons(petIn)} inbound ${wk(petWk)}.\n\nPET is still under allocation. For any extra quantity I will ask product management and get back to you.\n\nKind regards\n${sig()}`, `Guten Morgen Anja Wolters,\n\nfür ${wk(2)} sind ${tons(petStock + petIn)} Ramapet N180 für Sie eingeplant: ${tons(petStock)} ab Lager Hamburg, ${tons(petIn)} im Zulauf ${wk(petWk)}.\n\nPET steht weiter unter Allokation. Für zusätzliche Mengen frage ich beim Produktmanagement an und melde mich.\n\nViele Grüße\n${sig()}`] },
          call: [[`${tons(petStock)} from stock, ${tons(petIn)} inbound ${wk(petWk)}`, `${tons(petStock)} ab Lager, ${tons(petIn)} im Zulauf ${wk(petWk)}`], ['Do not promise more until product management releases it', 'Mehr erst zusagen, wenn das Produktmanagement es freigibt']],
          title: ['When does our PET arrive?', 'Wann kommt unser PET?'],
          msg: [`Good morning, can you tell us when the PET for ${wk(2)} arrives? We need to plan the lines. Anja Wolters`, `Guten Morgen, können Sie uns sagen, wann das PET für ${wk(2)} kommt? Wir müssen die Linien planen. Anja Wolters`],
          steps: S3([['Question received by email', 'Frage per E-Mail erhalten'], [`Found: ${tons(petStock)} from stock, ${tons(petIn)} inbound ${wk(petWk)}`, `Gefunden: ${tons(petStock)} aus Lager, ${tons(petIn)} Zulauf ${wk(petWk)}`]], [['Answer drafted', 'Antwort entworfen']], [['Done', 'Erledigt']]), cur: 2,
          coach: [`PET is under allocation and product management decides it. Confirm the ${tons(petStock + petIn)} that are covered; do not promise the rest until the allocation is approved.`, `PET ist unter Allokation, und das Produktmanagement entscheidet. Die gedeckten ${tons(petStock + petIn)} bestätigen; den Rest erst zusagen, wenn die Allokation freigegeben ist.`],
          next: ['Send the delivery dates to Anja Wolters', 'Liefertermine an Anja Wolters senden'], why: ['Dates found in SAP; answer drafted.', 'Termine in SAP gefunden; Antwort entworfen.'],
          act: ['paper-plane-tilt', ['Send answer', 'Antwort senden'], 'send'], done: { cur: 3, status: 'done', log: ['Delivery dates sent to Anja Wolters', 'Liefertermine an Anja Wolters gesendet'] } },

        { id: 'C-110', type: 'opp', cust: 'Main-Tauber Fahrzeugteile GmbH', kind: 'com', goal: 'info', intents: ['quote'], channel: 'crm', at: 2 * 24, offer: mt?.id, value: mt?.value, status: 'sent', signal: 'buy', fromMsgs: true,
          title: ['PA6 GF30 15 t + PPS GF40 2 t', 'PA6 GF30 15 t + PPS GF40 2 t'],
          steps: S3([['Request from Biesterfeld CRM', 'Anfrage aus dem Biesterfeld CRM'], ['Qualified: approved grades', 'Qualifiziert: freigegebene Typen'], ['Matched stock and inbound', 'Bestand und Zulauf gematcht']], [['Offer drafted, checks passed', 'Angebot entworfen, Prüfungen ok'], ['Sent 2 days ago', 'Vor 2 Tagen gesendet']], [['Follow up', 'Nachfassen'], ['Customer decision', 'Entscheidung des Kunden'], ['Won or lost, with the reason', 'Gewonnen oder verloren, mit Grund']]), cur: 5,
          coach: ['Nothing to do yet. The follow-up is set for day four; if they get in touch earlier, it moves up.', 'Noch nichts zu tun. Das Nachfassen ist für Tag vier gesetzt; meldet sich der Kunde früher, rückt es nach vorn.'],
          next: [`Follow up on ${short(day(2))}`, `Nachfassen am ${short(day(2))}`], why: ['Follow-up set automatically four days after sending.', 'Nachfassen automatisch vier Tage nach dem Versand gesetzt.'],
          act: ['phone', ['Follow up now', 'Jetzt nachfassen'], 'call'],
          chips: [['Heike Rösch just confirmed the order.', 'Heike Rösch hat gerade den Auftrag bestätigt.']] },

        { id: 'C-111', type: 'req', cust: 'Rheinform Kunststofftechnik GmbH', kind: 'com', goal: 'svc', intents: ['calloff'], channel: 'crm', at: 5, status: 'ready', signal: 'buy', path: 'short', fromMsgs: 'crm',
          send: ['Approve order & send confirmation', 'Auftrag freigeben & bestätigen'],
          mail: { subj: ['Order confirmation: Zytel 70G30HSL BK031', 'Auftragsbestätigung: Zytel 70G30HSL BK031'], att: ['AB_Zytel_70G30HSL_BK031.pdf'], body: [`Good morning Jana Kessler,\n\nwe confirm your call-off against the framework agreement: ${tons(rhein)} Zytel 70G30HSL BK031, delivered ${wk(2)} from stock in Hamburg. We are securing the remaining ${tons(18000 - rhein)} with the producer and will confirm that date by Friday.\n\nKind regards\n${sig()}`, `Guten Morgen Jana Kessler,\n\nwir bestätigen Ihren Abruf aus dem Rahmenvertrag: ${tons(rhein)} Zytel 70G30HSL BK031, Lieferung ${wk(2)} ab Lager Hamburg. Die restlichen ${tons(18000 - rhein)} sichern wir gerade beim Hersteller ab; den Termin bestätigen wir Ihnen bis Freitag.\n\nViele Grüße\n${sig()}`] },
          call: [[`${tons(rhein)} of 18 t confirmed from stock`, `${tons(rhein)} von 18 t ab Lager bestätigt`], ['Approved grade only: no substitute for the rest', 'Nur freigegebene Type: kein Ersatz für den Rest']],
          title: ['Call-off 18 t Zytel 70G30HSL', 'Abruf 18 t Zytel 70G30HSL'],
          steps: S3([['Call-off received in Biesterfeld CRM', 'Abruf im Biesterfeld CRM erhalten'], ['Approved grade matched, no substitute', 'Freigegebene Type gematcht, kein Ersatz']], [['Order to SAP after your click', 'Auftrag nach Ihrem Klick in SAP']], [['Done', 'Erledigt']]), cur: 2,
          coach: ['Routine: a framework call-off on an approved grade. Check the date and approve; no conversation needed. The uncovered rest goes to product management, not to a substitute.', 'Routine: ein Rahmenabruf auf eine freigegebene Type. Termin prüfen und freigeben; kein Gespräch nötig. Der ungedeckte Rest geht ans Produktmanagement, nicht an einen Ersatz.'],
          next: ['Approve the order in SAP', 'Auftrag in SAP freigeben'], why: [`${tons(rhein)} of 18 t covered by the approved grade; the rest is flagged to product management.`, `${tons(rhein)} von 18 t mit der freigegebenen Type gedeckt; der Rest ist ans Produktmanagement gemeldet.`],
          act: ['check', ['Approve order', 'Auftrag freigeben'], 'send'], done: { cur: 3, status: 'done', log: ['Order created in SAP after approval (demo)', 'Auftrag nach Freigabe in SAP angelegt (Demo)'] } },

        { id: 'C-112', type: 'req', cust: 'Ostsee Sanitär GmbH', kind: 'com', goal: 'info', intents: ['price'], channel: 'email', at: 30, offer: ost?.id, status: 'open', signal: 'explore', path: 'short',
          title: ['Price scale 1 / 3 / 5 t · ABS + PBT', 'Preisstaffel 1 / 3 / 5 t · ABS + PBT'],
          msg: ['Hello Ms Hoffmann, what do ABS HI121H and Celanex 2002-2 cost with you at the moment, as a scale for 1, 3 and 5 t? Just for our calculation, no order yet. Jörn Lübbe', 'Hallo Frau Hoffmann, was kosten ABS HI121H und Celanex 2002-2 aktuell bei Ihnen, gestaffelt nach 1, 3 und 5 t? Nur für unsere Kalkulation, noch kein Auftrag. Jörn Lübbe'],
          steps: S3([['Question received by email', 'Frage per E-Mail erhalten'], ['Intent: price for their calculation, no quantity', 'Absicht: Preis für die Kalkulation, keine Menge']], [['Send the scale 1 / 3 / 5 t', 'Staffel 1 / 3 / 5 t senden']], [['Opportunity only once a quantity follows', 'Opportunity erst, wenn eine Menge kommt']]), cur: 2,
          coach: ['A price question is not a purchase. Send the scale for 1, 3 and 5 t, promise no quantity, and do not chase. It becomes an opportunity once they name a quantity.', 'Eine Preisfrage ist kein Kauf. Staffel für 1, 3 und 5 t senden, keine Menge zusagen und nicht drängen. Zur Opportunity wird es erst, wenn eine Menge genannt wird.'],
          next: ['Send the price scale to Jörn Lübbe', 'Preisstaffel an Jörn Lübbe senden'], why: ['Only a price question for their calculation: a scale, not an offer.', 'Nur eine Preisfrage für die Kalkulation: Staffel statt Angebot.'],
          mail: ost ? { subj: [ctx.offerMail(ost).subj, ctx.offerMail(ost).subj], body: [ctx.offerMail(ost).body, ctx.offerMail(ost).body], att: [`Preisstaffel_${ost.id}.pdf`] } : null,
          call: [['Prices per tier: 1, 3 and 5 t', 'Preise je Staffel: 1, 3 und 5 t'], ['Ask when a quantity could follow, without pushing', 'Fragen, wann eine Menge kommen könnte, ohne zu drängen']],
          act: ['paper-plane-tilt', ['Send price scale', 'Staffel senden'], 'send'], done: { cur: 3, status: 'answered', log: ['Price scale 1 / 3 / 5 t sent', 'Preisstaffel 1 / 3 / 5 t gesendet'] } },

        // offer requests: the customer asked for an offer, the offer is drafted and checked, a person sends it
        offerCase('C-113', 'Sauerland Haushaltswaren GmbH', { title: ['PP copolymer 30 t + ABS 20 t', 'PP-Copolymer 30 t + ABS 20 t'],
          why: ['Asked by WhatsApp and email. Offer drafted; 2 checks to look at before sending.', 'Per WhatsApp und E-Mail angefragt. Angebot entworfen; 2 Prüfpunkte vor dem Versand ansehen.'],
          qual: { product: [1, ['PP 7032E3; ABS natural as Polylac (black via masterbatch)', 'PP 7032E3; ABS natur als Polylac (Schwarz per Masterbatch)']], qty: [1, ['30 t PP + 20 t ABS', '30 t PP + 20 t ABS']], price: [1, ['List price, margin above the floor', 'Listenpreis, Marge über der Untergrenze']], delivery: [1, [`PP ${wk(2)}, ABS from stock; 2 t ABS ${wk(6)}`, `PP ${wk(2)}, ABS ab Lager; 2 t ABS ${wk(6)}`]], intent: [1, ['Buying: asked for price per kg', 'Kaufabsicht: Preis pro kg erfragt']] },
          coach: ['They accept natural plus black masterbatch. PP is tight, so send today and ask for the order by Friday to keep the 30 t reserved. Say clearly that 2 t ABS arrive later.', 'Sie akzeptieren Natur plus Schwarz-Masterbatch. PP ist knapp: heute senden und um die Bestellung bis Freitag bitten, damit die 30 t reserviert bleiben. Klar sagen, dass 2 t ABS später kommen.'],
          chips: [['Why Polylac PA-765A for their ABS?', 'Warum Polylac PA-765A für ihr ABS?'], ['How much PP is still free?', 'Wie viel PP ist noch frei?']] }),
        offerCase('C-114', 'Harzer Steckverbinder GmbH', { title: ['PBT GF30 9 t + PA66 V-0 3 t + TPE 2 t', 'PBT GF30 9 t + PA66 V-0 3 t + TPE 2 t'],
          why: ['Three lines from CRM, WhatsApp and email. All matched; the offer is ready.', 'Drei Positionen aus CRM, WhatsApp und E-Mail. Alles gematcht; das Angebot steht.'],
          qual: { product: [1, ['Crastin SK605 (approved), Ultramid A3X2G5, Hytrel 4056', 'Crastin SK605 (freigegeben), Ultramid A3X2G5, Hytrel 4056']], qty: [1, ['9 t + 3 t + 2 t', '9 t + 3 t + 2 t']], price: [1, ['List price', 'Listenpreis']], delivery: [1, [`PBT inbound ${wk(3)}, PA66 from stock`, `PBT im Zulauf ${wk(3)}, PA66 ab Lager`]], intent: [1, ['Buying', 'Kaufabsicht']] },
          coach: [`Three small lines, one email. The PBT is their approved Crastin and arrives ${wk(3)}; say the date clearly. At the end, ask about PC/ABS V-0 for housings: 7 of 9 similar customers buy it.`, `Drei kleine Positionen, eine E-Mail. Das PBT ist ihr freigegebenes Crastin und kommt ${wk(3)}; den Termin klar nennen. Zum Schluss nach PC/ABS V-0 für Gehäuse fragen: 7 von 9 ähnlichen Kunden kaufen es.`],
          chips: [['When does the Crastin arrive?', 'Wann kommt das Crastin?']] }),
        offerCase('C-115', 'Bodensee Präzisionsteile GmbH', { title: ['POM 9 t · Ultraform N2320 003', 'POM 9 t · Ultraform N2320 003'],
          why: ['Call-off in CRM and a request on the phone. POM matched; PA6 GF30 black is not in stock.', 'Abruf im CRM und Anfrage am Telefon. POM gematcht; PA6 GF30 schwarz ist nicht am Lager.'],
          qual: { product: [1, ['Ultraform N2320 003, their approved POM', 'Ultraform N2320 003, ihr freigegebenes POM']], qty: [2, ['9 t of 10 t POM; 6 t PA6 GF30 open', '9 t von 10 t POM; 6 t PA6 GF30 offen'], ['Can the PA6 GF30 follow in two weeks?', 'Kann das PA6 GF30 in zwei Wochen folgen?']], price: [1, ['List price', 'Listenpreis']], delivery: [1, [`POM ${wk(2)}`, `POM ${wk(2)}`]], intent: [1, ['Buying', 'Kaufabsicht']] },
          coach: ['Never Grupa Azoty for Bodensee, so no Tarnamid for the PA6 GF30. Send the POM now and say the PA6 GF30 black follows separately once product management has a source.', 'Für Bodensee nie Grupa Azoty, also kein Tarnamid für das PA6 GF30. Das POM jetzt senden und sagen, dass das PA6 GF30 schwarz separat folgt, sobald das Produktmanagement eine Quelle hat.'],
          chips: [['Is there PA6 GF30 black anywhere?', 'Gibt es irgendwo PA6 GF30 schwarz?']] }),
        offerCase('C-116', 'Medplast Tuttlingen GmbH', { title: ['PC 6 t + POM 3 t · from stock', 'PC 6 t + POM 3 t · ab Lager'], att: ['CoA_Wonderlite_PC-110.pdf'],
          why: ['Asked on the phone. Everything is in stock in Hamburg; the lot certificate is attached.', 'Telefonisch angefragt. Alles liegt in Hamburg; das Chargenzertifikat hängt an.'],
          qual: { product: [1, ['Wonderlite PC-110 and Hostaform C 9021', 'Wonderlite PC-110 und Hostaform C 9021']], qty: [1, ['6 t + 3 t', '6 t + 3 t']], price: [1, ['List price', 'Listenpreis']], delivery: [1, ['From stock', 'Ab Lager']], intent: [1, ['Buying', 'Kaufabsicht']] },
          coach: ['A simple offer from stock. Medplast needs the lot certificate with every offer, so it is attached already.', 'Ein einfaches Angebot ab Lager. Medplast braucht zu jedem Angebot das Chargenzertifikat, deshalb hängt es schon an.'] }),
      ];
    }
    let baseCur = null;
    const cases = () => { const list = CASES(); if (!baseCur) baseCur = Object.fromEntries(list.map(c => [c.id, c.cur])); return list.map(c => ({ ...c, ...(W.cases[c.id] || {}) })); };
    const caseById = id => cases().find(c => c.id === id);
    const setCase = (id, patch) => { W.cases[id] = { ...(W.cases[id] || {}), ...patch }; };
    const stageOf = c => (c.cur >= c.steps.length ? 3 : c.steps[c.cur][0]);
    const isOpenCase = c => !['done', 'lost', 'won'].includes(c.status) && c.cur < c.steps.length;

    // ------------------------------------------------------------------ tasks
    const tight = () => (ctx.tightFamilies?.() || []).filter(t => !model.allotted.has(t.fam));
    function TASKS() {
      return [
        // ranked so that offers to send and information to get alternate, starting at the top
        { id: 'T-1', case: 'C-113', prio: 96, roles: ['inside'] },
        { id: 'T-2', case: 'C-101', prio: 92, roles: ['inside', 'field'] },
        { id: 'T-3', case: 'C-114', prio: 90, roles: ['inside'] },
        { id: 'T-4', case: 'C-104', prio: 88, roles: ['inside'] },
        { id: 'T-5', case: 'C-106', prio: 86, roles: ['inside'] },
        { id: 'T-6', case: 'C-115', prio: 84, roles: ['inside', 'field'] },
        { id: 'T-7', case: 'C-102', prio: 82, roles: ['inside'] },
        { id: 'T-8', case: 'C-103', prio: 76, roles: ['inside', 'field'] },
        { id: 'T-9', case: 'C-109', prio: 74, roles: ['inside'] },
        { id: 'T-10', case: 'C-116', prio: 72, roles: ['inside', 'field'] },
        { id: 'T-11', case: 'C-111', prio: 70, roles: ['inside'] },
        { id: 'T-12', case: 'C-105', prio: 66, roles: ['inside'] },
        { id: 'T-13', nav: 'push', push: 'hdpe', prio: 61, roles: ['inside'], kind: 'com', goal: 'offer', ch: 'open', open: () => !W.pushed, act: [`Offer ${tons(hdpe().total)} HDPE to fitting customers`, `${tons(hdpe().total)} HDPE passenden Kunden anbieten`], why: ['Product management push at a special price; 2 of 5 likely buyers fit.', 'Aktion des Produktmanagements zum Sonderpreis; 2 von 5 möglichen Käufern passen.'], src: [['pm', 'Sven Martens', 20, null, ['HDPE to move this month', 'HDPE soll diesen Monat raus']]] },
        { id: 'T-19', case: 'C-112', prio: 53, roles: ['inside'] },
        { id: 'T-14', case: 'C-107', prio: 58, roles: ['inside', 'field'] },
        { id: 'T-15', case: 'C-108', prio: 50, roles: ['inside', 'field'] },
        { id: 'T-17', cust: 'Emsland Rohrsysteme GmbH', prio: 40, roles: ['inside'], kind: 'rel', goal: 'rel', ch: 'phone', act: ['Check-in call with Henrik Lammers', 'Check-in-Anruf bei Henrik Lammers'], why: ['No call or email for 3 weeks. Nothing open, just keep in touch.', 'Seit 3 Wochen kein Anruf und keine E-Mail. Nichts offen, einfach Kontakt halten.'], src: [['crm', ['Contact history', 'Kontakthistorie'], 4, null, ['Last contact 20 days ago (phone). Usual rhythm: every 2 weeks.', 'Letzter Kontakt vor 20 Tagen (Telefon). Üblicher Rhythmus: alle 2 Wochen.']]] },
        { id: 'T-18', cust: 'Vogtland Spielwaren GmbH', prio: 38, roles: ['inside'], kind: 'rel', goal: 'rel', ch: 'email', act: ['Check-in email to Nina Seidel', 'Check-in-E-Mail an Nina Seidel'], why: ['No contact for 6 weeks and no order for 14. A short hello first.', 'Seit 6 Wochen kein Kontakt, seit 14 Wochen keine Bestellung. Erst ein kurzes Hallo.'], src: [['crm', ['Contact history', 'Kontakthistorie'], 4, null, ['Last contact 44 days ago (email).', 'Letzter Kontakt vor 44 Tagen (E-Mail).']]] },
        { id: 'T-16', cust: 'Lippe Kabeltechnik GmbH', prio: 42, roles: ['inside'], kind: 'rel', goal: 'rel', ch: 'email', act: ['Relationship check-in by email', 'Beziehungspflege per E-Mail'], why: ['No contact for 5 weeks. Email only, no calls before 10:00.', 'Seit 5 Wochen kein Kontakt. Nur E-Mail, keine Anrufe vor 10 Uhr.'], src: [['crm', ['Contact history', 'Kontakthistorie'], 4, null, ['Last contact 36 days ago (email). Usual rhythm: every 2 to 3 weeks.', 'Letzter Kontakt vor 36 Tagen (E-Mail). Üblicher Rhythmus: alle 2 bis 3 Wochen.']]] },
        { id: 'P-1', nav: 'allot', prio: 94, roles: ['pm'], kind: 'com', ch: 'open', open: () => tight().length > 0, act: ['Approve allocations for scarce grades', 'Allokationen für knappe Typen freigeben'], why: [`${tight().length} materials are asked above what is available. Account managers wait for you.`, `${tight().length} Werkstoffe sind über dem Verfügbaren angefragt. Der Vertrieb wartet auf Sie.`] },
        { id: 'P-2', case: 'C-106', prio: 86, roles: ['pm'], kind: 'svc', ch: 'open', open: c => c.cur === 4, act: ['Answer Elbtal: GWIT 775 °C for Lupoy GN5001RFH', 'Elbtal beantworten: GWIT 775 °C für Lupoy GN5001RFH'], why: ['Asked by Lena Hoffmann with the full thread and data sheet.', 'Von Lena Hoffmann mit ganzem Verlauf und Datenblatt gefragt.'] },
        { id: 'P-3', nav: 'push', push: 'hdpe', prio: 72, roles: ['pm'], kind: 'com', ch: 'open', open: () => !W.pushed, act: [`Send the ${tons(hdpe().total)} HDPE push to account managers`, `${tons(hdpe().total)} HDPE-Aktion an den Vertrieb geben`], why: ['Inbound next week is not sold yet. The list of fitting customers is ready.', 'Der Zulauf nächste Woche ist noch nicht verkauft. Die Liste passender Kunden steht.'] },
        { id: 'P-4', nav: 'prices', prio: 66, roles: ['pm'], kind: 'com', ch: 'open', act: ['Check producer notices against open offers', 'Herstellerschreiben gegen offene Angebote prüfen'], why: ['Celanese POM from 8 Oct; three more notices from 1 Nov.', 'Celanese POM ab 8. Okt.; drei weitere Schreiben ab 1. Nov.'] },
        { id: 'F-1', cust: 'Bodensee Präzisionsteile GmbH', prio: 90, roles: ['field'], kind: 'rel', ch: 'open', act: ['Visit tomorrow 10:00: briefing ready', 'Besuch morgen 10:00: Briefing bereit'], why: ['New POM line, open items and last orders on one page.', 'Neue POM-Linie, offene Punkte und letzte Bestellungen auf einer Seite.'] },
        { id: 'F-2', cust: 'Medplast Tuttlingen GmbH', prio: 48, roles: ['field'], kind: 'rel', ch: 'phone', act: ['Add Medplast to tomorrow\'s trip', 'Medplast in die Tour morgen aufnehmen'], why: ['62 km from Bodensee; last visit 4 months ago.', '62 km von Bodensee; letzter Besuch vor 4 Monaten.'] },
      ];
    }
    const taskFull = t => { const c = t.case ? caseById(t.case) : null; return { ...t, c, cust: t.cust || c?.cust, kind: t.kind || c?.kind, goal: t.goal || c?.goal || (t.kind === 'rel' ? 'rel' : t.kind === 'svc' ? 'svc' : 'info'), act: t.act || c?.next, why: t.why || c?.why }; };
    const dirOf = t => (t.dir || ((t.nav && !['allot', 'prices'].includes(t.nav)) || t.goal === 'rel' || (t.c && !t.c.channel) || (!t.c && !t.nav) ? 'out' : 'in'));
    const taskSrc = t => (t.c ? srcOf(t.c) : srcOf({ src: t.src || [['rule', 'DemandMatch', 1, null, t.why]] }));
    const isOpenTask = t => {
      if (W.done.has(t.id)) return false;
      if (t.goal === 'rel' && !t.case && acc(t.cust || '').ci === 'off') return false; // check-in suggestions switched off for this customer
      if (t.case) { const c = caseById(t.case); return t.open ? t.open(c) : c.cur === (t.step ?? baseCur[t.case]) && !CLOSING.includes(c.status) && isOpenCase(c); }
      return t.open ? t.open() : true;
    };
    const snoozedTill = t => W.snoozed[t.id];
    const roleTasks = () => { if (!W.initOpen) W.initOpen = new Set(TASKS().filter(isOpenTask).map(t => t.id)); return [...TASKS(), ...W.extra].filter(t => t.roles.includes(W.role)); };
    const todayTasks = () => roleTasks().filter(t => isOpenTask(t) && !(snoozedTill(t) > endOfDay) && !(t.due > endOfDay)).map(taskFull).sort((a, b) => b.prio - a.prio);
    const laterTasks = () => roleTasks().filter(t => isOpenTask(t) && (snoozedTill(t) > endOfDay || t.due > endOfDay)).map(taskFull).sort((a, b) => (a.due || snoozedTill(a)) - (b.due || snoozedTill(b)));
    // done today = tasks that were open when the demo started (or were added later) and are closed now
    const doneTasks = () => [...TASKS().filter(t => W.initOpen?.has(t.id)), ...W.extra].filter(t => t.roles.includes(W.role) && !isOpenTask(t)).map(taskFull);
    const addTask = (cust, inDays, x) => { W.extra.push({ id: `X-${++W.n}`, cust, due: day(inDays), prio: 60, roles: [W.role, 'inside'], ch: acc(cust).pref, kind: 'com', ...x }); };
    const log = (cust, icon, text, caseId) => { (W.log[cust] = W.log[cust] || []).unshift({ at: new Date(), icon, t: text, case: caseId }); };
    const closeTasksOf = id => TASKS().filter(t => t.case === id).forEach(t => W.done.add(t.id));

    const hdpe = () => { const hma = left('HMA 016'), mar = left('Marlex 9006'), lot = D().R.supply.find(s => s.grade === 'HMA 016'); return { hma, mar, total: hma + mar, wk: lot?.week || 1 }; };

    // ------------------------------------------------------------------ small components
    const kindChip = k => `<span class="ae-kind k-${k}">${ph(KIND()[k][1])}${KIND()[k][0]}</span>`;
    const intentChips = list => list.map(k => chip(INT()[k][1], INT()[k][0])).join('');
    function mrail(c, tourId) {
      const s = stageOf(c), lost = c.status === 'lost';
      const label = s >= 3 || !isOpenCase(c) ? (lost ? L('Lost', 'Verloren') : L('Done', 'Erledigt')) : STG_S()[s];
      return `<span class="ae-mr ${lost ? 'lost' : s >= 3 || !isOpenCase(c) ? 'fin' : ''} ${c.path === 'short' ? 'short' : ''}"${tourId ? ` data-tour="${tourId}"` : ''} title="${esc(STG().join(' → '))}">${[0, 1, 2].map(g => `<i class="${g < s || !isOpenCase(c) ? 'd' : g === s ? 'c' : ''}"></i>`).join('')}<em>${label}</em></span>`;
    }
    function rail(c) {
      const short = c.path === 'short';
      return `<div class="ae-rail ${short ? 'short' : ''}">
        ${short ? `<div class="ae-rail-h">${ph('lightning')}<b>${L('Short path', 'Kurzer Weg')}</b><span>${L('Service request: answered without an offer or an opportunity', 'Serviceanfrage: beantwortet, ohne Angebot oder Opportunity')}</span></div>` : ''}
        <div class="ae-stgs">${[0, 1, 2].map(g => {
          const steps = c.steps.map((s, i) => [s, i]).filter(([s]) => s[0] === g); if (!steps.length) return '';
          const all = steps.every(([, i]) => i < c.cur), has = steps.some(([, i]) => i === c.cur);
          return `<div class="ae-stg ${all ? 'd' : has ? 'c' : ''}"><div class="ae-stg-h"><span class="n">${all ? ph('check') : g + 1}</span><b>${STG()[g]}</b></div>
            <ol>${steps.map(([s, i]) => `<li class="${i < c.cur ? 'd' : i === c.cur ? 'c' : ''}">${ph(i < c.cur ? 'check-circle' : i === c.cur ? 'arrow-circle-right' : 'circle')}<span>${esc(T([s[1], s[2]]))}</span></li>`).join('')}</ol></div>`;
        }).join('')}</div></div>`;
    }
    // every customer action offers both ways: email (a finished draft) or a call (with talking points); the preferred one comes first
    const keyOf = t => (t.c ? `case:${t.c.id}` : `task:${t.id}`);
    const prefCall = (cust, c) => c?.act?.[2] === 'call' || (!c?.mail && !c?.offer && acc(cust).pref === 'phone');
    function contactBtns(key, cust, c, strong) {
      const call = prefCall(cust, c), cls = on => (on ? (strong ? 'primary' : 'accent') : '');
      const mail = `<button class="bfa-btn sm ${cls(!call)}" data-act="ae-cmp" data-id="${esc(key)}" data-v="email">${ph('envelope-simple')}${L('Email', 'E-Mail')}</button>`;
      const tel = `<button class="bfa-btn sm ${cls(call)}" data-act="ae-cmp" data-id="${esc(key)}" data-v="call">${ph('phone')}${L('Call', 'Anrufen')}</button>`;
      return call ? tel + mail : mail + tel;
    }
    const docOf = c => { if (!c) return null; if (c.intents?.includes('calloff')) return (D().orders || []).find(o => o.customer === c.cust) || null; const o = c.offer && D().offers.find(x => x.id === c.offer); return o && (c.goal === 'offer' || o.priceOnly) ? o : null; };
    const openBtn = (o, strong) => `<button class="bfa-btn sm ${strong ? 'primary' : 'accent'}" data-act="offer" data-id="${o.id}">${ph('eye')}${'View'}</button>`;
    // the list is an overview: every row has one button, View; calling or writing happens inside the case
    const primary = (t, i) => `<button class="bfa-btn sm ${i === 0 ? 'primary' : 'accent'}" data-act="ae-task" data-id="${t.id}">${ph('eye')}View</button>`;
    // inside a case or a customer: the document if there is one, otherwise call or email
    function actionBtns(t) {
      const doc = t.c && isOpenCase(t.c) && W.role !== 'pm' && docOf(t.c);
      if (doc && !W.ordered.has(doc.id)) return openBtn(doc, true);
      if (t.ch === 'open' || t.nav || (t.c && (!isOpenCase(t.c) || W.role === 'pm'))) return primary(t, 0);
      return contactBtns(keyOf(t), t.cust, t.c, true);
    }
    function taskRow(t, i, opts = {}) {
      const s0 = taskSrc(t)[0], o = t.c?.offer && t.c.goal === 'offer' ? D().offers.find(x => x.id === t.c.offer) : null;
      return `<div class="ae-task" style="--i:${i}">
        <div class="ae-tmain">
          <div class="ae-tt"><button class="lnk" data-act="ae-task" data-id="${t.id}"><b>${esc(T(t.act))}</b></button>${goalChip(t.goal)}${o ? `<span class="ae-val">${eurK(o.value)}</span>` : ''}</div>
          <div class="ae-tsub"><span class="ae-dir d-${dirOf(t)}">${dirOf(t) === 'in' ? `${ph('arrow-down-left')}Inbound` : `${ph('arrow-up-right')}Outbound`}</span>${t.cust ? `<button class="lnk cust" data-act="ae-cust" data-id="${esc(t.cust)}">${esc(nm(t.cust))}</button>` : `<span class="cust">${L('Several customers', 'Mehrere Kunden')}</span>`}${srcTag(s0)}</div>
          <span class="ae-why" title="${esc(T(t.why))}">${ph('sparkle')}${esc(T(t.why))}</span>
        </div>
        ${t.c ? mrail(t.c, opts.tourRail && i === 0 ? 'trail' : '') : '<span class="ae-mr none"></span>'}
        <div class="ae-tact">${primary(t, opts.first ? 0 : 1)}
          <button class="bfa-ic sm" data-act="ae-tsnooze" data-id="${t.id}" aria-label="${esc(L('Snooze 3 days', '3 Tage zurückstellen'))}" title="${esc(L('Snooze 3 days', '3 Tage zurückstellen'))}">${ph('clock-countdown')}</button>
          <button class="bfa-ic sm" data-act="ae-tdone" data-id="${t.id}" aria-label="${esc(L('Mark done', 'Erledigt'))}" title="${esc(L('Mark done', 'Erledigt'))}">${ph('check')}</button></div>
      </div>`;
    }
    const sec = (title, body, extra = '') => `<div class="bfa-card ae-block"><h5>${title}${extra}</h5>${body}</div>`;
    const daysAgo = n => (n <= 0 ? L('today', 'heute') : n === 1 ? L('yesterday', 'gestern') : L(`${n} days ago`, `vor ${n} Tagen`));
    const weeksAgo = n => (n < 14 ? daysAgo(n) : L(`${Math.round(n / 7)} weeks ago`, `vor ${Math.round(n / 7)} Wochen`));
    const prefChip = p => `<span class="ae-pref">${ph(PREF[p][0])}${esc(T(PREF[p][1]))}</span>`;

    // ------------------------------------------------------------------ Today
    function today() {
      const u = USERS()[W.role], all = todayTasks(), done = doneTasks(), later = laterTasks(), f = st.todayDir || 'all', list = all.filter(t => f === 'all' || dirOf(t) === f);
      const hi = list.filter(t => t.prio >= 80), mid = list.filter(t => t.prio >= 50 && t.prio < 80), lo = list.filter(t => t.prio < 50);
      const h = NOW.getHours(), hello = h < 11 ? L('Good morning', 'Guten Morgen') : h < 17 ? L('Good afternoon', 'Guten Tag') : L('Good evening', 'Guten Abend');
      const pct = done.length + all.length ? Math.round(done.length / (done.length + all.length) * 100) : 0;
      let k = 0;
      const band = (cls, label, rows) => rows.length ? `<div class="ae-band b-${cls}"${cls === 'hi' ? ' data-tour="tlist"' : ''}><h5><i></i>${label}<em>${rows.length}</em></h5>${rows.map(t => taskRow(t, k++, { first: k === 1, tourRail: true, tourChat: true })).join('')}</div>` : '';
      const nIn = all.filter(t => dirOf(t) === 'in').length, nOut = all.length - nIn;
      return `<div class="ae-hello"><div><small class="ae-eyebrow">${L('MY WORKDAY', 'MEIN ARBEITSTAG')} · ${NOW.toLocaleDateString(ctx.lang() === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</small><h2>${all.length ? L(`${all.length} things to do today`, `Heute zu erledigen: ${all.length} Aufgaben`) : L('Everything for today is done.', 'Für heute ist alles erledigt.')}</h2><p>${hello}, ${esc(u[0].split(' ')[0])}. ${L(`Inbound and outbound in one list, by priority; ${hi.length} urgent. Each task says why and where it comes from.`, `Inbound und Outbound in einer Liste, nach Priorität; ${hi.length} dringend. Bei jeder steht, warum und woher sie kommt.`)}</p>
          <div class="ae-dirbar"><div class="ae-seg sm">${[['all', L('All', 'Alle'), all.length, 'list-bullets'], ['in', 'Inbound', nIn, 'tray-arrow-down'], ['out', 'Outbound', nOut, 'paper-plane-tilt']].map(([k, l, n, ic]) => `<button class="${f === k ? 'on' : ''}" data-act="ae-dir" data-id="${k}">${ph(ic)}${l}<em>${n}</em></button>`).join('')}</div>
          ${all.length ? `<div class="ae-mix">${goalChip('offer')}<b>${all.filter(t => t.goal === 'offer').length}</b>${goalChip('info')}<b>${all.filter(t => t.goal === 'info').length}</b>${goalChip('svc')}<b>${all.filter(t => t.goal === 'svc').length}</b></div>` : ''}</div></div>
          <div class="ae-prog"><span><b>${done.length}</b> ${L('of', 'von')} ${done.length + all.length} ${L('done', 'erledigt')}</span><i><b style="width:${pct}%"></b></i></div></div>
        <div class="ae-today solo">
          <div class="ae-col">${band('hi', L('High priority', 'Hohe Priorität'), hi)}${band('mid', L('Medium', 'Mittel'), mid)}${band('lo', L('When there is time', 'Wenn Zeit ist'), lo)}
            ${!list.length ? `<div class="bfa-card">${empty('confetti', L('Nothing left for today', 'Für heute ist nichts mehr offen'), L('New tasks appear as messages and signals come in.', 'Neue Aufgaben erscheinen, sobald Nachrichten und Signale eingehen.'))}</div>` : ''}
            ${done.length ? `<details class="ae-donelist"><summary>${ph('check-circle')}${L('Done today', 'Heute erledigt')}<em>${done.length}</em>${ph('caret-down')}</summary>${done.map(t => `<div class="ae-dn"><s>${esc(T(t.act))}</s><span>${esc(nm(t.cust))}</span></div>`).join('')}</details>` : ''}
          </div>
        </div>`;
    }
    const statLabel = s => STAT()[s]?.[0] || s;

    // ------------------------------------------------------------------ Customers
    function custFacts(c) {
      const a = acc(c), cs = cases().filter(x => x.cust === c);
      const reqs = cs.filter(x => x.type === 'req' && isOpenCase(x)).length, opps = cs.filter(x => x.type === 'opp' && isOpenCase(x)).length;
      const tasks = [...TASKS(), ...W.extra].filter(t => (t.cust || caseById(t.case || '')?.cust) === c && isOpenTask(t)).length;
      const overdue = a.order > a.rhythm * 7 + 7;
      return { a, reqs, opps, tasks, overdue, cold: a.contact > 21 };
    }
    function nba(c) {
      const t = [...TASKS(), ...W.extra].filter(t => (t.cust || caseById(t.case || '')?.cust) === c && isOpenTask(t)).map(taskFull).sort((x, y) => y.prio - x.prio)[0];
      if (t) return { t, text: t.due > endOfDay ? `${T(t.act)} · ${short(t.due)}` : T(t.act), why: T(t.why) };
      const a = acc(c), wks = Math.round(a.order / 7);
      if (a.order > a.rhythm * 7 + 7) return { text: L('Call about the next order', 'Wegen der nächsten Bestellung anrufen'), why: L(`Orders every ${a.rhythm} weeks; last order ${wks} weeks ago.`, `Bestellt alle ${a.rhythm} Wochen; letzte Bestellung vor ${wks} Wochen.`) };
      if (a.contact > 21) return { text: L('Relationship check-in', 'Beziehungspflege'), why: L(`No contact for ${Math.round(a.contact / 7)} weeks.`, `Seit ${Math.round(a.contact / 7)} Wochen kein Kontakt.`) };
      if (CROSS[c]) return { text: L(`Ask about ${CROSS[c][0]}`, `Nach ${CROSS[c][0]} fragen`), why: T(CROSS[c][1]) };
      const nx = Math.max(1, a.rhythm - wks);
      return { text: L('Nothing urgent', 'Nichts Dringendes'), why: nx === 1 ? L('Next order expected in about a week.', 'Nächste Bestellung voraussichtlich in etwa einer Woche.') : L(`Next order expected in about ${nx} weeks.`, `Nächste Bestellung voraussichtlich in etwa ${nx} Wochen.`) };
    }
    function customers() {
      const rows = allCust().filter(inRole).filter(c => ctx.search(st.q, c, meta(c).city, meta(c).contact)).sort((x, y) => { const a = acc(x), b = acc(y); return (b.tier < a.tier) - (b.tier > a.tier) || x.localeCompare(y); });
      const all = allCust().filter(inRole).map(custFacts);
      return `${tiles([[all.length, W.role === 'field' ? L('Customers in your territory', 'Kunden in Ihrem Gebiet') : L('Customers', 'Kunden')], [all.filter(f => f.overdue).length, L('Reorder overdue', 'Nachbestellung überfällig')], [all.filter(f => f.cold).length, L('No contact for 3+ weeks', 'Seit über 3 Wochen kein Kontakt')], [all.reduce((a, f) => a + f.reqs + f.opps, 0), L('Open requests and opportunities', 'Offene Anfragen und Opportunities')]])}
        <label class="bfa-search solo">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(L('Search customers, cities, contacts', 'Kunden, Orte, Kontakte suchen'))}"></label>
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table ae-ctable"><thead><tr><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('TERRITORY', 'GEBIET')}</th><th>${L('LAST CONTACT', 'LETZTER KONTAKT')}</th><th>${L('ORDER RHYTHM', 'BESTELLRHYTHMUS')}</th><th>${L('OPEN', 'OFFEN')}</th><th>${L('NEXT BEST ACTION', 'NÄCHSTE BESTE AKTION')}</th><th></th></tr></thead>
        <tbody>${rows.map((c, i) => { const f = custFacts(c), m = meta(c), n = nba(c); return `<tr style="--i:${i}">
          <td><button class="lnk" data-act="ae-cust" data-id="${esc(c)}"><b class="cname">${esc(c)}</b></button><small class="code">${m.code} · ${esc(m.city)} · ${L('Tier', 'Klasse')} ${f.a.tier}</small></td>
          <td>${chip('c-cat', T(TERR[f.a.terr][0]))}<small class="ae-sub">${esc(TERR[f.a.terr][1])}</small></td>
          <td class="nowrap ${f.cold ? 'ae-warnc' : ''}">${daysAgo(f.a.contact)}${prefChip(f.a.pref)}</td>
          <td class="nowrap">${L(`every ${f.a.rhythm} wk`, `alle ${f.a.rhythm} Wo.`)} · ${weeksAgo(f.a.order)}${f.overdue ? chip('c-warn', L('Overdue', 'Überfällig')) : ''}</td>
          <td class="nowrap"><span class="ae-cnt" title="${esc(L('Requests · Opportunities · Tasks', 'Anfragen · Opportunities · Aufgaben'))}"><b>${f.reqs}</b>R<b>${f.opps}</b>O<b>${f.tasks}</b>T</span></td>
          <td class="ae-nbacell"><b>${esc(n.text)}</b><small>${esc(n.why)}</small></td>
          <td><button class="bfa-btn sm" data-act="ae-cust" data-id="${esc(c)}">${'View'}</button></td></tr>`; }).join('')}</tbody></table></div>`;
    }

    function rhythm(a) {
      const wks = a.order / 7, pts = [], h = hash(a.buys.join());
      for (let w = wks, k = 0; w < 52 && k < 14; w += a.rhythm + ((h >>> k) % 3) - 1, k++) pts.push(w);
      const x = w => 86 - w / 52 * 84, next = a.rhythm - wks, over = next < -1;
      return `<div class="ae-rh"><div class="ae-rh-bar">${pts.map(w => `<i style="left:${x(w)}%"></i>`).join('')}<b class="now" style="left:86%"></b><u class="${over ? 'over' : ''}" style="left:${over ? 86 : Math.min(98, 86 + next / 52 * 84)}%"></u></div>
        <div class="ae-rh-l"><span>${L('12 months ago', 'vor 12 Monaten')}</span><span>${L('today', 'heute')}</span></div>
        <p>${L(`Orders about every ${a.rhythm} weeks. Last order ${weeksAgo(a.order)}.`, `Bestellt etwa alle ${a.rhythm} Wochen. Letzte Bestellung ${weeksAgo(a.order)}.`)} ${over ? chip('c-warn', L(`${Math.round(-next)} weeks overdue`, `${Math.round(-next)} Wochen überfällig`)) : chip('c-ok', L(`next in ~${Math.max(1, Math.round(next))} wk`, `nächste in ~${Math.max(1, Math.round(next))} Wo.`))}</p></div>`;
    }
    // the account manager knows things SAP does not ("they cut production", "season starts early"): rhythm, quantity and check-ins can be corrected here
    function rhEdit(c) {
      const a = acc(c), o = W.rh[c] || {}, base = ACC[c]?.rhythm ?? 8, q = qtyOf(c), ci = a.ci || 'auto', changed = o.rhythm != null || o.qty != null || o.ci;
      const step = (f, v, unit) => `<span class="ae-step"><button data-act="ae-rh" data-id="${esc(c)}|${f}|-1" aria-label="−">${ph('minus')}</button><b>${v} ${unit}</b><button data-act="ae-rh" data-id="${esc(c)}|${f}|1" aria-label="+">${ph('plus')}</button></span>`;
      const WHY = () => [['call', L('From a call', 'Aus Gespräch')], ['season', L('Season', 'Saison')], ['prod', L('Production changed', 'Produktion geändert')], ['other', L('Other', 'Sonstiges')]];
      return `<div class="ae-rhedit">
        <div class="ae-rhrow"><span>${L('Orders every', 'Bestellt alle')}</span>${step('rhythm', a.rhythm, L('wk', 'Wo.'))}</div>
        <div class="ae-rhrow"><span>${L('Usual quantity', 'Übliche Menge')}</span>${step('qty', q, 't')}</div>
        <div class="ae-rhrow"><span>${L('Check-in suggestions', 'Check-in-Vorschläge')}</span><span class="ae-seg sm">${[['auto', L('Automatic', 'Automatisch')], ['fix', L('Fixed', 'Fest')], ['off', L('Off', 'Aus')]].map(([k, l]) => `<button class="${ci === k ? 'on' : ''}" data-act="ae-rh" data-id="${esc(c)}|ci|${k}">${l}</button>`).join('')}</span></div>
        ${ci === 'fix' ? `<div class="ae-rhrow sub"><span>${L('Suggest a check-in after', 'Check-in vorschlagen nach')}</span>${step('ciw', ciWeeks(c), L('wk without contact', 'Wo. ohne Kontakt'))}</div>` : ''}
        <p class="ae-rhsrc">${ci === 'off' ? `${ph('bell-slash')}<span>${L('No check-in suggestions for this customer. Reorders and offers still show up.', 'Keine Check-in-Vorschläge für diesen Kunden. Nachbestellungen und Angebote erscheinen weiter.')}</span>` : ci === 'auto' ? `${ph('sparkle')}<span>${L(`Automatic: learned from the contact history, about every ${ciWeeks(c)} weeks. A suggestion comes only when that is exceeded.`, `Automatisch: aus der Kontakthistorie gelernt, etwa alle ${ciWeeks(c)} Wochen. Ein Vorschlag kommt erst, wenn das überschritten ist.`)}</span>` : `${ph('calendar-dots')}<span>${L(`A check-in is suggested after ${ciWeeks(c)} weeks without contact.`, `Ein Check-in wird nach ${ciWeeks(c)} Wochen ohne Kontakt vorgeschlagen.`)}</span>`}</p>
        <p class="ae-rhsrc">${changed ? `${ph('user-circle')}<span>${L(`Adjusted by ${USERS()[W.role][0]} on ${short(o.at || NOW)}`, `Angepasst von ${USERS()[W.role][0]} am ${short(o.at || NOW)}`)}${o.rhythm != null && o.rhythm !== base ? L(` (SAP: every ${base} wk)`, ` (SAP: alle ${base} Wo.)`) : ''}</span><button class="lnk" data-act="ae-rh" data-id="${esc(c)}|reset|0">${ph('arrow-counter-clockwise')}${L('Back to SAP', 'Zurück auf SAP')}</button>`
          : `${ph('database')}${L('From SAP order history, average of the last 12 months.', 'Aus der SAP-Kaufhistorie, Durchschnitt der letzten 12 Monate.')}`}</p>
        ${changed ? `<div class="ae-rhwhy"><small>${L('Why?', 'Warum?')}</small>${WHY().map(([k, l]) => `<button class="${o.why === k ? 'on' : ''}" data-act="ae-rh" data-id="${esc(c)}|why|${k}">${l}</button>`).join('')}</div>` : ''}
        <p class="ae-rhfx">${ph('arrows-split')}${L('Feeds Opportunities, Demand Match, check-ins and the forecast.', 'Fließt in Opportunities, Demand Match, Check-ins und die Prognose.')}</p>
      </div>`;
    }
    function custView() {
      const c = st.cust, m = meta(c), a = acc(c), n = nba(c), e = eta();
      const cs = cases().filter(x => x.cust === c);
      const tasksC = [...TASKS(), ...W.extra].filter(t => t.cust === c && !t.case && isOpenTask(t)).map(taskFull);
      const items = [...cs.map(x => ({ kind: x.type, x })), ...tasksC.map(t => ({ kind: 'task', t }))];
      const offer = offerFor(c), lines = ms(c);
      const deliv = lines.map(l => ({ g: l.s.grade, q: l.qty, wk: l.s.week, late: l.s.grade === 'PP 7032E3' && l.s.week > 0 }));
      const ev = [...(W.log[c] || []).map(x => [x.at, x.icon, T(x.t), x.me ? L(`changed by ${USERS()[W.role][0]}`, `geändert von ${USERS()[W.role][0]}`) : L('logged by the assistant', 'vom Assistenten protokolliert')]),
        ...cs.map(x => [new Date(+NOW - x.at * 3600e3), x.channel ? null : 'sparkle', T(x.title), x.type === 'req' ? L('Request', 'Anfrage') : 'Opportunity', x.channel]),
        ...D().msgs.filter(x => x.customer === c).map(x => [x.at, null, ctx.subject(x), ch(x.channel).name, x.channel]),
        [day(-a.contact), PREF[a.pref][0], L(`Last contact: ${T(PREF[a.pref][1])}`, `Letzter Kontakt: ${T(PREF[a.pref][1])}`), m.contact],
        [day(-a.order), 'package', L('Last order delivered', 'Letzte Bestellung geliefert'), a.buys[0] || '']].sort((x, y) => y[0] - x[0]).slice(0, 8);
      const TL = { req: L('REQUEST', 'ANFRAGE'), opp: 'OPPORTUNITY', task: L('TASK', 'AUFGABE') };
      return `<div class="bfa-dh"><button class="bfa-ic" data-act="back" aria-label="Back">${ph('arrow-left')}</button><h3 class="ae-h3">${esc(c)}</h3>${segChip(m.seg)}${chip('c-cat', `${L('Tier', 'Klasse')} ${a.tier}`)}${chip('c-cat', `${T(TERR[a.terr][0])} · ${TERR[a.terr][1]}`, ph('map-pin'))}
          <span class="srcs"><small>${L('DATA SOURCES', 'DATENQUELLEN')}</small>${chip('c-src', 'SAP S/4', ctx.logo('sap', '#0FAAFF'))}${chip('c-src', 'Biesterfeld CRM', ctx.logo('biesterfeld', '#cb3f1d'))}${chip('c-src', 'Outlook', ctx.glyph('microsoft-outlook-logo', '#3b8ee0'))}</span></div>
        <div class="ae-grid2">
          <div class="ae-col">
            <div class="ae-nba">${ph('sparkle')}<div><small>${L('NEXT BEST ACTION', 'NÄCHSTE BESTE AKTION')}</small><b>${esc(n.text)}</b><span>${esc(n.why)}</span></div>
              <div class="ae-nba-a">${n.t ? actionBtns(n.t) : `${contactBtns(`cust:${c}`, c, null, true)}<button class="bfa-btn sm" data-act="ae-out" data-id="${esc(c)}">${ph('plus')}${L('Create task', 'Aufgabe anlegen')}</button>`}</div></div>
            ${sec(L('Open items', 'Offene Punkte'), items.length ? `<div class="ae-items">${items.map(it => it.x ? `<button class="ae-item" data-act="ae-case" data-id="${it.x.id}"><span class="ae-tl t-${it.kind}">${TL[it.kind]}</span><span class="ae-it"><b>${esc(T(it.x.title))}</b><small>${intentChips(it.x.intents)}${statChip(it.x.status)}</small></span>${mrail(it.x)}</button>`
              : `<button class="ae-item" data-act="ae-task" data-id="${it.t.id}"><span class="ae-tl t-task">${TL.task}</span><span class="ae-it"><b>${esc(T(it.t.act))}</b><small>${it.t.due ? short(it.t.due) : L('today', 'heute')} · ${esc(T(it.t.why))}</small></span><span class="ae-mr none"></span></button>`).join('')}</div>` : `<p class="ae-muted">${L('Nothing open for this customer.', 'Für diesen Kunden ist nichts offen.')}</p>`, `<em>${items.length}</em>`)}
            ${sec(L('Activity', 'Aktivitäten'), `<ol class="bfa-log ae-log">${ev.map(([t, ic, a1, b, chn]) => `<li><span class="ic">${chn ? ch(chn).icon() : ph(ic || 'circle')}</span><span><b>${esc(a1)}</b><small>${esc(b || '')}</small></span><time>${short(t)}</time></li>`).join('')}</ol>`)}
          </div>
          <div class="ae-col">
            ${sec(L('Contacts', 'Kontakte'), `<div class="ae-contacts"><div><span class="av">${esc(m.contact.split(' ').map(x => x[0]).join('').slice(-2))}</span><span><b>${esc(m.contact)}</b><small>${L('Purchasing · main contact', 'Einkauf · Hauptkontakt')}</small></span>${prefChip(a.pref)}</div>${a.c2 ? `<div><span class="av">${esc(a.c2[0].split(' ').map(x => x[0]).join('').slice(-2))}</span><span><b>${esc(a.c2[0])}</b><small>${esc(T(a.c2[1]))}</small></span></div>` : ''}${a.note ? `<p class="ae-note">${ph('info')}${esc(T(a.note))}</p>` : ''}</div>`)}
            ${sec(L('Buying rhythm', 'Kaufrhythmus'), rhythm(a) + rhEdit(c))}
            ${sec(L('Products', 'Produkte'), `<div class="ae-prods">${[...new Set([...a.buys, ...lines.map(l => l.s.grade)])].map(g => `<span>${esc(g)}</span>`).join('')}</div>${CROSS[c] ? `<div class="ae-cross">${ph('lightbulb')}<span><b>${L('Cross-sell idea', 'Cross-Selling-Idee')}: ${esc(CROSS[c][0])}</b><small>${esc(T(CROSS[c][1]))}</small></span></div>` : ''}`)}
            ${sec(L('Deliveries', 'Lieferungen'), deliv.length ? `<ul class="ae-deliv">${deliv.map(d => `<li class="${d.late ? 'late' : ''}">${ph(d.wk ? (d.late ? 'warning' : 'boat') : 'warehouse')}<span><b>${esc(d.g)}</b><small>${tons(d.q)}</small></span><em>${d.late ? `<s>${short(e.old)}</s> ${short(e.now)}` : d.wk ? `ETA ${wk(d.wk)}` : L('ready in Hamburg', 'bereit in Hamburg')}</em></li>`).join('')}</ul>` : `<p class="ae-muted">${L('No open deliveries.', 'Keine offenen Lieferungen.')}</p>`)}
            ${a.project ? sec(L('Known projects', 'Bekannte Projekte'), `<p class="ae-proj">${ph('rocket-launch')}${esc(T(a.project))}</p>`) : ''}
            ${offer ? sec(L('Offer in the matching engine', 'Angebot aus dem Matching'), `<button class="ae-item" data-act="offer" data-id="${offer.id}"><span class="ae-tl t-opp">${offer.id}</span><span class="ae-it"><b>${eur(offer.value)}</b><small>${offer.ms.length} ${L('lines', 'Pos.')}</small></span>${ctx.statusChip(offer.status)}</button>`) : ''}
          </div>
        </div>`;
    }

    // ------------------------------------------------------------------ Case: the workflow guide for one request or opportunity
    function tiersHtml() {
      const p = D().R.supply.find(s => s.grade === 'PP 7032E3')?.price || 1.3;
      const rows = [[1, .12, .14], [3, .06, .09], [5, .02, .07]];
      return `<table class="ae-tiers"><thead><tr><th>${L('Quantity', 'Menge')}</th><th>€/kg</th><th>${L('Freight €/kg', 'Fracht €/kg')}</th><th>${L('Total', 'Gesamt')}</th></tr></thead><tbody>${rows.map(([t, up, fr]) => `<tr><td>${t} t</td><td>${nf(p + up, 2)}</td><td>${nf(fr, 2)}</td><td>${eur((p + up + fr) * t * 1000)}</td></tr>`).join('')}</tbody></table>
        <p class="ae-hint">${ph('truck')}${L('At 5 t, adding 1 t ABS HI121H (they buy it too) fills the sixth pallet space and lowers freight per kg by about 8 %. Freight values are demo values.', 'Bei 5 t füllt 1 t ABS HI121H zusätzlich (das kaufen sie auch) den sechsten Palettenplatz und senkt die Fracht pro kg um etwa 8 %. Die Frachtwerte sind Demo-Werte.')}</p>`;
    }
    const srcSec = list => sec(L('Source · where this comes from', 'Quelle · woher das kommt'), `<div class="ae-srcs">${list.map(srcCard).join('')}</div>`, `<em>${list.length}</em>`);
    function offerCard(o) {
      return `<div class="ae-offer"><div class="oh"><span class="ae-tl t-opp">${o.id}</span>${otypeChip(o)}${ctx.statusChip(o.status)}<button class="lnk" data-act="offer" data-id="${o.id}">${L('Open document', 'Dokument öffnen')}${ph('arrow-up-right')}</button></div>
        <table class="ae-olines"><thead><tr><th>${L('Grade', 'Type')}</th><th>${L('Qty', 'Menge')}</th><th>€/kg</th><th>${L('Delivery', 'Lieferung')}</th><th class="r">${L('Total', 'Summe')}</th></tr></thead>
        <tbody>${o.ms.map(m => `<tr><td><b>${esc(m.s.grade)}</b><small>${esc(m.s.producer)}${m.grade === 'alt' ? ` · ${L('equivalent', 'gleichwertig')}` : ''}</small></td><td>${tons(m.qty)}</td><td>${nf(m.s.price, 2)}</td><td class="${m.onTime ? '' : 'late'}">${m.s.week ? wk(m.s.week) : L('stock', 'Lager')}</td><td class="r">${eur(m.value)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="4">${L('Offer value', 'Angebotswert')} · ${L('margin', 'Marge')} ${nf(o.value ? o.margin / o.value * 100 : 0, 1)} %</td><td class="r">${eur(o.value)}</td></tr></tfoot></table>
        ${o.checks.filter(x => x.s === 'warn').map(x => `<p class="ae-warnl">${ph('warning-circle')}${esc(x.t)}</p>`).join('')}</div>`;
    }
    const mailPreview = (x, key) => { const m = mailOf(x); return `<div class="bfa-mail ae-mailprev"><div class="mh"><span>${L('To', 'An')}</span><b>${esc(m.to)}</b></div>${m.cc ? `<div class="mh"><span>Cc</span><b>${esc(m.cc)}</b></div>` : ''}<div class="mh"><span>${L('Subject', 'Betreff')}</span><b>${esc(m.subj)}</b></div><div class="mb">${esc(m.body).replace(/\n/g, '<br>')}</div>${m.att.length ? `<div class="ae-atts">${m.att.map(f => `<span class="ma">${ph('file-pdf')}${esc(f)}</span>`).join('')}</div>` : ''}</div>
      <div class="ae-mp-a"><button class="bfa-btn sm" data-act="ae-cmp" data-id="${esc(key)}" data-v="call">${ph('phone')}${L('Call instead', 'Lieber anrufen')}</button><button class="bfa-btn sm primary" data-act="ae-cmp" data-id="${esc(key)}" data-v="email">${ph('pencil-simple')}${L('Edit & send', 'Bearbeiten & senden')}</button></div>`; };
    function caseView() {
      const c = caseById(st.case); if (!c) return '';
      const m = meta(c.cust), a = acc(c.cust), o = c.offer ? D().offers.find(x => x.id === c.offer) : null, sig = SIG()[c.signal];
      const qual = c.qual ? Object.entries(c.qual) : [];
      const evs = [...(W.log[c.cust] || []).filter(x => x.case === c.id).map(x => [x.at, x.icon, T(x.t)]), [new Date(+NOW - c.at * 3600e3), c.channel ? null : 'sparkle', c.type === 'req' ? L('Request created', 'Anfrage angelegt') : L('Opportunity created', 'Opportunity angelegt'), c.channel]];
      const pmAnswer = W.role === 'pm' && c.id === 'C-106' && c.cur === 4;
      const waitCust = ['reviewing', 'awaiting'].includes(c.status), wdue = c.decision || (c.offer && W.followups[c.offer]?.due);
      const actBtn = pmAnswer ? `<button class="bfa-btn primary" data-act="ae-pmok">${ph('seal-check')}${L('Send verified answer', 'Geprüfte Antwort senden')}</button>`
        : isOpenCase(c) && docOf(c) ? openBtn(docOf(c), true) : isOpenCase(c) ? contactBtns(`case:${c.id}`, c.cust, c, true) : '';
      const offerGoal = o && c.goal === 'offer', sentOffer = o && !offerGoal && o.status === 'sent';
      return `<div class="bfa-dh"><button class="bfa-ic" data-act="back" aria-label="Back">${ph('arrow-left')}</button><h3 class="ae-h3">${esc(T(c.title))}</h3>${goalChip(c.goal)}${chip('c-cat', c.type === 'req' ? L('Request', 'Anfrage') : 'Opportunity')}${statChip(c.status)}${intentChips(c.intents)}
          <span class="srcs"><button class="lnk ae-custlink" data-act="ae-cust" data-id="${esc(c.cust)}">${ph('buildings')}${esc(c.cust)}</button></span></div>
        ${rail(c)}
        <div class="ae-grid2">
          <div class="ae-col">
            <div class="ae-nba">${ph(isOpenCase(c) ? 'sparkle' : c.status === 'lost' ? 'x-circle' : 'check-circle')}<div><small>${L('NEXT ACTION', 'NÄCHSTE AKTION')}</small><b>${esc(isOpenCase(c) ? (pmAnswer ? L('Send the verified glow-wire value to Lena Hoffmann', 'Geprüften Glühdrahtwert an Lena Hoffmann senden') : waitCust ? L(`Waiting for the customer · follow-up ${wdue ? short(wdue) : ''}`, `Wartet auf den Kunden · Nachfassen ${wdue ? short(wdue) : ''}`) : T(c.next)) : c.status === 'lost' ? L('Closed as lost', 'Als verloren geschlossen') : L('Nothing left to do', 'Nichts mehr zu tun'))}</b><span>${esc(isOpenCase(c) ? (waitCust ? L('The follow-up is on your Today list on that date. If they get in touch earlier, tell the AI.', 'Das Nachfassen steht an diesem Tag auf Ihrer Heute-Liste. Meldet sich der Kunde früher, sagen Sie es der KI.') : c.status === 'waiting' && !pmAnswer ? L('Waiting for product management. You will be notified when the answer arrives.', 'Wartet auf das Produktmanagement. Sie werden benachrichtigt, sobald die Antwort vorliegt.') : T(c.why)) : (c.lostReason ? T(c.lostReason) : L('Resolved and logged.', 'Erledigt und protokolliert.')))}</span></div>
              ${actBtn ? `<div class="ae-nba-a">${actBtn}</div>` : ''}</div>
            ${srcSec(srcOf(c))}
            ${offerGoal ? sec(L('Offer, drafted from the request', 'Angebot, aus der Anfrage entworfen'), offerCard(o)) : ''}
            ${sentOffer ? sec(L('The offer that was sent', 'Das gesendete Angebot'), `<div class="ae-docmini">${ctx.offerDoc(o)}</div><div class="ae-mp-a"><button class="bfa-btn sm" data-act="offer" data-id="${o.id}">${ph('file-text')}View</button></div>`, W.followups[o.id] ? `<em>${L('sent', 'gesendet')} ${short(W.followups[o.id].sent)}</em>` : '') : ''}
            ${sentOffer ? (() => { const om = ctx.offerMail(o), fu = W.followups[o.id]; return `<details class="bfa-card ae-block ae-sentmail"><summary><h5>${ph('paper-plane-tilt')}${L('The email that went out', 'Die gesendete E-Mail')}${fu ? `<em>${short(fu.sent)}</em>` : ''}</h5><span class="ae-mut">${esc(om.subj)}</span>${ph('caret-down')}</summary>
              <div class="bfa-mail"><div class="mh"><span>${L('To', 'An')}</span><b>${esc(mailTo(c.cust))}</b></div><div class="mh"><span>${L('Subject', 'Betreff')}</span><b>${esc(om.subj)}</b></div><div class="mb">${esc(om.body).replace(/\n/g, '<br>')}</div><div class="ae-atts"><span class="ma">${ph('file-pdf')}${o.id}.pdf</span></div></div></details>`; })() : ''}
            ${qual.length ? sec(L('Qualification', 'Qualifizierung'), `<div class="ae-qual">${qual.map(([k, q]) => `<div class="ae-q q${q[0]}">${ph(q[0] === 1 ? 'check-circle' : q[0] === 2 ? 'circle-half' : 'question')}<span class="k">${QD()[k]}</span><span class="v"><b>${esc(T(q[1]))}</b>${q[2] ? `<small>${ph(k === 'spec' ? 'user-switch' : 'chat-centered-text')}${k === 'spec' ? esc(T(q[2])) : L(`Ask: "${esc(T(q[2]))}"`, `Fragen: „${esc(T(q[2]))}“`)}</small>` : ''}</span>${q[2] && k !== 'spec' ? `<button class="bfa-btn sm ghost" data-act="ae-q">${ph('plus')}${L('To call notes', 'In Notizen')}</button>` : ''}</div>`).join('')}</div>`, `<em>${qual.filter(([, q]) => q[0] === 1).length}/${qual.length} ${L('known', 'bekannt')}</em>`) : ''}
            ${c.id === 'C-103' ? sec(L('Price tiers, ready to send', 'Preisstaffel, versandbereit'), tiersHtml()) : ''}
            ${isOpenCase(c) && !pmAnswer ? sec(c.draft ? L('Message, ready to send', 'Nachricht, versandbereit') : sentOffer ? L('Follow-up email, ready to send', 'Nachfass-E-Mail, versandbereit') : L('Email, ready to send', 'E-Mail, versandbereit'), c.draft ? `<div class="bfa-bubble whatsapp ae-draft"><div class="bh">${logoWa()}<b>${L('To', 'An')}: ${esc(m.contact)}</b>${chip('c-ai', L('Draft', 'Entwurf'), ph('sparkle'))}</div><p>${esc(ctx.personal(tidy(T(c.draft)), c.cust))}</p></div><div class="ae-mp-a"><button class="bfa-btn sm" data-act="ae-cmp" data-id="case:${c.id}" data-v="email">${ph('envelope-simple')}${L('As email', 'Als E-Mail')}</button><button class="bfa-btn sm primary" data-act="ae-cmp" data-id="case:${c.id}" data-v="whatsapp">${ph('whatsapp-logo')}${L('Review & send', 'Prüfen & senden')}</button></div>` : mailPreview({ c, cust: c.cust }, `case:${c.id}`)) : ''}
          </div>
          <div class="ae-col">
            <div class="ae-coach"><div class="ae-coach-h">${ph('lightbulb')}<b>${L('How to approach it', 'So gehen Sie vor')}</b>${chip(sig[1], sig[0], ph(sig[2]))}</div><p>${esc(T(c.coach))}</p></div>
            ${sec(L('Customer', 'Kunde'), `<div class="ae-snap"><div><span>${L('Contact', 'Kontakt')}</span><b>${esc(m.contact)}</b>${prefChip(a.pref)}</div><div><span>${L('Phone', 'Telefon')}</span><b class="mono">${phone(c.cust)}</b></div><div><span>${L('Last contact', 'Letzter Kontakt')}</span><b>${daysAgo(a.contact)}</b></div><div><span>${L('Last order', 'Letzte Bestellung')}</span><b>${weeksAgo(a.order)}</b></div></div>${a.note ? `<p class="ae-note">${ph('info')}${esc(T(a.note))}</p>` : ''}`)}
            ${o && !offerGoal && !sentOffer ? sec(L('Linked offer', 'Verknüpftes Angebot'), `<button class="ae-item" data-act="offer" data-id="${o.id}"><span class="ae-tl t-opp">${o.id}</span><span class="ae-it"><b>${eur(o.value)}</b><small>${o.ms.length} ${L('lines', 'Pos.')} · ${L('margin', 'Marge')} ${eur(o.margin)}</small></span>${ctx.statusChip(o.status)}</button>${W.followups[o.id] ? `<p class="ae-hint">${ph('calendar-check')}${L(`Sent ${short(W.followups[o.id].sent)} · follow-up ${short(W.followups[o.id].due)}`, `Gesendet ${short(W.followups[o.id].sent)} · nachfassen ${short(W.followups[o.id].due)}`)}</p>` : ''}`) : ''}
            ${sec(L('History', 'Verlauf'), `<ol class="bfa-log ae-log">${evs.map(([t, ic, x, chn]) => `<li><span class="ic">${chn ? ch(chn).icon() : ph(ic || 'circle')}</span><span><b>${esc(x)}</b></span><time>${when(t)}</time></li>`).join('')}</ol>`)}
          </div>
        </div>`;
    }
    const logoWa = () => ch('whatsapp').icon();

    // ------------------------------------------------------------------ actions on a case, a task, a customer or one outbound recipient
    // key forms: case:C-101 · task:T-16 · cust:Name#reorder · push:hdpe:Name · scarce:PA66:Name
    function target(key) {
      const i = key.indexOf(':'), kind = key.slice(0, i), rest = key.slice(i + 1);
      if (kind === 'case') { const c = caseById(rest); return c && { key, c, cust: c.cust, title: T(c.next), src: srcOf(c) }; }
      if (kind === 'task') { const t0 = [...TASKS(), ...W.extra].find(x => x.id === rest); if (!t0) return null; const t = taskFull(t0); return t.c ? { ...target(`case:${t.c.id}`), t } : { key, t, cust: t.cust, why: t.flavor, title: T(t.act), src: taskSrc(t) }; }
      if (kind === 'push') { const [pid, cust] = [rest.slice(0, rest.indexOf(':')), rest.slice(rest.indexOf(':') + 1)], p = PUSH().find(x => x.id === pid), f = p?.fits.find(x => x[0] === cust); if (!f) return null;
        return { key, cust, push: p, fit: f, title: L(`Offer ${p.grade}`, `${p.grade} anbieten`), src: srcOf({ src: [...(p.from === 'pm' ? [['pm', 'Sven Martens', 20, null, p.why]] : [['sap', ['Stock', 'Lagerbestand'], 6, null, p.why]]), [f[3], meta(cust).contact, 30 + hash(cust) % 200, null, f[2]]] }) }; }
      if (kind === 'scarce') { const [fm, cust] = [rest.slice(0, rest.indexOf(':')), rest.slice(rest.indexOf(':') + 1)], r = scarceRows(fm).find(x => x.cust === cust); if (!r) return null;
        return { key, cust, scarce: r, title: L(`${fm} is tight: tell ${nm(cust)}`, `${fm} ist knapp: ${nm(cust)} informieren`), src: srcOf({ src: [['sap', ['Allocation', 'Allokation'], 3, null, [`${fm}: ${tons(r.t.req)} requested, ${tons(r.t.avail)} available incl. inbound.`, `${fm}: ${tons(r.t.req)} angefragt, ${tons(r.t.avail)} verfügbar inkl. Zulauf.`]], ...r.msgs.map(m => [m.channel, meta(cust).contact, Math.max(1, Math.round((NOW - m.at) / 3600e3)), [ctx.subject(m), ctx.subject(m)], [ctx.body(m), ctx.body(m)]])] }) }; }
      if (kind === 'offer') { const o = D().offers.find(x => x.id === rest), fu = o && W.followups[o.id]; if (!o) return null;
        return { key, cust: o.customer, o, title: L(`Follow up on offer ${o.id}`, `Zu Angebot ${o.id} nachfassen`), src: srcOf({ fromMsgs: true, cust: o.customer, src: [['rule', ['Follow-up rule', 'Nachfass-Regel'], 1, null, [`Offer ${o.id} (${eur(o.value)}) sent ${fu ? short(fu.sent) : ''}; no reply recorded yet.`, `Angebot ${o.id} (${eur(o.value)}) gesendet ${fu ? short(fu.sent) : ''}; noch keine Antwort erfasst.`]]] }) }; }
      const [cust, why = ''] = rest.split('#'), a = acc(cust), n = nba(cust);
      if (why === 'spec') return { key, cust, why, title: L(`Ask ${meta(cust).contact} for the open points`, `${meta(cust).contact} nach den offenen Punkten fragen`), src: srcOf({ fromMsgs: true, cust }) };
      const txt = why === 'cross' && CROSS[cust] ? CROSS[cust][1] : why === 'reorder' ? [`Orders ${a.buys.join(', ')} about every ${a.rhythm} weeks; last order ${weeksAgo(a.order)}.`, `Bestellt ${a.buys.join(', ')} etwa alle ${a.rhythm} Wochen; letzte Bestellung ${weeksAgo(a.order)}.`] : [`Last contact ${daysAgo(a.contact)}. ${n.why}`, `Letzter Kontakt ${daysAgo(a.contact)}. ${n.why}`];
      return { key, cust, why, title: why === 'cross' && CROSS[cust] ? L(`Ask about ${CROSS[cust][0]}`, `Nach ${CROSS[cust][0]} fragen`) : why === 'reorder' ? L('Ask about the next order', 'Nach der nächsten Bestellung fragen') : n.text,
        src: srcOf({ src: [[why === 'cold' || !why ? 'crm' : 'sap', why === 'cross' ? ['Purchase analysis', 'Kaufanalyse'] : why === 'reorder' ? ['Order history', 'Kaufhistorie'] : ['Contact history', 'Kontakthistorie'], 2, null, txt]] }) };
    }
    const hello = who => L(`Good day ${who},`, `Guten Tag ${who},`), bye = () => L(`Kind regards\n${sig()}`, `Viele Grüße\n${sig()}`);
    const tidy = t => t.replace(/\.\.(?!\.)/g, '.');
    function mailOf(x) { const m = mailRaw(x); return { ...m, subj: ctx.personal(tidy(m.subj), x.cust), body: ctx.personal(tidy(m.body), x.cust) }; }
    function mailRaw(x) {
      const c = x.c, cust = x.cust, m = meta(cust), a = acc(cust), to = mailTo(cust), who = m.contact, buy = a.buys[0] || '';
      const o = c?.offer && c.goal === 'offer' ? D().offers.find(y => y.id === c.offer) : null;
      if (o) { const om = ctx.offerMail(o); return { to, subj: om.subj, body: om.body, att: [`${o.id}.pdf`, ...(c.att || [])] }; }
      if (c?.mail) return { to, cc: c.mail.cc, subj: T(c.mail.subj), body: T(c.mail.body), att: c.mail.att || [] };
      if (x.push) { const p = x.push, f = x.fit, q = Math.max(1, f[4] || 2);
        return { to, subj: L(`${q} t ${p.grade} at a good price`, `${q} t ${p.grade} zu einem guten Preis`), att: [`Datenblatt_${p.grade.split(' · ')[0].replace(/[^A-Za-z0-9]+/g, '_')}.pdf`],
          body: L(`${hello(who)}\n\nwe have ${q} t ${p.grade} (${T(p.mat)}) available right now at a good price: ${nf(p.special, 2)} €/kg instead of ${nf(p.price, 2)} €/kg, FCA Hamburg, valid until ${short(p.until)}.\n\n${T(f[5])}\n\nWould you be interested? Just get in touch and I will reserve the quantity for you.\n\n${bye()}`,
            `${hello(who)}\n\nwir haben gerade ${q} t ${p.grade} (${T(p.mat)}) zu einem guten Preis frei: ${nf(p.special, 2)} €/kg statt ${nf(p.price, 2)} €/kg, FCA Hamburg, gültig bis ${short(p.until)}.\n\n${T(f[5])}\n\nHätten Sie Interesse? Melden Sie sich gern, dann reserviere ich Ihnen die Menge.\n\n${bye()}`) }; }
      if (x.scarce) { const r = x.scarce, g = r.grades.join(', ') || r.mat, fm = r.t.fam;
        if (r.state === 'secure') return { to, att: [], subj: L(`${fm}: your ${tons(r.need)} are reserved`, `${fm}: Ihre ${tons(r.need)} sind reserviert`), body: L(`${hello(who)}\n\n${fm} is tight right now; producers are allocating. We have reserved your ${tons(r.need)} ${g} for ${wk(r.wk)}.\n\nPlease confirm the order by Friday, then the quantity is firmly planned for you.\n\n${bye()}`, `${hello(who)}\n\n${fm} ist gerade knapp, die Hersteller allokieren. Ihre ${tons(r.need)} ${g} für ${wk(r.wk)} haben wir für Sie reserviert.\n\nBitte bestätigen Sie die Bestellung bis Freitag, dann ist die Menge fest für Sie eingeplant.\n\n${bye()}`) };
        if (r.state === 'part') return { to, att: [], subj: L(`${fm}: ${tons(r.got)} of ${tons(r.need)} secured`, `${fm}: ${tons(r.got)} von ${tons(r.need)} gesichert`), body: L(`${hello(who)}\n\n${fm} is tight right now. Of your ${tons(r.need)} we can deliver ${tons(r.got)} ${g} for sure. For the remaining ${tons(r.need - r.got)} we suggest ${T(r.alt)}.\n\nDoes that work for you? Then I will reserve both right away.\n\n${bye()}`, `${hello(who)}\n\n${fm} ist gerade knapp. Von Ihren ${tons(r.need)} können wir ${tons(r.got)} ${g} sicher liefern. Für die restlichen ${tons(r.need - r.got)} schlagen wir ${T(r.alt)} vor.\n\nPasst das für Sie? Dann reserviere ich beides sofort.\n\n${bye()}`) };
        return { to, att: [], subj: L(`${fm}: an early heads-up`, `${fm}: eine frühe Info`), body: L(`${hello(who)}\n\nan early heads-up: ${fm} is tight, and for your ${tons(r.need)} ${r.mat} we have no free quantity right now. We suggest ${T(r.alt)}.\n\nShall I reserve that for you, or offer you an equivalent grade?\n\n${bye()}`, `${hello(who)}\n\neine frühe Info: ${fm} ist knapp, und für Ihre ${tons(r.need)} ${r.mat} haben wir im Moment keine freie Menge. Wir schlagen ${T(r.alt)} vor.\n\nSoll ich Ihnen das reservieren oder eine gleichwertige Type anbieten?\n\n${bye()}`) }; }
      const fl = x.why || '';
      if (x.o) { const o = x.o, fu = W.followups[o.id], g = [...new Set(o.ms.map(m => m.s.grade))].join(', ');
        return { to, att: [`${o.id}.pdf`], subj: L(`Your offer ${o.id}`, `Ihr Angebot ${o.id}`), body: L(`${hello(who)}\n\na quick follow-up on our offer ${o.id}${fu ? ` from ${short(fu.sent)}` : ''} (${g}, ${eur(o.value)}). Do the price and the delivery dates work for you? The quantities are reserved for you while the offer is valid.\n\nIf anything is still open, I am happy to call.\n\n${bye()}`, `${hello(who)}\n\nich hake kurz zu unserem Angebot ${o.id}${fu ? ` vom ${short(fu.sent)}` : ''} nach (${g}, ${eur(o.value)}). Passen Preis und Liefertermine für Sie? Die Mengen halten wir für Sie reserviert, solange das Angebot gilt.\n\nWenn noch etwas offen ist, rufe ich Sie gern an.\n\n${bye()}`) }; }
      if (fl === 'spec' && SPEC[cust]) { const Q = { qty: L('Which quantity do you need for the first order?', 'Welche Menge brauchen Sie für die erste Bestellung?'), date: L('By when do you need the material?', 'Bis wann brauchen Sie die Ware?'), place: L('Where do we deliver to?', 'Wohin liefern wir?'), price: L('Do you have a target price per kg?', 'Haben Sie einen Zielpreis pro kg?'), spec: L('Which test values do you need exactly?', 'Welche Prüfwerte brauchen Sie genau?') }, qs = SPEC[cust].map((k, i) => `${i + 1}. ${Q[k]}`).join('\n');
        const o = offerFor(cust), lines = o ? o.ms.map(m => `- ${tons(m.qty)} ${m.s.grade}${!m.s.week ? L(', in stock', ', ab Lager') : L(`, inbound ${wk(m.s.week)}`, `, Zulauf ${wk(m.s.week)}`)}`).join('\n') : '';
        return { to, att: [], subj: L('Your request: a few quick questions', 'Ihre Anfrage: kurze Rückfragen'), body: L(`${hello(who)}\n\nthank you for your request. So I can send you a firm offer, I still need:\n${qs}\n\n${lines ? `What we can offer today:\n${lines}\n\n` : ''}${bye()}`, `${hello(who)}\n\nvielen Dank für Ihre Anfrage. Damit ich Ihnen ein festes Angebot schicken kann, brauche ich noch:\n${qs}\n\n${lines ? `Was wir heute anbieten können:\n${lines}\n\n` : ''}${bye()}`) }; }
      if (fl === 'reorder') return { to, att: [], subj: L(`Your next order of ${buy}`, `Ihre nächste Bestellung ${buy}`), body: L(`${hello(who)}\n\nyour last order of ${buy} was ${weeksAgo(a.order)}; usually you order about every ${a.rhythm} weeks. Is new demand coming up? Tell me the quantity and the date, and I will reserve the material for you.\n\n${bye()}`, `${hello(who)}\n\nIhre letzte Bestellung ${buy} war ${weeksAgo(a.order)}, sonst bestellen Sie etwa alle ${a.rhythm} Wochen. Steht bald wieder Bedarf an? Sagen Sie mir Menge und Termin, dann reserviere ich das Material für Sie.\n\n${bye()}`) };
      if (fl === 'cross' && CROSS[cust]) return { to, att: [`Datenblatt_${CROSS[cust][0].replace(/[^A-Za-z0-9]+/g, '_')}.pdf`], subj: L(`${CROSS[cust][0]} for your parts?`, `${CROSS[cust][0]} für Ihre Teile?`), body: L(`${hello(who)}\n\nyou buy ${buy} from us. Many customers with similar parts also use ${CROSS[cust][0]}. Would that be interesting for you? I am happy to send the data sheet and a price.\n\n${bye()}`, `${hello(who)}\n\nSie beziehen bei uns ${buy}. Viele Kunden mit ähnlichen Teilen setzen zusätzlich ${CROSS[cust][0]} ein. Wäre das für Sie interessant? Gern schicke ich Ihnen Datenblatt und Preis.\n\n${bye()}`) };
      return { to, att: [], subj: c ? T(c.title) : L('Checking in', 'Kurze Nachfrage'), body: L(`${hello(who)}\n\nit has been a while, so I wanted to check in. How are things going, and is anything coming up where we can help?\n\n${bye()}`, `${hello(who)}\n\nes ist eine Weile her, darum melde ich mich kurz. Wie läuft es bei Ihnen, und steht etwas an, wobei wir helfen können?\n\n${bye()}`) };
    }
    function callOf(x) {
      const c = x.c, o = c?.offer && c.goal === 'offer' ? D().offers.find(y => y.id === c.offer) : null, pts = c?.call ? c.call.map(T) : [];
      if (o) pts.push(L(`Walk through offer ${o.id}: ${o.ms.length} lines, ${eur(o.value)}`, `Angebot ${o.id} durchgehen: ${o.ms.length} Positionen, ${eur(o.value)}`), L('Say clearly what arrives later or is an equivalent', 'Klar sagen, was später kommt oder gleichwertig ist'), L('Ask for the order by Friday so the quantity stays reserved', 'Um die Bestellung bis Freitag bitten, damit die Menge reserviert bleibt'));
      if (c?.qual) pts.push(...Object.values(c.qual).filter(q => q[2] && !pts.includes(T(q[2]))).map(q => T(q[2])));
      if (x.push) pts.push(L(`We have ${x.fit[4] || 2} t ${x.push.grade} at ${nf(x.push.special, 2)} €/kg until ${short(x.push.until)}`, `Wir haben ${x.fit[4] || 2} t ${x.push.grade} zu ${nf(x.push.special, 2)} €/kg bis ${short(x.push.until)}`), T(x.fit[2]), L('Interested? Reserve the quantity right away', 'Interesse? Menge gleich reservieren'));
      if (x.o) pts.push(L(`Do price and dates of ${x.o.id} work?`, `Passen Preis und Termine von ${x.o.id}?`), L('What is still open before they order?', 'Was ist vor der Bestellung noch offen?'), L('The quantity is reserved while the offer is valid', 'Die Menge ist reserviert, solange das Angebot gilt'));
      if (x.why === 'spec' && SPEC[x.cust]) pts.push(...SPEC[x.cust].map(k => ({ qty: L('Quantity for the first order?', 'Menge für die erste Bestellung?'), date: L('By when?', 'Bis wann?'), place: L('Delivered where?', 'Wohin geliefert?'), price: L('Target price per kg?', 'Zielpreis pro kg?'), spec: L('Which test values exactly?', 'Welche Prüfwerte genau?') }[k])));
      if (x.scarce) pts.push(L(`${x.scarce.t.fam} is tight: be open about it`, `${x.scarce.t.fam} ist knapp: offen ansprechen`), x.scarce.state === 'secure' ? L('Their quantity is reserved: ask for the order by Friday', 'Ihre Menge ist reserviert: um die Bestellung bis Freitag bitten') : L(`Offer ${T(x.scarce.alt)}`, `${T(x.scarce.alt)} anbieten`));
      if (!pts.length) pts.push(...(x.why === 'reorder' ? [L('How is business going? Is the next order coming up?', 'Wie läuft das Geschäft? Steht die nächste Bestellung an?'), L('Quantity and date: reserve it now', 'Menge und Termin: gleich reservieren')] : x.why === 'cross' && CROSS[x.cust] ? [L(`Do they use ${CROSS[x.cust][0]} anywhere?`, `Setzen sie irgendwo ${CROSS[x.cust][0]} ein?`), L('Offer the data sheet and a sample', 'Datenblatt und Muster anbieten')] : [L('What new projects are you planning for next year?', 'Welche neuen Projekte planen Sie für das nächste Jahr?'), L('Has anything changed in your production or your volumes?', 'Hat sich bei Ihrer Produktion oder Ihren Mengen etwas geändert?')]));
      return { tel: phone(x.cust), who: meta(x.cust).contact, pts, coach: c ? T(c.coach) : '' };
    }
    const waOf = (body, who) => body.replace(/^[^\n]*\n\n/, L(`Hi ${who}, `, `Hallo ${who}, `)).replace(/\n\n(Kind regards|Viele Grüße)\n(.*)$/s, (m0, g, n) => `\n${g}, ${n.split(' ')[0]}`);
    const ini = n => esc(String(n).replace(/^Dr\. /, '').split(' ').map(x => x[0]).join('').slice(0, 2));

    function compose() {
      const cp = st.compose; if (!cp) return '';
      const x = target(cp.key); if (!x) return '';
      const c = x.c, m = meta(x.cust), o = c?.offer && c.goal === 'offer' ? D().offers.find(y => y.id === c.offer) : null;
      const modes = [['email', 'envelope-simple', L('Email', 'E-Mail')], ...(c?.draft || acc(x.cust).pref === 'whatsapp' ? [['whatsapp', 'whatsapp-logo', 'WhatsApp']] : []), ['call', 'phone', L('Call', 'Anruf')]];
      let body = '', foot = '';
      if (cp.mode === 'call') {
        const k = callOf(x);
        body = `<div class="ae-callcard ${cp.live ? 'live' : ''}"><span class="av">${ini(k.who)}</span><span class="who"><b>${esc(k.who)}</b><small>${esc(nm(x.cust))}${prefChip(acc(x.cust).pref)}</small></span><span class="tel">${ph('phone')}${k.tel}</span>${cp.live ? `<span class="ae-live"><i></i>${L('On the call', 'Im Gespräch')}</span>` : ''}</div>
          <div class="ae-pts"><small>${L('TALKING POINTS', 'GESPRÄCHSLEITFADEN')}</small>${k.pts.map(p => `<label><input type="checkbox"><span>${esc(p)}</span></label>`).join('')}</div>
          ${k.coach ? `<p class="ae-note">${ph('lightbulb')}${esc(k.coach)}</p>` : ''}
          ${cp.live ? `<label class="ae-notes"><span>${L('Notes from the call', 'Notizen zum Anruf')}</span><textarea rows="3" data-f="callnote" placeholder="${esc(L('What was said? It goes into the customer history.', 'Was wurde gesagt? Es landet im Kundenverlauf.'))}"></textarea></label>` : ''}`;
        foot = cp.live ? `<span class="lab">${L('How did it go?', 'Wie lief es?')}</span><button class="bfa-btn sm" data-act="ae-cout" data-v="ai">${ph('sparkle')}${L('Tell the AI', 'Der KI erzählen')}</button><button class="bfa-btn sm" data-act="ae-cout" data-v="later">${L('Needs time', 'Braucht Zeit')}</button><button class="bfa-btn sm" data-act="ae-cout" data-v="no">${L('No need', 'Kein Bedarf')}</button><button class="bfa-btn sm primary" data-act="ae-cout" data-v="yes">${ph('check')}${o || x.push ? L('Interested: send by email', 'Interesse: per E-Mail senden') : L('Done, log it', 'Erledigt, protokollieren')}</button>`
          : `<button class="bfa-btn primary" data-act="ae-ccall">${ph('phone-call')}${L(`Call ${k.who}`, `${k.who} anrufen`)}</button>`;
      } else if (cp.mode === 'whatsapp') {
        const txt = ctx.personal(tidy(c?.draft ? T(c.draft) : waOf(mailOf(x).body, m.contact)), x.cust);
        body = `<div class="bfa-bubble whatsapp ae-wa"><div class="bh">${logoWa()}<b>${L('To', 'An')}: ${esc(m.contact)}</b><small>${phone(x.cust)}</small></div><p contenteditable="true" spellcheck="false">${esc(txt).replace(/\n/g, '<br>')}</p></div>`;
        foot = `<button class="bfa-btn primary" data-act="ae-csend" data-v="whatsapp">${ph('paper-plane-tilt')}${L('Approve & send', 'Freigeben & senden')}</button>`;
      } else {
        const mm = mailOf(x);
        body = `<div class="bfa-mail ae-cmail"><div class="mh"><span>${L('To', 'An')}</span><b>${esc(mm.to)}</b></div>${mm.cc ? `<div class="mh"><span>Cc</span><b>${esc(mm.cc)}</b></div>` : ''}<div class="mh"><span>${L('Subject', 'Betreff')}</span><b contenteditable="true" spellcheck="false">${esc(mm.subj)}</b></div><div class="mb" contenteditable="true" spellcheck="false">${esc(mm.body).replace(/\n/g, '<br>')}</div>${mm.att.length ? `<div class="ae-atts">${mm.att.map(f => `<span class="ma">${ph('file-pdf')}${esc(f)}</span>`).join('')}</div>` : ''}</div>`;
        foot = `<button class="bfa-btn" data-act="ae-csave">${ph('floppy-disk')}${L('Save draft', 'Entwurf speichern')}</button><button class="bfa-btn primary" data-act="ae-csend" data-v="email">${ph('paper-plane-tilt')}${c?.send ? T(c.send) : o ? L('Approve & send offer', 'Angebot freigeben & senden') : L('Approve & send', 'Freigeben & senden')}</button>`;
      }
      return `<div class="bfa-scrim" data-act="ae-cclose"></div><aside class="bfa-drawer ae-cmp ${cp.fresh ? 'enter' : ''}" role="dialog">
        <div class="dh"><div><h4>${esc(x.title)}</h4><small>${esc(x.cust)}${c ? ` · ${c.id}` : ''}</small></div><button class="bfa-ic" data-act="ae-cclose" aria-label="Close">${ph('x')}</button></div>
        <div class="db">
          <div class="ae-cmp-src"><small>${L('SOURCE · WHERE THIS COMES FROM', 'QUELLE · WOHER DAS KOMMT')}</small>${x.src.map(srcCard).join('')}</div>
          <div class="ae-seg" role="tablist">${modes.map(([k, ic, l]) => `<button class="${cp.mode === k ? 'on' : ''}" data-act="ae-cmode" data-v="${k}" role="tab" aria-selected="${cp.mode === k}">${ph(ic)}${l}</button>`).join('')}</div>
          ${body}
          ${o ? `<div class="ae-cmp-o"><small>${L('ATTACHED OFFER', 'ANGEHÄNGTES ANGEBOT')}</small>${offerCard(o)}</div>` : ''}
        </div>
        <div class="df">${foot}</div></aside>`;
    }

    // what happens once a message went out or a call ended
    function finish(x, via, note, quiet) {
      const c = x.c, cust = x.cust, icon = via === 'call' ? 'phone' : via === 'whatsapp' ? 'whatsapp-logo' : 'envelope-simple';
      const how = { email: ['by email', 'per E-Mail'], whatsapp: ['by WhatsApp', 'per WhatsApp'], call: ['by phone', 'telefonisch'] }[via];
      const extra = note ? [` · "${note}"`, ` · „${note}“`] : ['', ''];
      let msg = L('Sent after your approval and logged', 'Nach Ihrer Freigabe gesendet und protokolliert');
      if (SPEC[cust] && (x.why === 'spec' || x.c)) W.asked2.add(cust);
      if (x.c?.id === 'C-112' && x.c.offer) { W.tiersSent.add(x.c.offer); model.status[x.c.offer] = 'sent'; }
      if (x.c?.intents?.includes('calloff')) (D().orders || []).filter(o => o.customer === cust).forEach(o => { W.ordered.add(o.id); model.status[o.id] = 'sent'; });
      if (x.why === 'cold' || x.t?.goal === 'rel') { W.checkedIn.add(cust); if (ACC[cust]) ACC[cust].contact = 0; }
      if (x.o) { W.followups[x.o.id] = { ...(W.followups[x.o.id] || { sent: day(-2) }), due: day(4) }; log(cust, icon, [`Followed up on ${x.o.id} ${how[0]}${extra[0]}`, `Zu ${x.o.id} ${how[1]} nachgefasst${extra[1]}`]); msg = L(`Followed up. Next check ${short(day(4))}.`, `Nachgefasst. Nächster Check am ${short(day(4))}.`); }
      else if (x.push || x.scarce) {
        const id = x.push ? x.push.id : x.scarce.t.fam, sent = x.push ? (W.pushSent[id] = W.pushSent[id] || new Set()) : (W.scarceSent[id] = W.scarceSent[id] || new Set());
        sent.add(cust); if (x.push?.id === 'hdpe') W.pushed = true;
        log(cust, icon, x.push ? [`${x.push.grade} offered ${how[0]}${extra[0]}`, `${x.push.grade} ${how[1]} angeboten${extra[1]}`] : [`Told ${how[0]}: ${id} is tight${extra[0]}`, `${how[1]} informiert: ${id} ist knapp${extra[1]}`]);
        if (x.push) addTask(cust, 3, { prio: 55, kind: 'com', goal: 'offer', act: [`Follow up on ${x.push.grade}`, `Zu ${x.push.grade} nachfassen`], why: [`Offered ${short(NOW)} at ${nf(x.push.special, 2)} €/kg`, `Am ${short(NOW)} zu ${nf(x.push.special, 2)} €/kg angeboten`] });
      } else if (c) {
        const o = c.offer && c.goal === 'offer' && via !== 'call' ? c.offer : null;
        if (o) { model.status[o] = 'sent'; W.followups[o] = { sent: new Date(), due: day(4) }; setCase(c.id, { status: 'sent', cur: 4 }); log(cust, 'paper-plane-tilt', [`Offer ${o} sent ${how[0]}; follow-up ${short(day(4))}`, `Angebot ${o} ${how[1]} gesendet; Nachfassen ${short(day(4))}`], c.id); msg = L(`Offer ${o} sent. Follow-up set for ${short(day(4))}.`, `Angebot ${o} gesendet. Nachfassen am ${short(day(4))} gesetzt.`); }
        else {
          if (c.done) { setCase(c.id, { cur: c.done.cur, status: c.done.status }); if (c.id === 'C-106') W.asked = true; if (c.done.task) addTask(c.cust, c.done.task.in, { kind: c.done.task.kind, act: c.done.task.act, why: c.done.task.why }); if (c.done.toast) msg = T(c.done.toast); }
          else if (['followup', 'negotiation', 'qualifying', 'sent'].includes(c.status)) { setCase(c.id, { status: 'awaiting' }); if (c.offer && W.followups[c.offer]) W.followups[c.offer].due = day(4); }
          log(cust, icon, [`${c.next[0]} (${how[0]})${extra[0]}`, `${c.next[1]} (${how[1]})${extra[1]}`], c.id);
        }
        closeTasksOf(c.id);
      } else {
        if (x.t) W.done.add(x.t.id); else [...TASKS(), ...W.extra].filter(t => t.cust === cust && !t.case).forEach(t => W.done.add(t.id));
        log(cust, icon, [`${x.title} (${how[0]})${extra[0]}`, `${x.title} (${how[1]})${extra[1]}`]);
      }
      if (via === 'call') msg = L('Call logged on the customer', 'Anruf beim Kunden protokolliert');
      if (quiet) return;
      st.compose = null; ctx.toast(msg); ctx.emit();
    }

    // ------------------------------------------------------------------ Inbound purchase: request → offer → confirmation → follow-up
    // a request moves through four stages; the offer is drafted automatically from the matched lines (AutoPilot), a person sends it
    const SPEC = { 'Elbtal Elektrotechnik GmbH': ['spec'], 'Lippe Kabeltechnik GmbH': ['date', 'price'] };
    const OPEN = () => ({ qty: L('Quantity', 'Menge'), date: L('Delivery date', 'Liefertermin'), place: L('Delivery point', 'Lieferort'), price: L('Target price', 'Zielpreis'), spec: L('Specification', 'Spezifikation') });
    const caseOfOffer = o => (o.kind === 'order' ? cases().find(c => c.cust === o.customer && c.intents.includes('calloff')) : cases().find(c => c.offer === o.id) || cases().find(c => c.cust === o.customer && c.type === 'req' && SPEC[o.customer]));
    // stages: spec → create → out (with the customer) → order; framework call-offs start at order, accepted offers end there
    function pqStage(o) {
      if (o.kind === 'order' || W.won.has(o.id)) return W.ordered.has(o.id) ? null : 'order';
      if (o.priceOnly) return W.tiersSent.has(o.id) ? null : 'create';
      if (o.status === 'rejected') return null;
      if (o.status === 'sent') return 'out';
      return SPEC[o.customer] ? 'spec' : 'create';
    }
    const isDue = o => { const fu = W.followups[o.id]; return (fu && fu.due <= endOfDay) || ['followup', 'negotiation'].includes(caseOfOffer(o)?.status); };
    const allPQ = () => [...D().offers, ...(D().orders || [])];
    const PQ = () => ({ spec: [L('Needs specification', 'Spezifikation offen'), L('Something is still open: quantity, date, price or spec. Ask once, with every open point in one message.', 'Etwas ist noch offen: Menge, Termin, Preis oder Spezifikation. Einmal nachfragen, alle offenen Punkte in einer Nachricht.'), 'question'],
      create: [L('Create offer', 'Angebot erstellen'), L('Everything is clear. AutoPilot drafted the offer from stock and inbound; you check it and send it.', 'Alles steht fest. AutoPilot hat das Angebot aus Lager und Zulauf entworfen; Sie prüfen und senden.'), 'file-plus'],
      out: [L('With the customer', 'Beim Kunden'), L('Offers the customer has and needs to accept. The ones due for follow-up are on top: follow up today by email, WhatsApp or phone. The rest are still within their time.', 'Angebote, die beim Kunden liegen und angenommen werden müssen. Fällige stehen oben: heute nachfassen per E-Mail, WhatsApp oder Anruf. Die übrigen sind noch in ihrer Frist.'), 'hourglass-medium'],
      order: [L('Create order', 'Auftrag anlegen'), L('No offer needed: framework call-offs and accepted offers. Check them, create the order in SAP, and the confirmation goes to the customer.', 'Kein Angebot nötig: Abrufe aus Rahmenverträgen und angenommene Angebote. Prüfen, Auftrag in SAP anlegen, die Bestätigung geht an den Kunden.'), 'clipboard-text'] });
    const pqKey = o => { const c = caseOfOffer(o), g = pqStage(o); return c && isOpenCase(c) ? `case:${c.id}` : g === 'spec' ? `cust:${o.customer}#spec` : `offer:${o.id}`; };
    function pq(stage) {
      const all = allPQ().filter(o => pqStage(o) === stage && inRole(o.customer)).sort((x, y) => (stage === 'out' ? isDue(y) - isDue(x) : 0));
      const rows = all.filter(o => ctx.search(st.q, o.customer, meta(o.customer).code, ...o.ms.map(m => m.s.grade)));
      const sent = D().offers.filter(o => o.status === 'sent' && !W.won.has(o.id));
      const extraH = { spec: L('OPEN POINTS', 'OFFEN'), create: L('CHECKS', 'PRÜFUNG'), out: L('FOLLOW-UP', 'NACHFASSEN'), order: L('ORIGIN', 'HERKUNFT') }[stage];
      const extra = o => {
        if (stage === 'spec') return `<span class="ae-open">${SPEC[o.customer].map(k => `<i>${esc(OPEN()[k])}</i>`).join('')}</span>${W.asked2.has(o.customer) ? chip('c-sent', L('Asked', 'Nachgefragt'), ph('check')) : ''}`;
        if (o.priceOnly) return chip('c-cat', L('Price inquiry · scale 1 / 3 / 5 t', 'Preisanfrage · Staffel 1 / 3 / 5 t'), ph('currency-eur'));
        if (stage === 'create') return o.warn ? chip('c-warn', L(`${o.warn} to check`, `${o.warn} prüfen`), ph('warning-circle')) : chip('c-ok', L('All checks pass', 'Alles geprüft'), ph('check'));
        if (stage === 'order') return o.kind === 'order' ? chip('c-sent', L('Framework call-off', 'Rahmenabruf'), ph('handshake')) : chip('c-ok', L('Offer accepted', 'Angebot angenommen'), ph('check-circle'));
        const fu = W.followups[o.id], c = caseOfOffer(o);
        if (isDue(o)) return `${chip('c-warn', L('Due today', 'Heute fällig'), ph('bell-ringing'))}<span class="ae-mut">${esc(c?.status === 'negotiation' ? L('price objection', 'Preiseinwand') : fu ? L(`sent ${short(fu.sent)}`, `gesendet ${short(fu.sent)}`) : '')}</span>`;
        return `<span class="ae-mut">${fu ? L(`sent ${short(fu.sent)} · follow-up ${short(fu.due)}`, `gesendet ${short(fu.sent)} · nachfassen ${short(fu.due)}`) : ''}</span>`;
      };
      const btnOf = () => [ph('eye'), 'View'];
      const tl = {
        spec: () => [[all.length, L('Requests with open points', 'Anfragen mit offenen Punkten')], [all.reduce((a, o) => a + SPEC[o.customer].length, 0), L('Open points', 'Offene Punkte')], [all.filter(o => W.asked2.has(o.customer)).length, L('Asked already', 'Schon nachgefragt')], [eurK(all.reduce((a, o) => a + o.value, 0)), L('Value in play', 'Wert im Spiel')]],
        create: () => [[all.length, L('Offers drafted by AutoPilot', 'Von AutoPilot entworfen')], [all.filter(o => !o.warn).length, L('Ready to send', 'Versandbereit')], [all.filter(o => o.warn).length, L('With points to check', 'Mit Prüfpunkten')], [eurK(all.reduce((a, o) => a + o.value, 0)), L('Offer value', 'Angebotswert')]],
        out: () => [[all.length, L('Offers with customers', 'Angebote beim Kunden')], [all.filter(isDue).length, L('Follow up today', 'Heute nachfassen')], [eurK(all.reduce((a, o) => a + o.value, 0)), L('Offer value', 'Angebotswert')], [W.won.size, L('Accepted this week', 'Diese Woche angenommen')]],
        order: () => [[all.length, L('Orders to create', 'Aufträge anzulegen')], [all.filter(o => o.kind === 'order').length, L('Framework call-offs', 'Rahmenabrufe')], [all.filter(o => o.kind !== 'order').length, L('From accepted offers', 'Aus angenommenen Angeboten')], [eurK(all.reduce((a, o) => a + o.value, 0)), L('Order value', 'Auftragswert')]] }[stage]();
      return `<div class="bfa-tabsbar ae-pqbar"><p class="ae-pqlead">${ph(PQ()[stage][2])}${esc(PQ()[stage][1])}</p>
          <div class="bfa-tabs-r"><label class="bfa-ap" data-tour="autopilot">${ph('sparkle')}<span>AutoPilot</span><button class="bfa-switch ${model.autopilot ? 'on' : ''}" role="switch" aria-checked="${model.autopilot}" data-act="autopilot"><i></i></button></label>${stage === 'order' ? '' : `<button class="bfa-btn primary" data-act="newoffer">${ph('plus')}${L('New offer', 'Neues Angebot')}</button>`}</div></div>
        ${model.autopilot ? `<div class="bfa-banner">${ph('sparkle')}<span>${L('AutoPilot reads every request, matches stock and inbound and drafts the offer. Sending stays with you.', 'AutoPilot liest jede Anfrage, gleicht Lager und Zulauf ab und entwirft das Angebot. Das Senden bleibt bei Ihnen.')}</span></div>` : ''}
        ${tiles(tl)}
        <label class="bfa-search solo">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(L('Search customer, grade', 'Kunde, Type suchen'))}"></label>
        ${rows.length ? `<div class="bfa-card bfa-tablewrap"><table class="bfa-table ae-pqt"><thead><tr><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('TYPE', 'TYP')}</th><th>${L('SOURCE', 'QUELLE')}</th><th>${L('DATE', 'DATUM')}</th><th class="num">${L('VALUE', 'WERT')}</th><th class="num">${L('QUOTED ITEMS', 'POSITIONEN')}</th><th>${extraH}</th><th></th></tr></thead>
          <tbody>${rows.map((o, i) => { const m = meta(o.customer), at = o.msgs.reduce((a, x) => (x.at > a ? x.at : a), new Date(0)); return `<tr style="--i:${i}">
            <td><button class="lnk" data-act="ae-cust" data-id="${esc(o.customer)}"><b class="cname">${esc(o.customer)}</b></button><small class="code">${m.code} · ${esc(m.contact)}</small></td>
            <td>${segChip(m.seg)}</td>
            <td><span class="ae-chs">${[...new Set(o.msgs.map(x => x.channel))].map(k => ctx.chTag(k)).join('')}</span></td>
            <td class="nowrap">${when(at)}</td>
            <td class="num">${eur(o.value)}</td>
            <td class="num">${String(o.ms.length).padStart(2, '0')}</td>
            <td>${extra(o)}</td>
            <td><button class="bfa-btn sm ${stage === 'create' || stage === 'order' || (stage === 'out' && isDue(o)) ? 'accent' : ''}" data-act="offer" data-id="${o.id}">${btnOf(o)[0]}${btnOf(o)[1]}</button></td></tr>`; }).join('')}</tbody></table></div>`
          : `<div class="bfa-card">${empty('check-circle', L('Nothing in this stage', 'In dieser Stufe ist nichts'), L('New requests land here as they come in.', 'Neue Anfragen landen hier, sobald sie eingehen.'))}</div>`}`;
    }
    const srcFor = o => { const c = caseOfOffer(o); return c && (o.kind === 'order' || c.offer === o.id) ? srcOf(c) : o.msgs.map(x => ({ k: x.channel, who: meta(o.customer).contact, at: x.at, title: ctx.subject(x), text: ctx.body(x) })).sort((a, b) => a.at - b.at); };
    // always visible on the first tab: where it comes from
    const sourceBrief = o => { const l = srcFor(o); return `<div class="gsrc"><small>${L('SOURCE', 'QUELLE')}</small>${l.map(srcTag).join('')}<button class="lnk" data-act="otab" data-id="demand">${L('Read', 'Lesen')}${ph('arrow-right')}</button></div>`; };
    // the GeneralMind-style detail: the source tab, then the offer, then our reply
    function offerSource(o) {
      const m = meta(o.customer), a = acc(o.customer), list = srcFor(o);
      return `<div class="ae-ocust"><span class="av">${ini(m.contact)}</span><span class="who"><b>${esc(m.contact)}</b><small>${L('Purchasing', 'Einkauf')} · ${esc(o.customer)}</small></span>${prefChip(a.pref)}</div>
        <div class="ae-ofacts"><div><span>${L('Type', 'Typ')}</span>${segChip(m.seg)}</div><div><span>${L('City', 'Ort')}</span><b>${esc(m.city)}</b></div><div><span>${L('Tier', 'Klasse')}</span><b>${a.tier}</b></div><div><span>${L('Phone', 'Telefon')}</span><b class="mono">${phone(o.customer)}</b></div><div><span>${L('Email', 'E-Mail')}</span><b>${esc(mailTo(o.customer))}</b></div><div><span>${L('Buys', 'Kauft')}</span><b>${esc(a.buys.join(', ') || '–')}</b></div></div>
        ${a.note ? `<p class="ae-note">${ph('info')}${esc(T(a.note))}</p>` : ''}
        ${SPEC[o.customer] && pqStage(o) === 'spec' ? `<div class="ae-specbox">${ph('question')}<span><b>${L('Still open before a firm offer', 'Vor einem festen Angebot noch offen')}</b>${SPEC[o.customer].map(k => esc(OPEN()[k])).join(' · ')}</span></div>` : ''}
        <div class="ae-srcs">${list.map(srcCard).join('')}</div>`;
    }
    const avail = m => (!m.s.week ? [L('In stock, Hamburg', 'Ab Lager Hamburg'), 'ok'] : m.onTime ? [L(`Inbound ${wk(m.s.week)}`, `Zulauf ${wk(m.s.week)}`), 'info'] : [L(`Inbound ${wk(m.s.week)}, after the need date`, `Zulauf ${wk(m.s.week)}, nach Bedarfstermin`), 'warn']);
    function offerFoot(o) {
      const g = pqStage(o), key = pqKey(o), fu = W.followups[o.id];
      const contact = (label, modes) => `<span class="lab">${label}</span>${modes.map(([v, ic, l]) => `<button class="bfa-btn sm" data-act="ae-cmp" data-id="${esc(key)}" data-v="${v}">${ph(ic)}${l}</button>`).join('')}`;
      if (g === 'spec') return `${contact(L(`Open: ${SPEC[o.customer].map(k => OPEN()[k]).join(', ')}`, `Offen: ${SPEC[o.customer].map(k => OPEN()[k]).join(', ')}`), [['call', 'phone', L('Call', 'Anrufen')]])}<button class="bfa-btn primary" data-act="ae-cmp" data-id="${esc(key)}" data-v="email">${ph('envelope-simple')}${L('Ask by email', 'Per E-Mail nachfragen')}</button>`;
      if (o.priceOnly) return W.tiersSent.has(o.id) ? `<span class="done">${ph('check-circle')}${L(`Price scale sent to ${meta(o.customer).contact}`, `Preisstaffel an ${meta(o.customer).contact} gesendet`)}</span>`
        : `<span class="lab">${L('Price inquiry only: no offer', 'Nur Preisanfrage: kein Angebot')}</span><button class="bfa-btn sm" data-act="otab" data-id="email">${ph('envelope-simple')}${L('See reply', 'Antwort ansehen')}</button><button class="bfa-btn sm primary" data-act="ae-tiers" data-id="${o.id}">${ph('paper-plane-tilt')}${L('Send price scale', 'Staffel senden')}</button>`;
      if (g === 'order') return `<span class="lab">${o.kind === 'order' ? L('Framework call-off: no offer needed', 'Rahmenabruf: kein Angebot nötig') : L('Offer accepted', 'Angebot angenommen')}</span><button class="bfa-btn sm" data-act="otab" data-id="email">${ph('envelope-simple')}${L('See confirmation', 'Bestätigung ansehen')}</button><button class="bfa-btn sm primary" data-act="ae-order" data-id="${o.id}">${ph('check-circle')}${L('Create order in SAP & confirm', 'Auftrag in SAP anlegen & bestätigen')}</button>`;
      if (o.kind === 'order' || W.ordered.has(o.id)) return `<span class="done">${ph('check-circle')}${L(`Order created in SAP, confirmation sent to ${meta(o.customer).contact}`, `Auftrag in SAP angelegt, Bestätigung an ${meta(o.customer).contact} gesendet`)}</span>`;
      if (g === 'out') return `${contact(fu ? L(`Follow-up ${short(fu.due)}`, `Nachfassen ${short(fu.due)}`) : L('Sent', 'Gesendet'), [['email', 'envelope-simple', L('Email', 'E-Mail')], ['whatsapp', 'whatsapp-logo', 'WhatsApp'], ['call', 'phone', L('Call', 'Anrufen')]])}<button class="bfa-btn sm primary" data-act="ae-won" data-id="${o.id}">${ph('check-circle')}${L('Accepted', 'Angenommen')}</button>`;
      return null;
    }
    const coachFor = o => { const c = caseOfOffer(o); if (!c?.coach) return ''; const sg = SIG()[c.signal]; return `<details class="bfa-sec ae-ocoach" open><summary><span>${ph('lightbulb')}${L('How to approach it', 'So gehen Sie vor')}</span>${sg ? chip(sg[1], sg[0], ph(sg[2])) : ''}${ph('caret-down')}</summary><p>${esc(T(c.coach))}</p></details>`; };
    const pqOf = o => { const g = o.id && pqStage(o); return g ? PQ()[g][0] : W.ordered.has(o.id) ? L('Orders', 'Aufträge') : L('Offers', 'Angebote'); };

    // ------------------------------------------------------------------ Opportunities: everything in the pipeline, recurring orders included, by closing date
    function oppRows() {
      const out = [];
      for (const p of pipeItems().filter(x => inRole(x.cust))) {
        if (['won', 'lost'].includes(p.status) || W.won.has(p.offer || p.c?.offer)) continue;
        const close = p.due || (p.c?.id === 'C-108' ? new Date(NOW.getFullYear() + 1, 0, 20) : p.c?.goal === 'offer' ? day(7) : day(10 + hash(p.cust) % 12));
        const prob = { qualifying: 30, future: 15, drafted: 50, sent: 55, awaiting: 55, followup: 60, reviewing: 65, negotiation: 50 }[p.status] || 40;
        out.push({ cust: p.cust, title: p.title, kind: p.c?.id === 'C-108' ? 'project' : p.c?.intents?.includes('outbound') ? 'reorder' : 'new', status: p.status, value: p.value || (p.c?.id === 'C-108' ? 60 * 2600 : 0), prob, close, open: p.case ? ['ae-case', p.case] : ['offer', p.offer], p });
      }
      // recurring business: every account with a buying rhythm has its next order coming
      for (const c of allCust().filter(inRole)) {
        const a = acc(c); if (!a.buys.length || out.some(r => r.cust === c && r.kind !== 'project')) continue;
        const lot = D().R.supply.find(x => x.grade === a.buys[0]), t = qtyOf(c);
        const next = day(Math.max(-35, a.rhythm * 7 - a.order));
        out.push({ cust: c, title: `${a.buys[0]} · ${L(`about ${t} t`, `ca. ${t} t`)}`, kind: 'recurring', status: next < NOW ? 'overdue' : 'expected', value: t * 1000 * (lot?.price || 2.4), prob: next < NOW ? 45 : 80, close: next < NOW ? day(3) : next, late: next < NOW, open: ['ae-cust', c], a, t, next });
      }
      return out.sort((x, y) => x.close - y.close);
    }
    // ------------------------------------------------------------------ Opportunities as a Gantt: phases, check-ins, escalation rules and the decision date of each one
    function ganttRows(rows) {
      const GR = () => ({ project: L('Projects with a long cycle', 'Projekte mit langem Zyklus'), new: L('Open offers & new business', 'Angebote & Neugeschäft'), recurring: L('Recurring orders from the buying rhythm', 'Wiederkehrende Bestellungen aus dem Kaufrhythmus') });
      const ORD = { project: 0, new: 1, reorder: 1, recurring: 2 }, at = (d, n) => new Date(+d + n * 864e5);
      return rows.slice().sort((x, y) => ORD[x.kind] - ORD[y.kind] || x.close - y.close).map(r => {
        const base = { label: nm(r.cust), sub: r.title, value: r.value, prob: r.prob, group: GR()[r.kind === 'reorder' ? 'new' : r.kind], late: r.late, open: r.open, close: r.close };
        if (r.kind === 'recurring') {
          // the next orders, one rhythm apart; a week before the first one, ask for quantity and date
          const marks = [], every = r.a.rhythm * 7, first = r.late ? day(3) : r.next;
          if (r.late) marks.push({ k: 'esc', at: day(.4), t: L(`${Math.round(r.a.order / 7 - r.a.rhythm)} weeks overdue: call about the next order`, `${Math.round(r.a.order / 7 - r.a.rhythm)} Wochen überfällig: wegen der nächsten Bestellung anrufen`) });
          else if (at(first, -7) > NOW) marks.push({ k: 'check', at: at(first, -7), t: L(`Ask ${meta(r.cust).contact} for quantity and date`, `${meta(r.cust).contact} nach Menge und Termin fragen`) });
          for (let d = first, k = 0; k < 6 && d < day(130); d = at(d, every), k++) marks.push({ k: 'order', at: d, q: `${r.t} t`, t: L(`Expected order: about ${r.t} t ${r.a.buys[0]}`, `Erwartete Bestellung: ca. ${r.t} t ${r.a.buys[0]}`) });
          return { ...base, sub: L(`${r.a.buys[0]} · every ${r.a.rhythm} wk`, `${r.a.buys[0]} · alle ${r.a.rhythm} Wo.`), line: true, marks };
        }
        const p = r.p || {}, c = p.c, created = c ? day(-c.at / 24) : day(-2);
        if (r.kind === 'project') {
          const cl = r.close;
          return { ...base, phases: [{ k: 'qual', from: created, to: day(12), t: L('Requirements & volumes', 'Anforderungen & Mengen') }, { k: 'sample', from: day(12), to: day(54), t: L('Samples & first-article test', 'Muster & Erstmusterprüfung') }, { k: 'offer', from: day(54), to: day(72), t: L('Framework offer 60 t a year', 'Rahmenangebot 60 t/Jahr') }, { k: 'wait', from: day(72), to: cl, t: L('Purchasing decides', 'Einkauf entscheidet') }, { k: 'serial', from: cl, to: day(240), t: L('Series demand from Q2 2027', 'Serienbedarf ab Q2 2027') }],
            marks: [{ k: 'check', at: day(26), t: L(`Check in with ${a2(r.cust)}: how are the samples running?`, `Check-in mit ${a2(r.cust)}: Wie laufen die Muster?`) }, { k: 'check', at: day(62), t: L('Walk through the framework offer by phone', 'Rahmenangebot telefonisch durchgehen') }, { k: 'esc', at: day(86), t: L('No decision by then: bring in product management and plan a visit', 'Bis dahin keine Entscheidung: Produktmanagement einbinden und Besuch planen') }, { k: 'close', at: cl, t: L('Decision on the supplier', 'Entscheidung über den Lieferanten') }] };
        }
        const id = p.offer || c?.offer, fu = id && W.followups[id], o = id && D().offers.find(x => x.id === id);
        const lead = o ? Math.max(1, ...o.ms.map(m => m.s.week || 0)) * 7 : 10, phases = [], marks = [];
        let cl = r.close < day(1) ? day(1) : r.close;
        if (fu?.sent) {
          if (cl <= at(fu.sent, 2)) cl = at(fu.sent, 6);
          phases.push({ k: 'offer', from: at(fu.sent, -2), to: fu.sent, t: L('Offer', 'Angebot') }, { k: 'wait', from: fu.sent, to: cl, t: r.status === 'negotiation' ? L('Negotiation', 'Verhandlung') : L('Customer reviewing', 'Kunde prüft') });
          marks.push({ k: 'check', at: fu.due, t: L('Follow up four days after sending', 'Nachfassen vier Tage nach Versand') }, { k: 'esc', at: at(fu.due, 5), t: L('Still no answer: call instead of writing again', 'Weiter keine Antwort: anrufen statt erneut schreiben') });
        } else if (['qualifying', 'future'].includes(r.status)) {
          if (cl < day(10)) cl = day(10);
          phases.push({ k: 'qual', from: created, to: day(5), t: L('Clarify quantity and date', 'Menge und Termin klären') }, { k: 'offer', from: day(5), to: day(7) }, { k: 'wait', from: day(7), to: cl });
          marks.push({ k: 'check', at: day(2), t: L('Call: ask every open point at once', 'Anrufen: alle offenen Punkte auf einmal klären') });
        } else {
          if (cl < day(4)) cl = day(4);
          phases.push({ k: 'qual', from: created, to: day(.2), t: L('Read & matched', 'Gelesen & abgeglichen') }, { k: 'offer', from: day(.2), to: day(1), t: L('Check & send', 'Prüfen & senden') }, { k: 'wait', from: day(1), to: cl });
          marks.push({ k: 'check', at: day(5), t: L('Follow up four days after sending', 'Nachfassen vier Tage nach Versand') });
        }
        phases.push({ k: 'deliv', from: at(cl, 2), to: at(cl, 2 + lead), t: o?.ms.some(m => m.s.week) ? L('Inbound, then delivery', 'Zulauf, dann Lieferung') : L('Delivery from Hamburg', 'Lieferung ab Hamburg') });
        marks.push({ k: 'close', at: cl, t: L(`Expected decision · ${eurK(r.value)} at ${r.prob} %`, `Erwartete Entscheidung · ${eurK(r.value)} bei ${r.prob} %`) });
        return { ...base, close: cl, phases: phases.filter(x => x.to > x.from), marks };
      });
    }
    const a2 = c => acc(c).c2?.[0] || meta(c).contact;
    function opps() {
      const v = st.oppView || 'gantt';
      const all = oppRows(), f = st.oppTab || 'all', rows = all.filter(r => f === 'all' || (f === 'recurring' ? r.kind === 'recurring' : r.kind !== 'recurring'));
      const KIND2 = () => ({ new: [L('New business', 'Neugeschäft'), 'c-ai'], recurring: [L('Recurring', 'Wiederkehrend'), 'c-ok'], reorder: [L('Reorder', 'Nachbestellung'), 'c-warn'], project: [L('Project', 'Projekt'), 'c-cat'] });
      const weekEnd = day(7 - ((NOW.getDay() + 6) % 7));
      // the view switch sits on top of the page, above everything else
      const VIEWS = [['gantt', 'chart-bar-horizontal', L('Timeline', 'Zeitplan')], ['board', 'kanban', 'Board'], ['list', 'list-bullets', L('List', 'Liste')]];
      const HINT = { gantt: L('Every opportunity on one timeline: phases, check-ins, escalation rules and the decision date.', 'Jede Opportunity auf einer Zeitachse: Phasen, Check-ins, Eskalationsregeln und der Entscheidungstermin.'), board: L('Where each opportunity stands, by stage.', 'Wo jede Opportunity steht, nach Phase.'), list: L('Everything in the pipeline, by closing date.', 'Alles in der Pipeline, nach Abschlussdatum.') };
      const sw = `<div class="ae-oview"><div class="ae-seg sm" role="tablist">${VIEWS.map(([k, ic, l]) => `<button role="tab" aria-selected="${v === k}" class="${v === k ? 'on' : ''}" data-act="ae-oview" data-id="${k}">${ph(ic)}${l}</button>`).join('')}</div><span>${HINT[v]}</span></div>`;
      if (v === 'board') return sw + pipeline();
      const z = st.oppZoom || 'q', ZOOM = { w: [L('8 weeks', '8 Wochen'), -7, 8], q: [L('4 months', '4 Monate'), -14, 16], h: [L('6 months', '6 Monate'), -14, 27] };
      const tabs = `<div class="bfa-tabsbar"><div class="bfa-tabs">${[['all', L('All', 'Alle'), all.length], ['new', L('Open offers & new', 'Angebote & Neues'), all.filter(r => r.kind !== 'recurring').length], ['recurring', L('Recurring', 'Wiederkehrend'), all.filter(r => r.kind === 'recurring').length]].map(([k, l, n]) => `<button class="${f === k ? 'on' : ''}" data-act="ae-otab" data-id="${k}">${l}<em>${n}</em></button>`).join('')}</div>
        ${v === 'gantt' ? `<div class="bfa-tabs-r"><div class="ae-seg sm">${Object.entries(ZOOM).map(([k, [l]]) => `<button class="${z === k ? 'on' : ''}" data-act="ae-ozoom" data-id="${k}">${l}</button>`).join('')}</div></div>` : ''}</div>`;
      const head = `${sw}${tiles([[all.length, L('Opportunities', 'Opportunities')], [eurK(all.reduce((a, r) => a + r.value, 0)), L('Pipeline value', 'Pipeline-Wert')], [eurK(all.reduce((a, r) => a + r.value * r.prob / 100, 0)), L('Weighted', 'Gewichtet')], [all.filter(r => r.close <= weekEnd).length, L('Closing this week', 'Abschluss diese Woche')]])}${tabs}`;
      if (v === 'list') return head + oppList(all, rows, KIND2, weekEnd);
      return `${head}${window.BFGantt ? window.BFGantt.html({ rows: ganttRows(rows), from: day(ZOOM[z][1]), weeks: ZOOM[z][2], lang: L('en', 'de'), sum: true, money: eurK, now: NOW }) : ''}
        <p class="bfa-fn">${L('Solid up to today, light from today on. The rules behind the markers: follow up four days after sending, call if there is still no answer five days later, ask about quantity and date a week before a recurring order. Click a customer to open it.', 'Bis heute kräftig, ab heute hell. Die Regeln hinter den Markern: vier Tage nach Versand nachfassen, fünf Tage später ohne Antwort anrufen, eine Woche vor einer wiederkehrenden Bestellung nach Menge und Termin fragen. Ein Klick auf den Kunden öffnet ihn.')}</p>`;
    }
    function oppList(all, rows, KIND2, weekEnd) {
      return `<div class="bfa-card bfa-tablewrap"><table class="bfa-table ae-opt"><thead><tr><th>${L('CLOSING', 'ABSCHLUSS')}</th><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('TYPE', 'TYP')}</th><th>OPPORTUNITY</th><th>${L('KIND', 'ART')}</th><th>${L('STAGE', 'PHASE')}</th><th class="num">${L('VALUE', 'WERT')}</th><th class="num">${L('PROB.', 'WAHRSCH.')}</th><th></th></tr></thead>
          <tbody>${rows.map((r, i) => `<tr style="--i:${i}" class="${r.close <= weekEnd ? 'soon' : ''}"><td class="nowrap"><b class="${r.late ? 'ae-warnc' : ''}">${short(r.close)}</b><small class="ae-sub">${r.close <= endOfDay ? L('today', 'heute') : r.close <= weekEnd ? L('this week', 'diese Woche') : L(`in ${Math.round((r.close - NOW) / 864e5)} days`, `in ${Math.round((r.close - NOW) / 864e5)} Tagen`)}</small></td>
            <td><button class="lnk" data-act="ae-cust" data-id="${esc(r.cust)}"><b class="cname">${esc(nm(r.cust))}</b></button></td><td>${segChip(meta(r.cust).seg)}</td><td class="ae-ot">${esc(r.title)}</td>
            <td>${chip(KIND2()[r.kind][1], KIND2()[r.kind][0])}</td><td>${r.kind === 'recurring' ? chip(r.late ? 'c-warn' : 'c-cat', r.late ? L('Overdue', 'Überfällig') : L('Expected', 'Erwartet')) : statChip(r.status)}</td>
            <td class="num">${r.value ? eurK(r.value) : '–'}</td><td class="num"><span class="ae-prob"><i style="width:${r.prob}%"></i></span>${r.prob} %</td>
            <td><button class="bfa-btn sm" data-act="${r.open[0]}" data-id="${esc(r.open[1])}">${'View'}</button></td></tr>`).join('')}</tbody></table></div>
        <p class="bfa-fn">${L('Recurring opportunities come from each customer\'s buying rhythm in SAP: the next order is expected one rhythm after the last one.', 'Wiederkehrende Opportunities kommen aus dem Kaufrhythmus jedes Kunden in SAP: Die nächste Bestellung wird einen Rhythmus nach der letzten erwartet.')}</p>`;
    }

    // ------------------------------------------------------------------ Pipeline
    const COLS = () => [['qual', L('Qualify & match', 'Qualifizieren & matchen')], ['draft', L('Offer drafted', 'Angebot entworfen')], ['sent', L('Sent · awaiting reply', 'Gesendet · wartet')], ['due', L('Follow-up due', 'Nachfassen fällig')], ['neg', L('Reviewing · negotiation', 'Prüfung · Verhandlung')], ['closed', L('Won · lost', 'Gewonnen · verloren')]];
    const COLOF = { qualifying: 'qual', future: 'qual', drafted: 'draft', sent: 'sent', awaiting: 'sent', followup: 'due', reviewing: 'neg', negotiation: 'neg', won: 'closed', lost: 'closed' };
    function pipeItems() {
      const opps = cases().filter(c => c.type === 'opp');
      const linked = new Set(opps.map(c => c.offer).filter(Boolean));
      const out = opps.map(c => ({ case: c.id, cust: c.cust, title: T(c.title), value: c.value, status: c.status, c, due: c.offer && W.followups[c.offer] && ['sent', 'awaiting'].includes(c.status) ? W.followups[c.offer].due : c.decision }));
      for (const o of D().offers) {
        if (linked.has(o.id)) continue;
        const status = o.status === 'new' ? 'qualifying' : o.status === 'sent' ? (W.followups[o.id] && W.followups[o.id].due <= endOfDay ? 'followup' : 'sent') : o.status === 'rejected' ? 'lost' : 'drafted';
        out.push({ offer: o.id, cust: o.customer, title: [...new Set(o.ms.map(m => m.s.grade))].slice(0, 2).join(' + '), value: o.value, status, due: W.followups[o.id]?.due, rej: o.status === 'rejected' });
      }
      return out;
    }
    function pipeline() {
      const items = pipeItems().filter(p => inRole(p.cust));
      const open = items.filter(p => COLOF[p.status] !== 'closed');
      const reqs = cases().filter(c => c.type === 'req' && !c.intents.includes('calloff') && inRole(c.cust));
      // the Match cockpit and the offer list are reached from here when a quote is needed
      return `<div class="ae-bar"><button class="bfa-btn sm" data-act="nav" data-id="offers">${ph('list-bullets')}${L('All offers', 'Alle Angebote')}</button><button class="bfa-btn sm accent" data-act="nav" data-id="cockpit">${ph('arrows-merge')}${L('Match cockpit', 'Match-Cockpit')}</button></div>
        ${tiles([[open.length, L('Open opportunities', 'Offene Opportunities')], [eurK(open.reduce((a, p) => a + (p.value || 0), 0)), L('Value in play', 'Wert im Spiel')], [items.filter(p => ['sent', 'awaiting', 'reviewing'].includes(p.status)).length, L('Waiting on the customer', 'Warten auf den Kunden')], [items.filter(p => p.status === 'followup').length, L('Follow-ups due today', 'Heute nachfassen')]])}
        <div class="ae-pnote">${ph('info')}<span>${L(`Requests are not opportunities. ${reqs.length} requests this week (documents, delivery questions, price checks) are handled in Service and the inbox and never clutter this board.`, `Anfragen sind keine Opportunities. ${reqs.length} Anfragen dieser Woche (Dokumente, Lieferfragen, Preisanfragen) laufen über Service und Posteingang und landen nicht auf diesem Board.`)}</span><button class="lnk" data-act="nav" data-id="service">${L('Open Service', 'Service öffnen')} ${ph('arrow-right')}</button></div>
        <div class="ae-kanban">${COLS().map(([k, l]) => { const list = items.filter(p => COLOF[p.status] === k); return `<div class="ae-kcol k-${k}"><h5>${l}<em>${list.length}</em></h5>${list.map((p, i) => `<button class="ae-kcard" style="--i:${i}" data-act="${p.case ? 'ae-case' : 'offer'}" data-id="${p.case || p.offer}">
            <span class="kt"><b>${esc(nm(p.cust))}</b>${p.value ? `<em>${eurK(p.value)}</em>` : ''}</span><span class="ks">${esc(p.title)}</span>
            <span class="kf">${statChip(p.status)}${p.due ? `<small>${ph('calendar-blank')}${short(p.due)}</small>` : ''}${p.c?.lostReason ? `<small>${esc(T(p.c.lostReason))}</small>` : ''}${!p.case ? `<small class="eng">${ph('arrows-merge')}${L('from matching', 'aus Matching')}</small>` : ''}</span></button>`).join('') || `<p class="ae-muted sm">${L('Empty', 'Leer')}</p>`}</div>`; }).join('')}</div>
        <p class="bfa-fn">${L('Sending an offer sets a follow-up for day four automatically. Customer answers, delays and lost reasons come in through the chat on each card.', 'Mit dem Versand eines Angebots wird automatisch ein Nachfassen für Tag vier angelegt. Kundenantworten, Verschiebungen und Verlustgründe kommen über den Chat auf jeder Karte.')}</p>`;
    }

    // ------------------------------------------------------------------ Outbound: push products, scarce supply, reorders and cross-sell
    const freeStock = g => D().R.supply.filter(x => x.grade === g && !x.week).reduce((a, x) => a + x.left, 0);
    // fits: [customer, 1 fits · 2 maybe · 0 no, why, where we know it from, suggested t, the personal line for the email]
    const PUSH = () => {
      const hp = hdpe(), until = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0);
      const P = (id, grade, prod, mat, qty, where, price, cut, from, why, fits) => ({ id, grade, prod, mat, qty, where, price, special: price - cut, from, why, fits, until });
      return [
        P('hdpe', 'HMA 016 · Marlex 9006', 'ExxonMobil · Chevron Phillips', ['HDPE food grade, injection moulding', 'HDPE Lebensmittel, Spritzguss'], hp.total, [`${tons(hp.hma)} inbound ${wk(hp.wk)}, ${tons(hp.mar)} in Hamburg`, `${tons(hp.hma)} Zulauf ${wk(hp.wk)}, ${tons(hp.mar)} in Hamburg`], 1.38, .04, 'pm',
          [`${tons(hp.hma)} HMA 016 arrive ${wk(hp.wk)} and are not sold yet, plus ${tons(hp.mar)} Marlex 9006 free in Hamburg. Special price −€40/t for orders until the end of the month.`, `${tons(hp.hma)} HMA 016 kommen ${wk(hp.wk)} und sind noch nicht verkauft, dazu ${tons(hp.mar)} Marlex 9006 frei in Hamburg. Sonderpreis −40 €/t für Bestellungen bis Monatsende.`],
          [['Hanse Closures GmbH', 1, ['Buys HDPE food for closures every 3 weeks; next call-off due in about 9 days.', 'Kauft HDPE Lebensmittel für Verschlüsse alle 3 Wochen; nächster Abruf in etwa 9 Tagen.'], 'sap', 24, ['You buy HDPE for your closures every three weeks, so I thought of you first.', 'Sie beziehen alle drei Wochen HDPE für Ihre Verschlüsse, deshalb dachte ich zuerst an Sie.']],
            ['Weser Getränketechnik GmbH', 1, ['Bought HMA 016 in spring for closures. With PET allocated, HDPE help is welcome.', 'Hat im Frühjahr HMA 016 für Verschlüsse gekauft. Bei allokiertem PET ist HDPE-Hilfe willkommen.'], 'sap', 12, ['You ran HMA 016 on your closures in spring. It is the same grade.', 'Sie hatten HMA 016 im Frühjahr für Ihre Verschlüsse im Einsatz. Es ist dieselbe Type.']],
            ['Sauerland Haushaltswaren GmbH', 2, ['Housewares in PP today; said on the phone that HDPE is worth a trial.', 'Haushaltswaren heute in PP; am Telefon gesagt, dass HDPE einen Versuch wert ist.'], 'calls', 4, ['On the phone you said HDPE might be worth a trial for your housewares. This would be a good moment.', 'Am Telefon meinten Sie, HDPE sei für Ihre Haushaltswaren einen Versuch wert. Das wäre ein guter Moment.']],
            ['Emsland Rohrsysteme GmbH', 0, ['Needs PE100 pipe grades. HMA 016 is an injection grade, not a substitute.', 'Braucht PE100-Rohrtypen. HMA 016 ist eine Spritzgusstype, kein Ersatz.'], 'sap', 0, ['', '']],
            ['Folienwerk Nordheide GmbH', 0, ['Film extrusion in LLDPE. An HDPE injection grade does not fit.', 'Folienextrusion in LLDPE. Eine HDPE-Spritzgusstype passt nicht.'], 'sap', 0, ['', '']]]),
        P('skypel', 'Skypel G130D', 'SK Chemicals', ['TPE 30D', 'TPE 30D'], freeStock('Skypel G130D'), ['In Hamburg, ready to ship', 'In Hamburg, sofort lieferbar'], 4.4, .15, 'stock', ['Surplus in stock with a good margin. Product management releases −€150/t.', 'Überbestand im Lager mit guter Marge. Das Produktmanagement gibt −150 €/t frei.'],
          [['Lippe Kabeltechnik GmbH', 1, ['Buys Skypel G130D for cable sheathing about every 8 weeks.', 'Kauft Skypel G130D für Kabelmäntel etwa alle 8 Wochen.'], 'sap', 4, ['It is the grade you use for your cable sheathing.', 'Es ist die Type, die Sie für Ihre Kabelmäntel einsetzen.']],
            ['Allgäu Gartengeräte GmbH', 1, ['Mentioned soft-grip handles for the 2027 garden-tool range on the phone.', 'Hat am Telefon Soft-Grip-Griffe für die Gartengeräte-Serie 2027 erwähnt.'], 'calls', 3, ['You mentioned soft-grip handles for your 2027 range. Skypel G130D is a good fit for that.', 'Sie hatten Soft-Grip-Griffe für Ihre Serie 2027 erwähnt. Dafür passt Skypel G130D gut.']],
            ['Harzer Steckverbinder GmbH', 2, ['Uses Hytrel 4056 (TPE 40D) for seals; 30D needs their release.', 'Nutzt Hytrel 4056 (TPE 40D) für Dichtungen; 30D braucht ihre Freigabe.'], 'sap', 2, ['For softer seals than your Hytrel 4056, a trial with Skypel G130D could be worth it.', 'Für weichere Dichtungen als mit Ihrem Hytrel 4056 könnte sich ein Versuch mit Skypel G130D lohnen.']]]),
        P('tarnamid', 'Tarnamid T-27', 'Grupa Azoty', ['PA6 natural', 'PA6 natur'], freeStock('Tarnamid T-27'), ['In Hamburg for 9 weeks', 'Seit 9 Wochen in Hamburg'], 2.45, .1, 'age', ['In stock for 9 weeks without open demand.', 'Seit 9 Wochen im Lager, ohne offenen Bedarf.'],
          [['Lippe Kabeltechnik GmbH', 1, ['Asked for 12 t PA6 natural on WhatsApp; Tarnamid T-27 meets the spec.', 'Hat per WhatsApp 12 t PA6 natur angefragt; Tarnamid T-27 erfüllt die Spezifikation.'], 'whatsapp', 9, ['You asked for PA6 natural on WhatsApp. Tarnamid T-27 meets your spec and is ready to ship.', 'Sie hatten per WhatsApp nach PA6 natur gefragt. Tarnamid T-27 erfüllt Ihre Spezifikation und ist sofort lieferbar.']],
            ['Harzer Steckverbinder GmbH', 2, ['Talked about PA6 for connector housings at the last visit.', 'Beim letzten Besuch über PA6 für Steckergehäuse gesprochen.'], 'visit', 3, ['At our last visit we talked about PA6 for your connector housings.', 'Bei unserem letzten Besuch hatten wir über PA6 für Ihre Steckergehäuse gesprochen.']],
            ['Bodensee Präzisionsteile GmbH', 0, ['Never buys from Grupa Azoty (customer rule).', 'Kauft nie bei Grupa Azoty (Kundenregel).'], 'crm', 0, ['', '']]]),
        P('lupoy', 'Lupoy 1303-10', 'LG Chem', ['PC natural', 'PC natur'], freeStock('Lupoy 1303-10'), [`In Hamburg, 18 t more inbound ${wk(8)}`, `In Hamburg, weitere 18 t im Zulauf ${wk(8)}`], 2.75, .08, 'stock', ['14 t in stock and 18 t more arriving.', '14 t im Lager, weitere 18 t im Zulauf.'],
          [['Ostsee Sanitär GmbH', 1, ['Asked about transparent PC covers for fittings on the phone.', 'Hat am Telefon nach transparenten PC-Abdeckungen für Armaturen gefragt.'], 'calls', 6, ['You asked about transparent covers for your fittings. Lupoy 1303-10 is made for that.', 'Sie hatten nach transparenten Abdeckungen für Ihre Armaturen gefragt. Dafür ist Lupoy 1303-10 gemacht.']],
            ['Elbtal Elektrotechnik GmbH', 1, ['Bought Lupoy 1303-10 for housings in spring.', 'Hat im Frühjahr Lupoy 1303-10 für Gehäuse gekauft.'], 'sap', 5, ['You used Lupoy 1303-10 for housings in spring.', 'Sie hatten Lupoy 1303-10 im Frühjahr für Gehäuse im Einsatz.']],
            ['Medplast Tuttlingen GmbH', 2, ['Uses Wonderlite PC-110; Lupoy 1303-10 needs their release.', 'Nutzt Wonderlite PC-110; Lupoy 1303-10 braucht ihre Freigabe.'], 'sap', 3, ['As a second source next to Wonderlite PC-110, Lupoy 1303-10 could be worth a release.', 'Als zweite Quelle neben Wonderlite PC-110 könnte sich eine Freigabe für Lupoy 1303-10 lohnen.']]]),
      ];
    };
    const FROM = () => ({ pm: [L('Product management', 'Produktmanagement'), 'megaphone-simple'], stock: [L('Surplus stock', 'Überbestand'), 'stack'], age: [L('Long in stock', 'Lange im Lager'), 'hourglass-medium'] });
    const fitChip = f => f === 1 ? chip('c-ok', L('Fits', 'Passt'), ph('check')) : f === 2 ? chip('c-warn', L('Maybe', 'Vielleicht')) : chip('c-rej', L('No fit', 'Passt nicht'), ph('x'));
    const pushSel = p => W.pushSel[p.id] || (W.pushSel[p.id] = new Set(p.fits.filter(f => f[1] === 1).map(f => f[0])));
    const iconBtns = key => `<button class="bfa-ic sm" data-act="ae-cmp" data-id="${esc(key)}" data-v="call" aria-label="${esc(L('Call', 'Anrufen'))}" title="${esc(L('Call', 'Anrufen'))}">${ph('phone')}</button><button class="bfa-ic sm" data-act="ae-cmp" data-id="${esc(key)}" data-v="email" aria-label="${esc(L('Email', 'E-Mail'))}" title="${esc(L('Email', 'E-Mail'))}">${ph('envelope-simple')}</button>`;
    const sentChip = () => chip('c-ok', L('Sent', 'Gesendet'), ph('check'));

    function push() {
      if (st.push) return pushDetail();
      const mode = st.pushMode || 'prod', sent = Object.values(W.pushSent).reduce((a, x) => a + x.size, 0);
      const P = PUSH().filter(p => ctx.search(st.q, p.grade, p.prod, T(p.mat)));
      const seg = `<div class="ae-pmode"><div class="ae-seg"><button class="${mode === 'prod' ? 'on' : ''}" data-act="ae-pmode" data-id="prod">${ph('package')}${L('Find customers for a product', 'Kunden zum Produkt finden')}</button><button class="${mode === 'cust' ? 'on' : ''}" data-act="ae-pmode" data-id="cust">${ph('buildings')}${L('Find products for a customer', 'Produkte zum Kunden finden')}</button></div>
        ${mode === 'prod' ? `<label class="bfa-search">${ph('magnifying-glass')}<input data-act="q" value="${esc(st.q)}" placeholder="${esc(L('Enter a product: grade, material, producer', 'Produkt eingeben: Type, Werkstoff, Hersteller'))}"></label>` : ''}</div>`;
      if (mode === 'cust') return seg + custProducts();
      return `${tiles([[P.length, L('Products to push', 'Produkte zum Anbieten')], [tons(P.reduce((a, p) => a + p.qty, 0)), L('Volume to place', 'Menge zu platzieren')], [P.reduce((a, p) => a + p.fits.filter(f => f[1]).length, 0), L('Customers who could buy', 'Kunden, die kaufen könnten')], [sent, L('Offers sent', 'Angebote gesendet')]])}
        ${seg}
        <p class="ae-hint ae-lead">${ph('shield-check')}${L('Each product lists the customers who fit, ranked by what they buy, what they said on calls and their specs. Pick the customers, and every one gets a personal email.', 'Zu jedem Produkt stehen die passenden Kunden, sortiert nach Kaufhistorie, Aussagen aus Anrufen und Spezifikation. Kunden auswählen, und jeder bekommt eine persönliche E-Mail.')}</p>
        <div class="ae-pgrid">${P.map((p, i) => { const n = p.fits.filter(f => f[1]).length, done = W.pushSent[p.id]?.size || 0; return `<button class="ae-pcard" style="--i:${i}" data-act="ae-pp" data-id="${p.id}">
          <span class="pt"><span class="pf f-${p.from}">${ph(FROM()[p.from][1])}${FROM()[p.from][0]}</span>${done ? chip('c-ok', L(`${done} sent`, `${done} gesendet`), ph('check')) : ''}</span>
          <b class="pg">${esc(p.grade)}</b><small class="pm">${esc(p.prod)} · ${esc(T(p.mat))}</small>
          <span class="pq"><b>${tons(p.qty)}</b><em>${esc(T(p.where))}</em></span>
          <span class="pp"><s>${nf(p.price, 2)}</s><b>${nf(p.special, 2)} €/kg</b><em>${L('until', 'bis')} ${short(p.until)}</em></span>
          <span class="pc"><span class="avs">${p.fits.filter(f => f[1]).slice(0, 3).map(f => `<i>${ini(meta(f[0]).contact)}</i>`).join('')}</span>${L(`${n} customers could buy`, `${n} Kunden könnten kaufen`)}${ph('arrow-right')}</span></button>`; }).join('')}</div>`;
    }
    // the other direction: pick a customer, see what we could offer them right now and why
    function custProducts() {
      const list = allCust().filter(inRole).sort((a, b) => nm(a).localeCompare(nm(b))), c = st.pushCust && list.includes(st.pushCust) ? st.pushCust : 'Lippe Kabeltechnik GmbH', a = acc(c), out = [];
      for (const p of PUSH()) { const f = p.fits.find(x => x[0] === c); if (f && f[1]) out.push({ g: p.grade, sub: `${p.prod} · ${T(p.mat)}`, why: T(f[2]), k: f[3], price: `${nf(p.special, 2)} €/kg`, q: f[4] ? `${f[4]} t` : '', fit: f[1], key: `push:${p.id}:${c}`, tag: FROM()[p.from][0] }); }
      for (const g of a.buys) { const lots = D().R.supply.filter(x => x.grade === g), free = lots.filter(x => !x.week).reduce((t, x) => t + x.left, 0); if (lots.length) out.push({ g, sub: `${lots[0].producer} · ${lots[0].material}`, why: L(`Their usual grade: orders every ${a.rhythm} weeks, last ${weeksAgo(a.order)}.`, `Ihre übliche Type: bestellt alle ${a.rhythm} Wochen, zuletzt ${weeksAgo(a.order)}.`), k: 'sap', price: `${nf(lots[0].price, 2)} €/kg`, q: free ? L(`${tons(free)} free`, `${tons(free)} frei`) : L('inbound only', 'nur Zulauf'), fit: 1, key: `cust:${c}#reorder`, tag: L('Reorder', 'Nachbestellung') }); }
      if (CROSS[c]) out.push({ g: CROSS[c][0], sub: L('Cross-sell idea', 'Cross-Selling-Idee'), why: T(CROSS[c][1]), k: 'sap', price: '', q: '', fit: 2, key: `cust:${c}#cross`, tag: 'Cross-Selling' });
      return `<div class="ae-cpick">${list.map(x => `<button class="${x === c ? 'on' : ''}" data-act="ae-pcust" data-id="${esc(x)}">${esc(nm(x))}</button>`).join('')}</div>
        <div class="bfa-card ae-block"><h5>${L(`What we could offer ${nm(c)}`, `Was wir ${nm(c)} anbieten könnten`)}<em>${out.length}</em><span class="ae-h5r">${segChip(meta(c).seg)}${prefChip(a.pref)}</span></h5>
          ${out.length ? `<div class="ae-prows">${out.map(r => `<div class="ae-prow ae-cprow f${r.fit}"><span class="nm"><b>${esc(r.g)}</b><small>${esc(r.sub)}</small></span>${chip(r.fit === 1 ? 'c-ok' : 'c-warn', r.tag)}<span class="w">${esc(r.why)}<small class="ae-srct">${srcIcon(r.k)}${esc(srcLabel(r.k))}</small></span><span class="q">${esc(r.price)}<small>${esc(r.q)}</small></span><span class="a">${iconBtns(r.key)}</span></div>`).join('')}</div>` : `<p class="ae-muted">${L('Nothing to offer right now.', 'Gerade nichts anzubieten.')}</p>`}</div>`;
    }
    function pushDetail() {
      const p = PUSH().find(x => x.id === st.push); if (!p) return '';
      const sel = pushSel(p), sent = W.pushSent[p.id] || new Set(), open = [...sel].filter(c => !sent.has(c)), pm = W.role === 'pm';
      return `<div class="bfa-dh"><button class="bfa-ic" data-act="back" aria-label="Back">${ph('arrow-left')}</button><h3 class="ae-h3">${esc(p.grade)}</h3>${chip('c-cat', `${p.prod} · ${T(p.mat)}`)}<span class="srcs"><span class="pf f-${p.from} ae-pfrom">${ph(FROM()[p.from][1])}${FROM()[p.from][0]}</span></span></div>
        <div class="ae-pfacts"><div><span>${L('Quantity', 'Menge')}</span><b>${tons(p.qty)}</b></div><div><span>${L('Where', 'Wo')}</span><b>${esc(T(p.where))}</b></div><div><span>${L('List price', 'Listenpreis')}</span><b>${nf(p.price, 2)} €/kg</b></div><div><span>${L('Push price', 'Aktionspreis')}</span><b class="acc">${nf(p.special, 2)} €/kg</b><small>${L('until', 'bis')} ${short(p.until)}</small></div></div>
        ${p.from === 'pm' ? `<div class="ae-pmmsg"><span class="av">SM</span><div><b>Sven Martens · ${L('product management', 'Produktmanagement')}</b><p>${esc(T(p.why))}</p></div></div>` : `<div class="ae-pmmsg"><span class="av">${ph(FROM()[p.from][1])}</span><div><b>${FROM()[p.from][0]}</b><p>${esc(T(p.why))}</p></div></div>`}
        <div class="bfa-card ae-block"><h5>${L('Who could buy it', 'Wer es kaufen könnte')}<em>${p.fits.length}</em></h5>
          <div class="ae-prows">${p.fits.map(([c, f, why, k, q], i) => { const done = sent.has(c); return `<div class="ae-prow f${f} ${done ? 'sent' : ''}">
            <label class="cb">${f && !done ? `<input type="checkbox" data-act="ae-psel" data-id="${esc(c)}" ${sel.has(c) ? 'checked' : ''}>` : `<input type="checkbox" disabled ${done ? 'checked' : ''}>`}</label>
            <span class="nm"><button class="lnk" data-act="ae-cust" data-id="${esc(c)}"><b>${esc(nm(c))}</b></button><small>${esc(meta(c).contact)}${prefChip(acc(c).pref)}</small></span>
            ${fitChip(f)}
            <span class="w">${esc(T(why))}<small class="ae-srct">${srcIcon(k)}${esc(srcLabel(k))}</small></span>
            <span class="q">${q ? `${q} t` : '–'}</span>
            <span class="a">${done ? sentChip() : f ? iconBtns(`push:${p.id}:${c}`) : ''}</span></div>`; }).join('')}</div>
          <div class="ae-pfoot"><span>${L(`${open.length} selected`, `${open.length} ausgewählt`)}</span>${pm ? (W.pushed ? `<span class="okline">${ph('check-circle')}${L('Sent to the account managers', 'An den Vertrieb gegeben')}</span>` : `<button class="bfa-btn primary sm" data-act="ae-push">${ph('paper-plane-tilt')}${L('Send to account managers', 'An den Vertrieb geben')}</button>`)
              : `<button class="bfa-btn primary sm" data-act="ae-bulk" data-id="push:${p.id}" ${open.length ? '' : 'disabled'}>${ph('envelope-simple')}${L(`Draft ${open.length} emails`, `${open.length} E-Mails entwerfen`)}</button>`}</div></div>`;
    }

    // scarce supply: more is asked than there is. Tell customers early, lock in what is covered, offer the rest another way
    function scarceRows(fm) {
      const t = (ctx.tightFamilies?.() || []).find(x => x.fam === fm); if (!t) return [];
      const lines = D().R.demand.filter(d => ctx.fam(d) === fm), by = new Map();
      for (const d of lines) { const r = by.get(d.customer) || { cust: d.customer, t, need: 0, got: 0, wk: d.week, mat: d.material, grades: new Set() }; r.need += d.qty; r.got += d.matched; r.wk = Math.min(r.wk, d.week); by.set(d.customer, r); }
      for (const m of D().R.matches) { const r = by.get(m.d.customer); if (r && ctx.fam(m.d) === fm) r.grades.add(m.s.grade); }
      const nextIn = D().R.supply.filter(x => ctx.fam(x) === fm && x.week > 0).sort((a, b) => b.week - a.week)[0];
      return [...by.values()].map(r => ({ ...r, grades: [...r.grades], state: r.got >= r.need ? 'secure' : r.got > 0 ? 'part' : 'none', msgs: D().msgs.filter(m => m.customer === r.cust && m.lines.some(l => ctx.fam(l) === fm)),
        alt: nextIn ? [`the next inbound lot (${nextIn.grade}, ${wk(nextIn.week + 2)})`, `den nächsten Zulauf (${nextIn.grade}, ${wk(nextIn.week + 2)})`] : ['an equivalent grade after your release', 'eine gleichwertige Type nach Ihrer Freigabe'] })).sort((a, b) => ({ none: 0, part: 1, secure: 2 }[a.state] - { none: 0, part: 1, secure: 2 }[b.state]));
    }
    const STATE = () => ({ secure: [L('Covered: lock it in', 'Gedeckt: absichern'), 'c-ok', L('Reserve and ask for the order by Friday', 'Reservieren und um die Bestellung bis Freitag bitten')], part: [L('Partly covered', 'Teilweise gedeckt'), 'c-warn', L('Confirm what is sure, offer the rest another way', 'Sicheres bestätigen, den Rest anders anbieten')], none: [L('Not covered', 'Nicht gedeckt'), 'c-rej', L('Tell them early and offer an alternative', 'Früh informieren und eine Alternative anbieten')] });
    function scarce() {
      const tf = ctx.tightFamilies?.() || [], hormuz = ['LLDPE', 'HDPE', 'PE', 'PP', 'PET'];
      const all = tf.flatMap(t => scarceRows(t.fam)), sent = Object.values(W.scarceSent).reduce((a, x) => a + x.size, 0);
      return `${tiles([[tf.length, L('Scarce materials', 'Knappe Werkstoffe')], [all.length, L('Customers affected', 'Betroffene Kunden')], [all.filter(r => r.state !== 'secure').length, L('Not fully covered', 'Nicht voll gedeckt')], [sent, L('Customers informed', 'Kunden informiert')]])}
        <div class="bfa-banner">${ph('scales')}<span>${L('When demand is higher than supply, speed matters: lock in what is covered, be open about what is not, and offer the next lot or an equivalent. No discounts on scarce material.', 'Wenn der Bedarf höher ist als das Angebot, zählt Tempo: Gedecktes absichern, Ungedecktes offen ansprechen und den nächsten Zulauf oder eine gleichwertige Type anbieten. Keine Rabatte auf knappe Ware.')}</span></div>
        <div class="ae-scarce">${tf.map((t, i) => { const rows = scarceRows(t.fam), sel = W.scarceSel[t.fam] || (W.scarceSel[t.fam] = new Set(rows.map(r => r.cust))), done = W.scarceSent[t.fam] || new Set(), open = [...sel].filter(c => !done.has(c)); return `<div class="bfa-card ae-block" style="--i:${i}">
          <h5>${esc(t.fam)}${hormuz.includes(t.fam) ? chip('c-warn', L('Hormuz allocation', 'Hormus-Allokation')) : chip('c-cat', L('Tight', 'Knapp'))}<span class="ae-sbar"><i style="width:${Math.round(t.avail / t.req * 100)}%"></i></span><span class="ae-sq"><b>${tons(t.avail)}</b> / ${tons(t.req)}</span></h5>
          <div class="ae-prows">${rows.map(r => { const dn = done.has(r.cust), S = STATE()[r.state]; return `<div class="ae-prow ${dn ? 'sent' : ''}">
            <label class="cb"><input type="checkbox" ${dn ? 'checked disabled' : `data-act="ae-ssel" data-id="${esc(`${t.fam}|${r.cust}`)}" ${sel.has(r.cust) ? 'checked' : ''}`}></label>
            <span class="nm"><button class="lnk" data-act="ae-cust" data-id="${esc(r.cust)}"><b>${esc(nm(r.cust))}</b></button><small>${esc(r.grades.join(', ') || r.mat)}</small></span>
            ${chip(S[1], S[0])}
            <span class="w">${esc(S[2])}${r.state !== 'secure' ? `<small>${L('Suggest', 'Vorschlag')}: ${esc(T(r.alt))}</small>` : ''}</span>
            <span class="q">${tons(r.got)} / ${tons(r.need)}</span>
            <span class="a">${dn ? sentChip() : iconBtns(`scarce:${t.fam}:${r.cust}`)}</span></div>`; }).join('')}</div>
          <div class="ae-pfoot"><span>${L(`${open.length} selected`, `${open.length} ausgewählt`)}</span><button class="bfa-btn primary sm" data-act="ae-bulk" data-id="scarce:${esc(t.fam)}" ${open.length ? '' : 'disabled'}>${ph('envelope-simple')}${L(`Draft ${open.length} emails`, `${open.length} E-Mails entwerfen`)}</button></div></div>`; }).join('')}</div>`;
    }

    // several personal emails at once, each one readable and editable before one approval sends them all
    function bulkList() {
      if (!st.bulk) return [];
      const [kind, id] = [st.bulk.slice(0, st.bulk.indexOf(':')), st.bulk.slice(st.bulk.indexOf(':') + 1)];
      if (kind === 'push') { const p = PUSH().find(x => x.id === id), sent = W.pushSent[id] || new Set(); return p ? [...pushSel(p)].filter(c => !sent.has(c)).map(c => target(`push:${id}:${c}`)).filter(Boolean) : []; }
      const sent = W.scarceSent[id] || new Set(); return [...(W.scarceSel[id] || [])].filter(c => !sent.has(c)).map(c => target(`scarce:${id}:${c}`)).filter(Boolean);
    }
    function bulk() {
      if (!st.bulk) return '';
      const list = bulkList(), kind = st.bulk.split(':')[0], id = st.bulk.slice(st.bulk.indexOf(':') + 1), p = kind === 'push' ? PUSH().find(x => x.id === id) : null;
      return `<div class="bfa-scrim" data-act="ae-bclose"></div><aside class="bfa-drawer ae-bulk ${st.bulkFresh ? 'enter' : ''}" role="dialog">
        <div class="dh"><div><h4>${L(`${list.length} personal emails`, `${list.length} persönliche E-Mails`)}</h4><small>${p ? `${esc(p.grade)} · ${nf(p.special, 2)} €/kg` : L(`${esc(id)} is tight`, `${esc(id)} ist knapp`)}</small></div><button class="bfa-ic" data-act="ae-bclose" aria-label="Close">${ph('x')}</button></div>
        <div class="db">${list.map((x, i) => { const m = mailOf(x); return `<details class="ae-bmail" ${i === 0 ? 'open' : ''}><summary><span class="av">${ini(meta(x.cust).contact)}</span><span class="who"><b>${esc(nm(x.cust))}</b><small>${esc(m.to)}</small></span><em>${esc(m.subj)}</em>${ph('caret-down')}</summary>
          <div class="ae-bsrc">${x.src.slice(-1).map(srcCard).join('')}</div>
          <div class="bfa-mail"><div class="mh"><span>${L('Subject', 'Betreff')}</span><b contenteditable="true" spellcheck="false">${esc(m.subj)}</b></div><div class="mb" contenteditable="true" spellcheck="false">${esc(m.body).replace(/\n/g, '<br>')}</div>${m.att.length ? `<div class="ae-atts">${m.att.map(f => `<span class="ma">${ph('file-pdf')}${esc(f)}</span>`).join('')}</div>` : ''}</div></details>`; }).join('')}</div>
        <div class="df"><span class="lab">${L('Each email is personal: name, reason and quantity.', 'Jede E-Mail ist persönlich: Name, Grund und Menge.')}</span><button class="bfa-btn primary" data-act="ae-bsend" ${list.length ? '' : 'disabled'}>${ph('paper-plane-tilt')}${L(`Approve & send all ${list.length}`, `Alle ${list.length} freigeben & senden`)}</button></div></aside>`;
    }

    // reorders, cross-sell and relationships: customers who are due, nobody asked for anything yet
    function outbound() {
      const reorder = allCust().filter(inRole).map(c => [c, acc(c)]).filter(([, a]) => a.order > a.rhythm * 7 + 7).sort((x, y) => (y[1].order - y[1].rhythm * 7) - (x[1].order - x[1].rhythm * 7));
      const cold = allCust().filter(inRole).map(c => [c, acc(c)]).filter(([, a]) => a.contact > 21).sort((x, y) => y[1].contact - x[1].contact);
      const STARTERS = () => [L('What new projects are you planning for next year?', 'Welche neuen Projekte planen Sie für das nächste Jahr?'), L('Has anything changed in your production or your volumes?', 'Hat sich bei Ihrer Produktion oder Ihren Mengen etwas geändert?'), L('Any supply problems this year we could help with?', 'Gibt es dieses Jahr Lieferprobleme, bei denen wir helfen können?')];
      const rh = allCust().filter(inRole).map(c => { const a = acc(c), r = a.order / (a.rhythm * 7), lot = D().R.supply.find(x => x.grade === a.buys[0]); return { c, a, r, st: r > 1.15 ? 'over' : r > .85 ? 'due' : 'ok', t: qtyOf(c), free: lot ? freeStock(lot.grade) : 0 }; }).filter(x => x.a.buys.length).sort((x, y) => y.r - x.r);
      const ST = { over: ['c-warn', L('Overdue', 'Überfällig')], due: ['c-ai', L('Due now', 'Jetzt fällig')], ok: ['c-ok', L('On rhythm', 'Im Rhythmus')] };
      return `${tiles([[rh.filter(x => x.st === 'over').length, L('Customers overdue', 'Kunden überfällig')], [rh.filter(x => x.st === 'due').length, L('Due now', 'Jetzt fällig')], [tons(rh.filter(x => x.st !== 'ok').reduce((a, x) => a + x.t * 1000, 0)), L('Expected volume', 'Erwartete Menge')], [Object.keys(CROSS).filter(inRole).length, L('Cross-sell ideas', 'Cross-Selling-Ideen')]])}
        <p class="ae-hint ae-lead">${ph('chart-line')}${L('Every customer against their own buying rhythm from SAP. Who usually orders every 9 weeks and has not ordered for 14 is worth a call today, before a competitor gets it.', 'Jeder Kunde gegen seinen eigenen Kaufrhythmus aus SAP. Wer sonst alle 9 Wochen bestellt und seit 14 Wochen nichts gekauft hat, ist heute einen Anruf wert, bevor ein Wettbewerber zum Zug kommt.')}</p>
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table ae-dmt"><thead><tr><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('TYPE', 'TYP')}</th><th>${L('PRODUCT', 'PRODUKT')}</th><th>${L('RHYTHM', 'RHYTHMUS')}</th><th>${L('LAST ORDER', 'LETZTE BESTELLUNG')}</th><th>${L('BUYING CYCLE', 'KAUFZYKLUS')}</th><th>STATUS</th><th class="num">${L('EXPECTED', 'ERWARTET')}</th><th></th></tr></thead>
          <tbody>${rh.map((x, i) => `<tr style="--i:${i}" class="${x.st}"><td><button class="lnk" data-act="ae-cust" data-id="${esc(x.c)}"><b class="cname">${esc(nm(x.c))}</b></button><small class="code">${esc(meta(x.c).contact)}</small></td><td>${segChip(meta(x.c).seg)}</td><td>${esc(x.a.buys[0])}${x.free ? `<small class="ae-sub">${L(`${tons(x.free)} free in stock`, `${tons(x.free)} frei am Lager`)}</small>` : ''}</td>
            <td class="nowrap">${L(`every ${x.a.rhythm} wk`, `alle ${x.a.rhythm} Wo.`)}</td><td class="nowrap">${weeksAgo(x.a.order)}</td><td><span class="ae-cyc ${x.st}"><i style="width:${Math.min(100, Math.round(x.r / 2 * 100))}%"></i><u></u></span></td>
            <td>${chip(ST[x.st][0], x.st === 'over' ? `${ST[x.st][1]} +${Math.max(1, Math.round(x.a.order / 7 - x.a.rhythm))} ${L('wk', 'Wo.')}` : ST[x.st][1])}</td><td class="num">${x.st === 'ok' ? '–' : `${x.t} t`}</td><td><span class="ae-acts">${x.st === 'ok' ? '' : iconBtns(`cust:${x.c}#reorder`)}</span></td></tr>`).join('')}</tbody></table></div>
        <p class="bfa-fn">${L('The bar is the time since the last order; the mark is where the next order is usually placed.', 'Der Balken ist die Zeit seit der letzten Bestellung; die Markierung zeigt, wann die nächste Bestellung üblicherweise kommt.')}</p>
        ${W.role === 'field' ? sec(L('Your next visit', 'Ihr nächster Besuch'), `<div class="ae-visit">${ph('map-pin-line')}<span><b>Bodensee Präzisionsteile · ${L('tomorrow 10:00', 'morgen 10:00')}</b><small>${L('Briefing: new POM line, open data sheets, last order 18 days ago. Never Grupa Azoty.', 'Briefing: neue POM-Linie, Datenblätter offen, letzte Bestellung vor 18 Tagen. Nie Grupa Azoty.')}</small></span><button class="bfa-btn sm" data-act="ae-cust" data-id="Bodensee Präzisionsteile GmbH">${L('Open briefing', 'Briefing öffnen')}</button></div>
          <p class="ae-hint">${ph('path')}${L('On the way: Medplast Tuttlingen (62 km, last visit 4 months ago) and Allgäu Gartengeräte (98 km, 2027 range in planning).', 'Auf dem Weg: Medplast Tuttlingen (62 km, letzter Besuch vor 4 Monaten) und Allgäu Gartengeräte (98 km, Serie 2027 in Planung).')}</p>`) : ''}
        <div class="ae-dmx">
          ${sec(L('Cross-sell', 'Cross-Selling'), `<ul class="ae-list">${Object.entries(CROSS).filter(([c]) => inRole(c)).map(([c, [p, why]]) => `<li><span><button class="lnk" data-act="ae-cust" data-id="${esc(c)}"><b>${esc(nm(c))} → ${esc(p)}</b></button><small>${esc(T(why))}</small></span>${iconBtns(`cust:${c}#cross`)}</li>`).join('')}</ul>`)}
</div>`;
    }

    // ------------------------------------------------------------------ Service
    function service() {
      const e = eta(), aff = delayed(), reqs = cases().filter(c => c.type === 'req' && c.intents.some(k => ['docs', 'delivery', 'tech', 'price'].includes(k)) && inRole(c.cust));
      const docs = ctx.docRequests?.() || [], docsReady = docs.filter(r => r.auto && !model.docsSent.has(r.id)).length, elb = caseById('C-106');
      const pet = D().R.supply.find(s => s.grade === 'Ramapet N180' && s.week > 0);
      return `${tiles([[reqs.filter(isOpenCase).length, L('Customers waiting for an answer', 'Kunden warten auf Antwort')], [2, L('Delivery changes detected', 'Erkannte Lieferänderungen')], [elb.status === 'waiting' ? 1 : elb.cur < 4 ? 1 : 0, L('Questions for experts', 'Fragen an Experten')], [docsReady, L('Document answers ready', 'Dokumentantworten bereit')]])}
        ${sec(L('Info requests: data sheets, delivery, technical and price questions', 'Info-Anfragen: Datenblätter, Lieferung, Technik und Preise'), `<div class="bfa-tablewrap"><table class="bfa-table ae-pqt"><thead><tr><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('TYPE', 'TYP')}</th><th>${L('SOURCE', 'QUELLE')}</th><th>${L('DATE', 'DATUM')}</th><th>${L('TOPIC', 'THEMA')}</th><th>STATUS</th><th></th></tr></thead>
          <tbody>${reqs.map((c, i) => { const s0 = srcOf(c)[0]; return `<tr style="--i:${i}" class="${isOpenCase(c) ? '' : 'ae-dim'}"><td><button class="lnk" data-act="ae-cust" data-id="${esc(c.cust)}"><b class="cname">${esc(nm(c.cust))}</b></button><small class="code">${esc(T(c.title))}</small></td><td>${segChip(meta(c.cust).seg)}</td><td>${s0 ? srcTag(s0) : ''}</td><td class="nowrap">${when(new Date(+NOW - c.at * 3600e3))}</td><td>${intentChips(c.intents)}</td><td>${statChip(c.status)}</td>
            <td><span class="ae-acts">${isOpenCase(c) ? iconBtns(`case:${c.id}`) : ''}<button class="bfa-btn sm" data-act="ae-case" data-id="${c.id}">${'View'}</button></span></td></tr>`; }).join('')}</tbody></table></div>`, `<button class="lnk ae-hlink" data-act="nav" data-id="docs">${L(`Document requests (${docs.length})`, `Dokumentanfragen (${docs.length})`)} ${ph('arrow-right')}</button>`)}
        ${sec(L('Delivery changes', 'Lieferänderungen'), `<div class="ae-events">
          <div class="ae-ev late"><div class="et">${ph('clock-countdown')}<b>${L('Later', 'Später')}: PP 7032E3 · ExxonMobil</b><span>ETA <s>${short(e.old)}</s> → <b>${short(e.now)}</b></span></div>
            <ul>${aff.map(c => { const done = c === 'Hanse Closures GmbH' ? !isOpenCase(caseById('C-104')) : W.informed.has(c); return `<li><span><button class="lnk" data-act="ae-cust" data-id="${esc(c)}"><b>${esc(nm(c))}</b></button><small>${tons(ms(c, m => m.s.grade === 'PP 7032E3').reduce((a, m) => a + m.qty, 0))} · ${prefChip(acc(c).pref)}</small></span>${done ? chip('c-ok', L('Informed', 'Informiert'), ph('check')) : c === 'Hanse Closures GmbH' ? `<button class="bfa-btn sm accent" data-act="ae-case" data-id="C-104">${L('Review update', 'Info prüfen')}</button>` : `<button class="bfa-btn sm accent" data-act="ae-inform" data-id="${esc(c)}">${ph('paper-plane-tilt')}${L('Approve & send update', 'Info freigeben & senden')}</button>`}</li>`; }).join('')}</ul></div>
          <div class="ae-ev early"><div class="et">${ph('rocket')}<b>${L('Earlier', 'Früher')}: Ramapet N180 · Indorama</b><span>${pet ? `ETA ${wk(pet.week)} → ${L('2 days earlier', '2 Tage früher')}` : ''}</span></div>
            <ul><li><span><button class="lnk" data-act="ae-cust" data-id="Weser Getränketechnik GmbH"><b>Weser Getränketechnik</b></button><small>${L('Good news worth a message: they asked about this PET today.', 'Eine gute Nachricht wert: Sie haben heute nach diesem PET gefragt.')}</small></span>${W.informed.has('Weser Getränketechnik GmbH') ? chip('c-ok', L('Informed', 'Informiert'), ph('check')) : `<button class="bfa-btn sm accent" data-act="ae-inform" data-id="Weser Getränketechnik GmbH">${ph('paper-plane-tilt')}${L('Approve & send update', 'Info freigeben & senden')}</button>`}</li></ul></div></div>
          <p class="ae-hint">${ph('info')}${L('An ETA is shown as estimated until SAP confirms it. Each change triggers one update, not a reminder every hour.', 'Eine ETA gilt als vorläufig, bis SAP sie bestätigt. Jede Änderung löst eine Info aus, keine stündliche Erinnerung.')}</p>`)}
        ${sec(L('Questions for experts', 'Fragen an Experten'), `<ul class="ae-list"><li><span><button class="lnk" data-act="ae-case" data-id="C-106"><b>${esc(T(elb.title))}</b></button><small>Elbtal Elektrotechnik · ${elb.cur >= 4 ? L('asked Sven Martens with the full thread', 'Sven Martens mit ganzem Verlauf gefragt') : L('not asked yet', 'noch nicht gefragt')}</small></span>${statChip(elb.status)}</li></ul>
          <p class="ae-hint">${ph('shield-check')}${L('When the library has no verified value, the assistant says so and routes the question. It never fills the gap itself.', 'Wenn die Bibliothek keinen geprüften Wert hat, sagt der Assistent das und leitet die Frage weiter. Die Lücke füllt er nie selbst.')}</p>`)}`;
    }

    // ------------------------------------------------------------------ inbox: intents for every message, plus requests that are not demand
    const msgIntents = m => intentChips(m.cat === 'calloff' ? ['calloff'] : m.cat === 'price' ? ['price', 'quote'] : ['quote']);
    function inboxRows(q) {
      return cases().filter(c => c.channel && c.type === 'req' && c.id !== 'C-111' && ctx.search(q, c.cust, T(c.title))).map(c => `<tr class="${isOpenCase(c) ? 'unread' : ''}"><td class="msgcell">${ch(c.channel).icon()}<span><b>${esc(T(c.title))}</b><small>${esc(T(c.msg || c.title).slice(0, 96))}…</small></span></td>
        <td>${esc(nm(c.cust))}</td><td class="nowrap">${when(new Date(+NOW - c.at * 3600e3))}</td><td>${intentChips(c.intents)}</td><td>${statChip(c.status)}</td><td>${ctx.conf(c.intents.includes('tech') ? 88 : 95)}</td>
        <td><button class="bfa-btn sm" data-act="ae-case" data-id="${c.id}">${'View'}</button></td></tr>`).join('');
    }
    const noOfferCount = () => cases().filter(c => c.channel && c.type === 'req' && c.id !== 'C-111').length;

    // ------------------------------------------------------------------ chat
    const NUMW = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, ten: 10, twelve: 12, ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, zehn: 10, zwölf: 12 };
    function span(text) {
      const s = text.toLowerCase();
      if (/next month|nächsten monat/.test(s)) return 30;
      if (/next week|nächste woche/.test(s)) return 7;
      const m = s.match(/(\d+|[a-zäöü]+)\s+(?:more\s+|weitere[n]?\s+)?(days?|tagen?|weeks?|wochen?|months?|monate?n?)\b/);
      if (!m) return /tomorrow|morgen/.test(s) ? 1 : 0;
      const n = /^\d+$/.test(m[1]) ? +m[1] : NUMW[m[1]]; if (!n) return 0;
      return n * (/^(d|t)/.test(m[2]) ? 1 : /^w/.test(m[2]) ? 7 : 30);
    }
    const ctxOf = key => {
      if (!key || !key.includes(':')) return { cust: null, c: null }; // day, gpt, prod: no record in focus
      if (key.startsWith('case:')) { const c = caseById(key.slice(5)); return { cust: c?.cust, c }; }
      const cust = key.slice(5); return { cust, c: cases().filter(x => x.cust === cust && isOpenCase(x)).sort((a, b) => (b.type === 'opp') - (a.type === 'opp'))[0] || null };
    };
    const chatOf = key => (W.chats[key] = W.chats[key] || []);
    function greet(key) {
      const list = chatOf(key); if (list.length) return;
      const { cust, c } = ctxOf(key);
      if (key === 'prod') { list.push({ who: 'ai', text: L('Ask me anything about our products: data sheets and properties, equivalent grades, what is free in stock or inbound, and prices. Or pick a grade on the left for its profile.', 'Fragen Sie mich alles zu unseren Produkten: Datenblätter und Eigenschaften, gleichwertige Typen, was frei am Lager oder im Zulauf ist, und Preise. Oder wählen Sie links eine Type für ihren Steckbrief.') }); return; }
      list.push({ who: 'ai', text: c ? L(`I have the context: ${T(c.title)} for ${nm(cust)}, status "${statLabel(c.status)}". Ask me anything about it, or tell me what happened on the call.`, `Ich habe den Kontext: ${T(c.title)} für ${nm(cust)}, Status „${statLabel(c.status)}“. Fragen Sie mich dazu, oder erzählen Sie, was im Anruf passiert ist.`)
        : cust ? L(`I have everything on ${nm(cust)}: contacts, orders, open items. What do you need?`, `Ich habe alles zu ${nm(cust)}: Kontakte, Bestellungen, offene Punkte. Was brauchen Sie?`)
        : L(`Hello ${sig().split(' ')[0]}. I am connected to SAP, the price list, the product knowledge and the CRM. Ask me about products, stock, prices or customers, or tell me what happened on a call.`, `Hallo ${sig().split(' ')[0]}. Ich bin mit SAP, der Preisliste, dem Produktwissen und dem CRM verbunden. Fragen Sie mich zu Produkten, Bestand, Preisen oder Kunden, oder erzählen Sie, was im Anruf passiert ist.`) });
    }
    // knowledge: stock and inbound from SAP, prices from the price list, equivalents and data sheets from the product knowledge
    const SRCN = () => ({ sap: L('SAP S/4 · stock and inbound, 07:00', 'SAP S/4 · Bestand und Zulauf, 07:00'), price: L('Price list Q4 2026', 'Preisliste Q4 2026'), kb: L('Product knowledge · data sheets', 'Produktwissen · Datenblätter'), crm: 'Biesterfeld CRM' });
    function know(text) {
      const m = text.match(/^(?:steckbrief|profile|product card)\s*:?\s*(.+)$/i);
      if (!m) return knowOne(text);
      const parts = [knowOne(`Datenblatt ${m[1]}`), knowOne(`Bestand ${m[1]}`), knowOne(`Preis ${m[1]}`)].filter(Boolean);
      return parts.length ? { text: parts.map(x => x.text).join('\n\n'), srcs: [...new Set(parts.flatMap(x => x.srcs))] } : null;
    }
    function knowOne(text) {
      const s = text.toLowerCase(), pm = E.parseMaterial(text), q = E.qtyFromText ? E.qtyFromText(text) : 0, sup = D().R.supply;
      const pf = x => x._pk || (x._pk = E.parseMaterial(`${x.material} ${x.grade}`));
      const grades = [...new Set(sup.map(x => x.grade))];
      // a grade counts as named when its brand is in the question; more matching tokens win ("Zytel 70G30HSL" beats "Zytel 101L")
      const score = g => { const tk = g.toLowerCase().split(' '); if (s.includes(g.toLowerCase())) return 99; return tk[0].length > 4 && s.includes(tk[0]) ? tk.filter(x => s.includes(x)).length : 0; };
      const best = Math.max(0, ...grades.map(score)), pick = best ? grades.filter(g => score(g) === best) : [];
      let lots = pick.length ? sup.filter(x => pick.includes(x.grade)) : pm.family ? sup.filter(x => pf(x).family === pm.family && (!pm.filler || pf(x).filler === pm.filler) && (!pm.props.includes('FR') || pf(x).props.includes('FR'))) : [];
      const cust = allCust().find(c => s.includes(nm(c).split(' ')[0].toLowerCase()));
      const isEq = /(gleichwertig|equivalent|ersatz|substitut|alternativ|instead|statt)/.test(s), isSpec = /(datenblatt|data ?sheet|v-0|ul ?94|gwit|glühdraht|lebensmittel|food|eigenschaft|propert|spec|zulassung|approv|wofür|what is)/.test(s);
      const isPrice = /(preis|price|kost|cost|€|eur|teuer|expensive|quote|staffel|tier|marge|margin)/.test(s), isEta = /(wann|when|eta|zulauf|inbound|kommt|arriv|container|liefer)/.test(s);
      if (!lots.length) return cust && /(was|what|wer|who|kauft|buy|kunde|customer|zusammen|summar|brief)/.test(s) ? { text: brief(cust), srcs: ['crm', 'sap'] } : null;
      const byGrade = [...new Set(lots.map(x => x.grade))].map(g => { const ls = lots.filter(x => x.grade === g); return { g, prod: ls[0].producer, mat: ls[0].material, price: ls[0].price, margin: ls[0].margin || 0, stock: ls.filter(x => !x.week).reduce((a, x) => a + x.qty, 0), free: ls.filter(x => !x.week).reduce((a, x) => a + x.left, 0), inb: ls.filter(x => x.week > 0) }; });
      const fam0 = pf(lots[0]), famLabel = [fam0.family, fam0.filler, ...fam0.props.filter(x => x === 'HS')].filter(Boolean).join(' ');
      if (isEq) {
        const eq = sup.filter(x => pf(x).family === fam0.family && pf(x).filler === fam0.filler && !pick.includes(x.grade));
        const gs = [...new Set(eq.map(x => x.grade))];
        const rule = (ctx.memory?.() || []).find(r => pick.some(g => r[0].includes(g.split(' ')[0])) || gs.some(g => r[0].includes(g.split(' ')[0])));
        return { srcs: ['kb', 'sap'], text: gs.length ? L(`Equivalent ${famLabel} grades we carry:\n${gs.map(g => { const l = eq.filter(x => x.grade === g); return `• ${g} (${l[0].producer}): ${tons(l.filter(x => !x.week).reduce((a, x) => a + x.left, 0))} free in Hamburg${l.some(x => x.week) ? `, inbound ${l.filter(x => x.week).map(x => wk(x.week)).join(', ')}` : ''}`; }).join('\n')}${rule ? `\nLearned rule: ${rule[0]}.` : ''}\nApproved-grade customers still need their release first.`,
          `Gleichwertige ${famLabel}-Typen in unserem Sortiment:\n${gs.map(g => { const l = eq.filter(x => x.grade === g); return `• ${g} (${l[0].producer}): ${tons(l.filter(x => !x.week).reduce((a, x) => a + x.left, 0))} frei in Hamburg${l.some(x => x.week) ? `, Zulauf ${l.filter(x => x.week).map(x => wk(x.week)).join(', ')}` : ''}`; }).join('\n')}${rule ? `\nGelernte Regel: ${rule[0]}.` : ''}\nKunden mit freigegebener Type brauchen trotzdem zuerst ihre Freigabe.`) : L(`I have no equivalent to ${pick.join(', ') || famLabel} in the range right now. Product management can source one.`, `Zu ${pick.join(', ') || famLabel} habe ich gerade keine gleichwertige Type im Sortiment. Das Produktmanagement kann eine beschaffen.`) };
      }
      if (isSpec) {
        const b = byGrade[0], pp = pf(lots[0]), feats = [pp.filler && L(`${pp.filler.replace('GF', '')} % glass fibre`, `${pp.filler.replace('GF', '')} % Glasfaser`), pp.props.includes('HS') && L('heat stabilised', 'wärmestabilisiert'), pp.props.includes('FR') && L('flame retardant, UL 94 V-0', 'flammgeschützt, UL 94 V-0'), /food/.test(b.mat) && L('food contact (EU 10/2011)', 'Lebensmittelkontakt (EU 10/2011)')].filter(Boolean);
        return { srcs: ['kb'], text: L(`${b.g} (${b.prod}) is ${b.mat}${feats.length ? `: ${feats.join(', ')}` : ''}. The data sheet is in the library and can go out with any email.${/gwit|glühdraht/.test(s) ? '\nGWIT: there is no verified value in the library. I will not guess it; product management has the producer\'s test reports.' : ''}`,
          `${b.g} (${b.prod}) ist ${b.mat}${feats.length ? `: ${feats.join(', ')}` : ''}. Das Datenblatt liegt in der Bibliothek und kann jeder E-Mail beiliegen.${/gwit|glühdraht/.test(s) ? '\nGWIT: Dafür gibt es keinen geprüften Wert in der Bibliothek. Den rate ich nicht; das Produktmanagement hat die Prüfberichte des Herstellers.' : ''}`) };
      }
      if (isPrice) {
        const notes = (ctx.priceNotices?.() || []).filter(n => byGrade.some(b => b.prod === n.producer && n.fams.includes(fam0.family)));
        return { srcs: ['price', 'sap'], text: L(`List prices, FCA Hamburg:\n${byGrade.map(b => `• ${b.g}: ${nf(b.price, 2)} €/kg${q ? ` → ${tons(q)} = ${eur(b.price * q)}` : ''}. Floor for 5 % margin: ${nf(b.price * (1 - Math.max(0, b.margin - .05)), 2)} €/kg`).join('\n')}${notes.map(n => `\nHeads-up: ${n.producer} +€${n.up}/t from ${n.from}.`).join('')}\nFrom 5 t freight per kg drops; tiers are in the price list.`,
          `Listenpreise, FCA Hamburg:\n${byGrade.map(b => `• ${b.g}: ${nf(b.price, 2)} €/kg${q ? ` → ${tons(q)} = ${eur(b.price * q)}` : ''}. Untergrenze für 5 % Marge: ${nf(b.price * (1 - Math.max(0, b.margin - .05)), 2)} €/kg`).join('\n')}${notes.map(n => `\nAchtung: ${n.producer} +${n.up} €/t ab ${n.from}.`).join('')}\nAb 5 t sinkt die Fracht pro kg; die Staffel steht in der Preisliste.`) };
      }
      const e = eta(), ppDelay = fam0.family === 'PP' && isEta;
      return { srcs: ['sap'], text: L(`${famLabel} in SAP right now:\n${byGrade.map(b => `• ${b.g} (${b.prod}): ${tons(b.stock)} in Hamburg, ${tons(b.free)} free${b.inb.length ? `; inbound ${b.inb.map(x => `${tons(x.qty)} ${wk(x.week)}`).join(', ')}` : ''}`).join('\n')}${ppDelay ? `\nNote: the PP 7032E3 container is late, ETA ${short(e.old)} → ${short(e.now)}.` : ''}\n"Free" means not yet promised to an open request.`,
        `${famLabel} in SAP, Stand jetzt:\n${byGrade.map(b => `• ${b.g} (${b.prod}): ${tons(b.stock)} in Hamburg, davon ${tons(b.free)} frei${b.inb.length ? `; Zulauf ${b.inb.map(x => `${tons(x.qty)} ${wk(x.week)}`).join(', ')}` : ''}`).join('\n')}${ppDelay ? `\nHinweis: Der Container PP 7032E3 ist verspätet, ETA ${short(e.old)} → ${short(e.now)}.` : ''}\n„Frei“ heißt: noch keiner offenen Anfrage zugesagt.`) };
    }
    function brief(cust) {
      const a = acc(cust), m = meta(cust), cs = cases().filter(x => x.cust === cust && isOpenCase(x));
      return L(`${nm(cust)} (${m.city}, tier ${a.tier}): buys ${a.buys.join(', ')}, about every ${a.rhythm} weeks, last order ${weeksAgo(a.order)}. Last contact ${daysAgo(a.contact)}; ${m.contact} prefers ${T(PREF[a.pref][1]).toLowerCase()}. Open: ${cs.length ? cs.map(x => T(x.title)).join('; ') : 'nothing'}.${a.note ? ` Note: ${T(a.note)}` : ''}`,
        `${nm(cust)} (${m.city}, Klasse ${a.tier}): kauft ${a.buys.join(', ')}, etwa alle ${a.rhythm} Wochen, letzte Bestellung ${weeksAgo(a.order)}. Letzter Kontakt ${daysAgo(a.contact)}; ${m.contact} bevorzugt ${T(PREF[a.pref][1])}. Offen: ${cs.length ? cs.map(x => T(x.title)).join('; ') : 'nichts'}.${a.note ? ` Hinweis: ${T(a.note)}` : ''}`);
    }
    function respond(key, text) {
      const { cust, c } = ctxOf(key), s = text.toLowerCase(), d = span(text);
      const noOpp = { text: L(cust ? `There is no open opportunity for ${nm(cust)} to update. I can log this as a note on the customer instead.` : 'Open a customer or task first, then I know what to update.', cust ? `Für ${nm(cust)} gibt es keine offene Opportunity. Ich kann das als Notiz am Kunden ablegen.` : 'Öffnen Sie zuerst einen Kunden oder eine Aufgabe, dann weiß ich, was zu ändern ist.'),
        prop: cust ? { items: [['note-pencil', [`Note on ${nm(cust)}: "${text}"`, `Notiz an ${nm(cust)}: „${text}“`]]], apply: () => log(cust, 'note-pencil', [`Note: ${text}`, `Notiz: ${text}`]) } : null };
      if (/(another supplier|other supplier|elsewhere|somewhere else|competitor|chose|went with|lost the|anderen lieferanten|anderer lieferant|woanders|wettbewerb|verloren|entschieden|abgesagt)/.test(s)) {
        if (!c) return noOpp;
        const reason = /price|preis/.test(s) ? ['Lost on price to another supplier', 'Über den Preis an einen anderen Lieferanten verloren'] : ['Chose another supplier', 'Anderen Lieferanten gewählt'];
        const items = [['x-circle', [`${T(c.title)} → Lost to competitor`, `${T(c.title)} → An Wettbewerb verloren`]], ['note-pencil', [`Reason: ${reason[0].toLowerCase()} (from your call)`, `Grund: ${reason[1]} (aus Ihrem Anruf)`]], ['bell-slash', ['Open follow-up tasks cancelled', 'Offene Nachfass-Aufgaben storniert']]];
        if (d) items.push(['calendar-plus', [`Relationship call on ${short(day(d))}`, `Beziehungsanruf am ${short(day(d))}`]]);
        return { text: d ? L(`Understood. I will close it as lost and keep ${nm(c.cust)} warm with a call on ${short(day(d))}. Please confirm:`, `Verstanden. Ich schließe die Opportunity als verloren und halte über einen Anruf am ${short(day(d))} den Kontakt zu ${nm(c.cust)}. Bitte bestätigen:`) : L('Understood. I will close it as lost. Want a check-in later? Say "in six weeks", for example. Please confirm:', 'Verstanden. Ich schließe die Opportunity als verloren. Später nachfassen? Sagen Sie z. B. „in sechs Wochen“. Bitte bestätigen:'),
          prop: { items, apply: () => { setCase(c.id, { status: 'lost', cur: c.steps.length, lostReason: reason }); closeTasksOf(c.id); if (c.offer) delete W.followups[c.offer]; if (d) addTask(c.cust, d, { kind: 'rel', act: ['Relationship call after a lost offer', 'Beziehungsanruf nach verlorenem Angebot'], why: [`Lost to a competitor on ${short(NOW)}; keep in touch.`, `Am ${short(NOW)} an den Wettbewerb verloren; in Kontakt bleiben.`] }); log(c.cust, 'x-circle', [`Opportunity lost: ${reason[0].toLowerCase()}`, `Opportunity verloren: ${reason[1]}`], c.id); } } };
      }
      if (/(confirmed the order|ordered|order confirmed|accepted|we won|bestätigt|auftrag|bestellt|angenommen|gewonnen|zusage)/.test(s)) {
        if (!c || c.type !== 'opp') return noOpp;
        return { text: L('Great news. I will mark it accepted and prepare the order for SAP. It is created only after your approval. Please confirm:', 'Sehr gut. Ich markiere das Angebot als angenommen und bereite den Auftrag für SAP vor. Angelegt wird er erst nach Ihrer Freigabe. Bitte bestätigen:'),
          prop: { items: [['check-circle', [`${T(c.title)} → Accepted`, `${T(c.title)} → Angenommen`]], ['tray-arrow-down', ['Order draft in SAP, waiting for your approval', 'Auftragsentwurf in SAP, wartet auf Ihre Freigabe']], ['bell-slash', ['Follow-ups stopped', 'Nachfassen gestoppt']]],
            apply: () => { setCase(c.id, { status: 'won', cur: c.steps.length }); closeTasksOf(c.id); if (c.offer) delete W.followups[c.offer]; log(c.cust, 'check-circle', ['Offer accepted, order draft prepared', 'Angebot angenommen, Auftragsentwurf vorbereitet'], c.id); } } };
      }
      if (d && /(need|braucht|brauchen|call again|wieder anrufen|later|später|postpone|verschieb|remind|erinner|weeks|wochen|month|monat|days|tage)/.test(s)) {
        if (!c) return noOpp;
        return { text: L(`Got it. The offer stays open and visible in the pipeline; I move the follow-up to ${short(day(d))}.`, `Verstanden. Ich verschiebe das Nachfassen auf den ${short(day(d))} und lasse das Angebot offen und sichtbar in der Pipeline.`),
          prop: { items: [['hourglass-medium', ['Status → Customer reviewing', 'Status → Kunde prüft']], ['calendar', [`Expected decision: ${short(day(d))}`, `Erwartete Entscheidung: ${short(day(d))}`]], ['arrows-clockwise', [`Follow-up moved to ${short(day(d))}`, `Nachfassen verschoben auf ${short(day(d))}`]], ['bell-slash', ['Today\'s reminder removed', 'Heutige Erinnerung entfernt']]],
            apply: () => { setCase(c.id, { status: 'reviewing', decision: day(d), cur: stageOf(c) === 2 && c.cur < c.steps.length - 1 ? c.cur + 1 : c.cur }); closeTasksOf(c.id); addTask(c.cust, d, { case: c.id, open: () => true, kind: c.kind, act: ['Follow up on the decision', 'Zur Entscheidung nachfassen'], why: [`On ${short(NOW)} the customer asked for ${d} more days.`, `Am ${short(NOW)} hat der Kunde um ${d} Tage gebeten.`] }); log(c.cust, 'calendar', [`Customer asked for ${d} more days; follow-up on ${short(day(d))}`, `Kunde bat um ${d} weitere Tage; nachfassen am ${short(day(d))}`], c.id); } } };
      }
      if (/(e-?mail|write|schreib|draft|entwirf|entwurf)/.test(s)) {
        if (!cust) return { text: L('Open a customer or task first, then I can write the email.', 'Öffnen Sie zuerst einen Kunden oder eine Aufgabe, dann schreibe ich die E-Mail.') };
        const m = meta(cust), o = c?.offer;
        const body = c?.id === 'C-104' ? T(c.draft) : o ? L(`Dear ${m.contact},\n\nI wanted to check in on our offer ${o} from ${short(W.followups[o]?.sent || day(-4))}. Do the price and the delivery dates work for you? If anything is still open, I am happy to adjust.\n\nKind regards\n${USERS()[W.role][0]}`, `Guten Tag ${m.contact},\n\nich möchte kurz zu unserem Angebot ${o} vom ${short(W.followups[o]?.sent || day(-4))} nachhaken. Passen Preis und Liefertermine für Sie? Falls noch etwas offen ist, passe ich das Angebot gerne an.\n\nViele Grüße\n${USERS()[W.role][0]}`)
          : L(`Dear ${m.contact},\n\nit has been a while, so I wanted to check in. How are things going, and is there anything coming up where we can help?\n\nKind regards\n${USERS()[W.role][0]}`, `Guten Tag ${m.contact},\n\nes ist eine Weile her, darum melde ich mich kurz. Wie läuft es bei Ihnen, und steht etwas an, wobei wir helfen können?\n\nViele Grüße\n${USERS()[W.role][0]}`);
        return { text: L('Here is a draft. Nothing goes out until you approve it.', 'Hier ist ein Entwurf. Nichts geht raus, bevor Sie ihn freigeben.'), mail: { to: mailTo(cust), subj: ctx.personal(o ? L(`Your offer ${o}`, `Ihr Angebot ${o}`) : L('Checking in', 'Kurze Nachfrage'), cust), body: ctx.personal(body, cust), cust, case: c?.id } };
      }
      if (/(spec|meet|requirement|erfüllt|anforderung|spezifikation)/.test(s) && c?.id === 'C-106') {
        return { text: L('I compared the request with the data sheet of Lupoy GN5001RFH:\n✓ UL 94 V-0 at 1.5 mm: confirmed by the data sheet\n? GWIT 775 °C: no verified value in the library\n✓ Colour black, 9 t: available\nSo the open point is the glow-wire value. I will not guess it. Shall I ask product management?', 'Ich habe die Anfrage mit dem Datenblatt von Lupoy GN5001RFH verglichen:\n✓ UL 94 V-0 bei 1,5 mm: vom Datenblatt bestätigt\n? GWIT 775 °C: kein geprüfter Wert in der Bibliothek\n✓ Farbe Schwarz, 9 t: verfügbar\nOffen ist also der Glühdrahtwert. Den rate ich nicht. Soll ich das Produktmanagement fragen?'),
          prop: { items: [['user-switch', ['Ask Sven Martens (product management) with the full thread', 'Sven Martens (Produktmanagement) mit ganzem Verlauf fragen']], ['file-text', ['Attach the data sheet of Lupoy GN5001RFH', 'Datenblatt Lupoy GN5001RFH anhängen']], ['envelope-simple', ['Tell Katrin Vogt: answer by Wednesday', 'Katrin Vogt informieren: Antwort bis Mittwoch']]],
            apply: () => { setCase(c.id, { cur: 4, status: 'waiting' }); W.asked = true; log(c.cust, 'user-switch', c.done.log, c.id); } } };
      }
      if (/(discount|rabatt|instead|statt)/.test(s) && c?.answers?.discount) return { text: T(c.answers.discount) };
      if (!/(why|warum|wieso|weshalb)/.test(s) || /(gleichwertig|equivalent)/.test(s)) { const k = know(text); if (k) return k; }
      if (!cust && /(heute|today|my day|mein tag|priorit|zuerst|first|to do|zu tun)/.test(s)) { const tl = todayTasks().slice(0, 5); return { srcs: ['crm', 'sap'], text: L(`Today, in this order:\n${tl.map((t, i) => `${i + 1}. ${T(t.act)} (${nm(t.cust || '')}): ${T(t.why)}`).join('\n')}\n\n${todayTasks().length} tasks in total; the full list is under My workday.`, `Heute, in dieser Reihenfolge:\n${tl.map((t, i) => `${i + 1}. ${T(t.act)} (${nm(t.cust || '')}): ${T(t.why)}`).join('\n')}\n\nInsgesamt ${todayTasks().length} Aufgaben; die ganze Liste steht unter Mein Arbeitstag.`) }; }
      if (/(why|warum|wieso|weshalb)/.test(s)) return { text: c?.answers?.why ? T(c.answers.why) : c ? `${T(c.why)} ${T(c.coach)}` : cust ? `${nba(cust).why} ${brief(cust)}` : L('Ask me from a task or a customer, then I can explain the recommendation.', 'Fragen Sie mich aus einer Aufgabe oder einem Kunden heraus, dann erkläre ich die Empfehlung.') };
      if (/(plan|next step|nächste|summar|zusammen|brief|prepare|vorbereit|talk about|worüber)/.test(s)) {
        if (c?.id === 'C-108') return { text: L('Here is a plan that does not push for a quote too early:', 'Hier ist ein Plan, der nicht zu früh auf ein Angebot drängt:'),
          prop: { items: [['file-text', ['Today: send data sheets for Ultraform N2320 003 and Hostaform C 9021', 'Heute: Datenblätter Ultraform N2320 003 und Hostaform C 9021 senden']], ['flask', ['Offer a 25 kg sample of each', 'Je ein 25-kg-Muster anbieten']], ['calendar-plus', [`Check-in on ${short(day(56))}, before the January decision`, `Kontakt am ${short(day(56))}, vor der Entscheidung im Januar`]], ['users', ['Keep Carina Weiß (field sales) in the loop', 'Carina Weiß (Außendienst) einbinden']]],
            apply: () => { setCase(c.id, { cur: 4 }); addTask(c.cust, 56, { kind: 'rel', act: ['Check in on the POM gear line', 'Zur POM-Zahnradlinie nachfragen'], why: ['Material decision planned for January', 'Werkstoffentscheidung für Januar geplant'] }); log(c.cust, 'list-checks', ['Plan set: data sheets, samples, check-in in 8 weeks', 'Plan gesetzt: Datenblätter, Muster, Kontakt in 8 Wochen'], c.id); } } };
        if (cust) return { text: brief(cust) };
      }
      return { text: L('In this demo I answer questions on products, stock, inbound and prices (name a grade or a material), and I understand the typical updates: lost, postponed or won, email drafts and "why" questions. Try one of the suggestions below.', 'In dieser Demo beantworte ich Fragen zu Produkten, Bestand, Zulauf und Preisen (nennen Sie eine Type oder einen Werkstoff) und verstehe die typischen Updates: verloren, verschoben oder gewonnen, E-Mail-Entwürfe und Warum-Fragen. Probieren Sie einen Vorschlag unten.') };
    }
    function send(text, key = st.chat) {
      text = String(text || '').trim(); if (!text || !key) return;
      const list = chatOf(key);
      list.push({ who: 'me', text }, { who: 'ai', typing: true });
      st.chatFocus = true; ctx.render();
      setTimeout(() => { const i = list.findIndex(x => x.typing); if (i >= 0) list.splice(i, 1, { who: 'ai', ...respond(key, text) }); ctx.render(); }, ctx.reduced ? 0 : 650);
    }
    function chips(key) {
      const { cust, c } = ctxOf(key);
      const list = c?.chips ? c.chips.map(T) : [];
      if (cust && !list.length) list.push(L(`Summarise ${nm(cust)} before my call.`, `Fasse ${nm(cust)} vor meinem Anruf zusammen.`), L('Write a short check-in email.', 'Schreib eine kurze E-Mail zur Nachfrage.'));
      if (cust && list.length < 3) list.push(L('Why do you recommend this?', 'Warum empfiehlst du das?'));
      if (key === 'prod') return [L('What is equivalent to Zytel 70G30HSL?', 'Was ist gleichwertig zu Zytel 70G30HSL?'), L('Is Lupoy GN5001RFH V-0?', 'Ist Lupoy GN5001RFH V-0?'), L('How much PC is free in stock?', 'Wie viel PC ist frei am Lager?'), L('What does Skypel G130D cost for 4 t?', 'Was kostet Skypel G130D bei 4 t?')];
      if (key === 'gpt') list.push(L('What should I do first today?', 'Was soll ich heute zuerst machen?'), L('Summarise Hanse Closures for me.', 'Fasse Hanse Closures für mich zusammen.'));
      if (!cust) list.push(L('What does PA66 GF30 HS cost for 10 t?', 'Was kostet PA66 GF30 HS bei 10 t?'), L('How much POM is free in stock?', 'Wie viel POM ist frei auf Lager?'), L('When does the PP container arrive?', 'Wann kommt der PP-Container?'), L('What is equivalent to Zytel 70G30HSL?', 'Was ist gleichwertig zu Zytel 70G30HSL?'));
      return list;
    }
  const bubble = (x, i) => {
      if (x.typing) return `<div class="ae-msg ai typing"><span class="av">${ph('sparkle')}</span><p><i></i><i></i><i></i></p></div>`;
      const prop = x.prop ? `<div class="ae-prop ${x.state || ''}"><small>${x.state === 'ok' ? L('UPDATED', 'AKTUALISIERT') : x.state === 'no' ? L('DISCARDED', 'VERWORFEN') : L('PROPOSED CHANGES', 'VORGESCHLAGENE ÄNDERUNGEN')}</small>${x.prop.items.map(([ic, t]) => `<div>${ph(ic)}<span>${esc(T(t))}</span></div>`).join('')}
        ${x.state ? `<em>${x.state === 'ok' ? `${ph('check-circle')}${L(`Done · logged ${when(x.at || NOW)}`, `Erledigt · protokolliert ${when(x.at || NOW)}`)}` : L('Nothing changed', 'Nichts geändert')}</em>` : `<div class="pa"><button class="bfa-btn sm" data-act="ae-no" data-id="${i}">${L('Discard', 'Verwerfen')}</button><button class="bfa-btn sm primary" data-act="ae-ok" data-id="${i}">${ph('check')}${L('Confirm', 'Bestätigen')}</button></div>`}</div>` : '';
      const mail = x.mail ? `<div class="bfa-mail ae-mailc"><div class="mh"><span>${L('To', 'An')}</span><b>${esc(x.mail.to)}</b></div><div class="mh"><span>${L('Subject', 'Betreff')}</span><b>${esc(x.mail.subj)}</b></div><div class="mb" contenteditable="true" spellcheck="false">${esc(x.mail.body).replace(/\n/g, '<br>')}</div>
        <div class="pa">${x.state === 'ok' ? `<em>${ph('check-circle')}${L('Sent after your approval', 'Nach Ihrer Freigabe gesendet')}</em>` : `<button class="bfa-btn sm primary" data-act="ae-mail" data-id="${i}">${ph('paper-plane-tilt')}${L('Approve & send', 'Freigeben & senden')}</button>`}</div></div>` : '';
      const srcs = x.srcs ? `<div class="ae-msrc">${x.srcs.map(k => `<span>${ph(k === 'sap' ? 'database' : k === 'price' ? 'currency-eur' : k === 'kb' ? 'books' : 'address-book')}${esc(SRCN()[k])}</span>`).join('')}</div>` : '';
      return `<div class="ae-msg ${x.who}">${x.who === 'ai' ? `<span class="av">${ph('sparkle')}</span>` : ''}<div class="mc">${x.text ? `<p>${esc(x.text).replace(/\n/g, '<br>')}</p>` : ''}${srcs}${prop}${mail}</div></div>`;
    };
    // the assistant: one floating button, draggable anywhere in the app; it opens a normal chat window next to it
    const chatKeyNow = () => (st.case ? `case:${st.case}` : st.cust ? `cust:${st.cust}` : 'day');
    function chat() {
      const fab = `<button class="ae-fab ${st.chat ? 'on' : ''}" data-act="ae-fab" data-tour="tchat" style="right:${W.fab.r}px;bottom:${st.offer && W.fab.r === 22 && W.fab.b === 22 ? 76 : W.fab.b}px" aria-label="${esc(L('Ask AI', 'Frag die KI'))}" aria-expanded="${!!st.chat}" title="${esc(L('Click to open, drag to move', 'Klicken zum Öffnen, ziehen zum Verschieben'))}"><span class="ic">${ph(st.chat ? 'x' : 'sparkle')}</span><span class="lb">${L('Ask AI', 'Frag die KI')}</span><i class="grip">${ph('dots-six-vertical')}</i></button>`;
      if (['gpt', 'prodq'].includes(st.page) && !st.case && !st.cust) return ''; // the page is the chat already
      if (!st.chat) return fab;
      const key = st.chat, { cust, c } = ctxOf(key), list = chatOf(key), sugg = chips(key);
      return `<section class="ae-chat ${st.chatFresh ? 'enter' : ''}" data-chat="${esc(key)}" role="dialog" aria-label="${esc(L('AI assistant', 'KI-Assistent'))}">
        <div class="ach"><span class="av">${ph('sparkle')}</span><div><b>${L('AI assistant', 'KI-Assistent')}</b><small><i></i>${L('Connected: SAP S/4 · price list · product knowledge · CRM', 'Verbunden: SAP S/4 · Preisliste · Produktwissen · CRM')}</small></div><button class="bfa-ic sm" data-act="ae-gfull" aria-label="${esc(L('Open full page', 'Als ganze Seite öffnen'))}" title="${esc(L('Open full page', 'Als ganze Seite öffnen'))}">${ph('arrows-out-simple')}</button><button class="bfa-ic sm" data-act="ae-chatclose" aria-label="Close">${ph('minus')}</button></div>
        ${c || cust ? `<div class="ae-ctx">${ph('link-simple')}<span>${c ? `${esc(nm(cust))} · ${esc(T(c.title))}` : esc(nm(cust))}</span><button class="lnk" data-act="ae-chatctx">${L('Ask in general', 'Allgemein fragen')}</button></div>` : ''}
        <div class="ae-msgs">${list.map(bubble).join('')}</div>
        ${sugg.length ? `<div class="ae-sugg">${sugg.map((x, i) => `<button data-act="ae-chip" data-v="${i}">${esc(x)}</button>`).join('')}</div>` : ''}
        <div class="ae-in"><input data-act="chatin" placeholder="${esc(L('Ask about a product, stock, a price, a customer…', 'Fragen Sie zu Produkt, Bestand, Preis, Kunde…'))}" autocomplete="off"><button class="bfa-btn primary" data-act="ae-send" aria-label="Send">${ph('paper-plane-right')}</button></div>
      </section>${fab}`;
    }
    // Biesterfeld GPT as a page: conversations on the left, the chat in the middle; the product tab lists the range instead
    const convName = k => (k === 'gpt' ? L('New conversation', 'Neues Gespräch') : k === 'day' ? L('Quick questions', 'Schnellfragen') : k.startsWith('case:') ? `${nm(caseById(k.slice(5))?.cust || '')} · ${k.slice(5)}` : nm(k.slice(5)));
    function gptPage(mode) {
      const key = mode === 'prod' ? 'prod' : (st.gptKey && W.chats[st.gptKey] ? st.gptKey : 'gpt'); greet(key);
      const list = chatOf(key), sugg = chips(key), fresh = list.filter(x => x.who === 'me').length === 0;
      const fam = x => E.parseMaterial(`${x.material} ${x.grade}`).family, grades = [...new Map(D().R.supply.map(x => [x.grade, x])).values()].sort((a, b) => fam(a).localeCompare(fam(b)) || a.grade.localeCompare(b.grade));
      const rail = mode === 'prod'
        ? `<div class="gr-h">${ph('package')}<b>${L('Our range', 'Unser Sortiment')}</b><em>${grades.length}</em></div><div class="gr-list">${grades.map(x => { const free = freeStock(x.grade); return `<button data-act="ae-gask" data-v="${esc(`Steckbrief ${x.grade}`)}"><span><b>${esc(x.grade)}</b><small>${esc(x.producer)} · ${esc(x.material)}</small></span><em class="${free ? 'ok' : ''}">${free ? tons(free) : L('inbound', 'Zulauf')}</em></button>`; }).join('')}</div>`
        : `<button class="bfa-btn primary gr-new" data-act="ae-gnew">${ph('plus')}${L('New conversation', 'Neues Gespräch')}</button><div class="gr-h">${ph('clock-counter-clockwise')}<b>${L('Conversations', 'Verläufe')}</b></div><div class="gr-list">${['gpt', ...Object.keys(W.chats).filter(k => !['gpt', 'prod'].includes(k) && W.chats[k].some(x => x.who === 'me'))].map(k => `<button class="${k === key ? 'on' : ''}" data-act="ae-gconv" data-id="${esc(k)}"><span><b>${esc(convName(k))}</b><small>${esc((W.chats[k] || []).filter(x => x.who === 'me').slice(-1)[0]?.text || L('Ask anything', 'Fragen Sie alles'))}</small></span></button>`).join('')}</div>`;
      return `<div class="ae-gpt" data-chat="${esc(key)}"><aside class="ae-grail">${rail}</aside>
        <section class="ae-gmain"><div class="ae-ghead"><span class="av">${ph(mode === 'prod' ? 'flask' : 'sparkle')}</span><div><b>${mode === 'prod' ? L('Product questions', 'Produktfragen') : 'Biesterfeld GPT'}</b><small><i></i>${mode === 'prod' ? L('Data sheets · equivalents · SAP stock · price list', 'Datenblätter · Gleichwertigkeiten · SAP-Bestand · Preisliste') : L('Connected: SAP S/4 · price list · product knowledge · CRM · your workday', 'Verbunden: SAP S/4 · Preisliste · Produktwissen · CRM · Ihr Arbeitstag')}</small></div></div>
          <div class="ae-msgs ae-gmsgs"><div class="ae-gcol">${list.map(bubble).join('')}
            ${fresh ? `<div class="ae-gstart">${sugg.map((x, i) => `<button data-act="ae-chip" data-v="${i}">${ph(mode === 'prod' ? 'flask' : 'sparkle')}<span>${esc(x)}</span></button>`).join('')}</div>` : ''}</div></div>
          ${!fresh ? `<div class="ae-sugg ae-gsugg">${sugg.map((x, i) => `<button data-act="ae-chip" data-v="${i}">${esc(x)}</button>`).join('')}</div>` : ''}
          <div class="ae-gin"><div class="box"><input data-act="chatin" placeholder="${esc(mode === 'prod' ? L('Ask about a grade, a property, an equivalent, a price…', 'Fragen Sie zu Type, Eigenschaft, Gleichwertigkeit, Preis…') : L('Message Biesterfeld GPT…', 'Nachricht an Biesterfeld GPT…'))}" autocomplete="off"><button class="bfa-btn primary" data-act="ae-send" aria-label="Send">${ph('arrow-up')}</button></div>
            <small>${L('Every answer names its source. Changes to records are proposed, you confirm.', 'Jede Antwort nennt ihre Quelle. Änderungen an Datensätzen werden vorgeschlagen, Sie bestätigen.')}</small></div></section></div>`;
    }

    // ------------------------------------------------------------------ Outbound: check-ins with customers nobody has called or written to for two or three weeks
    function checkin() {
      const STARTERS = () => [L('What new projects are you planning for next year?', 'Welche neuen Projekte planen Sie für das nächste Jahr?'), L('Has anything changed in your production or your volumes?', 'Hat sich bei Ihrer Produktion oder Ihren Mengen etwas geändert?'), L('Any supply problems this year we could help with?', 'Gibt es dieses Jahr Lieferprobleme, bei denen wir helfen können?')];
      const rows = allCust().filter(inRole).map(c => ({ c, a: acc(c), open: cases().filter(x => x.cust === c && isOpenCase(x)).length, done: W.checkedIn.has(c) })).filter(x => ciDue(x.c) || x.done).sort((x, y) => x.done - y.done || y.a.contact - x.a.contact);
      const opener = x => x.a.project ? L(`Ask about: ${T(x.a.project)}`, `Ansprechen: ${T(x.a.project)}`) : x.a.order > x.a.rhythm * 7 + 7 ? L('"How is the season going?" The reorder is overdue too.', '„Wie läuft die Saison?“ Die Nachbestellung ist auch überfällig.') : STARTERS()[hash(x.c) % 3];
      return `${tiles([[rows.filter(x => !x.done).length, L('No contact for 2+ weeks', 'Seit über 2 Wochen kein Kontakt')], [rows.filter(x => !x.done && x.a.contact >= 21).length, L('Of those, 3+ weeks', 'Davon über 3 Wochen')], [rows.filter(x => !x.done && !x.open).length, L('Nothing open with them', 'Nichts offen bei ihnen')], [W.checkedIn.size, L('Checked in today', 'Heute kontaktiert')]])}
        <p class="ae-hint ae-lead">${ph('handshake')}${L('No sales reason needed: whoever has not heard from us for two or three weeks gets a short call or email. It keeps the relationship warm and often surfaces the next request.', 'Ohne Verkaufsanlass: Wer zwei, drei Wochen nichts von uns gehört hat, bekommt einen kurzen Anruf oder eine E-Mail. Das hält die Beziehung warm und bringt oft die nächste Anfrage.')}</p>
        <div class="bfa-card bfa-tablewrap"><table class="bfa-table ae-pqt"><thead><tr><th>${L('CUSTOMER', 'KUNDE')}</th><th>${L('TYPE', 'TYP')}</th><th>${L('CONTACT', 'ANSPRECHPARTNER')}</th><th>${L('LAST CONTACT', 'LETZTER KONTAKT')}</th><th>${L('OPEN', 'OFFEN')}</th><th>${L('CONVERSATION STARTER', 'GESPRÄCHSEINSTIEG')}</th><th></th></tr></thead>
          <tbody>${rows.map((x, i) => `<tr style="--i:${i}" class="${x.done ? 'ae-dim' : ''}"><td><button class="lnk" data-act="ae-cust" data-id="${esc(x.c)}"><b class="cname">${esc(nm(x.c))}</b></button><small class="code">${L('Tier', 'Klasse')} ${x.a.tier}${x.a.note ? ` · ${esc(T(x.a.note))}` : ''}</small></td><td>${segChip(meta(x.c).seg)}</td>
            <td class="nowrap">${esc(meta(x.c).contact)}${prefChip(x.a.pref)}</td><td class="nowrap ${x.a.contact >= 21 && !x.done ? 'ae-warnc' : ''}">${x.done ? L('today', 'heute') : `${daysAgo(x.a.contact)} · ${Math.round(x.a.contact / 7)} ${L('wk', 'Wo.')}`}</td>
            <td>${x.open ? chip('c-cat', L(`${x.open} open`, `${x.open} offen`)) : `<span class="ae-mut">${L('nothing', 'nichts')}</span>`}</td><td class="ae-ot">${esc(opener(x))}</td>
            <td><span class="ae-acts">${x.done ? chip('c-ok', L('Contacted', 'Kontaktiert'), ph('check')) : iconBtns(`cust:${x.c}#cold`)}</span></td></tr>`).join('')}</tbody></table></div>`;
    }

    // keep the chat window next to the button, inside the app: above it, below it, or beside it, wherever it fits
    function placeChat(root) {
      const p = root.querySelector('.ae-chat'), f = root.querySelector('.ae-fab'); if (!p || !f) return;
      const R = root.getBoundingClientRect(), F = f.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, gap = 10;
      const alignX = F.left - R.left < R.width / 2 ? F.left - R.left : F.right - R.left - w;
      let left = alignX, top;
      if (F.top - R.top >= h + gap + 8) top = F.top - R.top - h - gap;
      else if (R.bottom - F.bottom >= h + gap + 8) top = F.bottom - R.top + gap;
      else { left = R.right - F.right >= w + gap + 8 ? F.right - R.left + gap : F.left - R.left - w - gap; top = F.top - R.top + F.height / 2 - h / 2; }
      p.style.left = `${Math.max(8, Math.min(left, R.width - w - 8))}px`; p.style.top = `${Math.max(8, Math.min(top, R.height - h - 8))}px`;
    }
    function dragFab(root) {
      const f = root.querySelector('.ae-fab'); if (!f) return;
      f.addEventListener('pointerdown', e => {
        if (e.button) return;
        const R = root.getBoundingClientRect(), r0 = W.fab.r, b0 = W.fab.b, x0 = e.clientX, y0 = e.clientY; let moved = false;
        const mv = ev => {
          const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!moved && Math.hypot(dx, dy) < 5) return;
          moved = true; f.classList.add('drag');
          W.fab.r = Math.round(Math.max(8, Math.min(R.width - f.offsetWidth - 8, r0 - dx))); W.fab.b = Math.round(Math.max(8, Math.min(R.height - f.offsetHeight - 8, b0 - dy)));
          f.style.right = `${W.fab.r}px`; f.style.bottom = `${W.fab.b}px`; placeChat(root);
        };
        const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); f.classList.remove('drag'); if (moved) W.dragged = Date.now(); };
        addEventListener('pointermove', mv); addEventListener('pointerup', up);
      });
    }

    // ------------------------------------------------------------------ actions
    // a case with a document (offer, price scale, order) always opens the GeneralMind view with the document in the middle
    function openCase(id) { const doc = docOf(caseById(id)); if (doc) { Object.assign(st, { offer: doc.id, oTab: 'details', case: null, drawer: null, linesFor: null, tour: -1 }); ctx.render(true); return; } Object.assign(st, { case: id, offer: null, drawer: null, linesFor: null, tour: -1 }); ctx.render(true); }
    function openCust(c) { Object.assign(st, { cust: c, case: null, offer: null, drawer: null, linesFor: null, tour: -1 }); ctx.render(true); }
    function openChat(key, aiLine) { st.chat = key; st.chatFresh = true; st.chatFocus = true; greet(key); if (aiLine) chatOf(key).push({ who: 'ai', text: aiLine }); ctx.render(); }
    function doCase(c) {
      if (!c?.act || !isOpenCase(c)) return;
      if (c.act[2] === 'call' || c.act[2] === 'offer') { st.compose = { key: `case:${c.id}`, mode: c.act[2] === 'call' ? 'call' : 'email', fresh: true }; ctx.render(); return; }
      const dn = c.done; setCase(c.id, { cur: dn.cur, status: dn.status }); log(c.cust, c.act[0], dn.log, c.id);
      if (c.id === 'C-106') W.asked = true;
      if (dn.task) addTask(c.cust, dn.task.in, { kind: dn.task.kind, act: dn.task.act, why: dn.task.why });
      ctx.toast(T(dn.toast || dn.log)); ctx.emit();
    }
    function act(a, id, el) {
      switch (a) {
        case 'ae-cust': openCust(id); return true;
        case 'ae-case': openCase(id); return true;
        case 'ae-task': { const t = [...TASKS(), ...W.extra].find(x => x.id === id); if (!t) return true; if (t.case) openCase(t.case); else if (t.nav) ctx.go(t.nav, { cust: null, case: null, push: t.push || null }); else openCust(t.cust); return true; }
        case 'ae-tgo': { const t = taskFull([...TASKS(), ...W.extra].find(x => x.id === id)); if (t.nav) ctx.go(t.nav, { cust: null, case: null, push: t.push || null }); else if (t.c) openCase(t.c.id); else openCust(t.cust); return true; }
        case 'ae-do': doCase(caseById(id)); return true;
        case 'ae-tdone': W.done.add(id); ctx.toast(L('Done. Logged on the customer.', 'Erledigt. Beim Kunden protokolliert.')); { const t = taskFull([...TASKS(), ...W.extra].find(x => x.id === id)); if (t.cust) log(t.cust, 'check', [`Done: ${t.act[0]}`, `Erledigt: ${t.act[1]}`], t.case); } ctx.emit(); return true;
        case 'ae-tsnooze': W.snoozed[id] = day(3); ctx.toast(L(`Snoozed until ${short(day(3))}`, `Zurückgestellt bis ${short(day(3))}`)); ctx.emit(); return true;
        case 'ae-chat': openChat(id); return true;
        // the click that ends a drag is not a click on the button
        case 'ae-fab': if (Date.now() - (W.dragged || 0) < 250) return true; if (st.chat) { st.chat = null; ctx.render(); } else openChat(chatKeyNow()); return true;
        case 'ae-chatctx': openChat('day'); return true;
        case 'ae-gfull': { const k = st.chat; st.gptKey = k === 'day' ? 'gpt' : k; if (k === 'day') W.chats.gpt = W.chats.day; ctx.go('gpt'); return true; }
        case 'ae-gnew': W.chats.gpt = []; st.gptKey = 'gpt'; st.chatFocus = true; ctx.render(); return true;
        case 'ae-gconv': st.gptKey = id; st.chatFocus = true; ctx.render(); return true;
        case 'ae-gask': send(el.dataset.v, 'prod'); return true;
        // the action drawer: email draft, WhatsApp or a call, always with the source on top
        case 'ae-cmp': st.compose = { key: id, mode: el.dataset.v || 'email', fresh: true }; st.chat = null; ctx.render(); return true;
        case 'ae-cmode': if (st.compose) Object.assign(st.compose, { mode: el.dataset.v, live: false, fresh: false }); ctx.render(); return true;
        case 'ae-cclose': st.compose = null; ctx.render(); return true;
        case 'ae-csave': ctx.toast(L('Draft saved in Outlook', 'Entwurf in Outlook gespeichert')); return true;
        case 'ae-csend': { const x = st.compose && target(st.compose.key); if (x) finish(x, el.dataset.v || 'email'); return true; }
        case 'ae-ccall': if (st.compose) Object.assign(st.compose, { live: true, fresh: false }); ctx.render(); return true;
        case 'ae-cout': {
          const x = st.compose && target(st.compose.key); if (!x) return true;
          const v = el.dataset.v, note = el.closest('.ae-cmp')?.querySelector('[data-f="callnote"]')?.value.trim() || '';
          if (v === 'yes' && (x.c?.goal === 'offer' && x.c.offer || x.push)) { log(x.cust, 'phone', [`Call: interested${note ? ` · "${note}"` : ''}`, `Anruf: Interesse${note ? ` · „${note}“` : ''}`], x.c?.id); Object.assign(st.compose, { mode: 'email', live: false, fresh: false }); ctx.toast(L('Call logged. The email is ready to send.', 'Anruf protokolliert. Die E-Mail ist versandbereit.')); ctx.emit(); return true; }
          if (v === 'yes') { finish(x, 'call', note); return true; }
          if (v === 'ai') { st.compose = null; openChat(x.c ? `case:${x.c.id}` : `cust:${x.cust}`, L(`The call with ${meta(x.cust).contact} has ended. Tell me how it went in your own words, and I will update the records.`, `Das Gespräch mit ${meta(x.cust).contact} ist beendet. Erzählen Sie mir in eigenen Worten, wie es lief, und ich aktualisiere die Datensätze.`)); return true; }
          if (v === 'later') { const ts = x.t ? [x.t] : x.c ? TASKS().filter(t => t.case === x.c.id) : []; ts.forEach(t => { W.snoozed[t.id] = day(7); }); if (!ts.length) addTask(x.cust, 7, { kind: 'com', act: [`Call ${meta(x.cust).contact} again`, `${meta(x.cust).contact} erneut anrufen`], why: ['Asked for more time on the call', 'Hat im Anruf um mehr Zeit gebeten'] });
            log(x.cust, 'phone', [`Call: needs more time, back on ${short(day(7))}${note ? ` · "${note}"` : ''}`, `Anruf: braucht mehr Zeit, Wiedervorlage ${short(day(7))}${note ? ` · „${note}“` : ''}`], x.c?.id); st.compose = null; ctx.toast(L(`Back on your list on ${short(day(7))}`, `Am ${short(day(7))} wieder auf Ihrer Liste`)); ctx.emit(); return true; }
          if (x.c?.type === 'opp' && isOpenCase(x.c)) { setCase(x.c.id, { status: 'lost', cur: x.c.steps.length, lostReason: ['No need right now (call)', 'Aktuell kein Bedarf (Anruf)'] }); closeTasksOf(x.c.id); }
          else if (x.c) closeTasksOf(x.c.id); else if (x.t) W.done.add(x.t.id);
          if (x.push || x.scarce) { const sent = x.push ? (W.pushSent[x.push.id] = W.pushSent[x.push.id] || new Set()) : (W.scarceSent[x.scarce.t.fam] = W.scarceSent[x.scarce.t.fam] || new Set()); sent.add(x.cust); }
          log(x.cust, 'phone', [`Call: no need right now${note ? ` · "${note}"` : ''}`, `Anruf: aktuell kein Bedarf${note ? ` · „${note}“` : ''}`], x.c?.id); st.compose = null; ctx.toast(L('Logged: no need right now', 'Protokolliert: aktuell kein Bedarf')); ctx.emit(); return true;
        }
        // outbound: products to push, scarce supply, several emails at once
        case 'ae-pp': st.push = id; ctx.render(true); return true;
        case 'ae-pmode': st.pushMode = id; ctx.render(); return true;
        case 'ae-pcust': st.pushCust = id; ctx.render(); return true;
        case 'ae-otab': st.oppTab = id; ctx.render(); return true;
        case 'ae-oview': st.oppView = id; ctx.render(); return true;
        case 'ae-rh': {
          const [c, f, v] = id.split('|'), o = W.rh[c] = { ...(W.rh[c] || {}), at: new Date() }, a = acc(c);
          if (f === 'reset') { delete W.rh[c]; log(c, 'arrow-counter-clockwise', ['Buying rhythm back to the SAP values', 'Kaufrhythmus zurück auf die SAP-Werte']); W.log[c][0].me = true; ctx.toast(L('Back to the values from SAP', 'Zurück auf die Werte aus SAP')); ctx.emit(); return true; }
          if (f === 'rhythm') o.rhythm = Math.max(1, Math.min(26, a.rhythm + +v));
          if (f === 'qty') o.qty = Math.max(1, Math.min(200, qtyOf(c) + +v));
          if (f === 'ci') { o.ci = v; if (v === 'fix' && o.ciw == null) o.ciw = 4; }
          if (f === 'ciw') o.ciw = Math.max(1, Math.min(12, ciWeeks(c) + +v));
          if (f === 'why') o.why = v;
          if (f === 'rhythm' || f === 'qty') { // one activity entry per adjustment, not one per click
            const txt = [`Buying rhythm set to every ${acc(c).rhythm} weeks, about ${qtyOf(c)} t`, `Kaufrhythmus auf alle ${acc(c).rhythm} Wochen, ca. ${qtyOf(c)} t gesetzt`], top = W.log[c]?.[0];
            if (top?.rh) Object.assign(top, { t: txt, at: new Date() }); else { log(c, 'arrows-clockwise', txt); Object.assign(W.log[c][0], { rh: true, me: true }); }
          }
          if (f === 'ci') { log(c, v === 'off' ? 'bell-slash' : 'bell', v === 'off' ? ['Check-in suggestions switched off', 'Check-in-Vorschläge ausgeschaltet'] : v === 'fix' ? ['Check-ins on a fixed rhythm', 'Check-ins im festen Rhythmus'] : ['Check-ins automatic again', 'Check-ins wieder automatisch']); W.log[c][0].me = true; }
          ctx.emit(); return true;
        }
        case 'ae-ozoom': st.oppZoom = id; ctx.render(); return true;
        case 'ae-dir': st.todayDir = id; ctx.render(); return true;
        case 'ae-tiers': { const o = D().offers.find(x => x.id === id); if (!o) return true; W.tiersSent.add(id); model.status[id] = 'sent'; const c = caseOfOffer(o); if (c && isOpenCase(c)) { setCase(c.id, { cur: c.done.cur, status: c.done.status }); closeTasksOf(c.id); }
          log(o.customer, 'currency-eur', [`Price scale 1 / 3 / 5 t sent; an opportunity only once a quantity follows`, `Preisstaffel 1 / 3 / 5 t gesendet; Opportunity erst, wenn eine Menge kommt`], c?.id);
          ctx.toast(L(`Price scale sent to ${meta(o.customer).contact}.`, `Preisstaffel an ${meta(o.customer).contact} gesendet.`)); ctx.emit(); return true; }
        case 'ae-order': { const o = allPQ().find(x => x.id === id); if (!o) return true; W.ordered.add(id); model.status[id] = 'sent'; const c = caseOfOffer(o); if (c && isOpenCase(c)) { setCase(c.id, c.done ? { cur: c.done.cur, status: c.done.status } : { status: 'won', cur: c.steps.length }); closeTasksOf(c.id); }
          log(o.customer, 'clipboard-text', [`Order created in SAP from ${o.kind === 'order' ? 'the framework call-off' : `offer ${id}`}; confirmation sent`, `Auftrag in SAP angelegt aus ${o.kind === 'order' ? 'dem Rahmenabruf' : `Angebot ${id}`}; Bestätigung gesendet`], c?.id);
          ctx.toast(L(`Order created in SAP. Confirmation sent to ${meta(o.customer).contact}.`, `Auftrag in SAP angelegt. Bestätigung an ${meta(o.customer).contact} gesendet.`)); ctx.emit(); return true; }
        case 'ae-won': { const o = D().offers.find(x => x.id === id); if (!o) return true; W.won.add(id); delete W.followups[id]; const c = caseOfOffer(o); if (c) { setCase(c.id, { status: 'won', cur: c.steps.length }); closeTasksOf(c.id); }
          log(o.customer, 'check-circle', [`Offer ${id} accepted; the order waits under Create order`, `Angebot ${id} angenommen; der Auftrag wartet unter Auftrag anlegen`], c?.id); ctx.toast(L('Accepted. The order is ready under "Create order".', 'Angenommen. Der Auftrag steht unter „Auftrag anlegen“ bereit.')); ctx.emit(); return true; }
        case 'ae-psel': { const p = PUSH().find(x => x.id === st.push), set = p && pushSel(p); if (set) set.has(id) ? set.delete(id) : set.add(id); ctx.render(); return true; }
        case 'ae-ssel': { const [fm, cust] = id.split('|'), set = W.scarceSel[fm]; if (set) set.has(cust) ? set.delete(cust) : set.add(cust); ctx.render(); return true; }
        case 'ae-bulk': st.bulk = id; st.bulkFresh = true; ctx.render(); st.bulkFresh = false; return true;
        case 'ae-bclose': st.bulk = null; ctx.render(); return true;
        case 'ae-bsend': { const list = bulkList(); list.forEach(x => finish(x, 'email', '', true)); st.bulk = null; ctx.toast(L(`${list.length} emails sent after your approval. Follow-ups are on your list in 3 days.`, `${list.length} E-Mails nach Ihrer Freigabe gesendet. Das Nachfassen steht in 3 Tagen auf Ihrer Liste.`)); ctx.emit(); return true; }
        case 'ae-chatclose': st.chat = null; ctx.render(); return true;
        case 'ae-chip': { const k = el.closest('[data-chat]')?.dataset.chat || st.chat; send(chips(k)[+el.dataset.v], k); return true; }
        case 'ae-send': { const box = el.closest('[data-chat]'), k = box?.dataset.chat || st.chat, inp = box?.querySelector('input[data-act="chatin"]') || el; send(inp.value, k); return true; }
        case 'ae-ok': case 'ae-no': { const x = chatOf(el.closest('[data-chat]')?.dataset.chat || st.chat)[+id]; if (!x?.prop || x.state) return true; x.state = a === 'ae-ok' ? 'ok' : 'no'; x.at = new Date(); if (a === 'ae-ok') { x.prop.apply(); ctx.toast(L('Records updated and logged', 'Datensätze aktualisiert und protokolliert')); } ctx.emit(); return true; }
        case 'ae-mail': { const x = chatOf(el.closest('[data-chat]')?.dataset.chat || st.chat)[+id]; if (!x?.mail || x.state) return true; x.state = 'ok'; log(x.mail.cust, 'envelope-simple', [`Email sent: ${x.mail.subj}`, `E-Mail gesendet: ${x.mail.subj}`], x.mail.case);
          const c = x.mail.case && caseById(x.mail.case); if (c?.id === 'C-104') { setCase(c.id, { cur: 4, status: 'done' }); } else if (c && c.status === 'followup') { setCase(c.id, { status: 'awaiting' }); closeTasksOf(c.id); } else { [...TASKS(), ...W.extra].filter(t => t.cust === x.mail.cust && !t.case).forEach(t => W.done.add(t.id)); }
          ctx.toast(L('Sent after your approval and logged', 'Nach Ihrer Freigabe gesendet und protokolliert')); ctx.emit(); return true; }
        case 'ae-role': W.role = el.dataset.v; Object.assign(st, { page: 'today', cust: null, case: null, chat: null, offer: null, menu: null, tour: -1 }); ctx.toast(L(`Viewing as ${USERS()[W.role][0]}`, `Ansicht: ${USERS()[W.role][0]}`)); ctx.emit(); return true;
        case 'ae-push': W.pushed = true; if (W.role !== 'pm') for (const c of ['Hanse Closures GmbH', 'Weser Getränketechnik GmbH']) addTask(c, 0, { prio: 64, kind: 'com', act: ['Offer HDPE at the special price', 'HDPE zum Sonderpreis anbieten'], why: [`Product management push: −€40/t until month end; fits their closures.`, `Aktion Produktmanagement: −40 €/t bis Monatsende; passt zu ihren Verschlüssen.`] });
          ctx.toast(W.role === 'pm' ? L('Sent to the account managers of Hanse and Weser', 'An den Vertrieb für Hanse und Weser gegeben') : L('Two tasks created, outreach drafted for your approval', 'Zwei Aufgaben angelegt, Ansprache zur Freigabe entworfen')); ctx.emit(); return true;
        case 'ae-inform': W.informed.add(id); log(id, 'paper-plane-tilt', ['Delivery update sent', 'Lieferinfo gesendet']); ctx.toast(L(`Update sent to ${nm(id)} after your approval`, `Update nach Ihrer Freigabe an ${nm(id)} gesendet`)); ctx.emit(); return true;
        case 'ae-out': addTask(id, 0, { prio: 56, kind: acc(id).contact > 21 ? 'rel' : 'com', act: acc(id).order > acc(id).rhythm * 7 + 7 ? ['Call about the next order', 'Wegen der nächsten Bestellung anrufen'] : CROSS[id] ? [`Ask about ${CROSS[id][0]}`, `Nach ${CROSS[id][0]} fragen`] : ['Relationship check-in', 'Beziehungspflege'], why: ['Created from Outbound today', 'Heute aus Outbound angelegt'] });
          ctx.toast(L(`Task for ${nm(id)} added to Today`, `Aufgabe für ${nm(id)} zu „Heute“ hinzugefügt`)); ctx.emit(); return true;
        case 'ae-q': ctx.toast(L('Question added to your call notes', 'Frage zu Ihren Gesprächsnotizen hinzugefügt')); return true;
        case 'ae-allocreq': ctx.toast(L('Request sent to Sven Martens (product management)', 'Anfrage an Sven Martens (Produktmanagement) gesendet')); return true;
        case 'ae-pmok': setCase('C-106', { cur: 5, status: 'qualifying' }); log('Elbtal Elektrotechnik GmbH', 'seal-check', ['Sven Martens: GWIT 775 °C confirmed by the producer test report (demo)', 'Sven Martens: GWIT 775 °C durch Prüfbericht des Herstellers bestätigt (Demo)'], 'C-106'); ctx.toast(L('Verified answer sent to Lena Hoffmann', 'Geprüfte Antwort an Lena Hoffmann gesendet')); ctx.emit(); return true;
      }
      return false;
    }

    // ------------------------------------------------------------------ public surface for app.js
    return {
      // the sidebar: the day on top, then what comes in and what goes out
      // the sidebar: the day on top, then the pipeline, then what comes in (the purchase stages as their own entries) and what goes out
      nav: () => [['work', L('My workday', 'Mein Arbeitstag'), 'sun-horizon', [['today', L('Today', 'Heute')]]],
        ['in', 'Inbound', 'tray-arrow-down', [['inbox', L('Inbox', 'Posteingang')], ['pq-spec', PQ().spec[0]], ['pq-create', PQ().create[0]], ['pq-out', PQ().out[0]], ['pq-order', PQ().order[0]], ['service', L('Info requests', 'Info-Anfragen')], ['customers', L('Customers', 'Kunden')]]],
        ['out', 'Outbound', 'paper-plane-tilt', [['outbound', 'Demand Match'], ['checkin', L('Check-ins', 'Check-ins')], ['push', L('Pushed products', 'Push-Produkte')], ['scarce', L('Scarce supply', 'Knappes Inventar')]]],
        ['opp', 'Opportunities', 'target', [['opps', L('Pipeline planning', 'Pipeline-Planung')]]],
        ['gpt', 'Biesterfeld GPT', 'sparkle', [['gpt', 'Chat'], ['prodq', L('Product questions', 'Produktfragen')]]]],
      titles: () => ({ today: L('My workday', 'Mein Arbeitstag'), customers: L('Customers', 'Kunden'), pipeline: L('Pipeline board', 'Pipeline-Board'), opps: L('Pipeline planning', 'Pipeline-Planung'), outbound: 'Demand Match', push: L('Pushed products', 'Push-Produkte'), scarce: L('Scarce supply', 'Knappes Inventar'), service: L('Info requests', 'Info-Anfragen'), followup: 'Pipeline', checkin: L('Customer check-ins', 'Kunden-Check-ins'), gpt: 'Biesterfeld GPT', prodq: L('Product questions', 'Produktfragen'),
        'pq-spec': PQ().spec[0], 'pq-create': PQ().create[0], 'pq-out': PQ().out[0], 'pq-order': PQ().order[0] }),
      count: p => (p === 'today' ? todayTasks().length : p.startsWith('pq-') ? allPQ().filter(o => pqStage(o) === p.slice(3) && inRole(o.customer)).length : p === 'service' ? cases().filter(c => c.type === 'req' && c.intents.some(k => ['docs', 'delivery', 'tech', 'price'].includes(k)) && isOpenCase(c)).length : p === 'checkin' ? allCust().filter(inRole).filter(ciDue).length : p === 'push' ? PUSH().filter(x => !(W.pushSent[x.id]?.size)).length : p === 'scarce' ? (ctx.tightFamilies?.() || []).filter(t => !(W.scarceSent[t.fam]?.size)).length : 0),
      content() { if (st.case) return caseView(); if (st.cust) return custView(); if (st.page === 'pipeline' || st.page === 'followup') { st.page = 'opps'; st.oppView = 'board'; } const p = { today, customers, pipeline, opps, outbound, checkin, push, scarce, service, gpt: () => gptPage('gpt'), prodq: () => gptPage('prod'), followup: pipeline, 'pq-spec': () => pq('spec'), 'pq-create': () => pq('create'), 'pq-out': () => pq('out'), 'pq-order': () => pq('order'), 'pq-confirm': () => pq('out'), 'pq-follow': () => pq('out') }[st.page]; return p ? p() : null; },
      crumbs() {
        const c = st.case && caseById(st.case);
        if (c) return `<span class="bfa-crumbs">${L('My workday', 'Mein Arbeitstag')} ${ph('caret-right')} ${esc(nm(c.cust))} ${ph('caret-right')} <b>${c.type === 'req' ? L('Request', 'Anfrage') : 'Opportunity'} ${c.id}</b></span>`;
        if (st.cust) return `<span class="bfa-crumbs">Inbound ${ph('caret-right')} ${L('Customers', 'Kunden')} ${ph('caret-right')} <b>${esc(nm(st.cust))}</b></span>`;
        if (st.page === 'push' && st.push) return `<span class="bfa-crumbs">Outbound ${ph('caret-right')} ${L('Push products', 'Push-Produkte')} ${ph('caret-right')} <b>${esc(PUSH().find(x => x.id === st.push)?.grade || '')}</b></span>`;
        return null;
      },
      user() {
        const u = USERS()[W.role];
        return `<div class="ae-userwrap">${st.menu === 'role' ? `<div class="bfa-menu ae-rolemenu"><small>${L('VIEW AS', 'ANSICHT ALS')}</small>${Object.entries(USERS()).map(([k, v]) => `<button data-act="ae-role" data-v="${k}" class="${W.role === k ? 'on' : ''}"><span class="av">${v[1]}</span><span class="rt"><b>${v[0]}</b><small>${v[2]}</small></span></button>`).join('')}</div>` : ''}
          <button class="bfa-user" data-act="menu" data-id="role" data-tour="role"><span class="av">${u[1]}</span><span><b>${u[0]}</b><small>${u[2]}</small></span>${ph('caret-up-down')}</button></div>`;
      },
      name: () => USERS()[W.role][0],
      canAllocate: () => W.role === 'pm',
      intents: msgIntents, inboxRows, noOfferCount,
      sentAt: id => W.followups[id]?.sent || null,
      act, overlays: () => compose() + bulk() + chat(), offerSource, offerFoot, pqOf, sourceBrief, coachFor,
      onSent(id) { W.followups[id] = { sent: new Date(), due: day(4) }; const c = cases().find(x => x.offer === id && x.goal === 'offer' && isOpenCase(x)); if (c) { setCase(c.id, { status: 'sent', cur: 4 }); closeTasksOf(c.id); log(c.cust, 'paper-plane-tilt', [`Offer ${id} sent; follow-up ${short(day(4))}`, `Angebot ${id} gesendet; Nachfassen ${short(day(4))}`], c.id); } return L(`Follow-up set for ${short(day(4))}.`, `Nachfassen am ${short(day(4))} gesetzt.`); },
      after(root) {
        root.querySelectorAll('.ae-msgs').forEach(box => { box.scrollTop = box.scrollHeight; });
        placeChat(root); dragFab(root);
        if (st.chatFocus) { root.querySelector(st.chat ? '.ae-chat input[data-act="chatin"]' : '.ae-gpt input[data-act="chatin"]')?.focus({ preventScroll: true }); st.chatFocus = false; }
        st.chatFresh = false; if (st.compose) st.compose.fresh = false;
      },
      tour: () => ({ today: [
        ['tlist', L('Your day, ranked', 'Ihr Tag, priorisiert'), L('Offers to send and information to get, in one list. Every task says why it is there and where it comes from, and offers both: an email draft or a call.', 'Angebote senden und Infos einholen, in einer Liste. Bei jeder Aufgabe steht, warum sie da ist und woher sie kommt, und beides geht: E-Mail-Entwurf oder Anruf.')],
        ['trail', L('Where each item stands', 'Wo jeder Vorgang steht'), L('Three stages: understand, respond, follow up. A data-sheet request takes the short path and never becomes a fake opportunity.', 'Drei Stufen: verstehen, antworten, nachfassen. Eine Datenblatt-Anfrage nimmt den kurzen Weg und wird nie zur Schein-Opportunity.')],
        ['tchat', L('Ask AI, from anywhere', 'Frag die KI, von überall'), L('Products, stock in SAP, prices, customers: just ask. Drag the button wherever it suits you. After a call, tell it what happened; it proposes the record changes, you confirm.', 'Produkte, Bestand in SAP, Preise, Kunden: einfach fragen. Den Knopf ziehen Sie dorthin, wo er Sie nicht stört. Nach einem Anruf erzählen Sie, was passiert ist; die KI schlägt die Änderungen vor, Sie bestätigen.')],
        ['role', L('Three roles, one system', 'Drei Rollen, ein System'), L('Switch to field sales or product management. Allocation decisions stay with product management.', 'Wechseln Sie in den Außendienst oder ins Produktmanagement. Allokationsentscheidungen bleiben beim Produktmanagement.')],
      ] }),
    };
  };
})();
