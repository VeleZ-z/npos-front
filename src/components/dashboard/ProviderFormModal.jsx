import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";

const ProviderFormModal = ({ initial, onSubmit, onClose }) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", contact: "" });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        phone: initial.phone || "",
        email: initial.email || "",
        contact: initial.contact || "",
      });
    }
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) return;
    onSubmit({
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      contact: form.contact.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-[480px]"
      >
        <div className="flex justify-between item-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">{initial ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>
          <button onClick={onClose} className="text-[#f5f5f5] hover:text-red-500">
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full bg-[#1f1f1f] text-white rounded-lg p-3" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#ababab] mb-2 text-sm font-medium">Teléfono</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full bg-[#1f1f1f] text-white rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-[#ababab] mb-2 text-sm font-medium">Correo</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-[#1f1f1f] text-white rounded-lg p-3" />
            </div>
          </div>
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Contacto</label>
            <input name="contact" value={form.contact} onChange={handleChange} className="w-full bg-[#1f1f1f] text-white rounded-lg p-3" required />
          </div>

          <button type="submit" className="w-full rounded-lg mt-2 py-3 text-lg bg-[#2F974D] hover:bg-[#277f41] text-gray-900 font-bold">
            {initial ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProviderFormModal;

ProviderFormModal.propTypes = {
  initial: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    contact: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

ProviderFormModal.defaultProps = {
  initial: null,
};
