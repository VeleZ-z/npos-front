import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getPopularProductsStats } from "../https";

const RANGE_FILTERS = [
  { id: "all", label: "Todo el tiempo" },
  { id: "30", label: "Últimos 30 días" },
  { id: "7", label: "Últimos 7 días" },
];

const DishRank = () => {
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.user);
  const isAdmin = String(role || "").toLowerCase() === "admin";
  const [range, setRange] = useState("30");
  const [customDates, setCustomDates] = useState({ from: "", to: "" });
  const backendUrl = useMemo(
    () => (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""),
    []
  );

  const params = useMemo(() => {
    const payload = {};
    if (range === "custom") {
      if (customDates.from) {
        payload.startDate = new Date(customDates.from).toISOString();
      }
      if (customDates.to) {
        const toDate = new Date(customDates.to);
        toDate.setHours(23, 59, 59, 999);
        payload.endDate = toDate.toISOString();
      }
    } else if (range !== "all") {
      const days = Number(range);
      if (Number.isFinite(days) && days > 0) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        payload.startDate = since.toISOString();
      }
    }
    return payload;
  }, [range, customDates]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["dish-rank", params],
    queryFn: async () => {
      const res = await getPopularProductsStats(isAdmin ? params : undefined);
      return res?.data?.data || [];
    },
    keepPreviousData: true,
  });

  const resolveImageSrc = (product) => {
    if (!product?.imageUrl) return null;
    if (/^https?:\/\//i.test(product.imageUrl) || /^data:/i.test(product.imageUrl)) {
      return product.imageUrl;
    }
    return backendUrl ? `${backendUrl}${product.imageUrl}` : product.imageUrl;
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <section className="bg-[#111] min-h-[calc(100vh-5rem)] px-6 py-4 text-white">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[#ababab] uppercase tracking-wide">
            Analíticas
          </p>
          <h1 className="text-2xl font-bold">Ranking de Productos más populares</h1>
          <p className="text-sm text-[#ababab]">
            {isAdmin
              ? "Basado en las ventas registradas en facturas."
              : "Listado informativo de los productos más pedidos por nuestros clientes."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start rounded-md border border-[#2f2f2f] px-4 py-2 text-sm text-[#f5f5f5] hover:bg-[#1f1f1f]"
        >
          Volver
        </button>
      </div>

      {isAdmin && (
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {RANGE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setRange(filter.id)}
                className={`rounded-full px-4 py-1 text-sm ${
                  range === filter.id
                    ? "bg-[#6EF221] text-black"
                    : "bg-[#1f1f1f] text-[#ababab]"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRange("custom")}
              className={`rounded-full px-4 py-1 text-sm ${
                range === "custom"
                  ? "bg-[#6EF221] text-black"
                  : "bg-[#1f1f1f] text-[#ababab]"
              }`}
            >
              Personalizado
            </button>
          </div>
          {range === "custom" && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#ababab]">
              <label className="flex items-center gap-2">
                Desde:
                <input
                  type="date"
                  value={customDates.from}
                  onChange={(e) =>
                    setCustomDates((prev) => ({ ...prev, from: e.target.value }))
                  }
                  className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-[#f5f5f5]"
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
                  className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-[#f5f5f5]"
                />
              </label>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-[#1a1a1a] rounded-xl p-4">
        {isAdmin && (
          <div className="hidden md:grid md:grid-cols-12 text-xs uppercase text-[#777] tracking-wider pb-2 border-b border-[#2a2a2a]">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Producto</span>
            <span className="col-span-2 text-center">Vendidos</span>
            <span className="col-span-2 text-center">Precio</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
        )}
        <div className="divide-y divide-[#2a2a2a]">
          {isLoading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`rank-skeleton-${idx}`}
                  className="flex items-center gap-4 py-4 animate-pulse"
                >
                  <div className="w-8 h-6 bg-[#2b2b2b] rounded" />
                  <div className="w-[50px] h-[50px] rounded-full bg-[#333]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#2b2b2b] rounded w-1/2" />
                    {isAdmin && (
                      <div className="h-3 bg-[#2b2b2b] rounded w-1/3" />
                    )}
                  </div>
                </div>
              ))
            : products && products.length
            ? products.map((product) => {
                const imageSrc = resolveImageSrc(product);
                if (isAdmin) {
                  return (
                    <div
                      key={product.productId}
                      className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 py-4"
                    >
                      <div className="flex items-center gap-4 md:col-span-6">
                        <span className="text-lg font-semibold text-[#6EF221] w-8">
                          {product.rank.toString().padStart(2, "0")}
                        </span>
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="w-[50px] h-[50px] rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-[50px] h-[50px] rounded-full bg-[#333]" />
                        )}
                        <div>
                          <p className="font-semibold capitalize">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#777]">
                            ID #{product.productId}
                          </p>
                        </div>
                      </div>
                      <div className="md:col-span-2 text-[#f5f5f5] text-sm text-center">
                        {product.totalQuantity}
                      </div>
                      <div className="md:col-span-2 text-sm text-center text-[#f5f5f5]">
                        ${formatCurrency(product.unitPrice)}
                      </div>
                      <div className="md:col-span-2 text-sm text-right text-[#f5f5f5] font-semibold">
                        ${formatCurrency(product.totalAmount)}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={product.productId}
                    className="flex items-center gap-4 py-4"
                  >
                        <span className="text-lg font-semibold text-[#6EF221] w-10">
                      {product.rank.toString().padStart(2, "0")}
                    </span>
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-[50px] h-[50px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] rounded-full bg-[#333]" />
                    )}
                    <p className="font-semibold capitalize">{product.name}</p>
                  </div>
                );
              })
            : (
                <div className="py-10 text-center text-[#ababab] text-sm">
                  Aún no hay datos suficientes para mostrar el ranking.
                </div>
              )}
        </div>
      </div>
    </section>
  );
};

export default DishRank;
