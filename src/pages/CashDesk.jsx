import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getCurrentCashDesk,
  openCashDesk,
  closeCashDesk,
  exportCashDeskMovements,
} from "../https";
import { enqueueSnackbar } from "notistack";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const CashDesk = () => {
  const navigate = useNavigate();
  const [showMovements, setShowMovements] = useState(false);
  const [openForm, setOpenForm] = useState({ saldoInicial: "" });
  const [closeForm, setCloseForm] = useState({
    saldoReal: "",
    gastos: "",
    observaciones: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cash-desk"],
    queryFn: async () => {
      const res = await getCurrentCashDesk();
      return res?.data?.data || null;
    },
  });

  const openMutation = useMutation({
    mutationFn: (payload) => openCashDesk(payload),
    onSuccess: () => {
      enqueueSnackbar("Caja abierta", { variant: "success" });
      setOpenForm({ saldoInicial: "" });
      refetch();
    },
    onError: (err) =>
      enqueueSnackbar(err?.response?.data?.message || "Error al abrir caja", {
        variant: "error",
      }),
  });

  const closeMutation = useMutation({
    mutationFn: (payload) => closeCashDesk(payload),
    onSuccess: () => {
      enqueueSnackbar("Caja cerrada", { variant: "success" });
      setCloseForm({ saldoReal: "", gastos: "", observaciones: "" });
      refetch();
    },
    onError: (err) =>
      enqueueSnackbar(err?.response?.data?.message || "Error al cerrar caja", {
        variant: "error",
      }),
  });

  const summaryRows = useMemo(() => {
    if (!data?.cuadre) return [];
    const totals = data.cuadre.totals || {};
    return [
      {
        label: "Caja inicial",
        value: data.cuadre.saldoInicial,
        color: "text-green-400",
      },
      {
        label: "Ventas de Contado",
        value: totals.cash,
        color: "text-green-400",
      },
      {
        label: "Ventas con Datafono",
        value: totals.card,
        color: "text-blue-400",
      },
      {
        label: "Ventas con Transferencia",
        value: totals.transfer,
        color: "text-blue-400",
      },
      {
        label: "Gastos",
        value: data.cuadre.gastos,
        color: "text-red-400",
      },
    ];
  }, [data]);

  const handleOpen = () => {
    const amount = Number(openForm.saldoInicial || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      enqueueSnackbar("Ingresa un saldo inicial válido", {
        variant: "warning",
      });
      return;
    }
    openMutation.mutate({ saldoInicial: amount });
  };

  const handleClose = () => {
    const saldoReal = Number(closeForm.saldoReal || 0);
    const gastos = Number(closeForm.gastos || 0);
    if (!Number.isFinite(saldoReal) || saldoReal < 0) {
      enqueueSnackbar("Ingresa el saldo real contado en caja", {
        variant: "warning",
      });
      return;
    }
    if (!window.confirm("¿Confirmas el cierre de la caja actual?")) {
      return;
    }
    closeMutation.mutate({
      saldoReal,
      gastos: Number.isFinite(gastos) ? gastos : 0,
      observaciones: closeForm.observaciones || undefined,
    });
  };

  const handleExport = async () => {
    if (!data?.cuadre?.id) return;
    try {
      const response = await exportCashDeskMovements({
        cuadreId: data.cuadre.id,
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: response.headers["content-type"],
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `movimientos-caja-${data.cuadre.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar("No se pudo exportar el archivo", { variant: "error" });
    }
  };

  if (isLoading) {
    return (
      <section className="bg-[#111] min-h-[calc(100vh-5rem)] px-6 py-6 text-white">
        <p>Cargando información...</p>
      </section>
    );
  }

  return (
    <section className="bg-[#111] min-h-[calc(100vh-5rem)] px-6 py-6 text-white overflow-y-auto">
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Relación de Caja</h1>
          <p className="text-sm text-[#ababab]">
            Perfil: {data?.cuadre?.openingUser?.name || "Sin asignar"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded bg-[#1f1f1f]"
          >
            Atrás
          </button>
          <button
            onClick={() => setShowMovements((prev) => !prev)}
            className="px-4 py-2 rounded bg-[#1f1f1f]"
          >
            Movimientos
          </button>
          <button
            onClick={handleExport}
            disabled={!data?.cuadre}
            className="px-4 py-2 rounded bg-[#1f1f1f] disabled:opacity-40"
          >
            Exportar XLS
          </button>
          {data?.cuadre ? (
            <button
              onClick={handleClose}
              disabled={closeMutation.isPending}
              className="px-4 py-2 rounded bg-red-600 disabled:opacity-40"
            >
              {closeMutation.isPending ? "Cerrando..." : "Cerrar Caja"}
            </button>
          ) : (
            <button
              onClick={handleOpen}
              disabled={openMutation.isPending}
              className="px-4 py-2 rounded bg-green-600 disabled:opacity-40"
            >
              {openMutation.isPending ? "Creando..." : "Abrir caja"}
            </button>
          )}
        </div>
      </div>

      {!data?.cuadre && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-lg">
          <h2 className="text-lg font-semibold mb-4">
            No hay caja abierta actualmente
          </h2>
          <label className="block text-sm text-[#ababab] mb-2">
            Caja inicial
          </label>
          <input
            type="number"
            min="0"
            value={openForm.saldoInicial}
            onChange={(e) =>
              setOpenForm({ saldoInicial: e.target.value })
            }
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 mb-4"
            placeholder="0"
          />
          <p className="text-sm text-[#ababab]">
            Sólo administradores y cajeros pueden abrir la caja.
          </p>
        </div>
      )}

      {data?.cuadre && (
        <>
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#ababab]">Estado</p>
                <p className="text-xl font-semibold">
                  {data.cuadre.estado || "ABIERTO"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#ababab]">Apertura</p>
                <p className="text-xl font-semibold">
                  {new Date(data.cuadre.openedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 border border-[#2a2a2a] rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-[#222] text-sm uppercase text-[#ababab]">
                <span className="px-4 py-3">Detalle</span>
                <span className="px-4 py-3 text-right">Valor</span>
              </div>
              {summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-2 border-t border-[#2a2a2a] text-[#f5f5f5]"
                >
                  <span className={`px-4 py-3 ${row.color}`}>{row.label}</span>
                  <span className="px-4 py-3 text-right">
                    $ {formatCurrency(row.value)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-2 border-t border-[#2a2a2a] bg-[#111] font-semibold text-[#f5f5f5]">
                <span className="px-4 py-3">Total Caja</span>
                <span className="px-4 py-3 text-right text-green-400">
                  $ {formatCurrency(data.cuadre.totals?.totalCaja || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Registrar cierre</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-[#ababab]">Saldo contado</label>
                <input
                  type="number"
                  min="0"
                  value={closeForm.saldoReal}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      saldoReal: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-[#ababab]">Gastos</label>
                <input
                  type="number"
                  min="0"
                  value={closeForm.gastos}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      gastos: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-[#ababab]">Observaciones</label>
                <input
                  type="text"
                  value={closeForm.observaciones}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      observaciones: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {showMovements && data?.movements && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Movimientos</h3>
          {data.movements.length === 0 ? (
            <p className="text-sm text-[#ababab]">Sin facturas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#222] text-[#ababab]">
                  <tr>
                    <th className="p-3">Factura</th>
                    <th className="p-3">Pedido</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Propina</th>
                    <th className="p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-[#2a2a2a]"
                    >
                      <td className="p-3">{movement.numero_factura}</td>
                      <td className="p-3">{movement.pedido_id || "-"}</td>
                      <td className="p-3">{movement.metodo_pago || "-"}</td>
                      <td className="p-3 text-right">
                        $ {formatCurrency(movement.total)}
                      </td>
                      <td className="p-3 text-right">
                        $ {formatCurrency(movement.propina)}
                      </td>
                      <td className="p-3">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CashDesk;
