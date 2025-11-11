import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack"

const Orders = () => {

  const [status, setStatus] = useState("all");

    useEffect(() => {
      document.title = "NPOS | Orders"
    }, [])

  const { role } = useSelector((state) => state.user);
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData
  })

  if(isError) {
    enqueueSnackbar("Something went wrong!", {variant: "error"})
  }

  const orders = useMemo(() => {
    const raw = resData?.data?.data ?? [];
    if (!Array.isArray(raw)) return [];
    const filtered = raw.filter((order) => (order?.items?.length || 0) > 0);
    if (status === "all") return filtered;
    if (status === "progress")
      return filtered.filter((order) => {
        const st = String(order?.orderStatus || "").toUpperCase();
        return st === "POR_APROBAR" || st === "PENDIENTE" || st === "IN_PROGRESS";
      });
    if (status === "ready")
      return filtered.filter(
        (order) => String(order?.orderStatus || "").toUpperCase() === "LISTO"
      );
    if (status === "completed")
      return filtered.filter(
        (order) => String(order?.orderStatus || "").toUpperCase() === "ENTREGADO"
      );
    return filtered;
  }, [resData, status]);

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Orders
          </h1>
        </div>
        {String(role || '').toLowerCase() !== 'customer' && (
          <div className="flex items-center justify-around gap-4">
            <button onClick={() => setStatus("all")} className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
              All
            </button>
            <button onClick={() => setStatus("progress")} className={`text-[#ababab] text-lg ${status === "progress" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
              In Progress
            </button>
            <button onClick={() => setStatus("ready")} className={`text-[#ababab] text-lg ${status === "ready" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
              Ready
            </button>
            <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-lg ${status === "completed" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
              Completed
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 px-16 py-4 overflow-y-scroll scrollbar-hide">
        {
          orders.length > 0 ? (
            orders.map((order) => {
              return <OrderCard key={order._id} order={order} />
            })
          ) : <p className="col-span-3 text-gray-500">No orders available</p>
        }
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
