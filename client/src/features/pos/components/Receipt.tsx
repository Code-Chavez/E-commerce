import React from 'react';
import { useBrand } from '@/shared/context/BrandContext';

export interface ReceiptData {
  orderId: number;
  date: string;
  seller: string;
  branch: {
    id: number;
    name: string;
    address: string;
    phone: string | null;
  };
  items: {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    lineTotal: number;
    isCrossBranch?: boolean;
  }[];
  isPickup?: boolean;
  isCrossBranch?: boolean;
  sourceBranchName?: string;
  documentType?: string;
  series?: string | null;
  correlative?: number | null;
  totals: {
    subtotal: number;
    discountTotal: number;
    total: number;
    paid: number;
    change: number;
  };
  igvExempt?: boolean;
  payments: {
    method: string;
    amount: number;
  }[];
}

interface ReceiptProps {
  data: ReceiptData | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ data }) => {
  const { brandConfig } = useBrand();

  if (!data) return null;

  return (
    <div className="hidden print:block text-black bg-white p-4 font-mono text-sm max-w-[80mm] mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-4">
        {brandConfig?.logoHorizontalUrl ? (
          <img
            src={brandConfig.logoHorizontalUrl}
            alt={brandConfig?.brandName || "D'MENDOZA"}
            className="max-h-12 max-w-full mx-auto object-contain mb-2 grayscale"
            onError={(e) => {
              // Si la imagen falla, ocultar y mostrar texto
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const h = document.createElement('h1');
                h.className = 'text-xl font-black uppercase mb-1 logo-fallback';
                h.textContent = brandConfig?.brandName || "D'MENDOZA";
                parent.insertBefore(h, target.nextSibling);
              }
            }}
          />
        ) : (
          <h1 className="text-xl font-black uppercase mb-1">{brandConfig?.brandName || "D'MENDOZA"}</h1>
        )}
        <h2 className="text-base font-bold uppercase">{data.branch.name}</h2>
        {data.branch.address && <p className="text-xs">{data.branch.address}</p>}
        {data.branch.phone && <p className="text-xs">Tel: {data.branch.phone}</p>}
        <p className="text-xs mt-2 font-bold uppercase border-t border-dashed border-gray-400 pt-2">
          {data.documentType === 'BOLETA' ? 'BOLETA DE VENTA ELECTRÓNICA'
            : data.documentType === 'FACTURA' ? 'FACTURA DE VENTA ELECTRÓNICA'
            : 'TICKET DE VENTA'}
        </p>
        <p className="text-xs font-bold pb-2">
          {(data.series && data.correlative)
            ? `${data.series}-${data.correlative.toString().padStart(6, '0')}`
            : `N° Venta: #${data.orderId.toString().padStart(6, '0')}`}
        </p>
      </div>

      {/* Meta Info */}
      <div className="text-xs mb-4">
        <p>Fecha: {new Date(data.date).toLocaleString('es-PE')}</p>
        <p>Atendido por: {data.seller}</p>
      </div>

      {/* Items */}
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-dashed border-gray-400">
            <th className="text-left pb-1">CANT</th>
            <th className="text-left pb-1">DESC.</th>
            <th className="text-right pb-1">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 align-top">{item.quantity}</td>
              <td className="py-1 pr-2">
                {item.name}
                {item.isCrossBranch && <span className="ml-1 text-xs font-bold">[EXT]</span>}
                {item.discountAmount > 0 && (
                  <div className="text-[10px] italic">
                    Desc: -S/. {item.discountAmount.toFixed(2)}
                  </div>
                )}
              </td>
              <td className="py-1 align-top text-right">
                {item.lineTotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="text-xs mb-4 border-t border-dashed border-gray-400 pt-2 space-y-1">
        {data.igvExempt ? (
          <>
            <div className="flex justify-between">
              <span>Op. Inafecta:</span>
              <span>S/. {data.totals.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV:</span>
              <span className="text-emerald-700 font-semibold">Exonerado (Ley 27037)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Op. Gravada:</span>
              <span>S/. {data.totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18%):</span>
              <span>S/. {(data.totals.subtotal * 0.18).toFixed(2)}</span>
            </div>
          </>
        )}
        {data.totals.discountTotal > 0 && (
          <div className="flex justify-between text-rose-700">
            <span>Descuento:</span>
            <span>-S/. {data.totals.discountTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-1 mt-1">
          <span>TOTAL:</span>
          <span>S/. {data.totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payments */}
      <div className="text-xs mb-4 border-t border-dashed border-gray-400 pt-2 space-y-1">
        {data.payments.map((p, idx) => (
          <div key={idx} className="flex justify-between">
            <span>PAGO ({p.method}):</span>
            <span>S/. {p.amount.toFixed(2)}</span>
          </div>
        ))}
        {data.totals.change > 0 && (
          <div className="flex justify-between font-bold mt-1">
            <span>VUELTO:</span>
            <span>S/. {data.totals.change.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-6 space-y-2">
        <p className="font-bold">¡Gracias por su compra!</p>
        <p>Vuelva pronto</p>
        
        {data.isPickup && !data.isCrossBranch && (
          <div className="border-t border-dashed border-gray-400 mt-4 pt-3 pb-2 text-[10px] leading-tight text-center font-bold">
            PARA RECOJO EN TIENDA: Conserve este comprobante. Preséntelo junto con su documento de identidad en la sucursal seleccionada para retirar su pedido. Plazo máximo de recojo: 7 días calendario desde la fecha de emisión.
          </div>
        )}

        {data.isCrossBranch && data.sourceBranchName && (
          <div className="border-t border-dashed border-gray-400 mt-4 pt-3 pb-2 text-[10px] leading-tight text-center font-bold text-[#B91C1C]">
            PENDIENTE DE RECOJO EN: {data.sourceBranchName.toUpperCase()}
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 mt-2 pt-3 pb-2 text-[10px] leading-tight text-justify">
          Este comprobante no tiene validez fiscal. Es un documento informativo emitido para el control interno y verificación del cliente, y no sustituye la factura o boleta electrónica correspondiente.
        </div>
      </div>
    </div>
  );
};
