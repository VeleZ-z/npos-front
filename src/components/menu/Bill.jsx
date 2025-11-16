import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import { addOrder, updateTable } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";

const Bill = () => {
  const dispatch = useDispatch();
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const { role, isAuth } = useSelector((state) => state.user);
  const isGuest = !isAuth;
  const navigate = useNavigate();
  const total = useSelector(getTotalPrice);
  const taxRaw = useMemo(() => {
    return cartData.reduce((acc, item) => {
      const gross = Number(item.price || 0);
      const rate = Number(item.taxRate || 0);
      if (!gross || rate <= 0) return acc;
      return acc + (gross - gross / (1 + rate / 100));
    }, 0);
  }, [cartData]);
  const tax = Math.round(taxRaw);
  const net = Math.max(total - tax, 0);
  const totalPriceWithTax = total;
  const totalQuantity = cartData.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  const handlePlaceOrder = () => {
    const orderData = {
      customer: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      guest: isGuest,
      orderStatus: "PENDIENTE",
      bills: {
        subtotal: net,
        tax: tax,
        total: totalPriceWithTax,
      },
      items: cartData.map((item) => ({
        productId: item.productId, // persist product FK
        baseProductId: item.baseProductId || item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        pricePerQuantity:
          item.pricePerQuantity ??
          (item.quantity ? item.price / item.quantity : item.price),
        originalPrice: item.originalPrice ?? item.pricePerQuantity,
        taxRate: Number(item.taxRate || 0),
        taxName: item.taxName || null,
        taxRegimen: item.taxRegimen || null,
        impuestoId: item.impuestoId || null,
        note: item.note || null,
        discount: item.discount || null,
        isDiscountProduct: !!item.isDiscountProduct,
      })),  
      table: customerData.table?.tableId,
      paymentStatus: "PENDIENTE",
    };
    orderMutation.mutate(orderData);
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      setOrderInfo(data);
      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: data.table,
      };
      setTimeout(() => {
        tableUpdateMutation.mutate(tableData);
      }, 1500);
      enqueueSnackbar("Orden creada!", { variant: "success" });
      // Redirigir segun rol
      const r = String(role || '').toLowerCase();
      if (r === 'customer' && isAuth) {
        navigate('/orders');
      } else {
        navigate('/');
      }
    },
    onError: () => {
      enqueueSnackbar("Error al crear orden", { variant: "error" });
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: () => {
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
    onError: () => {
      enqueueSnackbar("Error al actualizar mesa", { variant: "error" });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium">
          Items ({totalQuantity})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${net.toFixed(0)}
        </h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium">Impuestos</p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${tax.toFixed(0)}
        </h1>
      </div>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium">Total</p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${totalPriceWithTax.toFixed(0)}
        </h1>
      </div>
      
      <div className="flex items-center gap-3 px-5 mt-4">
        <button
          href="/orders"
          onClick={handlePlaceOrder}
          disabled={orderMutation.isPending}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg disabled:bg-gray-400"
        >
          {orderMutation.isPending ? "Creando..." : "Crear Orden"}
        </button>
      </div>
      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;






