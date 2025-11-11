import React from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getDiscounts } from "../../https";

const DiscountsTable = () => {
  const { data: res } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => await getDiscounts(),
    placeholderData: keepPreviousData,
  });
  const discounts = res?.data?.data || [];

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-3">Descuentos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[#f5f5f5]">
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map(d => (
              <tr key={d._id} className="border-b border-gray-600">
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.value ?? '—'}</td>
                <td className="p-3">{d.percent != null ? `${d.percent}%` : '—'}</td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr><td className="p-4 text-[#ababab]" colSpan={3}>Sin descuentos activos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DiscountsTable;

