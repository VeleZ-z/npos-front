import React, { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getCategories, getProducts, getDiscounts } from "../../https";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";

const MenuContainer = () => {
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
  const role = useSelector((state) => state.user.role);
  const canSeeDiscounts =
    String(role || "").toLowerCase() === "admin" ||
    String(role || "").toLowerCase() === "cashier";
  const { data: catsRes } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => await getCategories(),
    placeholderData: keepPreviousData,
  });
  const categories = catsRes?.data?.data || [];

  const { data: prodsRes } = useQuery({
    queryKey: ["products"],
    queryFn: async () => await getProducts(),
    placeholderData: keepPreviousData,
  });
  const products = prodsRes?.data?.data || [];

  const { data: discountsRes } = useQuery({
    queryKey: ["discounts-active"],
    queryFn: async () => await getDiscounts(),
    placeholderData: keepPreviousData,
  });
  const discounts = discountsRes?.data?.data || [];

  const [selected, setSelected] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [itemId, setItemId] = useState();
  const dispatch = useDispatch();

  const fullProducts = useMemo(() => {
    if (!products.length) return [];
    if (!canSeeDiscounts) return [...products];
    const addition = [];
    discounts
      .filter((d) => d.active && d.products?.length)
      .forEach((discount) => {
        const baseProductId = discount.products[0]?.productId;
        const baseProduct = products.find(
          (p) => String(p._id) === String(baseProductId)
        );
        if (!baseProduct) return;
        const taxRate = Number(baseProduct.tax?.percentage ?? 0);
        const basePrice = Number(baseProduct.price || 0);
        let variantPrice = basePrice;
        let discountType = null;
        let discountValue = null;
        if (discount.percent != null && discount.percent !== "") {
          discountType = "PERCENT";
          discountValue = Number(discount.percent);
          const baseNet =
            taxRate > 0 ? basePrice / (1 + taxRate / 100) : basePrice;
          const discAmount = baseNet * (discountValue / 100);
          const newNet = Math.max(0, baseNet - discAmount);
          variantPrice =
            taxRate > 0 ? newNet * (1 + taxRate / 100) : newNet;
        } else if (discount.value != null && discount.value !== "") {
          discountType = "VALUE";
          discountValue = Number(discount.value);
          variantPrice = Math.max(0, basePrice - discountValue);
        }
        if (!discountType || !Number.isFinite(discountValue)) return;
        const roundedVariant = Math.round(variantPrice);
        addition.push({
          ...baseProduct,
          _id: `discount-${discount._id}`,
          baseProductId,
          name: `${baseProduct.name} - ${discount.name}`,
          price: roundedVariant,
          originalPrice: basePrice,
          isDiscountProduct: true,
          discount: {
            id: discount._id,
            type: discountType,
            value: discountValue,
            name: discount.name,
          },
        });
      });
    return [...products, ...addition];
  }, [products, discounts, canSeeDiscounts]);

  const selectedItems = useMemo(() => {
    const catId = selected?._id || categories[0]?._id || null;
    if (!catId) return [];
    return fullProducts
      .filter((p) => Number(p.categoryId) === Number(catId))
      .map((p) => ({
        ...p,
        imageSrc: p.imageUrl ? `${backendUrl}${p.imageUrl}` : null,
      }));
  }, [selected, categories, fullProducts, backendUrl]);

  const increment = (id) => {
    setItemId(id);
    if (itemCount >= 4) return;
    setItemCount((prev) => prev + 1);
  };

  const decrement = (id) => {
    setItemId(id);
    if (itemCount <= 0) return;
    setItemCount((prev) => prev - 1);
  };

  const handleAddToCart = (item) => {
    if (itemCount === 0) return;
    const { name, price } = item;
    const impuestoId = item.impuestoId ?? item.tax?._id ?? null;
    const taxRate = Number(item.tax?.percentage ?? 0);
    const taxName = item.tax?.name || null;
    const taxRegimen = item.tax?.regimen || null;
    const baseProductId = item.isDiscountProduct
      ? item.baseProductId
      : item._id;
    const discountMeta = item.isDiscountProduct ? item.discount : null;
    const originalPrice = item.isDiscountProduct
      ? item.originalPrice
      : price;
    const newObj = {
      id: `${item._id}-${Date.now()}`,
      productId: baseProductId,
      baseProductId,
      name,
      pricePerQuantity: price,
      quantity: itemCount,
      price: price * itemCount,
      note: "",
      impuestoId,
      taxRate,
      taxName,
      taxRegimen,
      originalPrice,
      discount: discountMeta,
      isDiscountProduct: !!item.isDiscountProduct,
    };
    dispatch(addItems(newObj));
    setItemCount(0);
  };

  return (
    <>
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
        {categories.map((menu) => {
          const count = fullProducts.filter(
            (p) => Number(p.categoryId) === Number(menu._id)
          ).length;
          return (
            <div
              key={menu._id}
              className="flex flex-col items-start justify-between p-3 sm:p-4 rounded-xl min-h-[96px] cursor-pointer transition-all duration-200"
              style={{
                backgroundColor:
                  (selected?._id || categories[0]?._id) === menu._id
                    ? "#3b3b3b"
                    : "#2b2b2b",
              }}
              onClick={() => {
                setSelected(menu);
                setItemId(0);
                setItemCount(0);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className="text-[#f5f5f5] text-sm sm:text-base font-semibold truncate pr-3">
                  {menu.name}
                </h1>
                {(selected?._id || categories[0]?._id) === menu._id && (
                  <GrRadialSelected className="text-white" size={20} />
                )}
              </div>
              <p className="text-[#ababab] text-xs sm:text-sm font-semibold">{count} Items</p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
        {selectedItems.map((item) => {
          const countForItem = itemId === item._id ? itemCount : 0;
          const imageSrc =
            item.imageSrc ||
            "https://via.placeholder.com/220x150.png?text=Sin+imagen";
          return (
            <div
              key={item._id}
              className="flex flex-col gap-3 p-4 rounded-2xl min-h-[260px] cursor-pointer hover:bg-[#2a2a2a] bg-[#1a1a1a] shadow-lg"
            >
              <div className="w-full h-[150px] bg-[#111] rounded-md overflow-hidden flex items-center justify-center">
                <img
                  src={imageSrc}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-start justify-between w-full">
                <h1 className="text-[#f5f5f5] text-lg font-semibold line-clamp-2 pr-2">
                  {item.name}
                </h1>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="bg-[#2e4a40] text-[#02ca3a] p-2 rounded-lg"
                  title="Agregar al carrito"
                >
                  <FaShoppingCart size={20} />
                </button>
              </div>
              <div className="flex items-center justify-between w-full">
                <p className="text-[#f5f5f5] text-xl font-bold">$ {item.price.toLocaleString()}</p>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-2 rounded-full gap-6 w-[60%] sm:w-[55%]">
                  <button
                    onClick={() => decrement(item._id)}
                    className="text-yellow-500 text-2xl"
                  >
                    &minus;
                  </button>
                  <span className="text-white">{countForItem}</span>
                  <button
                    onClick={() => increment(item._id)}
                    className="text-yellow-500 text-2xl"
                  >
                    &#43;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MenuContainer;
