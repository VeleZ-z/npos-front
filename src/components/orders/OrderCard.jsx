import React from "react";
import PropTypes from "prop-types";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";

const OrderCard = ({ order }) => {
  if (!order) return null;

  const orderId = order._id ?? order.id ?? "N/A";
  const customerName = order.customer?.name || "Clientes Varios";
  const tableNumber = order.table?.number || "N/A";
  const itemsCount = order.items?.length || 0;
  const total = order.bills?.total || 0;
  const orderStatus = order.orderStatus || "PENDIENTE";

  return (
    <div className="w-full bg-[#262626] p-4 rounded-lg mb-4">
      <div className="flex items-center gap-5">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
          {getAvatarName(customerName)}
        </button>
        <div className="flex items-center justify-between w-[100%]">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
              {customerName}
            </h1>
            <p className="text-[#ababab] text-sm">#{orderId} / En el local</p>
            <p className="text-[#ababab] text-sm">
              Mesa{" "}
              <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" />{" "}
              {tableNumber}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {orderStatus === "LISTO" || orderStatus === "Ready" ? (
              <>
                <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
                  <FaCheckDouble className="inline mr-2" /> Listo
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-green-600" /> Listo para
                  servir
                </p>
              </>
            ) : orderStatus === "ENTREGADO" ? (
              <>
                <p className="text-blue-600 bg-[#2e3e4a] px-2 py-1 rounded-lg">
                  <FaCircle className="inline mr-2" /> Entregado
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-blue-600" /> Listo para
                  facturar
                </p>
              </>
            ) : orderStatus === "POR_APROBAR" ? (
              <>
                <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
                  <FaCircle className="inline mr-2" /> {orderStatus}
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-yellow-600" /> por favor
                  pidele a la/el mesera/o | Cajera/o que confirmen tu orden
                </p>
              </>
            ) : (
              <>
                <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
                  <FaCircle className="inline mr-2" /> {orderStatus}
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-yellow-600" />{" "}
                  Preparando tu orden
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 text-[#ababab]">
        <p>{formatDateAndTime(order.orderDate)}</p>
        <p>
          {itemsCount} {itemsCount === 1 ? "Item" : "Items"}
        </p>
      </div>
      <hr className="w-full mt-4 border-t-1 border-gray-500" />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-[#f5f5f5] text-lg font-semibold">Total</h1>
        <p className="text-[#f5f5f5] text-lg font-semibold">
          ${total.toFixed(0)}
        </p>
      </div>
    </div>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customer: PropTypes.shape({
      name: PropTypes.string,
    }),
    table: PropTypes.shape({
      number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        quantity: PropTypes.number,
        price: PropTypes.number,
        note: PropTypes.string,
      })
    ),
    bills: PropTypes.shape({
      total: PropTypes.number,
    }),
    orderStatus: PropTypes.string,
    orderDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
  }),
};

export default OrderCard;
