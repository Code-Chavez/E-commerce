import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingCart, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { VariantSelectionModal } from './VariantSelectionModal';
import { RelatedProducts } from './RelatedProducts';

export const CartDrawer = () => {
  const { cart, isOpen, closeCart, updateItem, removeItem, isLoading } = useCart();
  const navigate = useNavigate();
  const [editingCartItemId, setEditingCartItemId] = React.useState<number | null>(null);
  const [editingProductSlug, setEditingProductSlug] = React.useState<string>('');

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeCart();
    }
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItem(itemId, newQuantity);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-brand-accent">
            <ShoppingCart className="w-6 h-6" />
            Mi Carrito
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!cart?.items || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                <img
                  src={item.variant.product.images.find(i => i.isMain)?.url || 'https://via.placeholder.com/150'}
                  alt={item.variant.product.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-brand-accent line-clamp-1">
                        {item.variant.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">SKU: {item.variant.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCartItemId(item.id);
                          setEditingProductSlug(item.variant.product.slug);
                        }}
                        className="text-gray-400 hover:text-brand-accent transition-colors"
                        title="Modificar talla/color"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-black transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-black transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      {item.variant.discountPercent > 0 && (
                        <p className="text-xs text-gray-400 line-through">
                          S/ {Number(item.variant.price).toFixed(2)}
                        </p>
                      )}
                      <p className="font-bold text-brand-accent">
                        S/ {Number(item.variant.finalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Related Products — HU-093 */}
        {cart && cart.items.length > 0 && (
          <div className="px-4 pb-4 border-t pt-4">
            <RelatedProducts
              productId={cart.items[cart.items.length - 1].variant.product.id}
              title="También te puede interesar"
            />
          </div>
        )}

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4 text-lg font-bold text-brand-accent">
              <span>Subtotal</span>
              <span>S/ {cart.subtotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
              className="w-full bg-brand-accent text-white py-3 rounded-lg font-semibold hover:bg-black transition-colors"
            >
              Proceder al Checkout
            </button>
          </div>
        )}
      </div>

      <VariantSelectionModal 
        isOpen={!!editingCartItemId}
        onClose={() => {
          setEditingCartItemId(null);
          setEditingProductSlug('');
        }}
        productSlug={editingProductSlug}
        editCartItemId={editingCartItemId || undefined}
      />
    </div>
  );
};
