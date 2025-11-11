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
    <section className="bg-[#1f1f1f] min-h-screen grid grid-cols-4 gap-3 pb-20">
      {/* Left Div - ocupa 3/4 */}
      <div className="col-span-3 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Menu
            </h1>
          </div>
          <div className="flex items-center gap-3 cursor-pointer">
            <MdRestaurantMenu className="text-[#f5f5f5] text-3xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
                {customerData.customerName || "Customer Name"}
              </h1>
              <p className="text-xs text-[#ababab] font-medium">
                Table : {customerData.table?.tableNo || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <MenuContainer />
      </div>

      {/* Right Div - ocupa 1/4 */}
      <div className="col-span-1 bg-[#1a1a1a] rounded-lg p-4 flex flex-col gap-3">
        <CustomerInfo />
        <hr className="border-[#2a2a2a]" />
        <CartInfo />
        <hr className="border-[#2a2a2a]" />
        <Bill />
      </div>

      <BottomNav />
    </section>
  );
};

export default Menu;
