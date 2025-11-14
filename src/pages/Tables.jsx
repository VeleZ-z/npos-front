import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import useHideBottomNav from "../hooks/useHideBottomNav";

const Tables = () => {
  const [status, setStatus] = useState("all");

  useEffect(() => {
    document.title = "NPOS | Tables";
  }, []);

  useHideBottomNav((pathname) => pathname === "/tables");

  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  console.log(resData, isError);

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Mesas
          </h1>
        </div>
        <div className="flex items-center justify-around gap-4">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-lg ${
              status === "all" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-lg ${
              status === "booked" && "bg-[#383838] rounded-lg px-5 py-2"
            }  rounded-lg px-5 py-2 font-semibold`}
          >
            Ocupadas
          </button>
        </div>
      </div>

      <div className="px-6 md:px-10 py-4 h-[650px] overflow-y-scroll scrollbar-hide">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {resData?.data?.data?.map((table) => {
            const customerName = table?.currentOrder?.customer?.name || "Disponible";
            return (
              <TableCard
                key={table._id}
                id={table._id}
                name={table.number}
                status={table.status}
                initials={customerName}
                seats={table.capacity}
              />
            );
          })}
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default Tables;
