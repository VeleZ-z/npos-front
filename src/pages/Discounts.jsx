import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDiscounts,
  createDiscountAdmin,
  updateDiscountAdmin,
  resendDiscount,
  getProducts,
} from "../https";
import { enqueueSnackbar } from "notistack";

const initialForm = {
  id: null,
  nombre: "",
  valor: "",
  porciento: "",
  mensaje: "",
  is_activo: true,
  productoId: "",
};

const resolveDiscountImageSrc = (discount, backendUrl) => {
  if (!discount) return null;
  if (discount.imageInline) return discount.imageInline;
  const raw = discount.imageUrl;
  if (!raw) return null;
  if (/^data:/i.test(raw) || /^https?:\/\//i.test(raw)) {
    return raw;
  }
  return backendUrl ? `${backendUrl}${raw}` : raw;
};

const Discounts = () => {
  const backendUrl = useMemo(
    () => (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""),
    []
  );
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [flyer, setFlyer] = useState(null);

  const { data: list, isLoading } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: async () => {
      const res = await getAdminDiscounts();
      return res?.data?.data || [];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-basic"],
    queryFn: async () => {
      const res = await getProducts();
      return res?.data?.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id
        ? updateDiscountAdmin(id, payload)
        : createDiscountAdmin(payload),
    onSuccess: () => {
      enqueueSnackbar("Descuento guardado", { variant: "success" });
      setForm(initialForm);
      setFlyer(null);
      qc.invalidateQueries(["admin-discounts"]);
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || "Error al guardar", {
        variant: "error",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id) => resendDiscount(id),
    onSuccess: () => {
      enqueueSnackbar("Descuento reenviado", { variant: "success" });
    },
    onError: () =>
      enqueueSnackbar("No se pudo reenviar el descuento", {
        variant: "error",
      }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre) {
      enqueueSnackbar("El nombre es obligatorio", { variant: "warning" });
      return;
    }
    if (form.valor && form.porciento) {
      enqueueSnackbar(
        "Solo puedes aplicar un descuento por valor o por porcentaje",
        { variant: "warning" }
      );
      return;
    }
    if (!form.productoId) {
      enqueueSnackbar("Selecciona el producto asociado", {
        variant: "warning",
      });
      return;
    }
    const fd = new FormData();
    fd.append("nombre", form.nombre);
    if (form.valor !== "") fd.append("valor", form.valor);
    if (form.porciento !== "") fd.append("porciento", form.porciento);
    fd.append("is_activo", form.is_activo ? "1" : "0");
    if (form.mensaje) fd.append("mensaje", form.mensaje);
    fd.append("productoId", form.productoId);
    if (flyer) fd.append("flyer", flyer);
    mutation.mutate({ id: form.id, payload: fd });
  };

  const handleEdit = (discount) => {
    setForm({
      id: discount._id,
      nombre: discount.name || "",
      valor: discount.value ?? "",
      porciento: discount.percent ?? "",
      mensaje: discount.message || "",
      is_activo: !!discount.active,
      productoId: discount.products?.[0]?.productId
        ? String(discount.products[0].productId)
        : "",
    });
    setFlyer(null);
  };

  return (
    <section className="page-shell text-white box-border">
      <div className="page-shell__content space-y-6 px-1 sm:px-3 md:px-0">
	      <div className="page-card space-y-6">
	        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	          <div>
	            <h1 className="text-2xl font-bold">Gestión de Descuentos</h1>
	            <p className="text-sm text-[#ababab]">
	              Envía flyers y mensajes a todos los usuarios.
	            </p>
	          </div>
	          {form.id && (
	            <button
	              onClick={() => {
	                setForm(initialForm);
	                setFlyer(null);
	              }}
	              type="button"
	              className="px-4 py-2 rounded bg-[#1f1f1f]"
	            >
	              Nuevo descuento
	            </button>
	          )}
	        </div>

	    <form
	      onSubmit={handleSubmit}
	      className="grid grid-cols-1 md:grid-cols-2 gap-4"
	    >
        <div>
          <label className="text-sm text-[#ababab]">Nombre</label>
          <input
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
            value={form.nombre}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, nombre: e.target.value }))
            }
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#ababab]">Valor</label>
            <input
              type="number"
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
              value={form.valor}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  valor: e.target.value,
                  porciento: e.target.value ? "" : prev.porciento,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm text-[#ababab]">% descuento</label>
            <input
              type="number"
              className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
              value={form.porciento}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  porciento: e.target.value,
                  valor: e.target.value ? "" : prev.valor,
                }))
              }
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-[#ababab]">Mensaje</label>
          <textarea
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
            rows={3}
            value={form.mensaje}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, mensaje: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-sm text-[#ababab]">Flyer</label>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm"
            onChange={(e) => setFlyer(e.target.files?.[0] || null)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-[#ababab] block mb-2">
            Producto asociado
          </label>
          <select
            value={form.productoId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, productoId: e.target.value }))
            }
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2"
          >
            <option value="">Selecciona un producto</option>
            {productsData?.map((product) => (
              <option
                key={product._id || product.id}
                value={product._id || product.id}
              >
                {product.nombre || product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_activo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, is_activo: e.target.checked }))
            }
          />
          <span className="text-sm text-[#ababab]">Activo</span>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 rounded bg-[#6EF221] text-black disabled:opacity-50"
          >
            {mutation.isPending
              ? "Guardando..."
              : form.id
              ? "Actualizar descuento"
              : "Crear y enviar"}
          </button>
        </div>
	    </form>
	      </div>

	      <div className="page-card">
	      <h2 className="text-lg font-semibold mb-4">Historial</h2>
        {isLoading ? (
          <p className="text-sm text-[#ababab]">Cargando...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-[#ababab]">
            Aún no hay descuentos registrados.
          </p>
        ) : (
          <div className="space-y-4">
            {list.map((discount) => (
              <div
                key={discount._id}
                className="border border-[#2a2a2a] rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{discount.name}</h3>
                  <p className="text-sm text-[#ababab]">
                    Valor: {discount.value ?? "-"} | %:{" "}
                    {discount.percent ?? "-"}
                  </p>
                  <p className="text-sm mt-2">{discount.message || "-"}</p>
                  <p className="text-xs text-[#777] mt-1">
                    Estado: {discount.active ? "Activo" : "Inactivo"}
                  </p>
                  <p className="text-xs text-[#777] mt-1">
                    Productos:{" "}
                    {discount.products?.length
                      ? discount.products
                          .map((p) => p.name || `#${p.productId}`)
                          .join(", ")
                      : "N/A"}
                  </p>
                </div>
                {resolveDiscountImageSrc(discount, backendUrl) && (
                  <img
                    src={resolveDiscountImageSrc(discount, backendUrl)}
                    alt={discount.name}
                    className="w-32 h-32 object-cover rounded-lg border border-[#333]"
                  />
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(discount)}
                    className="px-3 py-2 rounded bg-[#1f1f1f]"
                  >
                    Editar
                  </button>
                  <button
                    disabled={resendMutation.isPending}
                    onClick={() => resendMutation.mutate(discount._id)}
                    className="px-3 py-2 rounded bg-[#2f4bff] disabled:opacity-40"
                  >
                    Reenviar
                  </button>
                </div>
              </div>
            ))}
          </div>
	        )}
	    </div>
	    </div>
	  </section>
	);
};

export default Discounts;
