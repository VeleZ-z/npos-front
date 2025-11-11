import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, getOrderById, createInvoice } from "../https";
import { enqueueSnackbar } from "notistack";
import { useSelector } from "react-redux";

const Cashier = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.user);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "CONSUMIDOR FINAL",
    nit: "222222222222",
    address: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [paymentType, setPaymentType] = useState("CONTADO");
  const [notes, setNotes] = useState("");

  // Obtener órdenes pendientes de pago
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });

  // Filtrar solo órdenes ENTREGADO (listas para facturar)
  const pendingOrders =
    ordersData?.data?.filter(
      (order) =>
        order.orderStatus === "ENTREGADO" && order.paymentStatus === "PENDIENTE"
    ) || [];

  // Seleccionar orden para facturar
  const handleSelectOrder = async (order) => {
    try {
      const response = await getOrderById(order._id);
      setSelectedOrder(response.data.data);
      setShowInvoiceForm(true);

      // Pre-llenar datos si la orden tiene cliente
      if (order.customer?.name) {
        setCustomerData((prev) => ({
          ...prev,
          name: order.customer.name,
          phone: order.customer.phone || "",
        }));
      }
    } catch (error) {
      enqueueSnackbar("Error al cargar orden", { variant: "error" });
    }
  };

  // Crear factura
  const invoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (response) => {
      enqueueSnackbar("Factura generada exitosamente", { variant: "success" });
      queryClient.invalidateQueries(["orders"]);
      setShowInvoiceForm(false);
      setSelectedOrder(null);
      resetForm();

      // Opción: abrir impresión de factura
      console.log("Factura creada:", response.data.data);
    },
    onError: (error) => {
      enqueueSnackbar(
        error.response?.data?.message || "Error al generar factura",
        { variant: "error" }
      );
    },
  });

  const handleCreateInvoice = () => {
    if (!selectedOrder) return;

    const invoiceData = {
      orderId: selectedOrder._id,
      paymentMethod,
      paymentType,
      customerData:
        customerData.name !== "CONSUMIDOR FINAL" ? customerData : undefined,
      notes,
    };

    invoiceMutation.mutate(invoiceData);
  };

  const resetForm = () => {
    setCustomerData({
      name: "CONSUMIDOR FINAL",
      nit: "222222222222",
      address: "",
      phone: "",
      email: "",
    });
    setPaymentMethod("EFECTIVO");
    setPaymentType("CONTADO");
    setNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Cargando órdenes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Caja - Facturación</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de órdenes pendientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Órdenes Pendientes de Pago ({pendingOrders.length})
          </h2>

          {pendingOrders.length === 0 ? (
            <p className="text-gray-500">No hay ordenes pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectOrder(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {order.customer?.name || "Sin nombre"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Mesa: {order.table?.number || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Items: {order.items?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${order.bills?.total?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.orderDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de facturación */}
        <div className="bg-white rounded-lg shadow p-6">
          {!showInvoiceForm ? (
            <div className="text-center text-gray-500 py-12">
              Selecciona una orden para facturar
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Generar Factura</h2>

              {/* Resumen de la orden */}
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Resumen de la Orden</h3>
                <div className="space-y-2 text-sm">
                  {selectedOrder?.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        ${selectedOrder?.bills?.subtotal?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>INC:</span>
                      <span>
                        ${selectedOrder?.bills?.tax?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>
                        ${selectedOrder?.bills?.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos del cliente */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    NIT/CC
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={customerData.nit}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, nit: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    value={customerData.phone}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Método de Pago
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                    <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de Pago
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                  >
                    <option value="CONTADO">Contado</option>
                    <option value="CREDITO">Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateInvoice}
                    disabled={invoiceMutation.isPending}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {invoiceMutation.isPending
                      ? "Generando..."
                      : "Generar Factura"}
                  </button>
                  <button
                    onClick={() => {
                      setShowInvoiceForm(false);
                      setSelectedOrder(null);
                      resetForm();
                    }}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cashier;
