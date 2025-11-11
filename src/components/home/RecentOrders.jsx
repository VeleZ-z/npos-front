import React, { useMemo } from "react";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";

const RecentOrders = () => {
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  const filteredOrders = useMemo(() => {
    const raw = resData?.data?.data ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.filter((order) => (order?.items?.length || 0) > 0);
  }, [resData]);

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            <a href="/orders">Ordenes de los clientes</a>
          </h1>
        </div>

        {/* Order list */}
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : (
            <p className="col-span-3 text-gray-500">No orders available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
