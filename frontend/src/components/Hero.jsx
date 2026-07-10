import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { gsap } from "gsap";
import PropertyCard from "./PropertyCard.jsx";
import "./Hero.css";

export default function Hero() {
  const titleRef = useRef(null);

  useEffect(() => {
    if (!titleRef.current) return;
    const lines = titleRef.current.querySelectorAll(".hero__line");
    gsap.fromTo(
      lines,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power3.out", delay: 0.15 }
    );
  }, []);

  return (
    <section className="hero section" id="hero">
      <div className="container hero__grid">
        <div className="hero__left">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Secure Land Ownership
          </motion.span>

          <h1 className="hero__title" ref={titleRef}>
            <span className="hero__line">Secure Land</span>
            <span className="hero__line">Ownership</span>
            <span className="hero__line hero__line--accent">Powered by Blockchain</span>
          </h1>

          <motion.p
            className="hero__paragraph"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            LANDCHAIN gives every property record a permanent, tamper-proof
            home on the blockchain &mdash; verifiable in seconds, transferable
            without paperwork, and impossible to forge.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <Link to="/signup" className="btn btn-primary">
              Register Property <HiArrowRight />
            </Link>
            <a href="#registry" className="btn btn-secondary">
              Explore Registry
            </a>
          </motion.div>
        </div>

        <div className="hero__right">
          <PropertyCard />
        </div>
      </div>
    </section>
  );
}
