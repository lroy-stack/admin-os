export function Fixture({ name, label }: Record<string, any>) {
  return (
    <p title={`${name} · ${label}`}>{`${name} · ${label}`}{`→ ${name}`}{`+${label}`}</p>
  );
}
