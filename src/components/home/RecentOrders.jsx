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
	  <div className="page-card w-full">
	    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	      <h1 className="text-lg font-semibold tracking-wide">
	        <a href="/orders">Ordenes de los clientes</a>
	      </h1>
	      <p className="text-sm text-[#ababab]">Actualizadas en tiempo real</p>
	    </div>
	    <div className="mt-4 max-h-[320px] overflow-y-auto np-scroll pr-1">
	      {filteredOrders.length > 0 ? (
	        filteredOrders.map((order) => (
	          <OrderList key={order._id} order={order} />
	        ))
	      ) : (
	        <p className="text-gray-500">No orders available</p>
	      )}
	    </div>
	  </div>
	);
};

export default RecentOrders;
