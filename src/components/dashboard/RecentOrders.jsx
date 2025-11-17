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
} from "../../https/index";
import { formatDateAndTime } from "../../utils";

const STATUS_REQUIRING_TABLE = new Set(["PENDIENTE", "LISTO", "READY"]);

const RecentOrders = () => {
  const queryClient = useQueryClient();
  const [tablePrompt, setTablePrompt] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all | today
  const [range, setRange] = useState({ from: "", to: "" });

  const orderStatusUpdateMutation = useMutation({
    mutationFn: ({ orderId, orderStatus, tableId }) =>
      updateOrderStatus({ orderId, orderStatus, tableId }),
  });

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => await getOrders(),
    placeholderData: keepPreviousData,
  });
  const orders = useMemo(() => {
    const base = Array.isArray(resData?.data?.data) ? resData.data.data : [];
    const filteredByItems = base.filter((order) => (order?.items?.length || 0) > 0);
    const today = new Date();
    const startRange = range.from ? new Date(range.from) : null;
    const endRange = range.to ? new Date(range.to) : null;

    return filteredByItems.filter((order) => {
      const orderDate = order?.orderDate ? new Date(order.orderDate) : null;
      if (!orderDate || Number.isNaN(orderDate.getTime())) return false;

      if (statusFilter === "today") {
        const sameDay =
          orderDate.getFullYear() === today.getFullYear() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getDate() === today.getDate();
        if (!sameDay) return false;
      }

      if (startRange && orderDate < startRange) return false;
      if (endRange) {
        const endOfDay = new Date(endRange);
        endOfDay.setHours(23, 59, 59, 999);
        if (orderDate > endOfDay) return false;
      }

      return true;
    });
  }, [resData, statusFilter, range]);

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

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (isError) {
      enqueueSnackbar("Something went wrong!", { variant: "error" });
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
      const candidateValues = [];
      if (typeof table === "number") {
        candidateValues.push(table);
      } else if (typeof table === "string") {
        const parsed = Number(table);
        if (Number.isFinite(parsed)) candidateValues.push(parsed);
      } else if (table && typeof table === "object") {
        candidateValues.push(
          table.tableId,
          table.id,
          table._id,
          table.number,
          table.tableNo
        );
      }
      for (const candidate of candidateValues) {
        const num = Number(candidate);
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

  const commitStatusChange = useCallback(
    (order, status, tableId) => {
      if (!order?._id) return;
      orderStatusUpdateMutation.mutate(
        { orderId: order._id, orderStatus: status, tableId },
        {
          onSuccess: () => {
            enqueueSnackbar("Order status updated successfully!", {
              variant: "success",
            });
            queryClient.invalidateQueries(["orders"]);
            setTablePrompt(null);
          },
          onError: (error) => {
            const responseStatus = error?.response?.status;
            if (responseStatus === 409) {
              enqueueSnackbar(
                "La mesa seleccionada está ocupada. Elige otra mesa.",
                {
                  variant: "warning",
                }
              );
              setTablePrompt({ order, status, reason: "occupied" });
            } else if (responseStatus === 400 && requiresTable(status)) {
              enqueueSnackbar(
                error?.response?.data?.message ||
                  "Selecciona una mesa para continuar.",
                { variant: "info" }
              );
              setTablePrompt({ order, status, reason: "missing" });
            } else {
              enqueueSnackbar("Failed to update order status!", {
                variant: "error",
              });
            }
          },
        }
      );
    },
    [enqueueSnackbar, orderStatusUpdateMutation, queryClient, requiresTable]
  );

  const handleStatusChange = useCallback(
    (order, nextStatus) => {
      const status = normalizeStatus(nextStatus);
      if (!order?._id) return;
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
      enqueueSnackbar
    ]
  );

  const currentPromptTable = useMemo(
    () => (tablePrompt ? findTableRecordForOrder(tablePrompt.order) : null),
    [tablePrompt, findTableRecordForOrder]
  );

  return (
    <>
      <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
        <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">Ordenes de los clientes</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Todas" },
              { id: "today", label: "Hoy" },
            ].map((filter) => (
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
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[#ababab] text-sm flex items-center gap-2">
              Desde:
              <input
                type="date"
                value={range.from}
                onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-[#f5f5f5]"
              />
            </label>
            <label className="text-[#ababab] text-sm flex items-center gap-2">
              Hasta:
              <input
                type="date"
                value={range.to}
                onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-[#f5f5f5]"
              />
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[#f5f5f5]">
            <thead className="bg-[#333] text-[#ababab]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Items</th>
                <th className="p-3">Table No</th>
                <th className="p-3">Total</th>
                <th className="p-3 text-center">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const customerName = order?.customer?.name || "Sin nombre";
                const status = (
                  order?.orderStatus || "PENDIENTE"
                ).toUpperCase();
                const itemsCount = order?.items?.length || 0;
                const tableNo =
                  order?.table?.tableNo || order?.table?.number || "N/A";
                const total =
                  order?.bills?.totalWithTax ?? order?.bills?.total ?? 0;
                const payment =
                  order?.paymentMethod || order?.paymentStatus || "N/A";
                const orderId = order?._id || order?.id || index;
                const orderDate = order?.orderDate;

                return (
                  <tr
                    key={orderId}
                    className="border-b border-gray-600 hover:bg-[#333]"
                  >
                    <td className="p-4">#{orderId}</td>
                    <td className="p-4">{customerName}</td>
                    <td className="p-4">
                      <select
                        className={`bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-2 rounded-lg focus:outline-none ${
                          status === "READY" || status === "LISTO"
                            ? "text-green-500"
                            : "text-yellow-500"
                        }`}
                        value={status}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value)
                        }
                        disabled={status === "CERRADO" || status === "CLOSED"}
                      >
                        {orderStates.map((st) => (
                          <option
                            key={st}
                            value={st}
                            className="text-[#f5f5f5]"
                          >
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">{formatDateAndTime(orderDate)}</td>
                    <td className="p-4">{itemsCount} Items</td>
                    <td className="p-4">Table - {tableNo}</td>
                    <td className="p-4">$ {total}</td>
                    <td className="p-4 text-center">{payment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
            {currentPromptTable ? (
              <p className="text-[#f5f5f5] text-sm mb-3">
                Mesa actual:{" "}
                <span className="font-semibold">
                  Mesa {String(currentPromptTable.number).padStart(2, "0")}
                </span>{" "}
                (
                {currentPromptTable.status === "Booked"
                  ? "ocupada"
                  : currentPromptTable.status.toLowerCase()}
                )
              </p>
            ) : null}
            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {tables.length === 0 ? (
                <p className="col-span-3 text-[#ababab] text-sm">
                  No hay mesas registradas.
                </p>
              ) : (
                tables.map((tbl) => {
                  const disabled = tbl.status === "Booked";
                  const isAvailable = !disabled;
                  return (
                    <button
                      key={tbl._id}
                      disabled={disabled || orderStatusUpdateMutation.isPending}
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
                        {isAvailable ? "Disponible" : "Ocupada"}
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
                  disabled={orderStatusUpdateMutation.isPending}
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
