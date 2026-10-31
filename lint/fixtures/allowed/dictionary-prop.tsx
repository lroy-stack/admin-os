export function Fixture({ name, label, text, locale, count }: Record<string, any>) {
  return (
    <button aria-label={text.close} />
  );
}
