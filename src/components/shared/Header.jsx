import { FaUserCircle } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import { GiPayMoney } from "react-icons/gi";
import AlertsBell from "./AlertsBell";
import { useLoginModal } from "../../context/LoginModalContext";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openLoginModal } = useLoginModal();
  const isAuth = Boolean(userData?.isAuth);
  const firstName = isAuth
    ? (userData.name || "").split(" ")[0] || userData.name
    : "Invitado";

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      try {
        localStorage.removeItem("token");
      } catch { /* empty */ }
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="w-full bg-[#1a1a1a] px-4 sm:px-6 md:px-8 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* LOGO */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            src={logo}
            className="h-8 w-8 imagen-redonda flex-shrink-0"
            alt="restro logo"
          />
          <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
            Nativho&apos;s
          </h1>
        </div>

        {/* Actions + Logged user */}
        <div className="flex items-center gap-2 sm:gap-4">
          {(userData.role === "Admin" || userData.role === "Cashier") && (
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#1f1f1f] rounded-[15px] p-3 flex items-center justify-center hover:bg-[#262626] transition"
            >
              <MdDashboard className="text-[#f5f5f5] text-xl sm:text-2xl" />
            </button>
          )}
          {(userData.role === "Admin" || userData.role === "Cashier") && (
            <button
              onClick={() => navigate("/cash-desk")}
              className="bg-[#1f1f1f] rounded-[15px] p-3 flex items-center justify-center hover:bg-[#262626] transition"
              title="Relación de caja"
            >
              <GiPayMoney className="text-[#f5f5f5] text-xl sm:text-2xl" />
            </button>
          )}
          <AlertsBell />

          <div
            onClick={() => (isAuth ? navigate("/profile") : openLoginModal())}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer rounded-xl bg-[#1f1f1f] px-2 sm:px-3 py-2"
          >
            <FaUserCircle className="text-[#f5f5f5] text-3xl sm:text-4xl" />
            <div className="flex flex-col items-start min-w-0">
              <h1 className="text-sm sm:text-md text-[#f5f5f5] font-semibold tracking-wide truncate max-w-[120px] sm:max-w-[160px]">
                {firstName}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#ababab] font-medium truncate max-w-[120px] sm:max-w-[160px]">
                {isAuth ? userData.role : "Sin sesión"}
              </p>
            </div>
            {isAuth && (
              <IoLogOut
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="text-[#f5f5f5] ml-1 sm:ml-2"
                size={26}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
