import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCategory } from "../../https";
import { enqueueSnackbar } from "notistack";

const CategoryModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: (req) => addCategory(req),
    onSuccess: () => {
      enqueueSnackbar("Category created!", { variant: "success" });
      queryClient.invalidateQueries(["categories"]);
      onClose();
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || "Failed to create category";
      enqueueSnackbar(msg, { variant: "error" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({ name: name.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-96"
      >
        <div className="flex justify-between item-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">Nueva Categoria</h2>
          <button onClick={onClose} className="text-[#f5f5f5] hover:text-red-500">
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre</label>
            <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malteadas"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full rounded-lg mt-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold">
            Create
          </button>
        </form>
      </motion.div>
    </div>
  );
};

CategoryModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default CategoryModal;
