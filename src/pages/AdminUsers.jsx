import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getUsers, updateUser as apiUpdateUser, setUserRole as apiSetUserRole, getDocTypes, getStates, getRoles } from '../https';
import { enqueueSnackbar } from 'notistack';

const AdminUsers = () => {
  const qc = useQueryClient();
  useEffect(()=> { document.title = 'NPOS | Usuarios'; }, []);

  const { data: usersRes } = useQuery({ queryKey: ['admin-users'], queryFn: async()=> await getUsers(), placeholderData: keepPreviousData });
  const users = useMemo(()=> usersRes?.data?.data || [], [usersRes]);
  const { data: docsRes } = useQuery({ queryKey: ['doc-types'], queryFn: async()=> await getDocTypes(), placeholderData: keepPreviousData });
  const docTypes = docsRes?.data?.data || [];
  const { data: estadosRes } = useQuery({ queryKey: ['user-states'], queryFn: async()=> await getStates(1), placeholderData: keepPreviousData });
  const estados = estadosRes?.data?.data || [];
  const { data: rolesRes } = useQuery({ queryKey: ['roles'], queryFn: async()=> await getRoles(), placeholderData: keepPreviousData });
  const roles = rolesRes?.data?.data || [{ _id: 0, name: 'Customer' }];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiUpdateUser(id, payload),
    onSuccess: () => { enqueueSnackbar('Usuario actualizado', { variant: 'success' }); qc.invalidateQueries(['admin-users']); },
    onError: () => enqueueSnackbar('Error actualizando usuario', { variant: 'error' })
  });
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => apiSetUserRole(id, role),
    onSuccess: () => { enqueueSnackbar('Rol actualizado', { variant: 'success' }); qc.invalidateQueries(['admin-users']); },
    onError: () => enqueueSnackbar('Error actualizando rol', { variant: 'error' })
  });

  return (
    <section className="page-shell text-[#f5f5f5] box-border">
      <div className="page-shell__content px-1 sm:px-3 md:px-0">
	      <div className="page-card">
	        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
	          <h1 className="text-2xl font-bold">Usuarios</h1>
	          <p className="text-sm text-[#ababab]">
	            Gestiona documentos, roles y estados desde cualquier dispositivo.
	          </p>
	        </div>
	        <div className="table-scroll np-scroll">
	          <table className="min-w-full text-left text-sm">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Documento</th>
              <th className="p-3">Tipo Doc</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Cumpleaños</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Rol</th>
            </tr>
          </thead>
	          <tbody>
	            {users.map(u => (
	              <Row key={u._id} u={u} docTypes={docTypes} estados={estados} roles={roles} onSave={(payload)=> updateMutation.mutate({ id: u._id, payload })} onSetRole={(role)=> roleMutation.mutate({ id: u._id, role })} />
	            ))}
	          </tbody>
	        </table>
	        </div>
	      </div>
	    </div>
	  </section>
  );
};

const Row = ({ u, docTypes, estados, roles, onSave, onSetRole }) => {
  const [form, setForm] = useState({ documento: u.document || '', telefono: u.phone || '', tipo_doc_id: u.docTypeId || '', cumpleanos: (u.birthday || '').slice(0,10), estado_id: u.estadoId || '' });
  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  return (
    <tr className="border-b border-[#3a3a3a]">
      <td className="p-3">{u.name}</td>
      <td className="p-3">{u.email}</td>
      <td className="p-3"><input className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-36" name="documento" value={form.documento} onChange={onChange} /></td>
      <td className="p-3">
        <select name="tipo_doc_id" value={form.tipo_doc_id} onChange={onChange} className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1">
          <option value="">-</option>
          {docTypes.map(d => (<option key={d._id} value={d._id}>{d.name}</option>))}
        </select>
      </td>
      <td className="p-3"><input className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1 w-36" name="telefono" value={form.telefono} onChange={onChange} /></td>
      <td className="p-3"><input type="date" className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1" name="cumpleanos" value={form.cumpleanos} onChange={onChange} disabled={Boolean(u.birthday)} /></td>
      <td className="p-3">
        <select name="estado_id" value={form.estado_id} onChange={onChange} className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1">
          <option value="">-</option>
          {estados.map(e => (<option key={e._id} value={e._id}>{e.name}</option>))}
        </select>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <select value={u.role} onChange={(e)=> onSetRole(e.target.value)} className="bg-[#1f1f1f] border border-[#444] rounded px-2 py-1">
            {roles.map(r => (<option key={r._id || r.name} value={r.name}>{r.name}</option>))}
          </select>
          <button onClick={()=> onSave({ documento: form.documento, telefono: form.telefono, tipo_doc_id: form.tipo_doc_id || null, cumpleanos: form.cumpleanos || null, estado_id: form.estado_id || null })} className="bg-blue-500 px-3 py-1 rounded">Guardar</button>
        </div>
      </td>
    </tr>
  );
};

const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

Row.propTypes = {
  u: PropTypes.shape({
    _id: idType.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    document: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    phone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    docTypeId: idType,
    birthday: PropTypes.string,
    estadoId: idType,
    role: PropTypes.string,
  }).isRequired,
  docTypes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: idType,
      name: PropTypes.string,
    })
  ).isRequired,
  estados: PropTypes.arrayOf(
    PropTypes.shape({
      _id: idType,
      name: PropTypes.string,
    })
  ).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      _id: idType,
      name: PropTypes.string,
    })
  ).isRequired,
  onSave: PropTypes.func.isRequired,
  onSetRole: PropTypes.func.isRequired,
};

export default AdminUsers;
