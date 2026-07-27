import React from 'react';
import { Check, XCircle, ShoppingBag, CreditCard, Truck, Home } from 'lucide-react';
import type { OrderStatus } from '../types';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ status }) => {
  const steps = [
    { label: 'Registrado', key: 'PENDING', icon: ShoppingBag },
    { label: 'Pagado', key: 'PAID', icon: CreditCard },
    { label: 'Enviado', key: 'SHIPPED', icon: Truck },
    { label: 'Entregado', key: 'DELIVERED', icon: Home },
  ];

  const getStatusIndex = (currStatus: OrderStatus) => {
    switch (currStatus) {
      case 'PENDING': return 0;
      case 'PAID': return 1;
      case 'SHIPPED': return 2;
      case 'DELIVERED': return 3;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(status);

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold w-fit">
        <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
        <span>Este pedido ha sido cancelado</span>
      </div>
    );
  }

  return (
    <div className="w-full py-4 relative z-0">
      {/* Progress Bar Container */}
      <div className="relative flex items-center justify-between w-full">
        {/* Connecting Lines background */}
        <div className="absolute left-0 right-0 top-[18px] -translate-y-1/2 h-1 bg-gray-100 -z-10 rounded-full">
          <div 
            className="h-full bg-brand-accent transition-all duration-500 rounded-full"
            style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Timeline Steps */}
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx <= currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-brand-accent border-brand-accent text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-400'
                } ${isActive ? 'ring-4 ring-brand-accent/20 scale-110' : ''}`}
              >
                {isCompleted && idx < currentIndex ? (
                  <Check className="w-4.5 h-4.5 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4.5 h-4.5" />
                )}
              </div>
              <span 
                className={`text-[10px] md:text-xs font-bold mt-2 transition-colors duration-300 ${
                  isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
