import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  exportCashDeskMovements,
  getCashDeskHistory,
  getCashDeskMovements,
} from "../https";
import { enqueueSnackbar } from "notistack";

const RANGE_FILTERS = [
  { id: "all", label: "Todo el tiempo" },
  { id: "30", label: "Últimos 30 días" },
  { id: "7", label: "Últimos 7 días" },
];

const money = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const MovementsList = ({ cuadreId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["cashdesk-movements", cuadreId],
    queryFn: async () => {
      const res = await getCashDeskMovements({ cuadreId });
      return res?.data?.data || [];
    },
    enabled: Boolean(cuadreId),
  });

  if (!cuadreId) return null;

  return (
    <div className="mt-3 rounded-lg border border-[#2a2a2a] bg-[#111] text-sm">
      <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[11px] uppercase tracking-wide text-[#969696]">
        <span>Factura</span>
        <span>Método</span>
        <span className="text-right">Total</span>
        <span className="text-right">Propina</span>
        <span className="text-right">Fecha</span>
      </div>
      <div className="divide-y divide-[#1f1f1f]">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`mov-skeleton-${idx}`}
                className="grid grid-cols-5 gap-2 px-3 py-3 animate-pulse text-[#777]"
              >
                <span className="h-4 rounded bg-[#1f1f1f]" />
                <span className="h-4 rounded bg-[#1f1f1f]" />
                <span className="h-4 rounded bg-[#1f1f1f]" />
                <span className="h-4 rounded bg-[#1f1f1f]" />
                <span className="h-4 rounded bg-[#1f1f1f]" />
              </div>
            ))
          : data && data.length
          ? data.map((movement) => (
              <div
                key={movement.id}
                className="grid grid-cols-5 gap-2 px-3 py-3 text-[#f5f5f5]"
              >
                <span className="truncate">#{movement.numero_factura}</span>
                <span className="truncate text-[#cfcfcf]">
                  {movement.metodo_pago || "—"}
                </span>
                <span className="text-right">${money(movement.total)}</span>
                <span className="text-right text-[#cfcfcf]">
                  ${money(movement.propina)}
                </span>
                <span className="text-right text-[#cfcfcf]">
                  {movement.created_at
                    ? new Date(movement.created_at).toLocaleString("es-CO")
                    : "—"}
                </span>
              </div>
            ))
          : (
              <div className="px-3 py-3 text-[#ababab] text-sm">
                No hay movimientos para este cuadre.
              </div>
            )}
      </div>
    </div>
  );
};

const CashDeskHistory = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState("30");
  const [customDates, setCustomDates] = useState({ from: "", to: "" });
  const [expanded, setExpanded] = useState(null);

  const params = useMemo(() => {
    const payload = {};
    if (range === "custom") {
      if (customDates.from) {
        payload.startDate = new Date(customDates.from).toISOString();
      }
      if (customDates.to) {
        const d = new Date(customDates.to);
        d.setHours(23, 59, 59, 999);
        payload.endDate = d.toISOString();
      }
    } else if (range !== "all") {
      const days = Number(range);
      if (Number.isFinite(days) && days > 0) {
        const start = new Date();
        start.setDate(start.getDate() - days);
        payload.startDate = start.toISOString();
      }
    }
    return payload;
  }, [range, customDates]);

  const { data, isLoading } = useQuery({
    queryKey: ["cashdesk-history", params],
    queryFn: async () => {
      const res = await getCashDeskHistory(params);
      return res?.data?.data || [];
    },
    keepPreviousData: true,
  });

  const exportMutation = useMutation({
    mutationFn: (cuadreId) => exportCashDeskMovements({ cuadreId }),
    onSuccess: (response, cuadreId) => {
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: response.headers["content-type"],
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `movimientos-caja-${cuadreId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: () =>
      enqueueSnackbar("No se pudo exportar el archivo", { variant: "error" }),
  });

  const handleExport = (cuadreId) => {
    if (!cuadreId || exportMutation.isPending) return;
    exportMutation.mutate(cuadreId);
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("es-CO") : "—";

  return (
    <section className="page-shell text-white">
      <div className="page-shell__content space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-[#ababab]">
              Facturación
            </p>
            <h1 className="text-2xl font-bold">Historial de cuadres</h1>
            <p className="text-sm text-[#ababab]">
              Consulta cierres, totales por método y facturas asociadas.
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

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                    setCustomDates((prev) => ({
                      ...prev,
                      from: e.target.value,
                    }))
                  }
                  className="rounded border border-[#333] bg-[#1a1a1a] px-2 py-1 text-[#f5f5f5]"
                />
              </label>
              <label className="flex items-center gap-2">
                Hasta:
                <input
                  type="date"
                  value={customDates.to}
                  onChange={(e) =>
                    setCustomDates((prev) => ({
                      ...prev,
                      to: e.target.value,
                    }))
                  }
                  className="rounded border border-[#333] bg-[#1a1a1a] px-2 py-1 text-[#f5f5f5]"
                />
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`history-skel-${idx}`}
                  className="page-card space-y-3 animate-pulse"
                >
                  <div className="h-4 w-1/2 rounded bg-[#222]" />
                  <div className="h-3 w-2/3 rounded bg-[#222]" />
                  <div className="h-28 rounded bg-[#222]" />
                </div>
              ))
            : data && data.length
            ? data.map((cuadre) => (
                <div key={cuadre.id} className="page-card space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-[#ababab]">Cuadre #{cuadre.id}</p>
                      <p className="text-lg font-semibold">
                        Apertura: {formatDate(cuadre.openedAt)}
                      </p>
                      <p className="text-sm text-[#cfcfcf]">
                        Cierre: {formatDate(cuadre.closedAt)}
                      </p>
                      <p className="text-xs text-[#8a8a8a]">
                        {cuadre.openingUser?.name
                          ? `Apertura: ${cuadre.openingUser.name}`
                          : "Apertura sin asignar"}
                        {cuadre.closingUser?.name
                          ? ` · Cierre: ${cuadre.closingUser.name}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#6EF221]">
                      {cuadre.estado || "—"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Caja inicial</p>
                      <p className="text-lg font-semibold">${money(cuadre.saldoInicial)}</p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Caja total</p>
                      <p className="text-lg font-semibold">${money(cuadre.totals?.totalCaja)}</p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Efectivo</p>
                      <p className="text-lg font-semibold text-green-400">
                        ${money(cuadre.totals?.cash)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Datafono</p>
                      <p className="text-lg font-semibold text-blue-400">
                        ${money(cuadre.totals?.card)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Transferencias</p>
                      <p className="text-lg font-semibold text-blue-300">
                        ${money(cuadre.totals?.transfer)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Gastos</p>
                      <p className="text-lg font-semibold text-red-400">
                        ${money(cuadre.gastos)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">Diferencia</p>
                      <p
                        className={`text-lg font-semibold ${
                          Number(cuadre.diferencia || 0) >= 0
                            ? "text-green-300"
                            : "text-red-400"
                        }`}
                      >
                        ${money(cuadre.diferencia)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#111] p-3">
                      <p className="text-[#8a8a8a] text-xs uppercase">
                        Facturas / movimientos
                      </p>
                      <p className="text-lg font-semibold">
                        {cuadre.invoicesCount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => (prev === cuadre.id ? null : cuadre.id))
                      }
                      className="rounded-lg bg-[#1f1f1f] px-4 py-2 text-sm hover:bg-[#262626]"
                    >
                      {expanded === cuadre.id ? "Ocultar movimientos" : "Ver movimientos"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport(cuadre.id)}
                      disabled={exportMutation.isPending}
                      className="rounded-lg bg-[#1f1f1f] px-4 py-2 text-sm hover:bg-[#262626] disabled:opacity-50"
                    >
                      {exportMutation.isPending ? "Exportando..." : "Exportar XLS"}
                    </button>
                  </div>

                  {expanded === cuadre.id && <MovementsList cuadreId={cuadre.id} />}
                </div>
              ))
            : (
                <div className="col-span-full rounded-xl border border-[#2a2a2a] bg-[#111] p-6 text-center text-[#ababab]">
                  No se encontraron cuadres en este rango de fechas.
                </div>
              )}
        </div>
      </div>
    </section>
  );
};

export default CashDeskHistory;
