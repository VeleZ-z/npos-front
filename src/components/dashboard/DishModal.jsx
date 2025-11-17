import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { addProduct, getCategories, uploadProductImage, getStates, getTaxes } from "../../https";
import { enqueueSnackbar } from "notistack";

const DishModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", price: "", categoryId: "", estadoId: "", impuestoId: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const { data: catsRes } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => await getCategories(),
    placeholderData: keepPreviousData,
  });
  const categories = catsRes?.data?.data || [];

  const { data: statesRes } = useQuery({
    queryKey: ["product-states"],
    queryFn: async () => await getStates(2), // tipo=2 -> productos
    placeholderData: keepPreviousData,
  });
  const productStates = statesRes?.data?.data || [];
  const { data: taxesRes } = useQuery({
    queryKey: ["taxes"],
    queryFn: async () => await getTaxes(),
    placeholderData: keepPreviousData,
  });
  const taxes = useMemo(() => taxesRes?.data?.data || [], [taxesRes]);

  useEffect(() => {
    if (!taxes.length || form.impuestoId) return;
    setForm((prev) => ({ ...prev, impuestoId: String(taxes[0]._id) }));
  }, [taxes, form.impuestoId]);

  const mutation = useMutation({
    mutationFn: (req) => addProduct(req),
    onSuccess: () => {
      enqueueSnackbar("Dish created!", { variant: "success" });
      queryClient.invalidateQueries(["products"]);
      onClose();
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || "Failed to create dish";
      enqueueSnackbar(msg, { variant: "error" });
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      price: Number(form.price || 0),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      estadoId: form.estadoId ? Number(form.estadoId) : undefined,
      impuestoId: form.impuestoId ? Number(form.impuestoId) : undefined,
    };
    mutation.mutate(payload, {
      onSuccess: async (res) => {
        const id = res?.data?.data?._id;
        if (id && file) {
          try {
            await uploadProductImage(id, file);
          } catch (err) {
            const msg =
              err?.response?.data?.message ||
              "No se pudo subir la imagen del producto";
            enqueueSnackbar(msg, { variant: "warning" });
          }
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-[460px]"
      >
        <div className="flex justify-between item-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Añadir Producto</h2>
          <button onClick={onClose} className="text-[#f5f5f5] hover:text-red-500">
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre</label>
            <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.j. Waffle de Yuca"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#ababab] mb-2 text-sm font-medium">Precio</label>
              <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="bg-transparent flex-1 text-white focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Categoria</label>
            <div className="flex item-center rounded-lg p-1 px-4 bg-[#1f1f1f]">
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="bg-transparent flex-1 text-white focus:outline-none w-full py-4"
              >
                <option className="bg-[#1f1f1f]" value="">Sin Categoria</option>
                {categories.map((c) => (
                  <option key={c._id} className="bg-[#1f1f1f]" value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Estado</label>
            <div className="flex item-center rounded-lg p-1 px-4 bg-[#1f1f1f]">
              <select
                name="estadoId"
                value={form.estadoId}
                onChange={handleChange}
                className="bg-transparent flex-1 text-white focus:outline-none w-full py-4"
              >
                <option className="bg-[#1f1f1f]" value="">Selecciona estado</option>
                {productStates.map((s) => (
                  <option key={s._id} className="bg-[#1f1f1f]" value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Impuesto</label>
            <div className="flex item-center rounded-lg p-1 px-4 bg-[#1f1f1f]">
              <select
                name="impuestoId"
                value={form.impuestoId}
                onChange={handleChange}
                className="bg-transparent flex-1 text-white focus:outline-none w-full py-4"
                required={taxes.length > 0}
                disabled={taxes.length === 0}
              >
                {taxes.length === 0 ? (
                  <option className="bg-[#1f1f1f]" value="" disabled>
                    No hay impuestos disponibles
                  </option>
                ) : (
                  taxes.map((t) => (
                    <option key={t._id} className="bg-[#1f1f1f]" value={t._id}>
                      {`${t.name} (${t.regimen}) - ${t.percentage}%`}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Imagen</label>
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" onChange={handleFile} className="text-[#f5f5f5]" />
              {preview && <img src={preview} alt="preview" className="w-12 h-12 rounded object-cover" />}
            </div>
          </div>

          {/* Estado se controla con select; sin checkbox de Active */}

          <button type="submit" className="w-full rounded-lg mt-2 py-3 text-lg bg-[#2F974D] hover:bg-[#277f41] text-gray-900 font-bold">
            Crear
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default DishModal;

DishModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
