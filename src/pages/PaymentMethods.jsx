import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getPayMethods,
  addPayMethod,
  updatePayMethod,
  deletePayMethod,
  setPayMethodEstado,
  getStates,
} from "../https";
import { enqueueSnackbar } from "notistack";

const PaymentMethods = () => {
  const { role } = useSelector((s) => s.user || {});
  const isAdmin = String(role || "").toLowerCase() === "admin";
  // const isStaff = isAdmin || String(role || "").toLowerCase() === "cashier";
  useEffect(() => {
    document.title = "NPOS | Métodos de Pago";
  }, []);
  const qc = useQueryClient();

  const { data: listRes } = useQuery({
    queryKey: ["paymethods"],
    queryFn: async () => await getPayMethods(),
    placeholderData: keepPreviousData,
  });
  const items = useMemo(() => listRes?.data?.data || [], [listRes]);
  const { data: estadosRes } = useQuery({
    queryKey: ["paymethod-states"],
    queryFn: async () => await getStates(5),
    placeholderData: keepPreviousData,
  });
  const estados = estadosRes?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload) => addPayMethod(payload),
    onSuccess: () => {
      enqueueSnackbar("Método creado", { variant: "success" });
      qc.invalidateQueries(["paymethods"]);
    },
    onError: () =>
      enqueueSnackbar("Error creando método", { variant: "error" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePayMethod(id, payload),
    onSuccess: () => {
      enqueueSnackbar("Método actualizado", { variant: "success" });
      qc.invalidateQueries(["paymethods"]);
    },
    onError: () =>
      enqueueSnackbar("Error actualizando método", { variant: "error" }),
  });
  const estadoMutation = useMutation({
    mutationFn: ({ id, estado_id }) => setPayMethodEstado(id, estado_id),
    onSuccess: () => {
      enqueueSnackbar("Estado actualizado", { variant: "success" });
      qc.invalidateQueries(["paymethods"]);
    },
    onError: () =>
      enqueueSnackbar("Error actualizando estado", { variant: "error" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deletePayMethod(id),
    onSuccess: () => {
      enqueueSnackbar("Método eliminado", { variant: "success" });
      qc.invalidateQueries(["paymethods"]);
    },
    onError: () =>
      enqueueSnackbar("Error eliminando método", { variant: "error" }),
  });

  const [newName, setNewName] = useState("");
  const [newEstado, setNewEstado] = useState("");

  const onCreate = () => {
    if (!newName.trim())
      return enqueueSnackbar("Nombre requerido", { variant: "warning" });
    createMutation.mutate({
      name: newName.trim(),
      estado_id: newEstado || undefined,
    });
    setNewName("");
    setNewEstado("");
  };

	return (
	  <section className="page-shell text-[#f5f5f5]">
	    <div className="page-shell__content">
	      <div className="page-card space-y-6">
	        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	          <h1 className="text-2xl font-bold">Métodos de Pago</h1>
	          <p className="text-sm text-[#ababab]">
	            Activa o desactiva los métodos aceptados desde cualquier dispositivo.
	          </p>
	        </div>
	        {isAdmin && (
	          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
	            <div className="flex flex-col">
	              <label className="block text-[#ababab] text-sm mb-1">Nombre</label>
	              <input
	                value={newName}
	                onChange={(e) => setNewName(e.target.value)}
	                className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white"
	                placeholder="Efectivo / Tarjeta"
	              />
	            </div>
	            <div className="flex flex-col">
	              <label className="block text-[#ababab] text-sm mb-1">Estado</label>
	              <select
	                value={newEstado}
	                onChange={(e) => setNewEstado(e.target.value)}
	                className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white"
	              >
	                <option value="">(por defecto: ACTIVO)</option>
	                {estados.map((e) => (
	                  <option key={e._id} value={e._id}>
	                    {e.name}
	                  </option>
	                ))}
	              </select>
	            </div>
	            <div className="flex items-end">
	              <button
	                onClick={onCreate}
	                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
	              >
	                Crear
	              </button>
	            </div>
	          </div>
	        )}

	        <div className="table-scroll np-scroll">
	          <table className="min-w-full text-left text-sm">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Estado</th>
              {isAdmin && <th className="p-3">Acciones</th>}
            </tr>
          </thead>
	          <tbody>
	            {items.map((pm) => (
	              <Row
	                key={pm._id}
	                pm={pm}
	                estados={estados}
	                isAdmin={isAdmin}
	                onSave={(payload) =>
	                  updateMutation.mutate({ id: pm._id, payload })
	                }
	                onSetEstado={(estado_id) =>
	                  estadoMutation.mutate({ id: pm._id, estado_id })
	                }
	                onDelete={() => deleteMutation.mutate(pm._id)}
	              />
	            ))}
	          </tbody>
	        </table>
	        </div>
	      </div>
	    </div>
	  </section>
	);
};

const Row = ({ pm, estados, isAdmin, onSave, onSetEstado, onDelete }) => {
  const [name, setName] = useState(pm.name);
  const [estado, setEstado] = useState(pm.estadoId || "");
  return (
    <tr className="border-b border-[#3a3a3a]">
      <td className="p-3">
        {isAdmin ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-56"
          />
        ) : (
          <span>{pm.name}</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1"
          >
            {estados.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSetEstado(estado)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            Guardar
          </button>
        </div>
      </td>
      {isAdmin && (
        <td className="p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave({ name, estado_id: estado })}
              className="bg-[#4BC81B] hover:bg-[#3aa114] text-[#1a1a1a] px-3 py-1 rounded"
            >
              Actualizar
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Eliminar
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

Row.propTypes = {
  pm: PropTypes.shape({
    _id: idType.isRequired,
    name: PropTypes.string,
    estadoId: idType,
  }).isRequired,
  estados: PropTypes.arrayOf(
    PropTypes.shape({
      _id: idType,
      name: PropTypes.string,
    })
  ).isRequired,
  isAdmin: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onSetEstado: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

Row.defaultProps = {
  isAdmin: false,
};

export default PaymentMethods;
