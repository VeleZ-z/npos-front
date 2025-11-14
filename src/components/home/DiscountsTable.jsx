import React, { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getDiscounts, getProducts } from "../../https";

const DiscountsTable = () => {
  const { data: res } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => await getDiscounts(),
    placeholderData: keepPreviousData,
  });
  const { data: productsRes } = useQuery({
    queryKey: ["all-products-lite"],
    queryFn: async () => await getProducts(),
    placeholderData: keepPreviousData,
  });

  const productsMap = useMemo(() => {
    const map = {};
    const list = productsRes?.data?.data || [];
    list.forEach((product) => {
      const id = product._id ?? product.id;
      if (id != null) {
        map[String(id)] = product;
      }
    });
    return map;
  }, [productsRes]);

  const formatCurrency = (value) => {
    if (value == null || Number.isNaN(value)) return "—";
    return Number(value).toLocaleString("es-CO");
  };

  const limitedDiscounts = useMemo(() => {
    const source = res?.data?.data || [];
    return source.slice(0, 6).map((discount) => {
      const productId = discount.products?.[0]?.productId;
      const product =
        productId != null ? productsMap[String(productId)] : null;
      const originalPrice = product ? Number(product.price || product.precio || 0) : null;
      let discountedPrice = originalPrice;
      let badge = null;
      if (originalPrice != null) {
        if (discount.percent != null) {
          const percent = Number(discount.percent) || 0;
          discountedPrice = Math.max(0, Math.round(originalPrice * (1 - percent / 100)));
          badge = `-${percent}%`;
        } else if (discount.value != null) {
          const value = Number(discount.value) || 0;
          discountedPrice = Math.max(0, Math.round(originalPrice - value));
          badge = value > 0 ? `-$${value.toLocaleString("es-CO")}` : null;
        }
      }
      const heroImage =
        discount.imageUrl || product?.imageUrl || "https://via.placeholder.com/600x400?text=Promo";
      return {
        id: discount._id,
        name: discount.name,
        message: discount.message,
        badge,
        productName: product?.name || product?.nombre || "Producto asociado",
        originalPrice,
        discountedPrice,
        image: heroImage,
      };
    });
  }, [res, productsMap]);

  const [index, setIndex] = useState(0);
  const slideCount = limitedDiscounts.length;
  const goTo = (next) => {
    if (!slideCount) return;
    const normalized = (next + slideCount) % slideCount;
    setIndex(normalized);
  };
  const handlePrev = () => goTo(index - 1);
  const handleNext = () => goTo(index + 1);

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-[#f5f5f5] text-xl font-semibold">Promociones activas</h2>
        {slideCount > 0 && (
          <span className="text-sm text-[#ababab]">
            {slideCount} {slideCount === 1 ? "descuento" : "descuentos"}
          </span>
        )}
      </div>

      {slideCount === 0 ? (
        <p className="text-sm text-[#ababab]">Sin descuentos activos por ahora.</p>
      ) : (
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {limitedDiscounts.map((slide) => (
                <div key={slide.id} className="basis-full shrink-0 px-1">
                  <article className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-gradient-to-br from-[#1f1f1f] via-[#141414] to-[#0f0f0f] p-5 flex flex-col gap-4 min-h-[360px]">
                    <div className="relative h-44 rounded-xl overflow-hidden">
                      <img
                        src={slide.image}
                        alt={slide.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {slide.badge && (
                        <span className="absolute top-3 right-3 bg-[#f6b100] text-[#1a1a1a] text-sm font-semibold px-3 py-1 rounded-full shadow-lg">
                          {slide.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#f6b100]">Descuento</p>
                      <h3 className="text-2xl font-semibold text-white">{slide.name}</h3>
                      {slide.message && (
                        <p className="text-sm text-[#ababab] mt-1">{slide.message}</p>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <p className="text-xs text-[#757575]">Precio original</p>
                        <p className="text-xl text-[#777] line-through">
                          {slide.originalPrice != null ? `$ ${formatCurrency(slide.originalPrice)}` : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#757575]">Precio con descuento</p>
                        <p className="text-3xl font-bold text-green-400">
                          {slide.discountedPrice != null
                            ? `$ ${formatCurrency(slide.discountedPrice)}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-[#ababab]">
                      Aplicado a: <span className="text-white font-medium">{slide.productName}</span>
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {slideCount > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#111]/80 hover:bg-[#222] text-white rounded-full w-10 h-10 flex items-center justify-center border border-[#2a2a2a]"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#111]/80 hover:bg-[#222] text-white rounded-full w-10 h-10 flex items-center justify-center border border-[#2a2a2a]"
              >
                {">"}
              </button>
            </>
          )}

          {slideCount > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {limitedDiscounts.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === index ? "w-6 bg-[#f6b100]" : "w-2 bg-[#555]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountsTable;
