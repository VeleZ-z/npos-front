import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack"

const STATUS_FILTERS = [
  { id: "all", label: "Todas" },
  { id: "progress", label: "En proceso" },
  { id: "ready", label: "Listas" },
  { id: "completed", label: "Completadas" },
];

const DATE_FILTERS = [
  { id: "all", label: "Todo el tiempo" },
  { id: "30", label: "Últimos 30 días" },
  { id: "7", label: "Últimos 7 días" },
  { id: "custom", label: "Personalizado" },
];

const Orders = () => {

  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("30");
  const [customDates, setCustomDates] = useState({ from: "", to: "" });

    useEffect(() => {
      document.title = "NPOS | Orders"
    }, [])

  const { role, isAuth } = useSelector((state) => state.user);
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
    enabled: isAuth,
  })

  if(isError) {
    enqueueSnackbar("Something went wrong!", {variant: "error"})
  }

  const orders = useMemo(() => {
    const raw = resData?.data?.data ?? [];
    if (!Array.isArray(raw)) return [];
    const withItems = raw.filter((order) => (order?.items?.length || 0) > 0);

    const now = new Date();
    let fromDate = null;
    let toDate = null;
    if (range === "custom") {
      if (customDates.from) {
        fromDate = new Date(customDates.from);
        fromDate.setHours(0, 0, 0, 0);
      }
      if (customDates.to) {
        toDate = new Date(customDates.to);
        toDate.setHours(23, 59, 59, 999);
      }
    } else if (range !== "all") {
      const days = Number(range);
      if (Number.isFinite(days) && days > 0) {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        fromDate.setHours(0, 0, 0, 0);
        toDate = now;
      }
    }

    return withItems.filter((order) => {
      const st = String(order?.orderStatus || "").toUpperCase();
      switch (status) {
        case "progress":
          if (!(st === "POR_APROBAR" || st === "PENDIENTE" || st === "IN_PROGRESS"))
            return false;
          break;
        case "ready":
          if (st !== "LISTO") return false;
          break;
        case "completed":
          if (st !== "ENTREGADO" && st !== "PAGADO") return false;
          break;
        default:
          break;
      }

      const orderDate = order?.orderDate ? new Date(order.orderDate) : null;
      if (!orderDate || Number.isNaN(orderDate.getTime())) return false;
      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > toDate) return false;
      return true;
    });
  }, [resData, status, range, customDates]);

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex flex-col gap-6 px-6 md:px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Orders
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatus(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                status === filter.id
                  ? "bg-[#2F974D] text-[#1f1f1f]"
                  : "bg-[#2b2b2b] text-[#f5f5f5]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setRange(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                range === filter.id
                  ? "bg-[#2F974D] text-[#1f1f1f]"
                  : "bg-[#2b2b2b] text-[#f5f5f5]"
              }`}
            >
              {filter.label}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex flex-wrap gap-3 text-sm text-[#f5f5f5]">
              <label className="flex items-center gap-2">
                Desde:
                <input
                  type="date"
                  value={customDates.from}
                  onChange={(e) =>
                    setCustomDates((prev) => ({ ...prev, from: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-2">
                Hasta:
                <input
                  type="date"
                  value={customDates.to}
                  onChange={(e) =>
                    setCustomDates((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-6 scrollbar-hide">
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl mx-auto w-full">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No orders available</p>
        )}
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
