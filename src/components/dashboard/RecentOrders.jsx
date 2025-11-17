import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  getOrders,
  updateOrderStatus,
  getStates,
  getTables,
} from "../../https";
import { formatDateAndTime } from "../../utils";
import { useSelector } from "react-redux";

const STATUS_REQUIRING_TABLE = new Set(["PENDIENTE", "LISTO", "READY"]);
const DATE_FILTERS = [
  { id: "all", label: "Todo el tiempo" },
  { id: "30", label: "Últimos 30 días" },
  { id: "7", label: "Últimos 7 días" },
  { id: "custom", label: "Personalizado" },
];

const RecentOrders = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { role } = useSelector((state) => state.user);
  const roleLower = String(role || "").toLowerCase();
  const isAdmin = roleLower === "admin";
  const isStaff = isAdmin || roleLower === "cashier";
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [tablePrompt, setTablePrompt] = useState(null);

  const { data: ordersRes, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => await getOrders(),
    placeholderData: keepPreviousData,
  });

  const { data: statesRes } = useQuery({
    queryKey: ["order-states"],
    queryFn: async () => await getStates(3),
    placeholderData: keepPreviousData,
  });
  const orderStates = useMemo(
    () =>
      statesRes?.data?.data?.map((s) => (s.name || "").toUpperCase()) ?? [
        "PENDIENTE",
        "LISTO",
        "PAGADO",
      ],
    [statesRes]
  );

  const { data: tablesRes } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => await getTables(),
    placeholderData: keepPreviousData,
  });
  const tables = useMemo(() => tablesRes?.data?.data ?? [], [tablesRes]);
  const availableTables = useMemo(
    () => tables.filter((tbl) => tbl.status !== "Booked"),
    [tables]
  );

  useEffect(() => {
    if (isError) {
      enqueueSnackbar("Error cargando órdenes", { variant: "error" });
    }
  }, [enqueueSnackbar, isError]);

  const normalizeStatus = useCallback(
    (status) => String(status || "").toUpperCase(),
    []
  );
  const requiresTable = useCallback(
    (status) => STATUS_REQUIRING_TABLE.has(normalizeStatus(status)),
    [normalizeStatus]
  );

  const findTableRecordForOrder = useCallback(
    (order) => {
      if (!order) return null;
      const table = order.table;
      const candidates = [];
      if (typeof table === "number") candidates.push(table);
      else if (typeof table === "string") {
        const parsed = Number(table);
        if (Number.isFinite(parsed)) candidates.push(parsed);
      } else if (table && typeof table === "object") {
        candidates.push(
          table.tableId,
          table.id,
          table._id,
          table.number,
          table.tableNo
        );
      }
      for (const value of candidates) {
        const num = Number(value);
        if (!Number.isFinite(num)) continue;
        const record = tables.find(
          (tbl) => Number(tbl._id) === num || Number(tbl.number) === num
        );
        if (record) return record;
      }
      return null;
    },
    [tables]
  );

  const mutation = useMutation({
    mutationFn: ({ orderId, orderStatus, tableId }) =>
      updateOrderStatus({ orderId, orderStatus, tableId }),
    onSuccess: () => {
      qc.invalidateQueries(["orders"]);
      setTablePrompt(null);
    },
  });

  const commitStatusChange = useCallback(
    (order, status, tableId) => {
      if (!order?._id) return;
      if (!isStaff) return;
      const currentStatus = normalizeStatus(order.orderStatus);
      if (currentStatus === "PAGADO" || currentStatus === "CERRADO") {
        return;
      }
      if (normalizeStatus(status) === "CERRADO" && !isAdmin) {
        enqueueSnackbar("Solo un administrador puede cerrar una orden.", {
          variant: "warning",
        });
        return;
      }
      mutation.mutate(
        { orderId: order._id, orderStatus: status, tableId },
        {
          onError: (err) => {
            const responseStatus = err?.response?.status;
            if (responseStatus === 409) {
              enqueueSnackbar("Mesa ocupada, elige otra.", {
                variant: "warning",
              });
              setTablePrompt({ order, status, reason: "occupied" });
            } else if (responseStatus === 400 && requiresTable(status)) {
              enqueueSnackbar(
                err?.response?.data?.message ||
                  "Selecciona una mesa para continuar.",
                { variant: "info" }
              );
              setTablePrompt({ order, status, reason: "missing" });
            } else {
              enqueueSnackbar("No se pudo actualizar la orden", {
                variant: "error",
              });
            }
          },
        }
      );
    },
    [enqueueSnackbar, mutation, requiresTable]
  );

  const handleStatusChange = useCallback(
    (order, nextStatus) => {
      const status = normalizeStatus(nextStatus);
      if (!order?._id) return;
      if (!isStaff) return;
      const currentStatus = normalizeStatus(order.orderStatus);
      if (currentStatus === "PAGADO" || currentStatus === "CERRADO") return;
      if (status === "CERRADO" && !isAdmin) {
        enqueueSnackbar("Solo un administrador puede cerrar una orden.", {
          variant: "warning",
        });
        return;
      }
      const isCustomerOrder = Boolean(order?.customer?.userId);
      if (isCustomerOrder && requiresTable(status)) {
        const tableRecord = findTableRecordForOrder(order);
        if (!tableRecord) {
          setTablePrompt({ order, status, reason: "missing" });
          enqueueSnackbar("Selecciona una mesa para esta orden.", {
            variant: "info",
          });
          return;
        }
        commitStatusChange(order, status, tableRecord._id);
        return;
      }
      commitStatusChange(order, status);
    },
    [
      normalizeStatus,
      requiresTable,
      findTableRecordForOrder,
      commitStatusChange,
      enqueueSnackbar,
    ]
  );

  const orders = useMemo(() => {
    const base = Array.isArray(ordersRes?.data?.data) ? ordersRes.data.data : [];
    const withItems = base.filter((o) => (o?.items?.length || 0) > 0);
    let startRange = null;
    let endRange = null;
    if (rangeFilter === "custom") {
      startRange = customRange.from ? new Date(customRange.from) : null;
      endRange = customRange.to ? new Date(customRange.to) : null;
    } else if (rangeFilter !== "all") {
      const days = Number(rangeFilter);
      if (Number.isFinite(days) && days > 0) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        startRange = since;
      }
    }

    return withItems.filter((order) => {
      const orderDate = order?.orderDate ? new Date(order.orderDate) : null;
      if (!orderDate || Number.isNaN(orderDate.getTime())) return false;
      if (startRange && orderDate < startRange) return false;
      if (endRange) {
        const endOfDay = new Date(endRange);
        endOfDay.setHours(23, 59, 59, 999);
        if (orderDate > endOfDay) return false;
      }
      const status = normalizeStatus(order.orderStatus);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    });
  }, [ordersRes, rangeFilter, customRange, statusFilter, normalizeStatus]);

  return (
    <>
      <div className="page-card bg-[#262626]">
        <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
          Ordenes de los clientes
        </h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {[{ id: "all", label: "Todas" }, ...orderStates.map((st) => ({ id: st, label: st }))].map(
              (filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    statusFilter === filter.id
                      ? "bg-[#2F974D] text-[#0f2f1c]"
                      : "bg-[#2b2b2b] text-[#f5f5f5]"
                  }`}
                >
                  {filter.label}
                </button>
              )
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setRangeFilter(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  rangeFilter === filter.id
                    ? "bg-[#2F974D] text-[#0f2f1c]"
                    : "bg-[#2b2b2b] text-[#f5f5f5]"
                }`}
              >
                {filter.label}
              </button>
            ))}
            {rangeFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#f5f5f5]">
                <label className="flex items-center gap-2">
                  Desde:
                  <input
                    type="date"
                    value={customRange.from}
                    onChange={(e) =>
                      setCustomRange((prev) => ({ ...prev, from: e.target.value }))
                    }
                    className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Hasta:
                  <input
                    type="date"
                    value={customRange.to}
                    onChange={(e) =>
                      setCustomRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                    className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => {
            const status = normalizeStatus(order.orderStatus);
            const tableRecord = findTableRecordForOrder(order);
            const tableLabel =
              tableRecord?.name ||
              tableRecord?.tableNo ||
              tableRecord?._id ||
              order.table ||
              "-";
            const totalStr = Number(order.bills?.total || 0).toLocaleString();
            const orderDate = order?.orderDate ? new Date(order.orderDate) : null;
            const orderId = order._id || order.id;

            return (
              <div
                key={orderId}
                className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#ababab]">
                      #{order.orderNumber || orderId}
                    </p>
                    <h3 className="text-lg font-semibold">
                      {order.customer?.name || "Cliente"}
                    </h3>
                    <p className="text-xs text-[#8a8a8a]">
                      Mesa {tableLabel} · {order.items?.length || 0} ítems
                    </p>
                  </div>
                  {isStaff ? (
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className="bg-[#2b2b2b] border border-[#444] rounded px-2 py-1 text-sm text-[#f5f5f5]"
                      disabled={
                        status === "PAGADO" ||
                        status === "CERRADO" ||
                        mutation.isPending
                      }
                    >
                      {orderStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-[#ababab]">{status}</span>
                  )}
                </div>
                <div className="text-sm text-[#f5f5f5]">
                  {orderDate ? formatDateAndTime(orderDate) : "-"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#ababab]">Estado de pago:</span>
                  <span className="text-sm">{order.paymentStatus || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#ababab]">Total</span>
                  <span className="text-lg font-semibold">${totalStr}</span>
                </div>
              </div>
            );
          })}
        </div>
        {orders.length === 0 && (
          <p className="text-sm text-[#ababab] mt-4">No hay órdenes para este filtro.</p>
        )}
      </div>

      {tablePrompt && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center px-4">
          <div className="bg-[#262626] border border-[#333] rounded-lg p-6 w-[460px] max-w-full">
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-1">
              Asignar mesa
            </h3>
            <p className="text-[#ababab] text-sm mb-4">
              {tablePrompt.reason === "occupied"
                ? "La mesa seleccionada está ocupada. Elige a qué mesa mover la orden."
                : "Esta orden no tiene una mesa asignada. Selecciona una mesa para continuar."}
            </p>
            {(() => {
              const current = findTableRecordForOrder(tablePrompt.order);
              return current ? (
                <p className="text-[#f5f5f5] text-sm mb-3">
                  Mesa actual:{" "}
                  <span className="font-semibold">
                    Mesa {String(current.number).padStart(2, "0")}
                  </span>{" "}
                  (
                  {current.status === "Booked"
                    ? "ocupada"
                    : current.status.toLowerCase()}
                  )
                </p>
              ) : null;
            })()}
            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {tables.length === 0 ? (
                <p className="col-span-3 text-[#ababab] text-sm">
                  No hay mesas registradas.
                </p>
              ) : (
                tables.map((tbl) => {
                  const disabled = tbl.status === "Booked";
                  return (
                    <button
                      key={tbl._id}
                      disabled={disabled || mutation.isPending}
                      onClick={() =>
                        commitStatusChange(
                          tablePrompt.order,
                          tablePrompt.status,
                          tbl._id
                        )
                      }
                      className={`p-3 rounded border text-sm transition ${
                        disabled
                          ? "border-[#402727] bg-[#2a1b1b] text-[#a96b6b] cursor-not-allowed"
                          : "border-[#2a2a2a] bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#2e2e2e]"
                      }`}
                    >
                      <div className="font-semibold">
                        Mesa {String(tbl.number).padStart(2, "0")}
                      </div>
                      <div className="text-xs">
                        {disabled ? "Ocupada" : "Disponible"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex justify-between items-center mt-4 text-xs text-[#ababab]">
              <span>{availableTables.length} mesas disponibles</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTablePrompt(null)}
                  className="px-4 py-2 bg-[#333] hover:bg-[#3a3a3a] text-[#f5f5f5] rounded"
                  disabled={mutation.isPending}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecentOrders;
