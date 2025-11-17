import React, { useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getProducts,
  getStates,
  updateProduct,
  updateProductStockState,
  getCategories,
  uploadProductImage,
  getTaxes,
  deleteProduct,
} from "../https";
import { enqueueSnackbar } from "notistack";
import DishModal from "../components/dashboard/DishModal";
import { useSelector } from "react-redux";

const Inventory = () => {
  const qc = useQueryClient();
  const { role } = useSelector((state) => state.user);
  const canManageAll = role === "Admin";
  useEffect(() => {
    document.title = "NPOS | Inventario";
  }, []);

  const { data: prodsRes } = useQuery({
    queryKey: ["products"],
    queryFn: async () => await getProducts(),
    placeholderData: keepPreviousData,
  });
  const items = useMemo(() => prodsRes?.data?.data || [], [prodsRes]);
  const { data: estadosRes } = useQuery({
    queryKey: ["product-states"],
    queryFn: async () => await getStates(2),
    placeholderData: keepPreviousData,
  });
  const estados = estadosRes?.data?.data || [];
  const { data: catsRes } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => await getCategories(),
    placeholderData: keepPreviousData,
  });
  const categories = catsRes?.data?.data || [];
  const { data: taxesRes } = useQuery({
    queryKey: ["taxes"],
    queryFn: async () => await getTaxes(),
    placeholderData: keepPreviousData,
  });
  const taxes = taxesRes?.data?.data || [];

  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState(""); // '' -> Todas
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    let base = items;
    if (category)
      base = base.filter(
        (p) => String(p.categoryId || "") === String(category)
      );
    if (!f) return base;
    return base.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(f) ||
        String(p.barcode || "").includes(f)
    );
  }, [items, filter, category]);

  const upd = useMutation({
    mutationFn: ({ id, payload }) =>
      (canManageAll ? updateProduct : updateProductStockState)(id, payload),
    onSuccess: () => {
      enqueueSnackbar("Producto actualizado", { variant: "success" });
      qc.invalidateQueries(["products"]);
    },
    onError: () => enqueueSnackbar("Error actualizando", { variant: "error" }),
  });
  const upImg = useMutation({
    mutationFn: ({ id, file }) => uploadProductImage(id, file),
    onSuccess: () => {
      enqueueSnackbar("Imagen actualizada", { variant: "success" });
      qc.invalidateQueries(["products"]);
    },
    onError: () =>
      enqueueSnackbar("Error subiendo imagen", { variant: "error" }),
  });
  const delMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      enqueueSnackbar("Producto eliminado", { variant: "success" });
      qc.invalidateQueries(["products"]);
    },
    onError: () =>
      enqueueSnackbar("Error eliminando producto", { variant: "error" }),
  });

  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="page-shell text-[#f5f5f5] box-border">
      <div className="page-shell__content px-1 sm:px-3 md:px-0">
	      <div className="page-card space-y-5">
	        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	          <h1 className="text-2xl font-bold">Inventario de Productos</h1>
	          <p className="text-sm text-[#ababab]">
	            Administra precios, estados y existencias desde cualquier dispositivo.
	          </p>
	        </div>
	        <div className="flex flex-col md:flex-row md:items-center gap-3">
	          <input
	            value={filter}
	            onChange={(e) => setFilter(e.target.value)}
	            placeholder="Buscar por nombre o codigo"
	            className="bg-[#111] border border-[#333] rounded px-3 py-2 text-white w-full md:w-80"
	          />
	        </div>
	        {/* Categori­as horizontales */}
	    <div className="mb-2 overflow-x-auto whitespace-nowrap px-1">
        <button
          onClick={() => setCategory("")}
          className={`inline-block mr-2 px-3 py-1 rounded ${
            category === ""
              ? "bg-[#2e2e2e] text-[#f5f5f5]"
              : "bg-[#1f1f1f] text-[#ababab] border border-[#333]"
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setCategory(String(c._id))}
            className={`inline-block mr-2 px-3 py-1 rounded ${
              String(category) === String(c._id)
                ? "bg-[#2e2e2e] text-[#f5f5f5]"
                : "bg-[#1f1f1f] text-[#ababab] border border-[#333]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

	    <h2 className="text-[#ababab] text-sm font-semibold">
        {category
          ? `Categori­a: ${
              categories.find((c) => String(c._id) === String(category))
                ?.name || "-"
            }`
          : "Categori­a: Todos"}
      </h2>

	    <div className="pt-2">
	      <div className="np-scroll table-scroll overflow-y-hidden pb-2">
	        <table className="min-w-[960px] text-left text-sm">
            <thead className="bg-[#333] text-[#ababab]">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Categori­a</th>
                <th className="p-3">Codigo Barras</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Costo</th>
                <th className="p-3">Impuesto</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Min Stock</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
                <th className="p-3">Imagen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <Row
                  key={p._id}
                  p={p}
                  estados={estados}
                  taxes={taxes}
                  onSave={(payload) => upd.mutate({ id: p._id, payload })}
                  onUploadImage={(file) => upImg.mutate({ id: p._id, file })}
                  canManageAll={canManageAll}
                  onDelete={() => delMutation.mutate(p._id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Boton para añadir producto */}
	    {canManageAll && (
	      <button
	        onClick={() => setShowAdd(true)}
	        className="fixed bottom-8 right-6 sm:right-8 bg-[#F6B100] hover:bg-yellow-500 text-[#1a1a1a] font-semibold px-5 py-3 rounded-full shadow-lg"
	      >
	        Añadir Producto
	      </button>
	    )}

	    {canManageAll && showAdd && <DishModal onClose={() => setShowAdd(false)} />}
	      </div>
	    </div>
	  </section>
	);
};

const Row = ({
  p,
  estados,
  taxes,
  onSave,
  onUploadImage,
  canManageAll,
}) => {
  const [form, setForm] = useState({
    name: p.name,
    barcode: p.barcode || "",
    price: p.price,
    cost: p.cost || 0,
    quantity: p.quantity || 0,
    alertMinStock: p.alertMinStock ?? "",
    estadoId: p.estadoId || "",
    impuestoId: p.impuestoId
      ? String(p.impuestoId)
      : p.tax?._id
      ? String(p.tax._id)
      : "",
  });
  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const fileRef = useRef(null);
  useEffect(() => {
    if (!form.impuestoId && taxes.length) {
      setForm((prev) => ({ ...prev, impuestoId: String(taxes[0]._id) }));
    }
  }, [form.impuestoId, taxes]);
  const imgSrc = useMemo(() => {
    if (!p.imageUrl) return null;
    if (/^https?:/i.test(p.imageUrl)) return p.imageUrl;
    const base = import.meta.env.VITE_BACKEND_URL || "";
    return `${base}${p.imageUrl}`;
  }, [p.imageUrl]);
  const isLowStock = useMemo(() => {
    if (
      form.alertMinStock === "" ||
      form.alertMinStock === null ||
      form.alertMinStock === undefined
    )
      return false;
    const min = Number(form.alertMinStock);
    if (Number.isNaN(min)) return false;
    const qty = Number(form.quantity ?? 0);
    return qty <= min;
  }, [form.quantity, form.alertMinStock]);
  return (
    <tr
      className={`border-b border-[#3a3a3a] ${
        isLowStock ? "bg-[#2a1515]" : ""
      }`}
    >
      <td className="p-3">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-56"
          disabled={!canManageAll}
        />
      </td>
      <td className="p-3">{p?.category?.name || "-"}</td>
      <td className="p-3">
        <input
          name="barcode"
          value={form.barcode}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-40"
          disabled={!canManageAll}
        />
      </td>
      <td className="p-3">
        <input
          name="price"
          type="number"
          value={form.price}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-24"
          disabled={!canManageAll}
        />
      </td>
      <td className="p-3">
        <input
          name="cost"
          type="number"
          value={form.cost}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-24"
          disabled={!canManageAll}
        />
      </td>
      <td className="p-3">
        <select
          name="impuestoId"
          value={form.impuestoId}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1"
          disabled={taxes.length === 0 || !canManageAll}
        >
          {taxes.length === 0 ? (
            <option value="" disabled>
              Sin impuestos disponibles
            </option>
          ) : (
            taxes.map((t) => (
              <option
                key={t._id}
                value={t._id}
              >{`${t.name} (${t.regimen}) - ${t.percentage}%`}</option>
            ))
          )}
        </select>
      </td>
      <td className="p-3">
        <input
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-24"
        />
      </td>
      <td className="p-3">
        <input
          name="alertMinStock"
          type="number"
          value={form.alertMinStock}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-24"
          placeholder="-"
          disabled={!canManageAll}
        />
      </td>
      <td className="p-3">
        <select
          name="estadoId"
          value={form.estadoId}
          onChange={onChange}
          className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1"
        >
          <option value="">-</option>
          {estados.map((e) => (
            <option key={e._id} value={e._id}>
              {e.name}
            </option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (canManageAll) {
                onSave({
                  name: form.name,
                  codigo_barras: form.barcode,
                  price: Number(form.price),
                  cost: Number(form.cost),
                  quantity: Number(form.quantity),
                  estadoId: form.estadoId || null,
                  alertMinStock:
                    form.alertMinStock === ""
                      ? null
                      : Number(form.alertMinStock),
                  impuestoId: form.impuestoId ? Number(form.impuestoId) : null,
                });
              } else {
                onSave({
                  quantity: Number(form.quantity),
                  estadoId: form.estadoId || null,
                });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Guardar
          </button>
          {canManageAll && (
            <button
              onClick={() => {
                const msg = `CONFIRMACION\n\nPara eliminar el producto escribe exactamente su nombre.\n\nNombre: "${p.name}"\n\nEsta es la confirmación.`;
                const typed = window.prompt(msg, "");
                if (typed == null) return;
                if (String(typed).trim() === String(p.name || "").trim()) {
                  onDelete();
                } else {
                  enqueueSnackbar(
                    "El nombre no coincide. No se eliminó el producto.",
                    { variant: "warning" }
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Eliminar
            </button>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={p.name}
              className="w-12 h-12 rounded object-contain bg-[#121212] border border-[#333]"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-[#2a2a2a] flex items-center justify-center text-[#777] text-xs">
              No img
            </div>
          )}
          {canManageAll && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadImage(f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="bg-[#2e2e2e] hover:bg-[#3a3a3a] text-[#f5f5f5] px-3 py-1 rounded"
              >
                Cambiar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

Row.propTypes = {
  p: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string,
    barcode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    alertMinStock: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    estadoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    category: PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
    }),
    imageUrl: PropTypes.string,
    impuestoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tax: PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      percentage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      regimen: PropTypes.string,
    }),
  }).isRequired,
  estados: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
    })
  ).isRequired,
  taxes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      percentage: PropTypes.number.isRequired,
      regimen: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSave: PropTypes.func.isRequired,
  onUploadImage: PropTypes.func.isRequired,
  canManageAll: PropTypes.bool.isRequired,
};

export default Inventory;
