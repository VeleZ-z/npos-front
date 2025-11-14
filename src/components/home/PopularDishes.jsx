
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPopularProductsStats } from "../../https";

const PopularDishes = () => {
  const navigate = useNavigate();
  const { data: resData, isLoading } = useQuery({
    queryKey: ["popular-products", { limit: 3 }],
    queryFn: async () => {
      const res = await getPopularProductsStats({ limit: 3 });
      return res?.data?.data || [];
    },
    placeholderData: keepPreviousData,
  });
  const products = resData || [];

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

	return (
	  <div className="page-card h-full">
	      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	        <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
	          Productos mas populares
	        </h1>
	        <button
	          type="button"
	          onClick={() => navigate("/dishrank")}
	          className="text-[#025cca] text-sm font-semibold hover:underline"
	        >
	          Ver todos
	        </button>
	      </div>

	      <div className="overflow-y-auto max-h-[32rem] scrollbar-hide pb-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
	                className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-4 py-4 mt-4 animate-pulse"
              >
                <div className="w-10 h-6 bg-[#2b2b2b] rounded" />
                <div className="w-[50px] h-[50px] rounded-full bg-[#333]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#2b2b2b] rounded w-1/2" />
                  <div className="h-3 bg-[#2b2b2b] rounded w-1/3" />
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#ababab] text-sm">
              Aún no hay ventas registradas para calcular este listado.
            </div>
          ) : (
            products.map((p, idx) => (
              <div
                key={p.productId || idx}
	                className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-4 py-4 mt-4"
              >
                <h1 className="text-[#f5f5f5] font-bold text-xl mr-4">
                  {p.rank.toString().padStart(2, "0")}
                </h1>
                {p.imageUrl ? (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${p.imageUrl}`}
                    alt={p.name}
                    className="w-[50px] h-[50px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[50px] h-[50px] rounded-full bg-[#333]" />
                )}
                <div className="flex flex-col flex-1">
                  <h1 className="text-[#f5f5f5] font-semibold tracking-wide capitalize">
                    {p.name}
                  </h1>
                  <p className="text-[#ababab] text-sm mt-1">
                    Vendidos: {p.totalQuantity} • ${" "}
                    {formatCurrency(p.unitPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#f5f5f5] text-sm font-semibold">
                    ${formatCurrency(p.totalAmount)}
                  </p>
                  <p className="text-[#777] text-xs">Total acumulado</p>
                </div>
              </div>
            ))
          )}
	  </div>
	);
};

export default PopularDishes;
