import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch, useSelector } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { BsCashCoin } from "react-icons/bs";
import { useLoginModal } from "../../context/LoginModalContext";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const { role, isAuth } = useSelector((state) => state.user);
  const isStaff = role === "Admin" || role === "Cashier";
  const { openLoginModal } = useLoginModal?.() || {};

  const openModal = () => {
    // Prefill for customers with their profile data if present
    try {
      if ((user?.role || "").toLowerCase() === "customer") {
        setName(user?.name || "");
        // if user.phone is null/undefined, keep empty so placeholder is shown
        setPhone(user?.phone ? String(user.phone) : "");
      }
    } catch {
      console.error();
    }
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleFabClick = () => {
    if (isStaff) {
      navigate("/sales");
      return;
    }
    openModal();
  };

  const increment = () => {
    if (guestCount >= 6) return;
    setGuestCount((prev) => prev + 1);
  };
  const decrement = () => {
    if (guestCount <= 0) return;
    setGuestCount((prev) => prev - 1);
  };

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    // send the data to store
    dispatch(setCustomer({ name, phone, guests: guestCount }));
    navigate("/tables");
  };

  return (
    <div
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around"
    >
      {(() => {
        if (isStaff) {
          return (
            <>
              <button
                onClick={() => navigate("/")}
                className={`flex items-center justify-center font-bold ${
                  isActive("/")
                    ? "text-[#f5f5f5] bg-[#343434]"
                    : "text-[#ababab]"
                } w-[300px] rounded-[20px]`}
              >
                <FaHome className="inline mr-2" size={20} /> <p>Home</p>
              </button>
              <button
                onClick={() => navigate("/inventory")}
                className={`flex items-center justify-center font-bold ${
                  isActive("/inventory")
                    ? "text-[#f5f5f5] bg-[#343434]"
                    : "text-[#ababab]"
                } w-[300px] rounded-[20px]`}
              >
                <BiSolidDish className="inline mr-2" size={20} />{" "}
                <p>Inventario</p>
              </button>
              <button
                onClick={() => {
                  if (!isAuth) {
                    openLoginModal?.();
                    return;
                  }
                  navigate(role === "Admin" ? "/descuentos" : "/promociones");
                }}
                className={`flex items-center justify-center font-bold ${
                  isActive("/descuentos") || isActive("/promociones")
                    ? "text-[#f5f5f5] bg-[#343434]"
                    : "text-[#ababab]"
                } w-[300px] rounded-[20px]`}
              >
                <BsCashCoin className="inline mr-2" size={20} />{" "}
                <p>Promociones</p>
              </button>
              <button
                onClick={() => setMoreOpen(true)}
                className="flex items-center justify-center font-bold text-[#ababab] w-[300px]"
              >
                <CiCircleMore className="inline mr-2" size={20} /> <p>Mas</p>
              </button>

              <button
                disabled={isActive("/tables") || isActive("/menu")}
                onClick={handleFabClick}
                className="absolute bottom-6 bg-[#F6B100] text-[#f5f5f5] rounded-full p-4 items-center"
              >
                <BiSolidDish size={40} />
              </button>

              {/* More menu */}
              <Modal
                isOpen={moreOpen}
                onClose={() => setMoreOpen(false)}
                title="Mas"
              >
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setMoreOpen(false);
                    }}
                    className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                  >
                    Mi Perfil
                  </button>
                  {role === "Admin" && (
                    <button
                      onClick={() => {
                        navigate("/admin/users");
                        setMoreOpen(false);
                      }}
                      className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                    >
                      Administrar Usuarios
                    </button>
                  )}
                  {(role === "Admin" || role === "Cashier") && (
                    <button
                      onClick={() => {
                        navigate("/paymethods");
                        setMoreOpen(false);
                      }}
                      className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                    >
                      Metodos de Pago
                    </button>
                  )}
                  {/* Inventory access moved to Dashboard */}
                </div>
              </Modal>
            </>
          );
        }
        return (
          <>
            <button
              onClick={() => navigate("/")}
              className={`flex items-center justify-center font-bold ${
                isActive("/") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
              } w-[300px] rounded-[20px]`}
            >
              <FaHome className="inline mr-2" size={20} /> <p>Home</p>
            </button>
            <button
              onClick={() => {
                if (!isAuth) {
                  openLoginModal?.();
                  return;
                }
                navigate("/orders");
              }}
              className={`flex items-center justify-center font-bold ${
                isActive("/ordenes")
                  ? "text-[#f5f5f5] bg-[#343434]"
                  : "text-[#ababab]"
              } w-[300px] rounded-[20px]`}
            >
              <MdOutlineReorder className="inline mr-2" size={20} />{" "}
              <p>Ordenes</p>
            </button>
            <button
              onClick={() => {
                if (!isAuth) {
                  openLoginModal?.();
                  return;
                }
                navigate("/promociones");
              }}
              className={`flex items-center justify-center font-bold ${
                isActive("/promociones")
                  ? "text-[#f5f5f5] bg-[#343434]"
                  : "text-[#ababab]"
              } w-[300px] rounded-[20px]`}
            >
              <BsCashCoin className="inline mr-2" size={20} />{" "}
              <p>Promociones</p>
            </button>
            <button
              onClick={() => setMoreOpen(true)}
              className="flex items-center justify-center font-bold text-[#ababab] w-[300px]"
            >
              <CiCircleMore className="inline mr-2" size={20} /> <p>Mas</p>
            </button>

            <button
              disabled={isActive("/tables") || isActive("/menu")}
              onClick={openModal}
              className="absolute bottom-6 bg-[#F6B100] text-[#f5f5f5] rounded-full p-4 items-center"
            >
              <BiSolidDish size={40} />
            </button>

            <Modal
              isOpen={isModalOpen}
              onClose={closeModal}
              title="Create Order"
            >
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Nombre del Cliente
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    name=""
                    placeholder="Introducir Nombre del Cliente"
                    id=""
                    className="bg-transparent flex-1 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
                  Numero de Telefono
                </label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="number"
                    name=""
                    placeholder="+57-3333333333"
                    id=""
                    className="bg-transparent flex-1 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">
                  comensales
                </label>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
                  <button
                    onClick={decrement}
                    className="text-yellow-500 text-2xl"
                  >
                    &minus;
                  </button>
                  <span className="text-white">{guestCount} Personas</span>
                  <button
                    onClick={increment}
                    className="text-yellow-500 text-2xl"
                  >
                    &#43;
                  </button>
                </div>
              </div>
              <button
                onClick={handleCreateOrder}
                className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700"
              >
                Crear Orden
              </button>
            </Modal>

            {/* More menu (Customer) */}
            <Modal
              isOpen={moreOpen}
              onClose={() => setMoreOpen(false)}
              title="Mas"
            >
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    window.open(
                      "https://www.instagram.com/nativhos_quibdo",
                      "_blank",
                      "noopener,noreferrer"
                    );
                    setMoreOpen(false);
                  }}
                  className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                >
                  Instagram
                </button>
                <button
                  onClick={() => {
                    window.open(
                      "https://facebook.com/nativhos_quibdo",
                      "_blank",
                      "noopener,noreferrer"
                    );
                    setMoreOpen(false);
                  }}
                  className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                >
                  Facebook
                </button>
                <button
                  onClick={() => {
                    window.open(
                      "https://wa.me/573233800506",
                      "_blank",
                      "noopener,noreferrer"
                    );
                    setMoreOpen(false);
                  }}
                  className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    window.open(
                      "https://tiktok.com/@nativhos_quibdo",
                      "_blank",
                      "noopener,noreferrer"
                    );
                    setMoreOpen(false);
                  }}
                  className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded px-4 py-2 text-left"
                >
                  TikTok
                </button>
              </div>
            </Modal>
          </>
        );
      })()}
    </div>
  );
};

export default BottomNav;

