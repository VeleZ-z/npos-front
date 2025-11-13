import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";

const Menu = () => {
  useEffect(() => {
    document.title = "NPOS | Menu";
  }, []);

  const customerData = useSelector((state) => state.customer);

  return (
    <section className="bg-[#1f1f1f] min-h-screen pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#ababab]">
                Menu
              </p>
              <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
                Selecciona tus productos
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#1a1a1a] px-4 py-3 w-full max-w-sm lg:max-w-none">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2a2a2a]">
              <MdRestaurantMenu className="text-[#f5f5f5] text-2xl" />
            </div>
            <div className="flex flex-col items-start text-left">
              <h1 className="text-sm sm:text-base text-[#f5f5f5] font-semibold tracking-wide truncate w-full">
                {customerData.customerName || "Cliente"}
              </h1>
              <p className="text-xs text-[#ababab] font-medium">
                Mesa: {customerData.table?.tableNo || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6 min-w-0">
            <MenuContainer />
          </div>
          <div className="bg-[#1a1a1a] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 h-fit sticky top-6">
            <CustomerInfo />
            <hr className="border-[#2a2a2a]" />
            <CartInfo />
            <hr className="border-[#2a2a2a]" />
            <Bill />
          </div>
        </div>
      </div>
      <BottomNav />
    </section>
  );
};

export default Menu;
