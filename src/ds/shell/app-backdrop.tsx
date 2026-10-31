/** Blurred scene behind the glass surfaces. Both layers come from preset tokens and are no-ops outside the glass preset. */
export function AppBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -inset-24 bg-(image:--app-backdrop) bg-cover bg-center blur-3xl" />
      <div className="absolute inset-0 bg-(--app-backdrop-overlay)" />
    </div>
  );
}
