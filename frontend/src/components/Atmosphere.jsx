// Ambient background: flat canvas colour + a dot-mesh grid. Deliberately
// no gradients, no blur, no glow — matches the flat, thick-border,
// hard-shadow visual language used throughout the app.
export default function Atmosphere() {
  return (
    <>
      <div className="bg-atmosphere" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
    </>
  );
}
