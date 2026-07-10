import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HiOutlineMenu } from "react-icons/hi";
import { TbShieldLock } from "react-icons/tb";
import { HiOutlineUserCircle } from "react-icons/hi2";
import ToggleMenu from "./ToggleMenu.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useWallet } from "../context/WalletContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatAddress } from "../lib/wallet.js";
import "./Navbar.css";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Registry", to: "/#registry" },
  { label: "Upload Documents", to: "/upload" },
  { label: "About", to: "/#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { address, connecting, connect, hasWallet } = useWallet();
  const { user } = useAuth();
  const logoRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subtle GSAP entrance for the logo mark on first mount.
  useEffect(() => {
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.1 }
    );
  }, []);

  async function handleConnect() {
    if (!hasWallet) {
      window.open("https://metamask.io/download/", "_blank", "noopener");
      return;
    }
    try {
      await connect();
    } catch {
      // Surfaced via wallet context's `error`; nothing else to do here.
    }
  }

  return (
    <>
      <header className={`navbar ${scrolled ? "navbar--shrunk" : ""}`}>
        <Link to="/" className="navbar__logo" aria-label="LANDCHAIN home" ref={logoRef}>
          <TbShieldLock className="navbar__logo-icon" aria-hidden="true" />
          <span>LANDCHAIN</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="navbar__link"
              end={link.to === "/"}
            >
              {link.label}
              <span className="navbar__underline" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <ThemeToggle />

          {user && (
            <Link to="/account" className="navbar__account" aria-label="Your account">
              <HiOutlineUserCircle size={22} />
            </Link>
          )}

          <motion.button
            className={`btn navbar__connect ${address ? "btn-secondary" : "btn-primary"}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConnect}
            disabled={connecting}
          >
            {address ? formatAddress(address) : connecting ? "Connecting..." : "Connect Wallet"}
          </motion.button>

          <motion.button
            className="navbar__hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            <HiOutlineMenu size={20} />
          </motion.button>
        </div>
      </header>

      <ToggleMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
