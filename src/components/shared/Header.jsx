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
    <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]">
      {/* LOGO */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-2 cursor-pointer"
      >
        <img src={logo} className="h-8 w-8 imagen-redonda" alt="restro logo" />
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
          Nativho&apos;s
        </h1>
      </div>

      {/* Actions + Logged user */}
      <div className="flex items-center gap-4">
        {(userData.role === "Admin" || userData.role === "Cashier") && (
          <div
            onClick={() => navigate("/dashboard")}
            className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer"
          >
            <MdDashboard className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        {(userData.role === "Admin" || userData.role === "Cashier") && (
          <div
            onClick={() => navigate("/cash-desk")}
            className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer"
            title="Relación de caja"
          >
            <GiPayMoney className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        {<AlertsBell />}

        <div
          onClick={() => (isAuth ? navigate("/profile") : openLoginModal())}
          className="flex items-center gap-3 cursor-pointer"
        >
          <FaUserCircle className="text-[#f5f5f5] text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
              {isAuth ? userData.name : "Invitado"}
            </h1>
            <p className="text-xs text-[#ababab] font-medium">
              {isAuth ? userData.role : "Sin sesión"}
            </p>
          </div>
          {isAuth && (
            <IoLogOut
              onClick={handleLogout}
              className="text-[#f5f5f5] ml-2"
              size={40}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
