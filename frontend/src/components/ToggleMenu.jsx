import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineX } from "react-icons/hi";
import { useAuth } from "../context/AuthContext.jsx";
import "./ToggleMenu.css";

const panelVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] },
  },
};

const listVariants = {
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function ToggleMenu({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    { label: "Home", to: "/" },
    ...(user
      ? [{ label: "Account", to: "/account" }]
      : [
          { label: "Login", to: "/login" },
          { label: "Signup", to: "/signup" },
        ]),
    { label: "Upload Documents", to: "/upload" },
    { label: "Contact", to: "/#contact" },
  ];

  function handleLogout() {
    logout();
    onClose();
    navigate("/");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="toggle-menu__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            className="toggle-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button className="toggle-menu__close" onClick={onClose} aria-label="Close menu">
              <HiOutlineX size={22} />
            </button>

            <motion.nav
              className="toggle-menu__links"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {items.map((item) => (
                <motion.div key={item.label} variants={itemVariants}>
                  <Link to={item.to} className="toggle-menu__link" onClick={onClose}>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {user && (
                <motion.div variants={itemVariants}>
                  <button className="toggle-menu__link toggle-menu__logout" onClick={handleLogout}>
                    Log Out
                  </button>
                </motion.div>
              )}
            </motion.nav>

            <div className="toggle-menu__footer">
              <p>LANDCHAIN &mdash; Secure Land Ownership</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
