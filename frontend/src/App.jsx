import { useLocation } from "react-router-dom";
import Atmosphere from "./components/Atmosphere.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import PageTransition from "./components/PageTransition.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const location = useLocation();
  // Footer only makes sense on the marketing home page; auth/upload
  // screens are focused, single-task surfaces.
  const showFooter = location.pathname === "/";

  return (
    <div className="app-shell">
      <Atmosphere />
      <Navbar />
      <PageTransition>
        <AppRoutes />
      </PageTransition>
      {showFooter && <Footer />}
    </div>
  );
}
