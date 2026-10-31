export function Fixture({ name, text }: Record<string, any>) {
  return (
    <p>{name ? text.symbol : "%"}</p>
  );
}
