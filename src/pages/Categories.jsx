import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getCategories, updateCategory, deleteCategory } from '../https';
import { enqueueSnackbar } from 'notistack';
import CategoryModal from '../components/dashboard/CategoryModal';

const Categories = () => {
  const qc = useQueryClient();
  useEffect(()=> { document.title = 'NPOS | Categorías'; }, []);

  const { data: catsRes } = useQuery({ queryKey: ['categories'], queryFn: async()=> await getCategories(), placeholderData: keepPreviousData });
  const items = useMemo(()=> catsRes?.data?.data || [], [catsRes]);
  const [filter, setFilter] = useState('');
  const filtered = useMemo(()=> {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter(c => (c.name||'').toLowerCase().includes(f));
  }, [items, filter]);

  const upd = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: ()=> { enqueueSnackbar('Categoría actualizada', { variant: 'success' }); qc.invalidateQueries(['categories']); },
    onError: ()=> enqueueSnackbar('Error actualizando', { variant: 'error' })
  });
  const del = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: ()=> { enqueueSnackbar('Categoría eliminada', { variant: 'success' }); qc.invalidateQueries(['categories']); },
    onError: ()=> enqueueSnackbar('Error eliminando', { variant: 'error' })
  });

  const [showAdd, setShowAdd] = useState(false);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden px-10 py-6">
      <h1 className="text-[#f5f5f5] text-2xl font-bold mb-4">Categorías</h1>
      <div className="mb-3 flex items-center gap-3">
        <input value={filter} onChange={(e)=> setFilter(e.target.value)} placeholder="Buscar categoría" className="bg-[#1f1f1f] border border-[#444] rounded px-3 py-2 text-white w-80" />
      </div>

      <div className="overflow-y-auto h-[calc(100%-8rem)]">
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <Row key={c._id} c={c} onSave={(payload)=> upd.mutate({ id: c._id, payload })} onDelete={()=> del.mutate(c._id)} />
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={()=> setShowAdd(true)}
        className="fixed bottom-8 right-8 bg-[#2F974D] hover:bg-[#277f41] text-[#1a1a1a] font-semibold px-5 py-3 rounded-full shadow-lg"
      >
        Crear Categoría
      </button>
      {showAdd && <CategoryModal onClose={()=> setShowAdd(false)} />}
    </section>
  );
};

const Row = ({ c, onSave, onDelete }) => {
  const [name, setName] = useState(c.name);

  const handleDelete = () => {
    const msg = `CONFIRMACION\n\nPara eliminar la categoría, escribe exactamente su nombre.\n\nNombre: "${c.name}"\n\nEsta es la confirmación.`;
    const typed = window.prompt(msg, "");
    if (typed == null) return; // cancel
    if (String(typed).trim() === String(c.name).trim()) {
      onDelete();
    } else {
      enqueueSnackbar('El nombre no coincide. No se eliminó la categoría.', { variant: 'warning' });
    }
  };

  return (
    <tr className="border-b border-[#3a3a3a]">
      <td className="p-3"><input value={name} onChange={(e)=> setName(e.target.value)} className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-72" /></td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <button onClick={()=> onSave({ name })} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Guardar</button>
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Eliminar</button>
        </div>
      </td>
    </tr>
  );
};

const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

Row.propTypes = {
  c: PropTypes.shape({
    _id: idType.isRequired,
    name: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default Categories;
