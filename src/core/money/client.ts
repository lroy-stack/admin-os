// Client entry of core/money: the currency list without zod. Client components import this, not the barrel.
export { CURRENCIES, CURRENCY_COOKIE, type Currency, currencyOfRegion, isCurrency, majorUnits } from "./currency";
