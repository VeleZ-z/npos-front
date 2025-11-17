import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getProviders, addProvider, updateProvider, deleteProvider } from "../../https";
import { enqueueSnackbar } from "notistack";
import { useSelector } from "react-redux";
import ProviderFormModal from "./ProviderFormModal";

const Providers = () => {
  const { role } = useSelector((s) => s.user);
  const isAdmin = role === 'Admin';
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [search, setSearch] = useState("");

  const { data: resData } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => await getProviders(),
    placeholderData: keepPreviousData,
  });
  const providers = resData?.data?.data || [];
  const filteredProviders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return providers;
    return providers.filter((p) => {
      return (
        (p.name || "").toLowerCase().includes(term) ||
        (p.contact || "").toLowerCase().includes(term) ||
        (p.email || "").toLowerCase().includes(term)
      );
    });
  }, [providers, search]);

  const createMutation = useMutation({
    mutationFn: (payload) => addProvider(payload),
    onSuccess: () => { enqueueSnackbar('Proveedor creado', { variant:'success' }); queryClient.invalidateQueries(["providers"]); setShowModal(false); },
    onError: (e) => enqueueSnackbar(e?.response?.data?.message || 'Error', { variant:'error' })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProvider(id, payload),
    onSuccess: () => { enqueueSnackbar('Proveedor actualizado', { variant:'success' }); queryClient.invalidateQueries(["providers"]); setEditRow(null); },
    onError: (e) => enqueueSnackbar(e?.response?.data?.message || 'Error', { variant:'error' })
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProvider(id),
    onSuccess: () => { enqueueSnackbar('Proveedor eliminado', { variant:'success' }); queryClient.invalidateQueries(["providers"]); },
    onError: (e) => enqueueSnackbar(e?.response?.data?.message || 'Error', { variant:'error' })
  });

  const onCreate = (payload) => createMutation.mutate(payload);
  const onUpdate = (payload) => updateMutation.mutate({ id: editRow._id, payload });

  return (
    <div className="container mx-auto px-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-[#f5f5f5] text-xl font-semibold">Proveedores</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, contacto o correo"
            className="bg-[#1f1f1f] border border-[#333] rounded px-3 py-2 text-white w-64"
          />
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#2F974D] hover:bg-[#277f41] text-[#1a1a1a] font-semibold px-6 py-2 rounded-lg"
            >
              Agregar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto bg-[#262626] rounded-lg">
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Contacto</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Correo</th>
              {isAdmin && <th className="p-3 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map((p) => (
              <tr key={p._id} className="border-b border-gray-600 hover:bg-[#333]">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.contact}</td>
                <td className="p-3">{p.phone || '—'}</td>
                <td className="p-3">{p.email || '—'}</td>
                {isAdmin && (
                  <td className="p-3 text-center space-x-3">
                    <button onClick={() => setEditRow(p)} className="px-3 py-1 bg-blue-600 rounded">Editar</button>
                    <button onClick={() => deleteMutation.mutate(p._id)} className="px-3 py-1 bg-red-600 rounded">Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td className="p-4 text-[#ababab]" colSpan={isAdmin ? 5 : 4}>Sin proveedores</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProviderFormModal onSubmit={onCreate} onClose={() => setShowModal(false)} />
      )}
      {editRow && (
        <ProviderFormModal initial={editRow} onSubmit={onUpdate} onClose={() => setEditRow(null)} />
      )}
    </div>
  );
};

export default Providers;
