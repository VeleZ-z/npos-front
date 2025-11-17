import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const useHideBottomNav = (shouldHide) => {
  const location = useLocation();
  const { role } = useSelector((state) => state.user);
  const roleLower = String(role || "").toLowerCase();
  const isStaff = roleLower === "admin" || roleLower === "cashier";

  useEffect(() => {
    // Esconder solo para clientes/invitados; staff mantiene la barra
    if (isStaff) return;
    const nav = document.getElementById("bottom-nav");
    if (!nav) return;
    if (shouldHide(location.pathname)) {
      nav.style.display = "none";
    } else {
      nav.style.display = "";
    }
    return () => {
      nav.style.display = "";
    };
  }, [location.pathname, shouldHide, isStaff]);
};

export default useHideBottomNav;
