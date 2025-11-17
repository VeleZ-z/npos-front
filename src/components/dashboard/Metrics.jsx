import React from "react";
import Greetings from "../home/Greetings";
import RecentOrders from "../home/RecentOrders";
import useTodayStats from "../../hooks/useTodayStats";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatPercentText = (value) => {
  const num = Number(value || 0);
  const formatted = `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
  return `${formatted} que ayer`;
};

const Metrics = () => {
  const { data, isLoading } = useTodayStats();

  const metricsCards = [
    {
      title: "Ganancias",
      value: data ? `$ ${formatCurrency(data.salesToday)}` : "$ 0",
      change: data ? data.salesChangePct : 0,
      color: "#1a1a1a",
    },
    {
      title: "Comandas Activas",
      value: data ? data.activeToday : 0,
      change: data ? data.activeChangePct : 0,
      color: "#1a1a1a",
    },
  ];

  const itemsCards = [
    {
      title: "Total Categorías",
      value: data?.counts?.categories ?? 0,
      color: "#5b45b0",
    },
    {
      title: "Total Productos",
      value: data?.counts?.products ?? 0,
      color: "#285430",
    },
    {
      title: "Comandas Activas",
      value: data?.activeToday ?? 0,
      color: "#735f32",
    },
    {
      title: "Total Mesas",
      value: data?.counts?.tables ?? 0,
      color: "#7f167f",
    },
  ];

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      {/* Resumen similar al Home */}
      <div className="flex-[3]">
        <Greetings />
        
        <RecentOrders />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Rendimiento General
          </h2>
          <p className="text-sm text-[#ababab]">
            Metricas de rendimiento general del punto de venta Nativhos
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsCards.map((metric, index) => (
          <div
            key={metric.title}
            className="shadow-sm rounded-lg p-4 bg-[#1a1a1a]"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>
                <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                  {isLoading ? "..." : metric.value}
                </p>
              </div>
            </div>
            <p
              className={`mt-2 text-xs font-medium ${
                Number(metric.change || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {isLoading ? "Calculando..." : formatPercentText(metric.change)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-between mt-12">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Item Details
          </h2>
          <p className="text-sm text-[#ababab]">
            detalles acerca de los items importantes del punto de venta Nativhos
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {itemsCards.map((item) => (
            <div
              key={item.title}
              className="shadow-sm rounded-lg p-4"
              style={{ backgroundColor: item.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {item.title}
                </p>
              </div>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                {isLoading ? "..." : item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
