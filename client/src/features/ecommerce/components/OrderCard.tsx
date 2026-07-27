import React, { useState, useEffect } from 'react';
import type { Order } from '../types';
import { OrderTimeline } from './OrderTimeline';
import { orderService } from '../services/order.service';
import { toast } from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  RotateCcw,
  Truck,
  KeyRound,
  PackageX,
  Banknote,
  Check
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onOrderUpdated?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onOrderUpdated }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [pendingAction, setPendingAction] = useState<'redelivery' | 'return' | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link desde el email: /profile/orders?orderId=X&action=redelivery|return
  useEffect(() => {
    const qOrderId = searchParams.get('orderId');
    const qAction = searchParams.get('action');
    if (
      qOrderId === String(order.id) &&
      (qAction === 'redelivery' || qAction === 'return') &&
      order.status === 'FAILED'
    ) {
      setPendingAction(qAction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, order.status]);

  const clearActionParams = () => {
    if (searchParams.get('orderId') === String(order.id)) {
      searchParams.delete('orderId');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionSubmitting(true);
    try {
      if (pendingAction === 'redelivery') {
        await orderService.requestRedelivery(order.id);
        toast.success('Reenvío solicitado. Programaremos una nueva entrega pronto.');
      } else {
        await orderService.requestReturnFromFailed(order.id);
        toast.success('Devolución registrada. Te notificaremos cuando el reembolso sea procesado.');
      }
      setPendingAction(null);
      clearActionParams();
      onOrderUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'No se pudo completar la solicitud.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await orderService.downloadOrderReceiptPdf(order.id);
      toast.success('Comprobante descargado');
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar el comprobante');
    } finally {
      setIsDownloading(false);
    }
  };

  const getPickupStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Recojo Pendiente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      case 'ASSIGNED':
        return { label: 'Repartidor Asignado', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'IN_TRANSIT':
        return { label: 'En Camino a Recoger', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'DELIVERED':
        return { label: 'Producto Recogido', className: 'bg-green-50 text-green-700 border-green-200' };
      default:
        return { label: 'Recojo Programado', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
  };

  const approvedReturn = order.returnRequests?.find(r => r.status === 'APPROVED');
  const pickupOrder = approvedReturn?.pickupOrder;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header Info */}
      <div className="bg-gray-50/75 p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">ID Pedido</p>
            <p className="font-extrabold text-gray-800 mt-0.5">#{order.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Fecha de Compra</p>
            <div className="flex items-center gap-1.5 text-gray-700 font-medium mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Facturado</p>
            <p className="font-black text-brand-accent mt-0.5">S/ {order.total.toFixed(2)}</p>
          </div>
          {order.shippingCost > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Costo Envío</p>
              <p className="font-semibold text-gray-600 mt-0.5">S/ {order.shippingCost.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Return Request Button or Status Badge */}
          {order.status === 'DELIVERED' && (
            <>
              {!order.returnRequests || order.returnRequests.length === 0 ? (
                <Link
                  to={`/profile/orders/${order.id}/return`}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-brand-primary/30 hover:border-brand-accent rounded-xl text-xs font-bold text-[#3F3F3F] hover:text-brand-accent bg-white transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Solicitar Devolución</span>
                </Link>
              ) : (
                (() => {
                  const req = order.returnRequests[0];
                  let badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                  let label = 'Devolución Pendiente';

                  if (req.status === 'APPROVED') {
                    badgeClass = 'bg-green-50 text-green-700 border-green-200';
                    label = 'Devolución Aprobada';
                  } else if (req.status === 'REJECTED') {
                    badgeClass = 'bg-red-50 text-red-700 border-red-200';
                    label = 'Devolución Rechazada';
                  }

                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-xl text-[10px] font-extrabold tracking-wide uppercase shadow-sm ${badgeClass}`}>
                      <RotateCcw className="w-3 h-3" />
                      {label}
                    </span>
                  );
                })()
              )}
            </>
          )}

          {/* Action Button: PDF receipt */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-black rounded-xl text-xs font-bold text-gray-700 hover:text-black bg-white transition-all shadow-sm disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Comprobante PDF</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Timeline Status */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Estado del Pedido</h4>
          <OrderTimeline order={order} />
        </div>

        {/* PIN de Entrega (visible mientras el pedido está en tránsito) */}
        {(order.status === 'PAID' || order.status === 'SHIPPED') && order.deliveryPin && (
          <div className="p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-wider text-brand-accent mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              PIN de Entrega
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-2xl font-black tracking-[0.3em] text-brand-accent shrink-0">
                {order.deliveryPin}
              </p>
              <p className="text-[11px] text-brand-text font-semibold leading-snug">
                Entrega este código al repartidor al recibir tu pedido para confirmar la recepción.
                No lo compartas con nadie más.
              </p>
            </div>
          </div>
        )}

        {/* Banner de reenvío con mini-tracker del delivery actual */}
        {order.isRedelivery && order.status === 'SHIPPED' && (() => {
          const ds = order.currentDeliveryStatus;
          const step1Done = true; // siempre: reenvío solicitado
          const step2Done = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].includes(ds ?? '');
          const step3Done = ['IN_TRANSIT', 'DELIVERED'].includes(ds ?? '');
          const step2Active = ds === 'ASSIGNED';
          const step3Active = ds === 'IN_TRANSIT';

          const statusText =
            ds === 'IN_TRANSIT' ? 'Tu reenvío está en camino. Muestra el PIN al repartidor.' :
            ds === 'ASSIGNED'   ? 'Un repartidor ha sido asignado. Tu pedido saldrá pronto.' :
                                  'Estamos procesando tu reenvío.';

          const dotClass = (done: boolean, active: boolean) =>
            `w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
              done
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : 'bg-white border-gray-300 text-gray-400'
            } ${active ? 'ring-2 ring-indigo-300 scale-110' : ''}`;

          return (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2">
                <Truck className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-indigo-800">Tu pedido está siendo reenviado</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5">{statusText}</p>
                </div>
              </div>

              {/* Mini-tracker del reenvío */}
              <div className="flex items-center gap-2 pt-1">
                {/* Paso 1: Solicitado */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={dotClass(step1Done, false)}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-[9px] font-bold text-center text-indigo-700 leading-tight">Solicitado</span>
                </div>

                <div className={`flex-1 h-0.5 mb-4 rounded-full ${step2Done ? 'bg-indigo-500' : 'bg-gray-200'}`} />

                {/* Paso 2: Repartidor asignado */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={dotClass(step2Done, step2Active)}>
                    {step2Done ? <Check className="w-3 h-3 stroke-[3]" /> : <Truck className="w-3 h-3" />}
                  </div>
                  <span className={`text-[9px] font-bold text-center leading-tight ${step2Done ? 'text-indigo-700' : 'text-gray-400'}`}>Asignado</span>
                </div>

                <div className={`flex-1 h-0.5 mb-4 rounded-full ${step3Done ? 'bg-indigo-500' : 'bg-gray-200'}`} />

                {/* Paso 3: En camino */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={dotClass(step3Done, step3Active)}>
                    {step3Done ? <Check className="w-3 h-3 stroke-[3]" /> : <MapPin className="w-3 h-3" />}
                  </div>
                  <span className={`text-[9px] font-bold text-center leading-tight ${step3Done ? 'text-indigo-700' : 'text-gray-400'}`}>En camino</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Entrega fallida: el cliente decide reenvío o devolución */}
        {order.status === 'FAILED' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2">
              <PackageX className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-red-800">No pudimos entregar tu pedido</p>
                <p className="text-xs text-red-600 font-semibold mt-0.5">
                  Elige cómo deseas continuar: podemos programar un nuevo envío o devolver el pedido y reembolsarte.
                </p>
              </div>
            </div>

            {order.failedAttempts && order.failedAttempts.length > 0 && (
              <div className="p-3 bg-white border border-red-100 rounded-xl space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  Motivo del intento fallido{order.failedAttempts.length > 1 ? ` (intento ${order.failedAttempts.length})` : ''}
                </p>
                <p className="text-xs font-bold text-gray-800 leading-snug">
                  {order.failedAttempts[0].reason}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold">
                  {new Date(order.failedAttempts[0].attemptedAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                  {order.failedAttempts[0].rescheduledFor && (
                    <> · Reprogramación sugerida: {new Date(order.failedAttempts[0].rescheduledFor).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</>
                  )}
                </p>
              </div>
            )}

            {pendingAction ? (
              <div className="p-3 bg-white border border-red-100 rounded-xl space-y-3">
                <p className="text-xs font-bold text-gray-700">
                  {pendingAction === 'redelivery'
                    ? '¿Confirmas que deseas programar un nuevo envío para este pedido?'
                    : '¿Confirmas la devolución del pedido? El reembolso será procesado a tu medio de pago original.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmAction}
                    disabled={actionSubmitting}
                    className="flex-1 py-2 text-xs font-bold bg-brand-accent text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirmar
                  </button>
                  <button
                    onClick={() => { setPendingAction(null); clearActionParams(); }}
                    disabled={actionSubmitting}
                    className="flex-1 py-2 text-xs font-bold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setPendingAction('redelivery')}
                  className="flex-1 py-2.5 text-xs font-bold bg-brand-accent text-white rounded-xl hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Solicitar Reenvío
                </button>
                <button
                  onClick={() => setPendingAction('return')}
                  className="flex-1 py-2.5 text-xs font-bold border border-red-300 text-red-700 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Solicitar Devolución
                </button>
              </div>
            )}
          </div>
        )}

        {/* Estado del reembolso (pedidos devueltos) */}
        {order.status === 'RETURNED' && order.refundStatus && order.refundStatus !== 'NONE' && (
          <div className={`p-4 border rounded-2xl flex items-center gap-3 ${
            order.refundStatus === 'PROCESSED'
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <Banknote className={`w-4.5 h-4.5 shrink-0 ${
              order.refundStatus === 'PROCESSED' ? 'text-green-600' : 'text-amber-600'
            }`} />
            <div>
              <p className={`text-sm font-extrabold ${
                order.refundStatus === 'PROCESSED' ? 'text-green-800' : 'text-amber-800'
              }`}>
                {order.refundStatus === 'PROCESSED' ? 'Reembolso procesado' : 'Reembolso en proceso'}
              </p>
              <p className={`text-xs font-semibold mt-0.5 ${
                order.refundStatus === 'PROCESSED' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {order.refundStatus === 'PROCESSED'
                  ? 'El importe fue devuelto a tu medio de pago original.'
                  : 'Nuestro equipo está gestionando la devolución del importe a tu medio de pago original.'}
              </p>
            </div>
          </div>
        )}

        {/* Pickup Order Status (visible only when return is approved) */}
        {pickupOrder && (
          <div className="pt-4 border-t border-gray-50">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              Orden de Recojo
            </h4>
            <div className="flex items-center gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">Recojo #{pickupOrder.id}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Programado: {new Date(pickupOrder.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {(() => {
                const info = getPickupStatusInfo(pickupOrder.status);
                return (
                  <span className={`inline-flex items-center px-3 py-1.5 border rounded-xl text-[10px] font-extrabold tracking-wide uppercase shadow-sm ${info.className}`}>
                    {info.label}
                  </span>
                );
              })()}
            </div>
          </div>
        )}

        {/* Address & Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
          {/* Address Snapshot */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Dirección de Envío
            </h4>
            <div className="text-sm text-gray-700 bg-gray-50/50 p-4 border border-gray-100 rounded-xl">
              <p className="font-bold text-gray-800">{order.addressSnapshot.alias}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.addressSnapshot.fullAddress}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {order.addressSnapshot.district}
                {order.addressSnapshot.reference && ` • Ref: ${order.addressSnapshot.reference}`}
              </p>
            </div>
          </div>

          {/* Toggle Items view */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => setShowItems(!showItems)}
              className="flex items-center justify-between w-full px-5 py-3 border border-gray-100 hover:border-gray-200 bg-gray-50/20 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-gray-400" />
                <span>Productos en este pedido ({order.items.reduce((acc, item) => acc + item.qty, 0)})</span>
              </div>
              {showItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Products Items List dropdown */}
        {showItems && (
          <div className="pt-4 border-t border-gray-100 animate-fadeIn">
            <div className="bg-gray-50/30 border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100/50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3 text-center">Cant.</th>
                    <th className="px-5 py-3 text-right">Precio Unit.</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/40">
                      <td className="px-5 py-3.5 font-bold text-gray-900">{item.productName}</td>
                      <td className="px-5 py-3.5 font-mono text-[10px] text-gray-400">{item.variantSku}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-gray-800">{item.qty}</td>
                      <td className="px-5 py-3.5 text-right">S/ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">S/ {(item.qty * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
