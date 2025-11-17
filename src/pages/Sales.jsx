import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getTables } from "../https";
import {
  getOrderByTable,
  addItemToTable,
  updateOrderItem,
  deleteOrderItem,
  moveOrderItem,
  getProducts,
  getCategories,
  getDiscounts,
  updateOrderStatus,
  deleteOrder,
  getStates,
  searchUsers,
  setOrderCustomer,
  markOrderItemsPrinted,
  getPayMethods,
  createInvoice,
} from "../https";
import { enqueueSnackbar } from "notistack";
import {
  FaLock,
  FaSearch,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaStickyNote,
  FaTrash,
  FaExchangeAlt,
  FaRedo,
  FaPrint,
} from "react-icons/fa";
import Modal from "../components/shared/Modal";

const ORDER_TEMPLATE = {
  _id: null,
  orderStatus: "POR_APROBAR",
  customer: null,
  items: [],
  bills: { total: 0, tax: 0, subtotal: 0 },
  cashierName: null,
};

const Sales = () => {
  const qc = useQueryClient();
  useEffect(() => {
    document.title = "NPOS | Ventas";
  }, []);
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
  const role = useSelector((state) => state.user.role);
  const roleLower = String(role || "").toLowerCase();
  const isAdmin = roleLower === "admin";
  const isStaff = roleLower === "admin" || roleLower === "cashier";
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [order, setOrder] = useState({ ...ORDER_TEMPLATE });
  const [view, setView] = useState("tables"); // 'mesas' | 'productos'
  const [search, setSearch] = useState("");
  const [moveItem, setMoveItem] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerManualName, setCustomerManualName] = useState("");
  const [customerManualPhone, setCustomerManualPhone] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const customerSearchTimer = useRef(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    methodId: "",
    amount: "",
    tip: "",
  });

  const { data: tablesRes, refetch: refetchTables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => await getTables(),
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
  });
  const tablesRaw = tablesRes?.data?.data;
  const tables = useMemo(() => tablesRaw ?? [], [tablesRaw]);

  const loadOrder = async (mesaId) => {
    try {
      const { data } = await getOrderByTable(mesaId);
      setOrder(data.data);
      return data.data;
    } catch {
      enqueueSnackbar("No se pudo cargar el pedido", { variant: "error" });
      return null;
    }
  };

  const handleSelectMesa = async (mesa) => {
    setSelectedMesa(mesa);
    await loadOrder(mesa._id);
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setInvoiceForm({ methodId: "", amount: "", tip: "" });
  };

  // Productos data for add view
  const { data: catsRes } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => await getCategories(),
    placeholderData: keepPreviousData,
  });
  const categoriesRaw = catsRes?.data?.data;
  const categories = useMemo(() => categoriesRaw ?? [], [categoriesRaw]);
  const { data: prodsRes } = useQuery({
    queryKey: ["products"],
    queryFn: async () => await getProducts(),
    placeholderData: keepPreviousData,
  });
  const productsRaw = prodsRes?.data?.data;
  const products = useMemo(() => productsRaw ?? [], [productsRaw]);
  const { data: discountsRes } = useQuery({
    queryKey: ["discounts-active"],
    queryFn: async () => await getDiscounts(),
    placeholderData: keepPreviousData,
    enabled: isStaff,
  });
  const discounts = discountsRes?.data?.data || [];
  const fullProducts = useMemo(() => {
    if (!products.length) return [];
    if (!isStaff) return [...products];
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
          categoryId: baseProduct.categoryId,
          name: `${baseProduct.name} - ${discount.name}`,
          price: roundedVariant,
          originalPrice: basePrice,
          isDiscountProduct: true,
          imageUrl: baseProduct.imageUrl || null,
          discount: {
            id: discount._id,
            type: discountType,
            value: discountValue,
            name: discount.name,
          },
        });
      });
    return [...products, ...addition];
  }, [products, discounts, isStaff]);
  const { data: statesRes } = useQuery({
    queryKey: ["order-states"],
    queryFn: async () => await getStates(3),
    placeholderData: keepPreviousData,
  });
  const orderStates = useMemo(
    () =>
      statesRes?.data?.data?.map((s) => (s.name || "").toUpperCase()) ?? [
        "POR_APROBAR",
        "PENDIENTE",
        "LISTO",
      ],
    [statesRes]
  );
  const { data: payRes } = useQuery({
    queryKey: ["paymethods-mini"],
    queryFn: async () => await getPayMethods(),
    placeholderData: keepPreviousData,
    enabled: isStaff,
  });
  const filteredProds = useMemo(() => {
    const f = search.trim().toLowerCase();
    const base = f
      ? fullProducts.filter((p) =>
          (p.name || "").toLowerCase().includes(f)
        )
      : fullProducts;
    const groups = categories.map((c) => ({
      cat: c,
      items: base
        .filter((p) => Number(p.categoryId) === Number(c._id))
        .map((item) => ({
          ...item,
          imageSrc: item.imageUrl
            ? `${backendUrl}${item.imageUrl}`
            : null,
        })),
    }));
    const noCat = base
      .filter((p) => !p.categoryId)
      .map((item) => ({
        ...item,
        imageSrc: item.imageUrl ? `${backendUrl}${item.imageUrl}` : null,
      }));
    return { groups, noCat };
  }, [fullProducts, categories, search, backendUrl]);

  const availableTables = useMemo(
    () => tables.filter((t) => t._id !== selectedMesa?._id),
    [tables, selectedMesa]
  );
  const isOrderPendingApproval =
    String(order?.orderStatus || "").toUpperCase() === "POR_APROBAR";
  const canRemoveItems = useMemo(() => {
    if (isAdmin) return true;
    return isOrderPendingApproval;
  }, [isAdmin, isOrderPendingApproval]);
  const canDeleteOrder =
    isStaff && isOrderPendingApproval && Boolean(order?._id);
  const canAssignCustomer = isOrderPendingApproval;
  const hasCustomerAssigned = Boolean(order?.customer?.name);
  const payMethods = useMemo(() => {
    const list = payRes?.data?.data || [];
    return list.filter(
      (pm) => String(pm.estado || "").toUpperCase() !== "INACTIVO"
    );
  }, [payRes]);
  const selectedPayMethod = useMemo(
    () =>
      payMethods.find(
        (pm) => String(pm._id) === String(invoiceForm.methodId || "")
      ),
    [payMethods, invoiceForm.methodId]
  );
  const isCashMethod = useMemo(() => {
    const name = (selectedPayMethod?.name || "").toLowerCase();
    return name.includes("efectivo") || name.includes("cash");
  }, [selectedPayMethod]);
  const pendingQuantity = useMemo(() => {
    return (order?.items || []).reduce((sum, it) => {
      const qty = Number(it.quantity || 0);
      const printed = Number(it.printedQty || 0);
      return sum + Math.max(0, qty - printed);
    }, 0);
  }, [order?.items]);
  const hasPendingItems = pendingQuantity > 0;
  const canInvoice =
    isStaff && order?._id && (order?.items?.length || 0) > 0 && !order?.invoice;
  const customerDisplayName = order?.customer?.name || "Clientes Varios";
  const customerDocument =
    order?.customer?.document ||
    order?.customer?.nit ||
    "222222222222";
  const baseInvoiceTotal = Number(order?.bills?.total || 0);
  const invoiceTipValue = Number(invoiceForm.tip || 0) || 0;
  const finalInvoiceTotal = baseInvoiceTotal + invoiceTipValue;
  const cashAmountValue = Number(invoiceForm.amount || 0) || 0;
  const invoiceChange = isCashMethod
    ? Math.max(0, cashAmountValue - finalInvoiceTotal)
    : 0;

  const addMutation = useMutation({
    mutationFn: ({ mesaId, payload }) => addItemToTable(mesaId, payload),
    onSuccess: ({ data }) => {
      setOrder(data.data);
      qc.invalidateQueries(["tables"]);
      refetchTables();
      enqueueSnackbar("Producto agregado", { variant: "success" });
    },
    onError: () =>
      enqueueSnackbar("No se pudo agregar el producto", { variant: "error" }),
  });

  const updItem = async (item, delta) => {
    const newQty = (item.quantity || 0) + delta;
    try {
      if (newQty <= 0) {
        const { data } = await deleteOrderItem(order._id, item._id);
        setOrder(data.data);
      } else {
        const { data } = await updateOrderItem(order._id, item._id, {
          cantidad: newQty,
        });
        setOrder(data.data);
      }
      qc.invalidateQueries(["tables"]);
      refetchTables();
    } catch {
      enqueueSnackbar("No se pudo actualizar el item", { variant: "error" });
    }
  };

  const moveMutation = useMutation({
    mutationFn: ({ itemId, mesaId }) =>
      moveOrderItem(order._id, itemId, mesaId),
    onSuccess: ({ data }) => {
      const nextOrder = data?.data?.source || data?.data;
      if (nextOrder) setOrder(nextOrder);
      setMoveItem(null);
      qc.invalidateQueries(["tables"]);
      refetchTables();
      enqueueSnackbar("Producto movido", { variant: "success" });
    },
    onError: () =>
      enqueueSnackbar("No se pudo mover el producto", { variant: "error" }),
  });

  const assignCustomerMutation = useMutation({
    mutationFn: ({ orderId, payload }) => setOrderCustomer(orderId, payload),
    onSuccess: ({ data }) => {
      if (data?.data) setOrder(data.data);
      setShowCustomerModal(false);
      qc.invalidateQueries(["tables"]);
      refetchTables();
      enqueueSnackbar("Cliente actualizado", { variant: "success" });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || "No se pudo actualizar el cliente";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: (payload) => createInvoice(payload),
    onSuccess: ({ data }) => {
      const payload = data?.data || {};
      const updatedOrder = payload.order || null;
      const invoiceInfo = payload.invoice || null;
      if (invoiceInfo) {
        printInvoiceTicket(invoiceInfo, updatedOrder || order);
      }
      if (updatedOrder) {
        setOrder(updatedOrder);
        if (
          String(updatedOrder.orderStatus || "").toUpperCase() === "PAGADO"
        ) {
          setSelectedMesa(null);
        }
      } else {
        setOrder({ ...ORDER_TEMPLATE });
        setSelectedMesa(null);
      }
      qc.invalidateQueries(["tables"]);
      enqueueSnackbar("Factura generada exitosamente", { variant: "success" });
      closeInvoiceModal();
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || "No se pudo generar la factura";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  useEffect(() => {
    if (!showCustomerModal) return;
    if (customerSearchTimer.current) {
      clearTimeout(customerSearchTimer.current);
    }
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      setCustomerSearchLoading(false);
      return;
    }
    setCustomerSearchLoading(true);
    customerSearchTimer.current = setTimeout(async () => {
      try {
        const { data } = await searchUsers({
          q: customerSearch.trim(),
          limit: 10,
        });
        setCustomerResults(data?.data || []);
      } catch {
        setCustomerResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 350);
    return () => {
      if (customerSearchTimer.current)
        clearTimeout(customerSearchTimer.current);
    };
  }, [customerSearch, showCustomerModal]);

  useEffect(() => {
    if (!showCustomerModal) {
      setCustomerSearch("");
      setCustomerResults([]);
      setCustomerSearchLoading(false);
    }
  }, [showCustomerModal]);

  const openCustomerModal = () => {
    if (!order?._id) return;
    if (!canAssignCustomer) {
      enqueueSnackbar(
        "El pedido ya fue confirmado; no es posible asignar otro cliente",
        { variant: "warning" }
      );
      return;
    }
    setCustomerManualName(order?.customer?.name || "");
    setCustomerManualPhone(order?.customer?.phone || "");
    setCustomerSearch("");
    setCustomerResults([]);
    setShowCustomerModal(true);
  };

  const handleAssignManual = () => {
    if (!order?._id) return;
    if (!customerManualName.trim()) {
      enqueueSnackbar("Debes ingresar un nombre para el pedido", {
        variant: "warning",
      });
      return;
    }
    const phoneValue =
      customerManualPhone && customerManualPhone.trim()
        ? customerManualPhone.trim()
        : null;
    assignCustomerMutation.mutate({
      orderId: order._id,
      payload: {
        name: customerManualName,
        phone: phoneValue,
      },
    });
  };

  const handleAssignUser = (userId) => {
    if (!order?._id) return;
    assignCustomerMutation.mutate({
      orderId: order._id,
      payload: { userId },
    });
  };

  const handleClearCustomer = () => {
    if (!order?._id) return;
    assignCustomerMutation.mutate({
      orderId: order._id,
      payload: { clear: true },
    });
  };

  const setNote = async (item) => {
    const val = window.prompt("Nota para cocina", item.note || "");
    if (val === null) return;
    try {
      const { data } = await updateOrderItem(order._id, item._id, {
        note: String(val).trim(),
      });
      setOrder(data.data);
    } catch {
      enqueueSnackbar("No se pudo actualizar la nota", { variant: "error" });
    }
  };

  const removeItem = async (item) => {
    try {
      const { data } = await deleteOrderItem(order._id, item._id);
      setOrder(data.data);
      qc.invalidateQueries(["tables"]);
    } catch {
      enqueueSnackbar("No se pudo eliminar el item", { variant: "error" });
    }
  };

  const handleDeleteOrder = async () => {
    if (!canDeleteOrder) return;
    const confirmation = window.confirm(
      "¿Seguro que deseas eliminar este pedido en estado POR_APROBAR?"
    );
    if (!confirmation) return;
    try {
      await deleteOrder(order._id);
      enqueueSnackbar("Pedido eliminado", { variant: "success" });
      setOrder({ ...ORDER_TEMPLATE });
      qc.invalidateQueries(["tables"]);
      if (selectedMesa?._id) {
        await loadOrder(selectedMesa._id);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "No se pudo eliminar el pedido";
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!order?._id || !isStaff) return;
    if (String(order.orderStatus || "").toUpperCase() === "CERRADO") {
      enqueueSnackbar("No se puede modificar una orden cerrada", {
        variant: "warning",
      });
      return;
    }
    const statusUpper = String(nextStatus || "").toUpperCase();
    if (statusUpper === String(order.orderStatus || "").toUpperCase()) return;
    try {
      await updateOrderStatus({
        orderId: order._id,
        orderStatus: statusUpper,
        tableId: selectedMesa?._id,
      });
      await loadOrder(selectedMesa?._id);
      qc.invalidateQueries(["tables"]);
      enqueueSnackbar("Estado actualizado", { variant: "success" });
    } catch (error) {
      const message =
        error?.response?.data?.message || "No se pudo actualizar el estado";
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const ensureOrderReadyForPrint = async () => {
    if (!order?._id || !selectedMesa?._id) return null;
    let currentOrder = order;
    try {
      if (order.orderStatus === "POR_APROBAR") {
        await updateOrderStatus({
          orderId: order._id,
          orderStatus: "PENDIENTE",
        });
        const updated = await loadOrder(selectedMesa._id);
        if (updated) currentOrder = updated;
        qc.invalidateQueries(["tables"]);
      } else {
        const refreshed = await loadOrder(selectedMesa._id);
        if (refreshed) currentOrder = refreshed;
      }
      return currentOrder;
    } catch {
      enqueueSnackbar("No se pudo confirmar el pedido", { variant: "error" });
      return null;
    }
  };

  const buildPrintableItems = (currentOrder, mode = "pending") => {
    const list = currentOrder?.items || [];
    return list
      .map((it) => {
        const qty = Number(it.quantity || 0);
        const printed = Number(it.printedQty || 0);
        const printQuantity =
          mode === "pending" ? Math.max(0, qty - printed) : qty;
        return { ...it, printQuantity };
      })
      .filter((it) => it.printQuantity > 0);
  };

  const triggerPrintWindow = (currentOrder, itemsSubset) => {
    const w = window.open(
      "",
      "PRINT",
      "width=320,height=700,margin=0,top=0,left=0"
    );
    if (!w) return;
    const customerName = (
      currentOrder.customer?.name || "CLIENTES VARIOS"
    ).toUpperCase();
    const customerDoc =
      currentOrder.customer?.document ||
      currentOrder.customer?.nit ||
      "222222222222";
    const totalFormatted = (currentOrder?.bills?.total || 0).toLocaleString();
    const itemsHtml = itemsSubset
      .map((it) => {
        const note = it.note ? `<div class="note">- ${it.note}</div>` : "";
        return `<div class="item-row"><div class="qty">${
          it.printQuantity
        }</div><div class="desc">${(
          it.name || ""
        ).toUpperCase()}${note}</div></div>`;
      })
      .join("");
    const styleSheet = `
      @page { size: 80mm 297mm; margin: 4mm; }
      body { width: 80mm; margin: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #111; max-height: 297mm; }
      .center { text-align: center; }
      .section { margin-bottom: 4px; }
      .separator { border-top: 1px dashed #000; margin: 4px 0; }
      .header strong { display: block; }
      .label-row { display: flex; justify-content: space-between; }
      .items { margin-top: 4px; }
      .item-row { display: flex; margin-bottom: 4px; }
      .item-row .qty { width: 16mm; font-weight: bold; }
      .item-row .desc { flex: 1; }
      .note { margin-left: 4mm; font-size: 11px; }
      .footnote { text-align: center; margin-top: 6px; }
    `;
    const receiptHtml = `
      <div class="section center header">
        <strong>SUCURSAL QUIBDO</strong>
        <strong>NATIVHOS</strong>
        <span>NIT: 11810434-9 <br></span>
        <span>Cra 1 No 31-28 B/Cristo Rey<br></span>
        <span>Cel: 3235113478</span>
      </div>
      <div class="section">
        <div>VENTA</div>
        <div class="label-row"><span>CLIENTE:</span><span>${customerName}</span></div>
        <div class="label-row"><span>DTO:</span><span>${customerDoc}</span></div>
        <div class="label-row"><span>PEDIDO:</span><span>${currentOrder._id}</span></div>
        <div class="label-row"><span>MESA:</span><span>${selectedMesa?.number ?? ""}</span></div>
      </div>
      <div class="separator"></div>
      <div class="label-row" style="font-weight:bold">
        <span>Cant</span>
        <span style="margin-left:40px">Detalle</span>
      </div>
      <div class="separator"></div>
      <div class="items">
        ${itemsHtml}
      </div>
      <div class="separator"></div>
      <div class="label-row"><strong>Total</strong><strong>${totalFormatted}</strong></div>
      <div class="footnote">Calidad y Buen Servicio</div>
    `;
    const doc = w.document;
    doc.title = "COMANDA";
    doc.head.innerHTML = "";
    const styleEl = doc.createElement("style");
    styleEl.textContent = styleSheet;
    doc.head.appendChild(styleEl);
    doc.body.innerHTML = receiptHtml;
    setTimeout(() => {
      w.focus();
      w.print();
      w.close();
    }, 300);
  };

  const handlePrint = async (mode = "pending") => {
    if (!order?._id) return;
    const readyOrder = await ensureOrderReadyForPrint();
    if (!readyOrder) return;
    const rows = buildPrintableItems(readyOrder, mode);
    if (!rows.length) {
      enqueueSnackbar(
        mode === "pending"
          ? "No hay nuevos productos para imprimir."
          : "No hay productos en la comanda.",
        { variant: "warning" }
      );
      return;
    }
    triggerPrintWindow(readyOrder, rows);
    if (mode === "pending") {
      try {
        const ids = rows.map((it) => it._id);
        const { data } = await markOrderItemsPrinted(readyOrder._id, ids);
        if (data?.data) {
          setOrder(data.data);
          qc.invalidateQueries(["tables"]);
        }
      } catch {
        enqueueSnackbar("No se pudo marcar la comanda como impresa", {
          variant: "error",
        });
      }
    }
  };

  const printInvoiceTicket = (invoiceInfo, orderInfo) => {
    if (!invoiceInfo) return;
    const win = window.open("", "PRINT", "width=320,height=700,top=0,left=0");
    if (!win) return;

    const resolvedOrder =
      orderInfo && Array.isArray(orderInfo.items) && orderInfo.items.length
        ? orderInfo
        : order;
    const orderItems = Array.isArray(resolvedOrder?.items)
      ? resolvedOrder.items
      : [];
    const invoiceItemsForDiscount = Array.isArray(invoiceInfo.items)
      ? invoiceInfo.items
      : orderItems;

    const business = invoiceInfo.issuer || {};
    const customerName = (
      invoiceInfo.customer?.name ||
      resolvedOrder?.customer?.name ||
      "CLIENTES VARIOS"
    ).toUpperCase();
    const tableNumber =
      resolvedOrder?.table?.number ?? selectedMesa?.number ?? "N/A";
    const pedidoId = resolvedOrder?._id || "";
    const regimen =
      orderItems.find((it) => it.tax?.regimen)?.tax?.regimen || "COMUN";

    const methodRaw =
      invoiceInfo.paymentMethod?.name ||
      invoiceInfo.paymentMethod?.rawName ||
      "";
    const methodLower = methodRaw.toLowerCase();
    const methodLabel = methodLower.includes("efectivo")
      ? "Efectivo"
      : methodLower.includes("datafono") || methodLower.includes("datáfono")
      ? "Datafono"
      : "Transferencia";
    const invoiceNumberPlain =
      (invoiceInfo.invoiceNumber || "")
        .replace(/^F-?/i, "")
        .replace(/^0+/, "") || "-";

    const formatMoney = (value) =>
      Number(value || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    const discountCode = (() => {
      const codes = invoiceItemsForDiscount
        .map((item) => item?.discount?.id)
        .filter((id) => id !== undefined && id !== null && String(id).trim() !== "");
      if (!codes.length) return "222222222222";
      return [...new Set(codes.map((code) => String(code)))].join(" | ");
    })();

    const totalsSource =
      (invoiceInfo.totals && invoiceInfo.totals.total > 0
        ? invoiceInfo.totals
        : resolvedOrder?.bills) || {};
    const subtotalFormatted = formatMoney(totalsSource.subtotal || 0);
    const taxFormatted = formatMoney(totalsSource.tax || totalsSource.totalTax || 0);
    const tipFormatted = formatMoney(invoiceInfo.tip || 0);
    const totalFormatted = formatMoney(totalsSource.total || 0);
    const changeFormatted = formatMoney(invoiceInfo.change || 0);

    const dateObj = new Date(invoiceInfo.createdAt || Date.now());
    const dateStr = dateObj.toLocaleDateString("es-CO");
    const timeStr = dateObj.toLocaleTimeString("es-CO");

    const rangeText =
      import.meta.env.VITE_BILL_RANGE || "Rango autorizado: 0001 al 9999";

    const itemRows =
      orderItems.length > 0
        ? orderItems
            .map((it) => {
              const rowTotal =
                Number(it.price || 0) * Math.max(1, Number(it.quantity || 0));
              const taxRate =
                it.taxRate ??
                it.tax?.percentage ??
                it.tax?.porcentaje ??
                it.tax?.valor ??
                0;
              return `
                <tr>
                  <td class="col-qty">${it.quantity}</td>
                  <td class="col-desc">
                    ${(it.name || "").toUpperCase()}
                    ${it.note ? `<div class="note">Nota: ${it.note}</div>` : ""}
                  </td>
                  <td class="col-inc">${taxRate ? `${taxRate}%` : "-"}</td>
                  <td class="col-total">${formatMoney(rowTotal)}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="4">Sin productos</td></tr>`;

    const styleSheet = `
      @page {
        size: 80mm 220mm;
        margin: 0;
      }
      * { box-sizing: border-box; }
      :root,
      html,
      body {
        width: 80mm !important;
        min-width: 80mm !important;
        max-width: 80mm !important;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #111;
      }
      #invoice-ticket {
        width: 100%;
        padding: 4mm;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .center { text-align: center; }
      .header { margin-bottom: 6px; }
      .header strong { display: block; }
      .section { margin-bottom: 6px; }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .info-column {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .info-label {
        font-weight: bold;
        text-transform: uppercase;
      }
      .info-value {
        display: block;
        margin-top: 2px;
      }
      .fact-data {
        margin-top: 4px;
        font-size: 11px;
        text-align: center;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }
      .items-table th,
      .items-table td {
        border-bottom: 1px dashed #000;
        padding: 2px 0;
      }
      .col-qty { width: 10mm; text-align: left; }
      .col-desc { width: 38mm; }
      .col-inc { width: 12mm; text-align: right; }
      .col-total { width: 18mm; text-align: right; }
      .note { font-size: 10px; text-transform: none; }
      .summary { margin-top: 6px; }
      .summary .row {
        display: flex;
        justify-content: space-between;
      }
      .separator { border-top: 1px dashed #000; margin: 4px 0; }
      .footnote, .legal { text-align: center; margin-top: 8px; font-size: 11px; }
    `;
    const receiptHtml = `
      <div id="invoice-ticket">
        <div class="header center">
          <strong>${(business.businessName || "NATIVHOS").toUpperCase()}</strong>
          <div>NIT: ${business.nit || ""}</div>
          <div>${business.address || ""}</div>
          <div>Cel: ${business.phone || ""}</div>
        </div>
        <div class="section info-grid">
          <div class="info-column">
            <div>
              <span class="info-label">VENTA:</span>
              <span class="info-value">${methodLabel}</span>
            </div>
            <div>
              <span class="info-label">CLIENTE:</span>
              <span class="info-value">${customerName}</span>
            </div>
            <div>
              <span class="info-label">DTO:</span>
              <span class="info-value">${discountCode}</span>
            </div>
          </div>
          <div class="info-column">
            <div>
              <span class="info-label">FECHA:</span>
              <span class="info-value">${dateStr}</span>
            </div>
            <div>
              <span class="info-label">HORA:</span>
              <span class="info-value">${timeStr}</span>
            </div>
            <div>
              <span class="info-label">PEDIDO:</span>
              <span class="info-value">${pedidoId || "-"}</span>
            </div>
            <div>
              <span class="info-label">MESA:</span>
              <span class="info-value">${tableNumber}</span>
            </div>
          </div>
          <div class="info-column">
            <div>
              <span class="info-label">RÉGIMEN:</span>
              <span class="info-value">${regimen}</span>
            </div>
            <div>
              <span class="info-label">FACTURA:</span>
              <span class="info-value">${invoiceNumberPlain}</span>
            </div>
          </div>
        </div>
        <div class="fact-data">
          <div>Factura de venta POS Número ${invoiceNumberPlain}</div>
          <div>${rangeText}</div>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-qty">Cant</th>
              <th class="col-desc">Detalle</th>
              <th class="col-inc">INC</th>
              <th class="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        <div class="summary">
          <div class="row"><strong>Sub Total</strong><strong>${subtotalFormatted}</strong></div>
          <div class="row"><strong>Impuestos</strong><strong>${taxFormatted}</strong></div>
          <div class="row"><strong>Propina</strong><strong>${tipFormatted}</strong></div>
          <div class="row"><strong>Total</strong><strong>${totalFormatted}</strong></div>
          ${invoiceInfo.change ? `<div class="row"><span>Cambio</span><span>${changeFormatted}</span></div>` : ""}
        </div>
        <div class="footnote">Calidad y Buen Servicio</div>
        <div class="legal">
          Esta factura se asimila para sus efectos legales a una letra<br/>
          de cambio según el art. 774 del código de comercio.<br/>
          Con este título valor, el comprador declara haber recibido<br/>
          mercancía y/o servicio a satisfacción.
        </div>
      </div>
    `;

    const printableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>FACTURA</title>
          <style>${styleSheet}</style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `;
    const doc = win.document;
    doc.open();
    doc.write(printableHtml);
    doc.close();
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
    }, 300);
  };

  const handleInvoiceSubmit = () => {
    if (!order?._id) return;
    if (!selectedPayMethod) {
      enqueueSnackbar("Selecciona un método de pago", { variant: "warning" });
      return;
    }
    if (isCashMethod) {
      if (!invoiceForm.amount) {
        enqueueSnackbar("Ingresa el monto recibido", { variant: "warning" });
        return;
      }
      if (cashAmountValue < finalInvoiceTotal) {
        enqueueSnackbar("El monto recibido es insuficiente", {
          variant: "warning",
        });
        return;
      }
    }
    const payload = {
      orderId: order._id,
      paymentMethodId: selectedPayMethod._id,
      paymentMethod: selectedPayMethod.name,
      paymentType: isCashMethod ? "CONTADO" : "ELECTRONICO",
      cashAmount: isCashMethod ? cashAmountValue : undefined,
      tipAmount: invoiceTipValue,
      customerData: order.customer
        ? {
            name: order.customer.name,
            nit:
              order.customer.document ||
              order.customer.nit ||
              "222222222222",
            phone: order.customer.phone || null,
            email: order.customer.email || null,
          }
        : undefined,
    };
    invoiceMutation.mutate(payload);
  };

	return (
	  <>
	    <section className="page-shell text-[#f5f5f5]">
      <div className="page-shell__content space-y-4">
      {/* Header total sticky */}
      <div className="sticky top-[5rem] z-10 bg-[#1f1f1f] py-3 px-2 mb-2 flex flex-wrap gap-3 items-center justify-between border-b border-[#2a2a2a]">
          <button
            type="button"
            onClick={() => {
              setView("tables");
              setSelectedMesa(null);
            }}
            className="text-left text-[#f5f5f5] text-xl font-bold hover:text-[#2F974D] transition-colors"
            title="Volver a las mesas"
          >
            Total $ {(order?.bills?.total || 0).toLocaleString()}
            {order?.orderStatus &&
              (isStaff ? (
                <select
                  value={String(order.orderStatus || "").toUpperCase()}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="ml-3 bg-[#1f1f1f] border border-[#333] rounded px-2 py-1 text-xs text-[#f5f5f5]"
                  disabled={String(order.orderStatus || "").toUpperCase() === "CERRADO"}
                >
                  {orderStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="ml-3 text-sm text-[#ababab]">
                  ({String(order.orderStatus).toUpperCase()})
                </span>
              ))}
          </button>
	          {order?._id && (
	            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handlePrint("pending")}
                disabled={!hasPendingItems}
                className={`rounded px-3 py-2 flex items-center gap-2 ${
                  hasPendingItems
                    ? "bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5]"
                    : "bg-[#1f1f1f] text-[#555] cursor-not-allowed"
                }`}
              >
                <FaLock /> Imprimir Comanda
              </button>
              <button
                onClick={() => handlePrint("all")}
                disabled={!order.items || order.items.length === 0}
                className={`rounded px-3 py-2 flex items-center gap-2 ${
                  order.items && order.items.length
                    ? "bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5]"
                    : "bg-[#1f1f1f] text-[#555] cursor-not-allowed"
                }`}
              >
                <FaRedo /> ReImprimir
              </button>
              {canInvoice && (
                <button
                  onClick={() => {
                    if (!payMethods.length) {
                      enqueueSnackbar(
                        "No hay métodos de pago activos",
                        { variant: "warning" }
                      );
                      return;
                    }
                    setInvoiceForm((prev) => ({
                      ...prev,
                      methodId: prev.methodId || payMethods[0]._id,
                    }));
                    setShowInvoiceModal(true);
                  }}
                  className="rounded px-3 py-2 flex items-center gap-2 bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5]"
                  title="Facturar pedido"
                >
                  <FaPrint /> Facturar
                </button>
              )}
            </div>
          )}
	          {canDeleteOrder && (
	            <button
	              onClick={handleDeleteOrder}
	              className="rounded px-3 py-2 flex items-center gap-2 bg-red-700 hover:bg-red-800 text-[#f5f5f5]"
	            >
	              <FaTrash /> Eliminar Pedido
	            </button>
	          )}
	        </div>

	        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
	          {/* Left: order detail */}
	          <div className="col-span-12 xl:col-span-4 page-card page-card--light space-y-3">
	            <div className="flex justify-between text-[#ababab] mb-2">
	              <span>Mesa {selectedMesa?.number ?? "-"}</span>
	              <span>Pedido {order?._id ?? "-"}</span>
	            </div>
	            <div className="table-scroll np-scroll">
	            <table className="w-full text-left text-sm">
	              <thead className="text-[#ababab]">
                <tr>
                  <th className="py-1">Cant</th>
                  <th className="py-1">Valor</th>
                  <th className="py-1">Desc</th>
                  <th className="py-1">Total</th>
                  <th className="py-1">Opciones</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it) => {
                  const quantity = Number(it.quantity || 0);
                  const price = Number(it.price || 0);
                  const total = price * quantity;
                  return (
                    <tr key={it._id} className="border-t border-[#2a2a2a]">
                      <td className="py-1 align-top">{quantity}</td>
                      <td className="py-1 align-top">
                        {price.toLocaleString()}
                      </td>
                      <td className="py-1 align-top">
                        <div className="font-semibold text-[#f5f5f5]">
                          {it.name || "Sin nombre"}
                        </div>
                        {it.note ? (
                          <div className="text-xs text-[#ababab] mt-1">
                            Nota: {it.note}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-1 align-top">
                        {total.toLocaleString()}
                      </td>
                      <td className="py-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => updItem(it, -1)}
                            className="px-2 py-1 bg-[#2e2e2e] rounded"
                            title="Quitar uno"
                          >
                            <FaMinus />
                          </button>
                          <button
                            onClick={() => updItem(it, +1)}
                            className="px-2 py-1 bg-[#2e2e2e] rounded"
                            title="Agregar uno"
                          >
                            <FaPlus />
                          </button>
                          <button
                            onClick={() => setNote(it)}
                            className="px-2 py-1 bg-[#2e2e2e] rounded inline-flex items-center gap-1"
                            title="Nota para cocina"
                          >
                            <FaStickyNote /> Nota
                          </button>
                          <button
                            onClick={() => setMoveItem(it)}
                            className="px-2 py-1 bg-[#2e2e2e] rounded inline-flex items-center gap-1"
                            title="Mover a otra mesa"
                          >
                            <FaExchangeAlt /> Mover
                          </button>
                          <button
                            onClick={() =>
                              canRemoveItems ? removeItem(it) : null
                            }
                            disabled={!canRemoveItems}
                            className={`px-2 py-1 rounded inline-flex items-center gap-1 ${
                              canRemoveItems
                                ? "bg-red-700 hover:bg-red-800"
                                : "bg-[#3a1f1f] text-[#a97b7b] cursor-not-allowed"
                            }`}
                            title={
                              canRemoveItems
                                ? "Eliminar del pedido"
                                : "Solo un administrador puede quitar productos despues de confirmar"
                            }
                          >
                            <FaTrash /> Quitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
	            </table>
	            </div>
            <div className="mt-4 text-xs text-[#ababab] space-y-1">
              <div>
                Pedido a:{" "}
                <span className="text-[#f5f5f5] font-semibold">
                  {order?.cashierName || "No asignado"}
                </span>
              </div>
              <div>
                Pedido por:{" "}
                {isStaff && order?._id ? (
                  canAssignCustomer ? (
                    <button
                      onClick={openCustomerModal}
                      className="text-[#f5f5f5] font-semibold underline underline-offset-2 hover:text-yellow-400 transition-colors"
                      type="button"
                    >
                      {hasCustomerAssigned
                        ? order.customer.name
                        : "Asignar cliente"}
                    </button>
                  ) : (
                    <span className="text-[#f5f5f5] font-semibold">
                      {hasCustomerAssigned
                        ? order.customer.name
                        : "Sin asignar"}
                    </span>
                  )
                ) : (
                  <span className="text-[#f5f5f5] font-semibold">
                    {hasCustomerAssigned ? order.customer.name : "Sin asignar"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: view switch */}
	          <div className="col-span-12 xl:col-span-8 page-card page-card--light">
	            <div className="flex flex-wrap items-center gap-2 mb-3">
	              <button
	                onClick={() => setView("tables")}
                className={`px-3 py-1 rounded ${
                  view === "tables"
                    ? "bg-[#2e2e2e] text-[#f5f5f5]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#333]"
                }`}
              >
                Mesas
              </button>
              <button
                onClick={() => setView("products")}
                className={`px-3 py-1 rounded ${
                  view === "products"
                    ? "bg-[#2e2e2e] text-[#f5f5f5]"
                    : "bg-[#1f1f1f] text-[#ababab] border border-[#333]"
                }`}
              >
                Productos
              </button>
	              {view === "products" && (
	                <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row sm:items-center gap-2">
	                  <FaSearch className="text-[#ababab]" />
	                  <input
	                    value={search}
	                    onChange={(e) => setSearch(e.target.value)}
	                    placeholder="Buscar producto"
	                    className="bg-[#111] border border-[#333] rounded px-2 py-2 text-[#f5f5f5] w-full sm:w-56"
	                  />
	                </div>
	              )}
            </div>

	            {view === "tables" ? (
	              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {tables.map((t) => {
                  const isSelected = selectedMesa?._id === t._id;
                  const isBooked = t.status === "Booked";
                  const isPending = t.status === "PendingApproval";
                  const cardClasses = [
                    "cursor-pointer",
                    "p-4",
                    "rounded",
                    "border",
                    "text-center",
                    "text-[#f5f5f5]",
                    isSelected
                      ? "border-yellow-500 bg-[#262626]"
                      : "border-[#2a2a2a] bg-[#1f1f1f]",
                    isBooked && !isSelected
                      ? "border-red-500/70 bg-[#2a1515]"
                      : "",
                    isPending && !isSelected
                      ? "border-amber-400/70 bg-[#2a2415]"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={t._id}
                      onClick={() => handleSelectMesa(t)}
                      className={cardClasses}
                    >
                      <div className="text-lg font-bold flex items-center justify-center gap-2">
                        {String(t.number).padStart(2, "0")}
                        {isBooked ? (
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#f97373]">
                            Ocupada
                          </span>
                        ) : isPending ? (
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#facc15]">
                            Por aprobar
                          </span>
                        ) : null}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMesa(t);
                          setView("products");
                        }}
                        className="mt-2 bg-[#2e2e2e] hover:bg-[#3a3a3a] rounded px-2 py-1 inline-flex items-center gap-1"
                      >
                        <FaShoppingCart /> Agregar
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProds.groups.map((g) => (
                  <div key={g.cat._id}>
                    <h3 className="text-[#ababab] mb-1">{g.cat.name}</h3>
	                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {g.items.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            if (!selectedMesa) return;
                            const payload = {
                              productId: p.baseProductId || p._id,
                              price: p.price,
                              originalPrice:
                                p.originalPrice ?? p.pricePerQuantity ?? p.price,
                              discount: p.isDiscountProduct ? p.discount : null,
                            };
                            addMutation.mutate({
                              mesaId: selectedMesa._id,
                              payload,
                            });
                          }}
                          className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] rounded p-3 text-left flex flex-col gap-2"
                        >
                          <div className="w-full h-32 rounded-md bg-[#111] overflow-hidden box-border flex items-center justify-center">
                            <img
                              src={p.imageSrc || "https://via.placeholder.com/300x200?text=Sin+imagen"}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="text-[#f5f5f5] font-semibold">
                            {p.name}
                          </div>
                          <div className="text-[#ababab]">
                            {p.isDiscountProduct && p.originalPrice ? (
                              <>
                                <span className="line-through text-[#777] mr-2">
                                  ${p.originalPrice.toLocaleString()}
                                </span>
                                <span>${p.price.toLocaleString()}</span>
                              </>
                            ) : (
                              <>${p.price.toLocaleString()}</>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredProds.noCat.length > 0 && (
                  <div>
                    <h3 className="text-[#ababab] mb-1">Sin Categori­a</h3>
	                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredProds.noCat.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            if (!selectedMesa) return;
                            const payload = {
                              productId: p.baseProductId || p._id,
                              price: p.price,
                              originalPrice:
                                p.originalPrice ?? p.pricePerQuantity ?? p.price,
                              discount: p.isDiscountProduct ? p.discount : null,
                            };
                            addMutation.mutate({
                              mesaId: selectedMesa._id,
                              payload,
                            });
                          }}
                          className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] rounded p-3 text-left flex flex-col gap-2"
                        >
                          <div className="w-full h-32 rounded-md bg-[#111] overflow-hidden box-border flex items-center justify-center">
                            <img
                              src={p.imageSrc || "https://via.placeholder.com/300x200?text=Sin+imagen"}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="text-[#f5f5f5] font-semibold">
                            {p.name}
                          </div>
                          <div className="text-[#ababab]">
                            {p.isDiscountProduct && p.originalPrice ? (
                              <>
                                <span className="line-through text-[#777] mr-2">
                                  ${p.originalPrice.toLocaleString()}
                                </span>
                                <span>${p.price.toLocaleString()}</span>
                              </>
                            ) : (
                              <>${p.price.toLocaleString()}</>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
	      </div>
	      </section>
      {moveItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#262626] border border-[#333] rounded-lg p-6 w-[420px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">
              Mover Producto
            </h3>
            <p className="text-[#ababab] text-sm mb-4">
              Selecciona la mesa destino para{" "}
              <span className="text-[#f5f5f5] font-semibold">
                {moveItem.name}
              </span>
              .
            </p>
            <div className="grid grid-cols-3 gap-3">
              {availableTables.length === 0 ? (
                <p className="text-[#ababab] col-span-3 text-sm">
                  No hay otras mesas disponibles.
                </p>
              ) : (
                availableTables.map((t) => (
                  <button
                    key={t._id}
                    onClick={() =>
                      moveMutation.mutate({
                        itemId: moveItem._id,
                        mesaId: t._id,
                      })
                    }
                    disabled={moveMutation.isPending}
                    className={`p-3 rounded border text-[#f5f5f5] ${
                      moveMutation.isPending
                        ? "bg-[#1f1f1f] border-[#333] cursor-wait"
                        : "bg-[#1f1f1f] border-[#2a2a2a] hover:bg-[#262626]"
                    }`}
                  >
                    Mesa {String(t.number).padStart(2, "0")}
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setMoveItem(null)}
                className="px-4 py-2 bg-[#2e2e2e] hover:bg-[#3a3a3a] rounded text-[#f5f5f5]"
                disabled={moveMutation.isPending}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#262626] border border-[#333] rounded-lg p-6 w-[480px] max-h-[85vh] overflow-y-auto">
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-3">
              Asignar cliente al pedido
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#ababab] mb-1">
                  Nombre manual
                </label>
                <input
                  value={customerManualName}
                  onChange={(e) => setCustomerManualName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#ababab] mb-1">
                  Telefono (opcional)
                </label>
                <input
                  value={customerManualPhone}
                  onChange={(e) => setCustomerManualPhone(e.target.value)}
                  placeholder="+57 3000000000"
                  className="w-full bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAssignManual}
                  disabled={assignCustomerMutation.isPending}
                  className={`px-4 py-2 rounded ${
                    assignCustomerMutation.isPending
                      ? "bg-[#3a3a3a] text-[#777]"
                      : "bg-[#2F974D] text-[#1a1a1a] hover:bg-[#277f41]"
                  }`}
                >
                  Guardar nombre
                </button>
                {hasCustomerAssigned && (
                  <button
                    onClick={handleClearCustomer}
                    disabled={assignCustomerMutation.isPending}
                    className="px-4 py-2 rounded bg-[#2e2e2e] text-[#f5f5f5] hover:bg-[#3a3a3a]"
                  >
                    Quitar asignacion
                  </button>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#333]">
              <label className="block text-sm text-[#ababab] mb-2">
                Buscar usuario registrado
              </label>
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar por nombre, correo o telefono"
                className="w-full bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
              />
              <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                {customerSearchLoading ? (
                  <p className="text-[#ababab] text-sm">Buscando...</p>
                ) : customerResults.length === 0 ? (
                  <p className="text-[#ababab] text-sm">Sin resultados</p>
                ) : (
                  customerResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleAssignUser(u._id)}
                      disabled={assignCustomerMutation.isPending}
                      className="w-full text-left bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                    >
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-[#ababab]">
                        {u.email || "Sin correo"}{" "}
                        {u.phone ? `| ${u.phone}` : ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setShowCustomerModal(false)}
                disabled={assignCustomerMutation.isPending}
                className="px-4 py-2 rounded bg-[#2e2e2e] text-[#f5f5f5] hover:bg-[#3a3a3a]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showInvoiceModal && (
        <Modal
          isOpen={showInvoiceModal}
          onClose={closeInvoiceModal}
          title="Facturar pedido"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#ababab] mb-1">
                  Medio de pago
                </label>
                <select
                  value={invoiceForm.methodId}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      methodId: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                >
                  <option value="">Selecciona</option>
                  {payMethods.map((pm) => (
                    <option key={pm._id} value={pm._id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-[#f5f5f5] flex flex-col justify-end">
                <span className="text-[#ababab]">Cliente</span>
                <span className="font-semibold">
                  {customerDisplayName || "Clientes Varios"}
                </span>
              </div>
            </div>

            {isCashMethod && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#ababab] mb-1">
                    Monto recibido
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.amount}
                    onChange={(e) =>
                      setInvoiceForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="w-full bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#ababab] mb-1">
                    Cambio
                  </label>
                  <input
                    disabled
                    value={invoiceChange.toLocaleString("es-CO")}
                    className="w-full bg-[#262626] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#ababab] mb-1">
                  Propina opcional
                </label>
                <input
                  type="number"
                  min="0"
                  value={invoiceForm.tip}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      tip: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-[#f5f5f5]"
                />
              </div>
              <div className="text-sm text-[#f5f5f5] flex flex-col justify-end">
                <span className="text-[#ababab]">Mesa</span>
                <span className="font-semibold">
                  {selectedMesa?.number ??
                    order?.table?.number ??
                    "Sin mesa"}
                </span>
              </div>
            </div>

            <div className="border border-[#333] rounded max-h-48 overflow-y-auto">
              <table className="w-full text-left text-sm text-[#f5f5f5]">
                <thead className="bg-[#333] text-[#ababab]">
                  <tr>
                    <th className="p-2">Cant</th>
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order?.items || []).map((it) => {
                    const total =
                      Number(it.price || 0) * Number(it.quantity || 0);
                    return (
                      <tr key={it._id} className="border-b border-[#2a2a2a]">
                        <td className="p-2">{it.quantity}</td>
                        <td className="p-2">
                          <div className="font-semibold">{it.name}</div>
                          <div className="text-xs text-[#ababab]">
                            {it.tax?.regimen || "Regimen Comun"}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          {total.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-sm text-[#f5f5f5]">
              <div className="label-row">
                <span>Sub total</span>
                <span>
                  {(order?.bills?.subtotal || 0).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="label-row">
                <span>Impuestos</span>
                <span>
                  {(order?.bills?.tax || 0).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="label-row">
                <span>Propina</span>
                <span>{invoiceTipValue.toLocaleString("es-CO")}</span>
              </div>
              <div className="label-row font-semibold text-base">
                <span>Total a pagar</span>
                <span>{finalInvoiceTotal.toLocaleString("es-CO")}</span>
              </div>
              {isCashMethod && (
                <div className="label-row text-[#ababab]">
                  <span>Cambio estimado</span>
                  <span>{invoiceChange.toLocaleString("es-CO")}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeInvoiceModal}
                disabled={invoiceMutation.isPending}
                className="px-4 py-2 rounded bg-[#2e2e2e] text-[#f5f5f5] hover:bg-[#3a3a3a]"
              >
                Atrás
              </button>
              <button
                onClick={handleInvoiceSubmit}
                disabled={invoiceMutation.isPending || !selectedPayMethod}
                className={`px-4 py-2 rounded ${
                  invoiceMutation.isPending || !selectedPayMethod
                    ? "bg-[#3a3a3a] text-[#777]"
                    : "bg-[#2F974D] text-[#1a1a1a] hover:bg-[#277f41]"
                }`}
              >
                {invoiceMutation.isPending ? "Facturando..." : "Facturar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Sales;
