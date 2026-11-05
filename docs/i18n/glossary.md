# admin-OS glossary: one term per concept in each language

Used by everyone who writes or reviews UI text in `en`, `es`, `de` and `fr` (ADR 0007, spec 001 D5). The shell wording in `src/ds/shell/server.ts` and `src/navigation/shell/nav-messages.server.ts` is the baseline; where this file and a dictionary disagree, fix the dictionary, or change this file in the same commit if the term is wrong.

A concept has **one** translation per language across the whole app. Do not use a synonym because it fits the line better. If a term is missing, add a row here in the same change that needs it.

## Register and voice

| Language | Address | Buttons and menu items | Instructions and validation | Placeholders |
| --- | --- | --- | --- | --- |
| en | neutral "you" | Verb or noun: "Save", "Add item" | "Enter a reference number." | Noun or verb: "Search…" |
| es | **tú** | Infinitive: "Guardar", "Añadir concepto" | Imperative: "Introduce un número de referencia." | **Infinitive**: "Buscar…", "Seleccionar fecha" |
| de | **du** | Infinitive: "Speichern", "Position hinzufügen" | Imperative: "Gib eine Referenznummer ein." | Infinitive: "Suchen…", "Datum auswählen" |
| fr | **vous** | Infinitive: "Enregistrer", "Ajouter une ligne" | Imperative, vous: "Saisissez un numéro de référence." | Infinitive: "Rechercher…", "Sélectionner une date" |

- **Native, not literal.** Write what a business owner would read in that country's accounting or CRM software. No calques: "Facturar a" (not "Billed to"), "Fälligkeitsdatum" (not "Fällig Datum"), "Embudo" for pipeline in Spanish where "pipeline" would sound imported, while German and French keep "Pipeline".
- **Sentence case** in all four languages: only the first word and proper nouns are capitalised ("Fecha de vencimiento", "Neue Rechnung erstellen", "Date d’échéance"). German nouns keep their mandatory capital. Do not copy English Title Case.
- **Short.** A label that overflows a 375 px screen in German or French is a bug; shorten with the abbreviations below, never with a different word.
- **No exclamation marks** in product text. No emoji.

## Typography

| Rule | en | es | de | fr |
| --- | --- | --- | --- | --- |
| Apostrophe | `’` or none | `’` or none | `’` or none | **always `’`** (U+2019), never `'` |
| Before `: ; ? !` | no space | no space | no space | **no-break space** (U+00A0) before each |
| Before `%` | none | no-break space ("12 %") | no-break space | no-break space |
| Ellipsis | `…` (one character) | `…` | `…` | `…` |
| Decimal and thousands | `1,234.5` | `1234,5` / `12.345,6` | `1.234,5` | `1 234,5` (narrow no-break space) |

- Numbers, percentages, currency, dates, times, lists and plurals are **never typed**. They come from `Intl` through `@/core/i18n` (`formatAmount`, `formatPercent`, `formatCalendarDate`, `formatList`, `Plural`). That is what makes `12 %` and `1 234,56 €` correct.
- The parity test (`assertDictionaryParity`) rejects, in `fr`, a plain space or no space before `: ; ? !`, no no-break space between a number (or `{placeholder}`) and `%`, and a straight apostrophe.
- A template such as `"{label}: {value}"` carries its own colon so French can put the no-break space in it (`"{label} : {value}"`). Never put `:` in JSX next to a translated label.
- Quotation marks: avoid them in UI text. If unavoidable: en “…”, es «…», de „…“, fr « … » (no-break spaces inside).

## Currency

The currency is a **business setting, independent of the language** (ADR 0007, amendment of the currency scope). Supported: USD, EUR, GBP. The dictionary never contains a currency symbol or the words "dollar" or "euro" for an amount; the amount is formatted by `Intl` with the business currency, or with the `Money` value's own currency. The picker names currencies with `Intl.DisplayNames` plus the symbol ("euro (€)", "Euro (€)", "Pfund Sterling (£)").

## Status agreement (es, fr)

A status agrees in gender and number with the noun it describes. The dictionary of a screen picks the form for the noun that screen shows; it never reuses the masculine form because the other screen did.

| Noun | es | fr | Statuses |
| --- | --- | --- | --- |
| Deal | oportunidad (f) | affaire (f) | es Ganada, Perdida; fr Gagnée, Perdue |
| Invoice | factura (f) | facture (f) | es Enviada, Pagada, Vencida; fr Envoyée, Payée |
| Task | tarea (f) | tâche (f) | es Completada; fr Terminée |
| Booking | reserva (f) | réservation (f) | es Confirmada, Cancelada; fr Confirmée, Annulée |

German statuses are participles without gender in these positions and need no rule.

## Terms

### Areas of the app

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Dashboard (one) | Dashboard | Panel | Dashboard | Tableau de bord | Nav group "Dashboards" is "Paneles" / "Dashboards" / "Tableaux de bord" |
| Overview | Overview | Resumen | Übersicht | Aperçu | |
| Sales overview | Sales overview | Resumen de ventas | Vertriebsübersicht | Aperçu des ventes | Page title |
| Schedule (staff) | Schedule | Agenda | Termine | Planning | Nav label |
| Team schedule | Team schedule | Agenda del equipo | Teamkalender | Planning de l’équipe | Page title |
| Calendar (the widget) | Calendar | Calendario | Kalender | Calendrier | Calendar view, calendar filter |
| All calendars | All calendars | Todos los calendarios | Alle Kalender | Tous les calendriers | "Agenda" in fr is a diary, not the filter |
| Reservations | Reservations | Reservas | Reservierungen | Réservations | See booking |
| Customers (the list) | Customers | Clientes | Kunden | Clients | |
| Products | Products | Productos | Produkte | Produits | |
| Finance | Finance | Finanzas | Finanzen | Finance | |
| Growth (analytics) | Growth | Crecimiento | Wachstum | Croissance | Nav label of the analytics screen |
| Projects | Projects | Proyectos | Projekte | Projets | |
| Tasks | Tasks | Tareas | Aufgaben | Tâches | |
| Files | File manager | Archivos | Dateien | Fichiers | |
| Inbox | Inbox | Bandeja de entrada | Posteingang | Boîte de réception | |
| Email | Email | Correo | E-Mail | E-mail | |
| Chat | Chat | Chat | Chat | Chat | Same word everywhere |
| Settings | Settings | Ajustes | Einstellungen | Paramètres | Preferences panel keeps "Preferencias" / "Einstellungen" / "Préférences" |
| Preferences | Preferences | Preferencias | Einstellungen | Préférences | The personal panel in the shell |
| Account | Account | Cuenta | Konto | Compte | |
| Profile | Profile | Perfil | Profil | Profil | |
| Breadcrumb | Breadcrumb | Ruta de navegación | Brotkrümelnavigation | Fil d’Ariane | The page trail's accessible name (ADR 0020); never shown |
| Roles | Roles | Roles | Rollen | Rôles | |
| Notifications | Notifications | Notificaciones | Benachrichtigungen | Notifications | |
| Search | Search | Buscar | Suchen | Rechercher | Button and placeholder |
| Language | Language | Idioma | Sprache | Langue | |
| Currency | Currency | Moneda | Währung | Devise | |
| Theme | Theme | Tema | Design | Thème | Theme and font names are never translated |
| Font | Font | Fuente | Schrift | Police | |

### Sales and customers

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Pipeline | Pipeline | Embudo | Pipeline | Pipeline | |
| Deal | Deal | Oportunidad | Deal | Affaire | Plural: oportunidades / Deals / affaires |
| Hot deals | Hot deals | Oportunidades calientes | Heiße Deals | Affaires chaudes | |
| Lead | Lead | Lead | Lead | Prospect | |
| Customer (one) | Customer | Cliente | Kunde | Client | |
| Contact | Contact | Contacto | Kontakt | Contact | |
| Company | Company | Empresa | Unternehmen | Entreprise | Company names are proper nouns |
| Segment | Segment | Segmento | Segment | Segment | |
| Owner (of a deal) | Owner | Responsable | Verantwortlich | Responsable | |
| Team | Team | Equipo | Team | Équipe | |
| Quota | Quota | Cuota | Quote | Quota | |
| Target | Target | Objetivo | Ziel | Objectif | |
| Win rate | Win rate | Tasa de éxito | Abschlussquote | Taux de réussite | |
| Revenue | Revenue | Ingresos | Umsatz | Chiffre d’affaires | |
| Sales | Sales | Ventas | Vertrieb | Ventes | "Vertrieb" for the department and the overview, "Verkäufe" only for counted sales |
| Weighted value | Weighted value | Valor ponderado | Gewichteter Wert | Valeur pondérée | |
| Closing (stage) | Closing | Cierre | Abschluss | Conclusion | |
| Stage | Stage | Fase | Phase | Étape | |
| Note (on a customer) | Note | Nota | Notiz | Note | Dated, signed by the team member who wrote it |
| Marketing messages (consent) | Marketing messages | Mensajes comerciales | Werbenachrichten | Messages commerciaux | Whether the customer agreed to receive them |

### Pipeline stages and statuses

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Qualification | Qualification | Cualificación | Qualifizierung | Qualification | |
| Proposal | Proposal | Propuesta | Angebot | Proposition | |
| Negotiation | Negotiation | Negociación | Verhandlung | Négociation | |
| Won | Won | Ganado / Ganada | Gewonnen | Gagné / Gagnée | A deal ("oportunidad", "affaire") is feminine |
| Lost | Lost | Perdido / Perdida | Verloren | Perdu / Perdue | See "Status agreement" below |
| Open | Open | Abierto | Offen | Ouvert | |
| Closed | Closed | Cerrado | Geschlossen | Clos | |
| Draft | Draft | Borrador | Entwurf | Brouillon | |
| Sent | Sent | Enviado / Enviada | Gesendet | Envoyé / Envoyée | An invoice ("factura", "facture") is feminine |
| Paid | Paid | Pagado / Pagada | Bezahlt | Payé / Payée | |
| Overdue | Overdue | Vencido / Vencida | Überfällig | En retard | fr "En retard" does not agree |
| Completed | Completed | Completado / Completada | Abgeschlossen | Terminé / Terminée | A task ("tarea", "tâche") is feminine |
| Pending | Pending | Pendiente | Ausstehend | En attente | |
| Confirmed | Confirmed | Confirmado | Bestätigt | Confirmé | |
| Cancelled | Cancelled | Cancelado | Storniert | Annulé | de: "Storniert" for bookings and invoices; "Abgebrochen" only for an interrupted process |
| Active | Active | Activo | Aktiv | Actif | |
| Inactive | Inactive | Inactivo | Inaktiv | Inactif | |
| Late (booking) | Late | Con retraso | Verspätet | En retard | |

### Bookings

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Booking, reservation | Reservation | Reserva | Reservierung | Réservation | "Booking" and "reservation" are one concept |
| Table | Table | Mesa | Tisch | Table | |
| Party size, covers | Covers | Comensales | Gedecke | Couverts | Restaurant preset vocabulary |
| No-show | No-show | No presentada | Nicht erschienen | Non honorée | A booking the guest did not keep; a count is plural ("No presentadas", "Non honorées") |
| Walk-in | Walk-in | Walk-in | Walk-in | Walk-in | Never translated (owner): the term staff use; the button, the booking channel and a walk-in guest all say "Walk-in" |
| Floor plan | Floor plan | Plano de sala | Raumplan | Plan de salle | |
| Arrivals (the rail) | Arrivals | Llegadas | Ankünfte | Arrivées | The rail of upcoming bookings by time slot |
| Guest | Guest | Cliente | Gast | Client | es uses "cliente" for a person at the table |
| Appointment | Appointment | Cita | Termin | Rendez-vous | Salon and workshop presets |
| Event | Event | Evento | Termin | Événement | de: "Termin" covers event and appointment; use "Veranstaltung" only for a public event |
| Meeting | Meeting | Reunión | Meeting | Réunion | |
| Focus time | Focus time | Tiempo de concentración | Fokuszeit | Temps de concentration | |
| All day | All day | Todo el día | Ganztägig | Toute la journée | |

### Billing

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Invoice | Invoice | Factura | Rechnung | Facture | |
| Reference number | Reference number | Número de referencia | Referenznummer | Numéro de référence | |
| Issued date | Issued date | Fecha de emisión | Rechnungsdatum | Date d’émission | |
| Due date | Due date | Fecha de vencimiento | Fälligkeitsdatum | Date d’échéance | |
| Billed to | Billed to | Facturar a | Rechnung an | Facturé à | |
| Line item | Item | Concepto | Position | Ligne | |
| Description | Description | Descripción | Beschreibung | Description | |
| Quantity (short) | Units | Uds. | Menge | Qté | |
| Unit price | Unit cost | Precio unitario | Einzelpreis | Prix unitaire | |
| Line total | Line total | Importe | Gesamt | Total ligne | |
| Net amount | Net amount | Base imponible | Nettobetrag | Montant net | |
| Discount | Discount | Descuento | Rabatt | Remise | |
| Tax | Tax | Impuesto | Steuer | Taxe | |
| VAT | VAT | IVA | MwSt. | TVA | GST keeps its abbreviation everywhere |
| Tax ID | Tax ID | NIF | Steuer-ID | N° fiscal | |
| Balance due | Balance due | Total a pagar | Offener Betrag | Solde dû | |
| Payment | Payment | Pago | Zahlung | Paiement | |
| Payment account | Payment account | Cuenta de pago | Zahlungskonto | Compte de paiement | |
| Billing | Billing | Facturación | Abrechnung | Facturation | Account menu item |
| Amount | Amount | Importe | Betrag | Montant | |
| Total | Total | Total | Gesamt | Total | |
| Subtotal | Subtotal | Subtotal | Zwischensumme | Sous-total | |

### Actions

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Save | Save | Guardar | Speichern | Enregistrer | |
| Save as draft | Save as draft | Guardar borrador | Als Entwurf speichern | Enregistrer le brouillon | |
| Cancel | Cancel | Cancelar | Abbrechen | Annuler | |
| Delete | Delete | Eliminar | Löschen | Supprimer | es: "Eliminar", not "Borrar" |
| Remove (from a list) | Remove | Quitar | Entfernen | Retirer | A line from an invoice: "Eliminar el concepto" is also fine; pick one per screen |
| Edit | Edit | Editar | Bearbeiten | Modifier | |
| Add | Add | Añadir | Hinzufügen | Ajouter | es: "Añadir", not "Agregar" |
| Create | Create | Crear | Erstellen | Créer | |
| New | New | Nuevo / Nueva | Neu / Neue | Nouveau / Nouvelle | Agrees with the noun |
| Send | Send | Enviar | Senden | Envoyer | |
| Print | Print | Imprimir | Drucken | Imprimer | |
| Download | Download | Descargar | Herunterladen | Télécharger | |
| Open | Open | Abrir | Öffnen | Ouvrir | |
| Close | Close | Cerrar | Schließen | Fermer | |
| Confirm | Confirm | Confirmar | Bestätigen | Confirmer | |
| Back | Back | Atrás | Zurück | Retour | |
| Next | Next | Siguiente | Weiter | Suivant | |
| Previous | Previous | Anterior | Zurück | Précédent | de: "Vorheriger Zeitraum" for periods |
| Today | Today | Hoy | Heute | Aujourd’hui | |
| Filter | Filter | Filtrar | Filtern | Filtrer | |
| Reset, restore defaults | Restore defaults | Restablecer valores predeterminados | Zurücksetzen | Réinitialiser | |
| Log out | Log out | Cerrar sesión | Abmelden | Se déconnecter | |
| Log in | Log in | Iniciar sesión | Anmelden | Se connecter | |
| Register | Register | Registrarse | Registrieren | S’inscrire | |
| Select (a value) | Select | Seleccionar | Auswählen | Sélectionner | |
| Pick a date | Pick a date | Elegir fecha | Datum wählen | Choisir une date | |

### Time

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Day | Day | Día | Tag | Jour | |
| Week | Week | Semana | Woche | Semaine | |
| Month | Month | Mes | Monat | Mois | |
| Year | Year | Año | Jahr | Année | |
| Period | Period | Periodo | Zeitraum | Période | |
| Previous period | Previous period | Periodo anterior | Vorheriger Zeitraum | Période précédente | |
| Up next | Up next | Próximos | Als Nächstes | À venir | |
| Closing soon | Closing soon | Próximos cierres | Abschluss in Kürze | À conclure prochainement | Deals about to close. de "Bald fällig" is for payments, not deals |
| Months at target | at target in {atTarget} of {count} | objetivo cumplido en {atTarget} de {count} | Ziel in {atTarget} von {count} erreicht | objectif atteint {atTarget} sur {count} | Revenue card summary |
| vs previous month | vs last month | vs. mes anterior | ggü. Vormonat | vs mois précédent | |
| Months (range option) | 6M, 12M | 6 meses, 12 meses | 6 Mon., 12 Mon. | 6 mois, 12 mois | Never "m" or "M" in es, de or fr: "M" reads as millions and "m" as metres |

### States and feedback

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Loading | Loading | Cargando | Wird geladen | Chargement | |
| No results | No results found. | No se encontraron resultados. | Keine Ergebnisse gefunden. | Aucun résultat. | |
| Nothing here yet | Nothing here yet | Aún no hay nada | Noch nichts vorhanden | Rien pour l’instant | Empty state headline |
| Something went wrong | Something went wrong. | Algo ha salido mal. | Etwas ist schiefgelaufen. | Une erreur s’est produite. | Always followed by the error code |
| Try again | Try again | Inténtalo de nuevo | Versuche es erneut | Veuillez réessayer | Register differs by language, see the table at the top |
| Not found | Page not found | Página no encontrada | Seite nicht gefunden | Page introuvable | |
| No permission | You do not have permission | No tienes permiso | Du hast keine Berechtigung | Vous n’avez pas l’autorisation | |
| Required field | Enter a value. | Introduce un valor. | Gib einen Wert ein. | Saisissez une valeur. | |
| Not given | Not given | Sin indicar | Nicht angegeben | Non renseigné | A field the record does not hold |

### Product and platform

| Concept | en | es | de | fr | Note |
| --- | --- | --- | --- | --- | --- |
| Light (theme mode) | Light | Claro | Hell | Clair | |
| Dark (theme mode) | Dark | Oscuro | Dunkel | Sombre | |
| System (theme mode) | System | Sistema | System | Système | |
| Owner (role) | Owner | Propietario | Inhaber | Propriétaire | `src/core/access`; a preset vocabulary may rename it. Not the owner of a deal |
| Manager (role) | Manager | Encargado | Leitung | Responsable | |
| Staff (role) | Staff | Personal | Mitarbeitende | Personnel | |
| Permission | Permission | Permiso | Berechtigung | Autorisation | |
| Vertical preset | Vertical preset | Preset por sector | Branchen-Preset | Préréglage métier | Hospitality, salon, workshop |
| Liquid glass | Liquid glass | liquid glass | Liquid Glass | liquid glass | The design's name, not translated; de capitalises it as a noun |
| Capability | Capability | Capacidad | Fähigkeit | Capacité | What a screen or an MCP tool may call |
| Mock adapter | Mock adapter | Adaptador simulado | Mock-Adapter | Adaptateur fictif | |
| AI assistant | AI assistant | Asistente de IA | KI-Assistent | Assistant IA | |
| Seed data | Seed data | Datos de ejemplo | Beispieldaten | Données d’exemple | |

## What is never translated

Per spec D5: proper nouns (people, companies, emails, brands, product model codes), theme names, font names, and each language's own name in the language picker (`LOCALE_NAMES`). Technical abbreviations that every industry reads the same stay (kW, MW, PDF, GST, ID). Addresses and tax numbers are data.

Demo business content (deal titles, event titles, line-item descriptions, email and chat bodies, notes) is translated, because a real business would write it in its own language.

## Adding a term

1. Look for the concept above. Reuse its row, even if another word seems nicer.
2. If it is new, add one row with all four languages in the same commit as the dictionary change.
3. Have a native speaker of each language review new rows before the slice ships (ADR 0007, Consequences).
