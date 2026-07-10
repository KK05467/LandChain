import { Link } from "react-router-dom";
import { TbShieldLock } from "react-icons/tb";
import { FiTwitter, FiGithub, FiLinkedin } from "react-icons/fi";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <div className="footer__logo">
            <TbShieldLock className="navbar__logo-icon" />
            <span>LANDCHAIN</span>
          </div>
          <p className="footer__tagline">
            Secure land ownership, verified on-chain, transferable without paperwork.
          </p>
          <div className="footer__socials">
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="GitHub"><FiGithub /></a>
            <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
          </div>
        </div>

        <div className="footer__col">
          <h4>Product</h4>
          <Link to="/">Home</Link>
          <a href="/#registry">Registry</a>
          <Link to="/upload">Upload Documents</Link>
        </div>

        <div className="footer__col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </div>

        <div className="footer__col">
          <h4>Company</h4>
          <a href="/#about">About</a>
          <a href="#contact" id="contact">Contact</a>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>&copy; {new Date().getFullYear()} LANDCHAIN. All rights reserved.</p>
        <p>Government-grade reliability &mdash; built on trust.</p>
      </div>
    </footer>
  );
}
