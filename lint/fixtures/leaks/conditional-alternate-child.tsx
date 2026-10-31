export function Fixture({ name, label, text, locale, count }: Record<string, any>) {
  return (
    <p>{name ? label : "No"}</p>
  );
}
