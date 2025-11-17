import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdTableBar, MdCategory, MdOutlineReorder } from "react-icons/md";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Modal from "../components/dashboard/Modal";
import CategoryModal from "../components/dashboard/CategoryModal";
// import DishModal from "../components/dashboard/DishModal";
import MiniCard from "../components/home/MiniCard";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import Providers from "../components/dashboard/Providers";
import useTodayStats from "../hooks/useTodayStats";

const buttons = [
  { label: "Añadir Mesa", icon: <MdTableBar />, action: "table" },
  { label: "Categorias", icon: <MdCategory />, action: "categories" },
  { label: "Compras", icon: <MdOutlineReorder />, action: "purchases" },
];

const tabs = ["Metrics", "Pidiendo", "Facturacion", "Proveedores"];

const Dashboard = () => {
  useEffect(() => {
    document.title = "NPOS | Admin Dashboard";
  }, []);

  const navigate = useNavigate();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Metrics");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  /* moved add-product into Inventory */
  const { role } = useSelector((state) => state.user);
  const { data: todayStats, isLoading: statsLoading } = useTodayStats();

  const handleOpenModal = (action) => {
    if (action === "table") setIsTableModalOpen(true);
    if (action === "categories") navigate("/categories");
    if (action === "purchases") navigate("/purchases");
  };

  return (
    <div className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-y-auto pb-10 px-3 sm:px-4 md:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-8">
        <div className="flex items-center gap-3">
          {(role === "Admin" ? buttons : []).map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
              >
                {label} {icon}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`
                px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-[#262626]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 sm:px-0">
        {activeTab === "Metrics" && <Metrics />}
        {activeTab === "Pidiendo" && <RecentOrders />}
        {activeTab === "Proveedores" && <Providers />}
        {activeTab === "Facturacion" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <MiniCard
              title="Ganancias"
              icon={<BsCashCoin />}
              number={todayStats?.salesToday ?? 0}
              change={todayStats?.salesChangePct ?? 0}
              isCurrency
              isLoading={statsLoading}
            />
            <MiniCard
              title="Comandas Activas"
              icon={<GrInProgress />}
              number={todayStats?.activeToday ?? 0}
              change={todayStats?.activeChangePct ?? 0}
              isLoading={statsLoading}
            />
          </div>
        )}
      </div>

      {isTableModalOpen && <Modal setIsTableModalOpen={setIsTableModalOpen} />}
      {isCategoryModalOpen && <CategoryModal onClose={() => setIsCategoryModalOpen(false)} />}
      {/* add product modal moved into Inventory */}
    </div>
  );
};

export default Dashboard;











