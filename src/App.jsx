import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import {
  Home,
  Auth,
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

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const hideHeaderRoutes = ["/auth", "/cashier"];
  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Home />
            </ProtectedRoutes>
          }
        />
        <Route path="/auth" element={isAuth ? <Navigate to="/" /> : <Auth />} />
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
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
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
            <ProtectedRoutes roles={["Admin", "Cashier"]}>
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
    </>
  );
}

function ProtectedRoutes({ children, roles }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" />;
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
};

ProtectedRoutes.defaultProps = {
  roles: undefined,
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
