import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getMyAlerts, ackMyAlert } from '../../https';
import { useLoginModal } from '../../context/LoginModalContext';

const AlertsBell = () => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { isAuth } = useSelector((state) => state.user);
  const { openLoginModal } = useLoginModal?.() || {};
  const { data: resData } = useQuery({
    queryKey: ['my-alerts'],
    queryFn: async () => await getMyAlerts(),
    placeholderData: keepPreviousData,
    enabled: open,
  });
  const alerts = Array.isArray(resData?.data?.data) ? resData.data.data : [];
  const ack = useMutation({
    mutationFn: (id) => ackMyAlert(id),
    onSuccess: () => qc.invalidateQueries(['my-alerts'])
  });
  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!isAuth) {
            openLoginModal?.();
            return;
          }
          setOpen((v)=>!v);
        }}
        className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer relative"
      >
        <FaBell className="text-[#f5f5f5] text-2xl" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{alerts.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-auto bg-[#262626] text-[#f5f5f5] rounded shadow-lg z-50">
          {alerts.length === 0 ? (
            <div className="p-3 text-sm text-[#ababab]">Sin alertas</div>
          ) : alerts.map((a)=> (
            <div key={a.id} className="p-3 border-b border-[#3a3a3a] text-sm flex items-start justify-between gap-3">
              <div>
                <div>{a.message}</div>
                {a.purchaseId && <div className="text-xs text-[#ababab] mt-1">Compra #{a.purchaseId}</div>}
              </div>
              <button onClick={()=> ack.mutate(a.id)} className="text-xs text-yellow-400">Marcar leída</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlertsBell;
