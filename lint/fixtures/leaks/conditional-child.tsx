export function Fixture({ name, label, text, locale, count }: Record<string, any>) {
  return (
    <p>{name ? "Yes" : "No"}</p>
  );
}
