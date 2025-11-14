import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Home,
  Orders,
  Tables,
  Menu,
  Dashboard,
  Cashier,
  Purchases,
  Profile,
  AdminUsers,
  PaymentMethods,
  Inventory,
  Categories,
  Sales,
  DishRank,
  CashDesk,
  Discounts,
  Promotions,
} from "./pages";
import Header from "./components/shared/Header";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import { LoginModalProvider } from "./context/LoginModalContext";
import LoginModal from "./components/auth/LoginModal";

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const hideHeaderRoutes = ["/auth", "/cashier"];
  const { isAuth } = useSelector((state) => state.user);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginDismissed, setLoginDismissed] = useState(false);

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (isAuth) {
      setLoginModalOpen(false);
      setLoginDismissed(false);
      return;
    }
    if (!loginDismissed && isHome) {
      setLoginModalOpen(true);
    }
  }, [isAuth, loginDismissed, isHome]);

  const openLoginModal = useCallback(() => {
    if (isAuth) return;
    setLoginDismissed(false);
    setLoginModalOpen(true);
  }, [isAuth]);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    setLoginDismissed(true);
  }, []);

  const loginContextValue = useMemo(
    () => ({
      openLoginModal,
      closeLoginModal,
    }),
    [openLoginModal, closeLoginModal]
  );

  if (isLoading) return <FullScreenLoader />;

  return (
    <LoginModalProvider value={loginContextValue}>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes allowGuest>
              <Home />
            </ProtectedRoutes>
          }
        />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoutes>
              <Orders />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoutes>
              <Tables />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoutes>
              <Menu />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <Cashier />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <Dashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoutes roles={["Admin"]}>
              <AdminUsers />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <Purchases />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/paymethods"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <PaymentMethods />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <Inventory />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <Sales />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoutes roles={["Admin"]}>
              <Categories />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dishrank"
          element={
            <ProtectedRoutes>
              <DishRank />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/cash-desk"
          element={
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
              <CashDesk />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/descuentos"
          element={
            <ProtectedRoutes roles={["Admin"]}>
              <Discounts />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/promociones"
          element={
            <ProtectedRoutes>
              <Promotions />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoutes>
              <Profile />
            </ProtectedRoutes>
          }
        />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
      <LoginModal open={loginModalOpen && !isAuth} onClose={closeLoginModal} />
    </LoginModalProvider>
  );
}

function ProtectedRoutes({ children, roles, allowGuest }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) {
    if (allowGuest) return children;
    return <Navigate to="/" replace />;
  }
  if (Array.isArray(roles) && roles.length > 0) {
    const ok = roles
      .map(String)
      .map((r) => r.toLowerCase())
      .includes(String(role || "").toLowerCase());
    if (!ok) return <Navigate to="/" />;
  }

  return children;
}

ProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
  allowGuest: PropTypes.bool,
};

ProtectedRoutes.defaultProps = {
  roles: undefined,
  allowGuest: false,
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
