export function Fixture({ name, label, text, locale, count }: Record<string, any>) {
  return (
    <p>{format(text.count, locale, { count })}</p>
  );
}
