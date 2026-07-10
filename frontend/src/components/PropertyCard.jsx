import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { TbCircleCheckFilled } from "react-icons/tb";
import { HiOutlineHashtag } from "react-icons/hi";
import "./PropertyCard.css";

export default function PropertyCard() {
  const cardRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), {
    stiffness: 150,
    damping: 18,
  });

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      className="property-card-wrap"
      style={{ perspective: 1200 }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        ref={cardRef}
        className="property-card glass-strong"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="property-card__top">
          <span className="property-card__label">Property Record</span>
          <span className="property-card__badge">
            <TbCircleCheckFilled size={14} />
            Verified
          </span>
        </div>

        <div className="property-card__id">
          <HiOutlineHashtag />
          <span>PID&nbsp;&mdash;&nbsp;LC-2984-KB</span>
        </div>

        <div className="property-card__grid">
          <div className="property-card__field">
            <span className="property-card__field-label">Owner</span>
            <span className="property-card__field-value">Aarav Sharma</span>
          </div>
          <div className="property-card__field">
            <span className="property-card__field-label">Location</span>
            <span className="property-card__field-value">Varanasi, UP</span>
          </div>
          <div className="property-card__field">
            <span className="property-card__field-label">Status</span>
            <span className="property-card__field-value property-card__field-value--good">
              Verified on-chain
            </span>
          </div>
          <div className="property-card__field">
            <span className="property-card__field-label">Area</span>
            <span className="property-card__field-value">1,240 sq.ft.</span>
          </div>
        </div>

        <div className="property-card__hash">
          <span className="property-card__field-label">Blockchain Hash</span>
          <code>0x7f9a...e21c4b</code>
        </div>
      </motion.div>
    </motion.div>
  );
}
