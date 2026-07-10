import { TbLockSquareRounded, TbBoltFilled, TbEyeCheck } from "react-icons/tb";
import FeatureCard from "./FeatureCard.jsx";
import "./Features.css";

const FEATURES = [
  {
    icon: <TbLockSquareRounded />,
    title: "Tamper Proof",
    description:
      "Every record is written to an immutable ledger. Once verified, ownership history can be viewed but never rewritten.",
  },
  {
    icon: <TbBoltFilled />,
    title: "Instant Verification",
    description:
      "Confirm ownership, boundaries, and transaction history in seconds instead of weeks &mdash; no office visits required.",
  },
  {
    icon: <TbEyeCheck />,
    title: "Transparent Ownership",
    description:
      "Every transfer is publicly auditable end-to-end, closing the door on duplicate titles and fraudulent claims.",
  },
];

export default function Features() {
  return (
    <section className="features section" id="registry">
      <div className="container">
        <div className="features__header">
          <span className="eyebrow">Why LANDCHAIN</span>
          <h2 className="features__title">Built for records that must never be wrong</h2>
        </div>

        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
