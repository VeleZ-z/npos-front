import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDiscounts } from "../https";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const resolveImageSrc = (discount, backendUrl) => {
  if (!discount) return null;
  if (discount.imageInline) return discount.imageInline;
  const raw = discount.imageUrl;
  if (!raw) return null;
  if (/^data:/i.test(raw) || /^https?:\/\//i.test(raw)) {
    return raw;
  }
  return backendUrl ? `${backendUrl}${raw}` : raw;
};

const Promotions = () => {
  const backendUrl = useMemo(
    () => (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""),
    []
  );
  const { data, isLoading } = useQuery({
    queryKey: ["public-promotions"],
    queryFn: async () => {
      const res = await getDiscounts();
      return res?.data?.data || [];
    },
  });

  return (
    <section className="bg-[#111] min-h-[calc(100vh-5rem)] px-6 py-6 text-white overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promociones vigentes</h1>
        <p className="text-sm text-[#ababab]">
          Consulta los descuentos disponibles para los productos.
        </p>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#ababab]">Cargando promociones...</p>
      ) : !data.length ? (
        <p className="text-sm text-[#ababab]">
          No hay promociones activas en este momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((discount) => (
            <div
              key={discount._id}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{discount.name}</h2>
                {discount.percent != null && (
                  <span className="px-3 py-1 rounded-full bg-[#2F974D] text-black text-sm font-semibold">
                    {discount.percent}% OFF
                  </span>
                )}
              </div>
              {discount.message && (
                <p className="text-sm text-[#ababab]">{discount.message}</p>
              )}
              <p className="text-sm text-[#ababab]">
                Valor: {discount.value != null ? `$ ${formatCurrency(discount.value)}` : "—"}
              </p>
              {discount.products?.length ? (
                <div>
                  <p className="text-xs uppercase text-[#777]">Productos</p>
                  <ul className="list-disc list-inside text-sm text-[#f5f5f5]">
                    {discount.products.map((p) => (
                      <li key={p.productId || p.id}>
                        {p.name || `Producto #${p.productId || p.id}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-[#777]">Sin productos asociados.</p>
              )}
              {resolveImageSrc(discount, backendUrl) && (
                <img
                  src={resolveImageSrc(discount, backendUrl)}
                  alt={discount.name}
                  className="rounded-lg border border-[#333] max-h-48 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Promotions;
