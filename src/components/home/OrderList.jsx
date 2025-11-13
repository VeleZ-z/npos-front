import React from "react";
import PropTypes from "prop-types";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";

const OrderList = ({ order }) => {
  // Validar que order y sus propiedades existan
  if (!order) return null;

  const customerName = order.customer?.name || "Sin nombre";
  const itemsCount = order.items?.length || 0;
  const tableNumber = order.table?.number || "N/A";
  const orderStatus = order.orderStatus || "PENDIENTE";

  return (
    <div className="flex items-center gap-5 mb-3">
      <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
        {getAvatarName(customerName)}
      </button>
      <div className="flex items-center justify-between w-[100%]">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            {customerName}
          </h1>
          <p className="text-[#ababab] text-sm">{itemsCount} Items</p>
        </div>

        <h1 className="text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg p-1">
          Mesa <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" />{" "}
          {tableNumber}
        </h1>

        <div className="flex flex-col items-end gap-2">
          {orderStatus === "LISTO" || orderStatus === "Ready" ? (
            <>
              <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
                <FaCheckDouble className="inline mr-2" /> Listo
              </p>
            </>
          ) : orderStatus === "ENTREGADO" || orderStatus === "PAGADO" ? (
            <>
              <p className="text-blue-600 bg-[#2e3e4a] px-2 py-1 rounded-lg">
                <FaCircle className="inline mr-2" /> {orderStatus}
              </p>
            </>
          ) : (
            <>
              <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
                <FaCircle className="inline mr-2" /> {orderStatus}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;

OrderList.propTypes = {
  order: PropTypes.shape({
    customer: PropTypes.shape({
      name: PropTypes.string,
    }),
    items: PropTypes.array,
    table: PropTypes.shape({
      number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    orderStatus: PropTypes.string,
  }),
};

OrderList.defaultProps = {
  order: null,
};
