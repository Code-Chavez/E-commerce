import React, { useState } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import axiosInstance from '@/shared/api/axiosInstance';
import { Percent, DollarSign, Tag, Loader2, CheckCircle, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

import { handleNumericKeyDown } from '@/shared/validation/documentValidators';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface CartItem {
  variantId: number;
  quantity: number;
  unitPrice: number;
}

export interface DiscountResult {
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;
  appliedBy: {
    userId: number;
    email: string;
  };
}

interface DiscountPanelProps {
  /** Ítems del carrito actual que se van a descontar */
  items: CartItem[];
  /** Callback que recibe el resultado del descuento validado */
  onDiscountApplied?: (result: DiscountResult) => void;
}

// ─── Roles autorizados para aplicar descuentos ───────────────────────────────
// Estos roles deben tener el permiso "pos:discounts" asignado en la BD.
const DISCOUNT_ALLOWED_ROLES = ['ADMIN', 'CAJERO_SENIOR'];

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * HU-034 / T-126: Panel de descuentos para el Punto de Venta (POS).
 *
 * Renderiza condicionalmente basado en el rol del usuario desde AuthContext:
 * - Si el usuario tiene un rol autorizado (ADMIN, CAJERO_SENIOR): muestra el panel completo.
 * - Si el usuario no tiene permisos: muestra un mensaje explicativo bloqueando la interacción.
 *
 * Permite seleccionar entre descuento por porcentaje o por monto fijo,
 * llama al endpoint POST /api/v1/pos/discounts/validate y muestra el resultado.
 */
const DiscountPanel: React.FC<DiscountPanelProps> = ({ items, onDiscountApplied }) => {
  const { user } = useAuth();

  // Estado local del formulario
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiscountResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Verificación de autorización por rol ──────────────────────────────────
  const userRole = user?.role ?? '';
  const isAuthorized = DISCOUNT_ALLOWED_ROLES.includes(userRole);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setError('Ingresa un valor de descuento válido mayor que cero.');
      return;
    }

    if (items.length === 0) {
      setError('El carrito está vacío. Agrega productos antes de aplicar un descuento.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post<{ success: boolean; data: DiscountResult }>(
        '/v1/pos/discounts/validate',
        {
          items,
          discountType,
          discountValue: value,
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        onDiscountApplied?.(response.data.data);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error ?? 'Error al validar el descuento. Intenta nuevamente.';
      setError(typeof message === 'string' ? message : 'Error de validación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setDiscountValue('');
  };

  // ─── Renderizado condicional: usuario sin permiso ─────────────────────────
  if (!isAuthorized) {
    return (
      <div
        style={{
          border: '1.5px solid #D9D9D2',
          borderRadius: '16px',
          padding: '20px 24px',
          background: '#F7F7F5',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Tag size={28} color="#D9D9D2" />
        </div>
        <p style={{ color: '#3F3F3F', fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>
          Panel de Descuentos
        </p>
        <p style={{ color: '#9B9B94', fontSize: '13px', margin: 0 }}>
          Tu rol actual (<strong>{userRole || 'Sin rol'}</strong>) no tiene permisos para aplicar
          descuentos. Contacta a un Administrador o Cajero Senior.
        </p>
      </div>
    );
  }

  // ─── Renderizado: resultado del descuento calculado ──────────────────────
  if (result) {
    return (
      <div
        style={{
          border: '1.5px solid #3F3F3F',
          borderRadius: '16px',
          padding: '20px 24px',
          background: '#F7F7F5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={20} color="#3F3F3F" />
          <span style={{ fontWeight: 700, color: '#3F3F3F', fontSize: '15px' }}>
            Descuento Validado
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B6B6B' }}>
            <span>Subtotal:</span>
            <span>S/. {result.subtotal.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#3F3F3F',
              fontWeight: 600,
            }}
          >
            <span>
              Descuento (
              {result.discountType === 'percentage'
                ? `${result.discountValue}%`
                : `Monto fijo`}
              ):
            </span>
            <span style={{ color: '#c0392b' }}>- S/. {result.discountAmount.toFixed(2)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #D9D9D2', margin: '4px 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#3F3F3F',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            <span>Total Final:</span>
            <span>S/. {result.total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleReset}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            border: '1.5px solid #3F3F3F',
            borderRadius: '8px',
            background: 'transparent',
            color: '#3F3F3F',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#D9D9D2';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          Aplicar otro descuento
        </button>
      </div>
    );
  }

  // ─── Renderizado: formulario principal ────────────────────────────────────
  return (
    <div
      style={{
        border: '1.5px solid #D9D9D2',
        borderRadius: '16px',
        padding: '20px 24px',
        background: '#F7F7F5',
      }}
    >
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Tag size={18} color="#3F3F3F" />
        <h3 style={{ margin: 0, color: '#3F3F3F', fontSize: '15px', fontWeight: 700 }}>
          Aplicar Descuento
        </h3>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Selector de tipo de descuento */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setDiscountType('percentage'); setResult(null); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '8px',
              border: '1.5px solid',
              borderColor: discountType === 'percentage' ? '#3F3F3F' : '#D9D9D2',
              background: discountType === 'percentage' ? '#3F3F3F' : 'transparent',
              color: discountType === 'percentage' ? '#F7F7F5' : '#3F3F3F',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            <Percent size={14} />
            Porcentaje
          </button>
          <button
            type="button"
            onClick={() => { setDiscountType('fixed'); setResult(null); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '8px',
              border: '1.5px solid',
              borderColor: discountType === 'fixed' ? '#3F3F3F' : '#D9D9D2',
              background: discountType === 'fixed' ? '#3F3F3F' : 'transparent',
              color: discountType === 'fixed' ? '#F7F7F5' : '#3F3F3F',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            <DollarSign size={14} />
            Monto Fijo
          </button>
        </div>

        {/* Input del valor */}
        <div>
          <label
            htmlFor="discount-value-input"
            style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '6px', fontWeight: 500 }}
          >
            {discountType === 'percentage'
              ? 'Porcentaje de descuento (ej: 10 = 10%)'
              : 'Monto fijo a descontar (S/.)'}
          </label>
          <input
            id="discount-value-input"
            type="number"
            min="0.01"
            step="0.01"
            max={discountType === 'percentage' ? 100 : undefined}
            value={discountValue}
            onKeyDown={handleNumericKeyDown}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (val < 0) return;
              if (discountType === 'percentage' && val > 100) return;
              setDiscountValue(e.target.value);
            }}
            placeholder={discountType === 'percentage' ? '0 – 100' : '0.00'}
            required
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1.5px solid #D9D9D2',
              background: '#fff',
              color: '#3F3F3F',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#3F3F3F'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D9D9D2'; }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: '#fef0f0',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#c0392b',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          id="btn-validate-discount"
          type="submit"
          disabled={isLoading || items.length === 0}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: isLoading || items.length === 0 ? '#D9D9D2' : '#3F3F3F',
            color: isLoading || items.length === 0 ? '#9B9B94' : '#F7F7F5',
            fontWeight: 700,
            fontSize: '14px',
            cursor: isLoading || items.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Calculando...
            </>
          ) : (
            'Validar Descuento'
          )}
        </button>

        {items.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9B9B94', fontSize: '12px', margin: 0 }}>
            Agrega productos al carrito para habilitar el descuento.
          </p>
        )}
      </form>
    </div>
  );
};

export default DiscountPanel;
