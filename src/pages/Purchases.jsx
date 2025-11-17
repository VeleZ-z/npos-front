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
  getPurchases,
  addPurchase,
  updatePurchase,
  updatePurchaseStock,
  deletePurchase,
  getProviders,
  getStates,
} from "../https";
import { enqueueSnackbar } from "notistack";
import { Link } from "react-router-dom";

const Purchases = () => {
  const { role } = useSelector((s) => s.user);
  const isAdmin = String(role || "").toLowerCase() === "admin";
  const isStaff = isAdmin || String(role || "").toLowerCase() === "cashier";
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPurchase, setEditPurchase] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "NPOS | Compras";
  }, []);

  const { data: resData } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => await getPurchases(),
    placeholderData: keepPreviousData,
  });
  const purchases = useMemo(
    () => (Array.isArray(resData?.data?.data) ? resData.data.data : []),
    [resData]
  );
  const filteredPurchases = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return purchases;
    return purchases.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const provider = (p.providerName || p.provider || "").toLowerCase();
      return name.includes(term) || provider.includes(term);
    });
  }, [purchases, search]);

  const { data: provRes } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => await getProviders(),
    placeholderData: keepPreviousData,
  });
  const providers = provRes?.data?.data || [];

  const stockMutation = useMutation({
    mutationFn: ({ id, quantity }) => updatePurchaseStock(id, quantity),
    onSuccess: () => {
      enqueueSnackbar("Stock actualizado", { variant: "success" });
      qc.invalidateQueries(["purchases"]);
    },
    onError: () =>
      enqueueSnackbar("Error al actualizar stock", { variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePurchase(id),
    onSuccess: () => {
      enqueueSnackbar("Compra eliminada", { variant: "success" });
      qc.invalidateQueries(["purchases"]);
    },
    onError: () => enqueueSnackbar("Error al eliminar", { variant: "error" }),
  });

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <h1 className="text-[#f5f5f5] text-2xl font-bold">Compras</h1>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#2F974D] hover:bg-[#277f41] text-black font-semibold px-4 py-2 rounded-lg"
            >
              Nueva Compra
            </button>
          )}
          <Link to="/dashboard" className="text-[#ababab] underline">
            Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className="px-10 overflow-y-auto h-[calc(100%-7rem)]">
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o proveedor"
            className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white w-full sm:w-80"
          />
        </div>
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Proveedor</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Entrega</th>
              <th className="p-3">Vencimiento</th>
              <th className="p-3">Costo por Unidad</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map((p) => (
              <Row
                key={p._id}
                p={p}
                isAdmin={isAdmin}
                isStaff={isStaff}
                onUpdateStock={(id, q) =>
                  stockMutation.mutate({ id, quantity: q })
                }
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={(purchase) => setEditPurchase(purchase)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nueva Compra" onClose={() => setShowForm(false)}>
          <PurchaseForm
            providers={providers}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}
      {editPurchase && (
        <Modal title="Editar Compra" onClose={() => setEditPurchase(null)}>
          <PurchaseForm
            providers={providers}
            onClose={() => setEditPurchase(null)}
            purchase={editPurchase}
          />
        </Modal>
      )}
    </section>
  );
};

const Row = ({ p, isAdmin, isStaff, onUpdateStock, onDelete, onEdit }) => {
  const [qty, setQty] = useState(p.stock ?? 0);
  return (
    <tr className="border-b border-gray-700">
      <td className="p-3">{p.name}</td>
      <td className="p-3">{p.provider?.name || "-"}</td>
      <td className="p-3">
        {isStaff ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={qty}
              min={0}
              step={1}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value || 0)))}
              className="w-24 bg-[#222] border border-[#444] rounded px-2 py-1"
            />
            <span className="text-xs text-[#ababab]">{p.unit || ""}</span>
            <button
              onClick={() => onUpdateStock(p._id, Number(qty))}
              className="bg-blue-500 px-3 py-1 rounded"
            >
              Guardar
            </button>
          </div>
        ) : (
          <span>
            {p.stock ?? 0}{" "}
            <span className="text-xs text-[#ababab]">{p.unit || ""}</span>
          </span>
        )}
      </td>
      <td className="p-3">{p.deliveryDate || "-"}</td>
      <td className="p-3">{p.expirationDate || "-"}</td>
      <td className="p-3">{p.cost}</td>
      <td className="p-3">
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(p)} className="text-blue-400 hover:text-blue-300">Editar</button>
            <button onClick={() => onDelete(p._id)} className="text-red-400 hover:text-red-300">Eliminar</button>
          </div>
        )}
      </td>
    </tr>
  );
};

const Modal = ({ children, onClose, title = "Nueva Compra" }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-[#262626] p-6 rounded-lg shadow-lg w-[520px]">
      <div className="flex justify-between mb-4">
        <h2 className="text-[#f5f5f5] text-xl font-semibold">{title}</h2>
        <button onClick={onClose} className="text-[#f5f5f5]">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const PurchaseForm = ({ providers, onClose, purchase }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", quantity: 0, deliveryDate: "", expirationDate: "", cost: 0, providerId: "", alertMinStock: "", alertMessage: "", unidadMedida: "", estadoCompraId: "" });
  const { data: estadosRes } = useQuery({
    queryKey: ["purchase-states"],
    queryFn: async () => await getStates(4), // tipo=4 para compras
    placeholderData: keepPreviousData,
  });
  const estadosCompra = estadosRes?.data?.data || [];  useEffect(() => {if (purchase) {setForm({name: purchase.name || "",quantity: purchase.quantity|| 0,deliveryDate: purchase.deliveryDate || "",expirationDate: purchase.expirationDate || "",cost: purchase.cost || 0,providerId: (purchase.provider && purchase.provider._id) || "",alertMinStock: (purchase.alertMinStock ?? ""),alertMessage: purchase.alertMessage || "",unidadMedida: purchase.unit || "",estadoCompraId: purchase.estadoCompraId || "",});}}, [purchase]);
  const mutation = useMutation({
    mutationFn: (payload) => (purchase ? updatePurchase(purchase._id, payload) : addPurchase(payload)),
    onSuccess: () => { enqueueSnackbar(purchase ? "Compra actualizada" : "Compra creada", { variant: "success" }); qc.invalidateQueries(["purchases"]); onClose(); },    
    onError: () => enqueueSnackbar("Error guardando compra", { variant: "error" }),  
  });
  const onChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      const n = Math.max(0, Number(value || 0));
      setForm((prev) => ({ ...prev, [name]: n }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      quantity: Math.max(0, Number(form.quantity || 0)),
      deliveryDate: form.deliveryDate || null,
      expirationDate: form.expirationDate || null,
      cost: Math.max(0, Number(form.cost || 0)),
      providerId: form.providerId ? Number(form.providerId) : null,
      alertMinStock:
        form.alertMinStock !== ""
          ? Math.max(0, Number(form.alertMinStock))
          : null,
      alertMessage: form.alertMessage || null,
      unidadMedida: form.unidadMedida || null,
      estadoCompraId: form.estadoCompraId ? Number(form.estadoCompraId) : null,
    };
    mutation.mutate(payload);
  };
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Nombre"
        name="name"
        value={form.name}
        onChange={onChange}
        required
      />
      <Input
        label="Cantidad"
        name="quantity"
        type="number"
        min={0}
        step={1}
        value={form.quantity}
        onChange={onChange}
        required
      />
      <Input
        label="Costo"
        name="cost"
        type="number"
        min={0}
        step={1}
        value={form.cost}
        onChange={onChange}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Entrega"
          name="deliveryDate"
          type="date"
          value={form.deliveryDate}
          onChange={onChange}
        />
        <Input
          label="Vencimiento"
          name="expirationDate"
          type="date"
          value={form.expirationDate}
          onChange={onChange}
        />
      </div>
      <Input
        label="Unidad de medida"
        name="unidadMedida"
        value={form.unidadMedida}
        onChange={onChange}
        placeholder="kg, unid, litros, etc"
      />
      <div>
        <label className="block text-[#ababab] mb-1 text-sm">
          Estado de la compra
        </label>
        <select
          name="estadoCompraId"
          value={form.estadoCompraId}
          onChange={onChange}
          className="w-full bg-[#1f1f1f] text-white rounded px-3 py-2"
        >
          <option value="">Sin estado</option>
          {estadosCompra.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[#ababab] mb-1 text-sm">Proveedor</label>
        <select
          name="providerId"
          value={form.providerId}
          onChange={onChange}
          className="w-full bg-[#1f1f1f] text-white rounded px-3 py-2"
        >
          <option value="">Sin proveedor</option>
          {providers.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Mí­nimo para alerta"
          name="alertMinStock"
          type="number"
          min={0}
          step={1}
          value={form.alertMinStock}
          onChange={onChange}
        />
        <Input
          label="Mensaje de alerta"
          name="alertMessage"
          value={form.alertMessage}
          onChange={onChange}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-[#2F974D] hover:bg-[#277f41] text-black font-semibold rounded py-2"
      >
        Guardar
      </button>
    </form>
  );
};

const Input = ({ label, ...rest }) => (
  <div>
    <label className="block text-[#ababab] mb-1 text-sm">{label}</label>
    <input
      className="w-full bg-[#1f1f1f] text-white rounded px-3 py-2"
      {...rest}
    />
  </div>
);

export default Purchases;

const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

Row.propTypes = {
  p: PropTypes.shape({
    _id: idType.isRequired,
    name: PropTypes.string,
    provider: PropTypes.shape({
      name: PropTypes.string,
      _id: idType,
    }),
    stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    unit: PropTypes.string,
    deliveryDate: PropTypes.string,
    expirationDate: PropTypes.string,
    cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  isAdmin: PropTypes.bool,
  isStaff: PropTypes.bool,
  onUpdateStock: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

Row.defaultProps = {
  isAdmin: false,
  isStaff: false,
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
};

Modal.defaultProps = {
  title: "Nueva Compra",
};

PurchaseForm.propTypes = {
  providers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: idType,
      name: PropTypes.string,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  purchase: PropTypes.shape({
    _id: idType,
    name: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    deliveryDate: PropTypes.string,
    expirationDate: PropTypes.string,
    cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    provider: PropTypes.shape({
      _id: idType,
    }),
    alertMinStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    alertMessage: PropTypes.string,
    unit: PropTypes.string,
    estadoCompraId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};

PurchaseForm.defaultProps = {
  purchase: null,
};

Input.propTypes = {
  label: PropTypes.string.isRequired,
};







