import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const useHideBottomNav = (shouldHide) => {
  const location = useLocation();
  const { role } = useSelector((state) => state.user);
  const isCustomer = String(role || "").toLowerCase() === "customer";

  useEffect(() => {
    if (!isCustomer) return;
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
  }, [location.pathname, shouldHide, isCustomer]);
};

export default useHideBottomNav;
