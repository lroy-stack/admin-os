import type { LucideIcon } from "lucide-react";

/** A link in the top navbar or the quick-access rail. */
export type ShellNavItem = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly icon?: LucideIcon;
};

/** Product mark shown at the left of the top navbar. */
export type ShellBrand = {
  readonly name: string;
  readonly href: string;
};

/** An account the user can switch to from the avatar menu. */
export type ShellAccount = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
  readonly role: string;
};

export type ShellSearchItem = {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly icon?: LucideIcon;
  readonly disabled?: boolean;
  readonly newTab?: boolean;
  /** Listed while the search box is empty. All items are searched once the user types. */
  readonly suggested?: boolean;
};

export type ShellSearchGroup = {
  /** Stable key the app translates the label with. */
  readonly id: string;
  readonly label: string;
  readonly items: readonly ShellSearchItem[];
};

/** One choice of a demo switch. */
export type ShellChoice = {
  readonly id: string;
  readonly label: string;
};

/** A demo switch: the app owns the choices and what selecting one does (a Server Action in practice). */
export type ShellSwitch = {
  readonly value: string;
  readonly options: readonly ShellChoice[];
  readonly onSelect: (id: string) => Promise<void>;
};

/** The demo switches of the account menu (ADR 0006): act as a role, view another preset, restore the demo data. */
export type ShellDemo = {
  readonly role: ShellSwitch;
  readonly preset: ShellSwitch;
  readonly onReset: () => Promise<void>;
};
