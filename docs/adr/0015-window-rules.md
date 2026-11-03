# ADR 0015 — The window is chosen by the job, from one shared kit

Status: accepted · Date: 2026-11-03 · Related: ADR 0003, 0005, 0007, 0008

## Context

- **Calls to action with no window.** An audit of the demo found 137 controls that do nothing or only change
  component state: among them Walk-in and New reservation on the bookings screen, the account menu, and the "New",
  row-menu and export buttons of the showcase screens.
- **Destructive actions in one tap.** Cancel a reservation, mark a no-show, reset the room, and delete a table, a zone
  or a landmark run at once, with no confirmation and no undo.
- **Every screen picks its own container.** The bookings drawer decides between a side and a bottom Drawer with
  `useIsMobile`, which is `false` before hydration; other screens use Sheet, Drawer or Popover with no shared rule. No
  confirmation, form scaffold, undo or unsaved-changes guard is shared.
- **Sources consulted:**
  - Nielsen Norman Group, [Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/): modals
    for important warnings and for information a started process cannot continue without; avoid them when the
    decision needs information outside the modal; consider nonmodal windows when the task is not critical or needs
    switching between views.
  - Primer, [Dialog guidelines](https://primer.style/product/components/dialog/guidelines): dialogs for transient
    tasks; side sheets for global actions and quick previews, "Don't use side sheets to present create/edit forms";
    dialogs with inputs go full screen on narrow viewports; at most two nested dialogs.
  - Material Design, [bottom sheets](https://material.io/components/sheets-bottom): bottom sheets replace menus and
    simple dialogs on mobile; side sheets take over on large screens.

## Decision

The window is chosen by the job, never by the screen, from one kit in `src/ds/overlays`, `src/ds/feedback` and
`src/ds/forms`:

| Job | Window | From 768 px | Below 768 px |
| --- | --- | --- | --- |
| Confirm an irreversible or destructive action | `ConfirmAction` | Centered alert dialog, Cancel focused | Centered |
| A short task, one decision, up to four fields | `QuickDialog` | Centered dialog, at most 480 px wide | Bottom sheet |
| Create or edit a record that needs nothing from the page | `FormDialog` | Centered dialog, at most 640 px | Full-screen sheet |
| Create or edit while the page stays in use (pick a table on the floor) | `DockedPanel`, nonmodal | Right column from 1024 px; the page stays usable | Full-screen sheet |
| Look at a record and act on it | `RecordPanel`, on `ResponsivePanel` | Column from 1024 px | Pushed full screen |
| Pick a value, filter, small settings, notifications | `PopoverOrSheet` | Popover | Bottom sheet |
| A task in several steps | A page with the step in the URL | Page | Page |

Rules for every window:

- At most two windows deep: a window and a `ConfirmAction` above it.
- Escape closes the top window, and focus returns to the control that opened it.
- Nothing modal before hydration: the server HTML holds no open window, and a viewport-dependent window waits for the
  client.
- A window with unsaved changes ignores the backdrop click and asks before it closes.
- Unsaved changes also guard leaving the page (`useGuardedExit`, `useGuardedLink`, `askBeforeLeaving` in
  `src/ds/feedback`): a `next/link` click through `onNavigate` (the shell links and the search dialog included), Back
  and Forward, and a reload or tab close (the browser's own prompt). Back and Forward are answered with a history
  entry the guard pushes while something is dirty, recognised by the Navigation API's entry key where it exists
  (the router's `replaceState` drops any marker in the state) and by a marker otherwise. The Navigation API's
  `navigate` event is not the mechanism: a `traverse` navigation is cancelable only for a same-document destination
  in a top-level page and, from the browser's Back button, only with history-action activation (WHATWG HTML, "inner
  navigate event firing algorithm", steps 8 and 9), and Chrome's guidance is that Back and Forward cannot be
  cancelled (developer.chrome.com/docs/web-platform/navigation-api). A guard that works only sometimes is not one.
  When the page stops being dirty on its own page the guard takes its entry off again; elsewhere one extra Back press
  lands on the same page.
- The title names the action ("Seat walk-in"); the primary button repeats the verb.
- A destructive capability (`effect: "destructive"`) runs only from `ConfirmAction`; a reversible action offers undo
  instead of asking first.
- A product window writes through one capability (ADR 0005); a showcase screen's window keeps demo-local state and
  says so in its footer.
- A control with no destination is removed, not left dead.

## Consequences

- New screens and modules add flows without new container code, and a reviewer can check a window against one table.
- Create and edit forms move off side sheets. The `ResponsivePanel` side sheet stays the base of the record panel and
  of the docked panel, where the page context matters.
- The bookings screen gains a nonmodal panel, which needs care for accessibility: a labelled region, focus moved in on
  open and back on close, Escape to close, and a modal sheet on phones.
- An e2e detector of dead controls measures the remaining gaps and, once they reach zero, fails the build on a new
  one.

## Alternatives considered

- **Side sheets for every create and edit form.** Familiar from many admin templates, but it hides the page behind a
  backdrop without using the extra height, and Primer advises against it for forms.
- **A modal for New reservation.** Simpler, but the host needs the floor to choose a table while taking the booking;
  NN/g advises against modals when the decision needs information outside them.
- **Leave each screen to choose.** The current state, and the cause of the inconsistency above.
