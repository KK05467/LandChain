import { useRef } from "react";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { gsap } from "gsap";
import { useTheme } from "../context/ThemeContext.jsx";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();
  const iconRef = useRef(null);
  const btnRef = useRef(null);

  function handleClick() {
    // Icon spins out, theme flips, new icon spins in.
    gsap
      .timeline()
      .to(iconRef.current, {
        rotate: 90,
        opacity: 0,
        scale: 0.4,
        duration: 0.22,
        ease: "power2.in",
        onComplete: toggleTheme,
      })
      .set(iconRef.current, { rotate: -90 })
      .to(iconRef.current, {
        rotate: 0,
        opacity: 1,
        scale: 1,
        duration: 0.32,
        ease: "back.out(2.4)",
      });

    gsap.fromTo(
      btnRef.current,
      { boxShadow: "0 0 0 0 var(--accent-glow)" },
      { boxShadow: "0 0 0 10px transparent", duration: 0.6, ease: "power2.out" }
    );
  }

  return (
    <button
      ref={btnRef}
      className="theme-toggle"
      onClick={handleClick}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span ref={iconRef} className="theme-toggle__icon">
        {theme === "dark" ? <HiOutlineMoon size={18} /> : <HiOutlineSun size={18} />}
      </span>
    </button>
  );
}
