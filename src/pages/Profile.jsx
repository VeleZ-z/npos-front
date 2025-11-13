import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getUserData, getDocTypes, updateProfile } from '../https';
import { enqueueSnackbar } from 'notistack';

const Profile = () => {
  const qc = useQueryClient();
  const { data: userRes } = useQuery({ queryKey: ['me'], queryFn: async ()=> await getUserData(), placeholderData: keepPreviousData });
  const me = userRes?.data?.data || {};
  const { data: docsRes } = useQuery({ queryKey: ['doc-types'], queryFn: async ()=> await getDocTypes(), placeholderData: keepPreviousData });
  const docTypes = docsRes?.data?.data || [];
  const [form, setForm] = useState({ documento: '', telefono: '', tipo_doc_id: '', cumpleanos: '' });

  useEffect(() => {
    document.title = 'NPOS | Perfil';
    setForm({
      documento: me.document || '',
      telefono: me.phone || '',
      tipo_doc_id: me.docTypeId || '',
      cumpleanos: (me.birthday || '').slice(0,10)
    });
  }, [me._id]);

  const mutation = useMutation({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: () => { enqueueSnackbar('Perfil actualizado', { variant: 'success' }); qc.invalidateQueries(['me']); },
    onError: () => enqueueSnackbar('Error actualizando perfil', { variant: 'error' })
  });

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const onSubmit = (e) => { e.preventDefault(); mutation.mutate({
    documento: form.documento || null,
    telefono: form.telefono || null,
    tipo_doc_id: form.tipo_doc_id ? Number(form.tipo_doc_id) : null,
    cumpleanos: form.cumpleanos || null,
  }); };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-auto px-10 py-6">
      <h1 className="text-[#f5f5f5] text-2xl font-bold mb-6">Mi Perfil</h1>
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <Input label="Nombre" value={me.name || ''} disabled />
        <Input label="Correo" value={me.email || ''} disabled />
        <Input label="Documento" name="documento" value={form.documento} onChange={onChange} />
        <Input label="Teléfono" name="telefono" value={form.telefono} onChange={onChange} />
        <div>
          <label className="block text-[#ababab] mb-1 text-sm">Tipo de documento</label>
          <select name="tipo_doc_id" value={form.tipo_doc_id} onChange={onChange} className="w-full bg-[#1f1f1f] text-white rounded px-3 py-2">
            <option value="">Sin asignar</option>
            {docTypes.map(d => (<option key={d._id} value={d._id}>{d.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[#ababab] mb-1 text-sm">Cumpleaños</label>
          <input
            type="date"
            name="cumpleanos"
            value={form.cumpleanos}
            onChange={onChange}
            disabled={Boolean(me.birthday)}
            className={`w-full rounded px-3 py-2 ${me.birthday ? 'bg-[#2a2a2a] text-[#ababab] cursor-not-allowed' : 'bg-[#1f1f1f] text-white'}`}
          />
          {me.birthday && (
            <p className="text-xs text-[#ababab] mt-1">El cumpleaños solo se puede registrar una vez.</p>
          )}
        </div>
        <button type="submit" className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg">Guardar</button>
      </form>
    </section>
  );
};

const Input = ({ label, ...rest }) => (
  <div>
    <label className="block text-[#ababab] mb-1 text-sm">{label}</label>
    <input className="w-full bg-[#1f1f1f] text-white rounded px-3 py-2" {...rest} />
  </div>
);

Input.propTypes = {
  label: PropTypes.string.isRequired,
};

export default Profile;
