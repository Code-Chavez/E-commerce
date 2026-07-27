import React, { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useCart } from './hooks/useCart';
import { ShoppingCart, MapPin, CreditCard, CheckCircle, ChevronRight, Loader2, Plus, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CouponInput } from './components/CouponInput';
import axiosInstance from '@/shared/api/axiosInstance';
import { AddressFormModal } from './profile/components/AddressFormModal';
import type { AddressFormData } from './profile/schemas/address.schema';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from './components/PaymentForm';
import { CreditNoteInput } from './components/CreditNoteInput';
import { LoyaltyInput } from './components/LoyaltyInput';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Address {
  id: number;
  alias: string;
  fullAddress: string;
  district: string;
  reference?: string;
  isDefault: boolean;
}

export const CheckoutPage = () => {
  useDocumentTitle('Checkout - Envío y Pago');
  const { cart, isLoading } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [creditNoteAmount, setCreditNoteAmount] = useState(0);
  const [creditNoteCode, setCreditNoteCode] = useState<string | null>(null);
  const [loyaltyDiscountAmount, setLoyaltyDiscountAmount] = useState(0);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const response = await axiosInstance.get('/v1/addresses');
      setAddresses(response.data.data as Address[]);
    } catch (error) {
      toast.error('Error al cargar tus direcciones');
    } finally {
      setIsLoadingAddresses(false);
    }
  };
  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreateAddress = async (data: AddressFormData) => {
    setIsSavingAddress(true);
    try {
      await axiosInstance.post('/v1/addresses', data);
      toast.success('Dirección creada exitosamente');
      setIsAddressModalOpen(false);
      await fetchAddresses();
    } catch (error) {
      toast.error('Ocurrió un error al guardar la dirección');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Calculate checkout costs
  const calculateCosts = async (addressId: number) => {
    if (!cart?.id) return;
    setIsCalculating(true);
    try {
      const response = await axiosInstance.post('/v1/checkout/calculate', {
        cartId: cart.id,
        addressId,
      });
      const data = response.data.data;
      setShippingCost(data.shippingCost);
      setCalculatedTotal(data.total);
      setCoverageError(null);
    } catch (error: any) {
      setShippingCost(null);
      setCalculatedTotal(null);
      setCoverageError(error.response?.data?.error || 'Error al calcular costo de envío');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    calculateCosts(addressId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) {
      toast.error('Por favor selecciona una dirección de envío');
      return;
    }
    if (coverageError) {
      toast.error(coverageError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axiosInstance.post('/v1/checkout/payment-intent', {
        cartId: cart?.id,
        addressId: selectedAddressId,
        creditNoteCode: creditNoteCode || undefined,
        loyaltyPoints: loyaltyPointsToRedeem || undefined,
      });
      
      if (response.data.success) {
        if (response.data.data.isFree && response.data.data.orderId) {
          // Si el total a pagar es 0, no pasamos por Stripe
          toast.success('¡Orden creada exitosamente!');
          navigate('/checkout/success?order_id=' + response.data.data.orderId);
          return;
        } else if (response.data.data.clientSecret) {
          setClientSecret(response.data.data.clientSecret);
          setStep('payment');
        } else {
          toast.error('Respuesta inválida del servidor al procesar el pago.');
        }
      } else {
        toast.error('No se pudo iniciar el proceso de pago.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ocurrió un error al preparar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] pt-24 px-4 flex flex-col items-center justify-center text-center">
        <ShoppingCart className="w-20 h-20 text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Aún no has agregado productos a tu carrito. Explora nuestras colecciones y encuentra lo que buscas.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-brand-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
        >
          Ir a comprar
        </button>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Stepper visual */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-8 text-sm md:text-base font-medium text-gray-500">
          <span className="flex items-center gap-2 cursor-pointer hover:text-brand-accent" onClick={() => navigate('/cart')}>
            <ShoppingCart size={18} /> Carrito
          </span>
          <ChevronRight size={16} />
          <span 
            className={`flex items-center gap-2 ${
              step === 'shipping' ? 'text-brand-accent font-bold' : 'cursor-pointer hover:text-brand-accent'
            }`}
            onClick={() => {
              if (step === 'payment') setStep('shipping');
            }}
          >
            <MapPin size={18} /> Envío
          </span>
          <ChevronRight size={16} />
          <span className={`flex items-center gap-2 ${step === 'payment' ? 'text-brand-accent font-bold' : 'opacity-50'}`}>
            <CreditCard size={18} /> Pago
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column: Shipping Form or Stripe Payment Element */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {step === 'shipping' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Detalles de Envío</h2>
                
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Selecciona una Dirección</h3>
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:text-black transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Nueva Dirección
                      </button>
                    </div>
                    
                    {isLoadingAddresses ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl flex flex-col items-center text-center gap-3">
                        <p className="text-yellow-800 text-sm font-medium">
                          No tienes direcciones guardadas. Por favor agrega una antes de continuar.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(true)}
                          className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-bold shadow-sm hover:bg-black transition-colors"
                        >
                          Agregar Dirección
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <label 
                            key={addr.id} 
                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                              selectedAddressId === addr.id 
                                ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent' 
                                : 'border-gray-200 hover:border-brand-accent/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              className="mt-1 w-4 h-4 text-brand-accent focus:ring-brand-accent border-gray-300"
                              checked={selectedAddressId === addr.id}
                              onChange={() => handleAddressSelect(addr.id)}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 flex items-center gap-2">
                                {addr.alias}
                                {addr.isDefault && (
                                  <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    Principal
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{addr.fullAddress}</p>
                              <p className="text-xs text-gray-500 mt-1">{addr.district}</p>
                              {addr.reference && <p className="text-xs text-gray-400 mt-0.5">Ref: {addr.reference}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {coverageError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                        {coverageError}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              clientSecret && (
                <div className="space-y-6">
                  {/* Address Summary */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-brand-accent" />
                      Dirección de Envío
                    </h3>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="font-semibold text-gray-800">{selectedAddress?.alias}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedAddress?.fullAddress}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedAddress?.district}</p>
                      {selectedAddress?.reference && <p className="text-xs text-gray-400 mt-0.5">Ref: {selectedAddress.reference}</p>}
                    </div>
                  </div>

                  {/* Stripe Wrapper & PaymentForm */}
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret, 
                      locale: 'es',
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#3F3F3F',
                          colorBackground: '#ffffff',
                          colorText: '#30313d',
                          colorDanger: '#df1b41',
                          fontFamily: 'Ideal Sans, system-ui, sans-serif',
                          spacingUnit: '4px',
                          borderRadius: '12px',
                        }
                      }
                    }}
                  >
                    <PaymentForm 
                      total={calculatedTotal !== null ? Math.max(0, calculatedTotal - discountAmount - creditNoteAmount - loyaltyDiscountAmount) : Math.max(0, cart.subtotal - discountAmount - creditNoteAmount - loyaltyDiscountAmount)}
                      onBack={() => setStep('shipping')}
                    />
                  </Elements>
                </div>
              )
            )}
          </div>

          {/* Resumen de la Orden */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen de tu Orden</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative">
                      <img
                        src={item.variant.product.images.find(i => i.isMain)?.url || 'https://via.placeholder.com/150'}
                        alt={item.variant.product.name}
                        className="w-16 h-16 object-cover rounded-lg border bg-gray-50"
                      />
                      <span className="absolute -top-2 -right-2 bg-brand-accent text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shadow-sm">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{item.variant.product.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.variant.attributesJson?.talla && `Talla: ${item.variant.attributesJson.talla}`}
                          {item.variant.attributesJson?.color && ` • Color: ${item.variant.attributesJson.color}`}
                        </p>
                      </div>
                      <div className="text-right pl-4">
                        <p className="font-bold text-sm text-gray-900">S/ {Number(item.variant.finalPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">S/ {cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío estimado</span>
                  {isCalculating ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Calculando...</span>
                  ) : shippingCost !== null ? (
                    <span className="font-medium text-gray-900">S/ {shippingCost.toFixed(2)}</span>
                  ) : (
                    <span className="font-medium text-gray-900 text-xs">Selecciona dirección</span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento (Cupón)</span>
                    <span className="font-medium">-S/ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {creditNoteAmount > 0 && (
                  <div className="flex justify-between text-brand-accent">
                    <span>Vale de Crédito</span>
                    <span className="font-medium">-S/ {creditNoteAmount.toFixed(2)}</span>
                  </div>
                )}
                {loyaltyDiscountAmount > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>Puntos Canjeados ({loyaltyPointsToRedeem} pts)</span>
                    <span className="font-medium">-S/ {loyaltyDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {step === 'shipping' && (
                <>
                  <CouponInput 
                    subtotal={cart.subtotal} 
                    onCouponApplied={(amount) => {
                      setDiscountAmount(amount);
                    }} 
                  />
                  <CreditNoteInput 
                    onCreditNoteApplied={(amount, code) => {
                      setCreditNoteAmount(amount);
                      setCreditNoteCode(code);
                    }} 
                  />
                  <LoyaltyInput 
                    maxAllowedDiscount={Math.max(0, cart.subtotal - discountAmount - creditNoteAmount)}
                    onLoyaltyApplied={(amount, points) => {
                      setLoyaltyDiscountAmount(amount);
                      setLoyaltyPointsToRedeem(points);
                    }}
                  />
                </>
              )}

              <div className="border-t pt-4 mb-8 mt-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-brand-accent text-xl">
                    S/ {calculatedTotal !== null ? Math.max(0, calculatedTotal - discountAmount - creditNoteAmount - loyaltyDiscountAmount).toFixed(2) : Math.max(0, cart.subtotal - discountAmount - creditNoteAmount - loyaltyDiscountAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {step === 'shipping' ? (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || shippingCost === null || !selectedAddressId}
                  className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Continuar al Pago
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span>Pago seguro y encriptado activo</span>
                </div>
              )}
              
              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                Pagos 100% Seguros
              </p>
            </div>
          </div>

        </div>
      </div>

      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSubmit={handleCreateAddress}
        isSaving={isSavingAddress}
      />
    </div>
  );
};
