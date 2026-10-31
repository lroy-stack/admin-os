export function Fixture({ name, label, text, locale, count }: Record<string, any>) {
  return (
    <Thing label={name ? label : "No"} />
  );
}
