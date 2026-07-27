import React from 'react';
import { Check, XCircle, ShoppingBag, CreditCard, Boxes, Truck, Home } from 'lucide-react';
import type { Order } from '../types';
import { formatTimelineDate } from '../utils/dateFormatter';

interface OrderTimelineProps {
  order: Order;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const steps = [
    { label: 'Pendiente', key: 'PENDING', icon: ShoppingBag },
    { label: 'Pagado', key: 'PAID', icon: CreditCard },
    { label: 'En Preparación', key: 'PREPARING', icon: Boxes },
    { label: 'En Camino', key: 'SHIPPED', icon: Truck },
    { label: 'Entregado', key: 'DELIVERED', icon: Home },
  ];

  const failedLog = order.statusLogs?.find((log) => ['CANCELLED', 'FAILED', 'RETURNED'].includes(log.status));
  const failedTime = failedLog ? formatTimelineDate(failedLog.changedAt) : formatTimelineDate(order.createdAt);

  if (['CANCELLED', 'FAILED', 'RETURNED'].includes(order.status)) {
    const isFailed = order.status === 'FAILED';
    const isReturned = order.status === 'RETURNED';
    let title = 'Pedido Cancelado';
    if (isFailed) title = 'Entrega Fallida';
    if (isReturned) title = 'Pedido Devuelto';
    
    let sub = 'Cancelado el';
    if (isFailed) sub = 'Falló el';
    if (isReturned) sub = 'Devuelto el';

    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-semibold w-full">
        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="font-extrabold text-red-800">{title}</p>
          <p className="text-[10px] text-red-500 mt-0.5">{sub} {failedTime}</p>
        </div>
      </div>
    );
  }

  const getStepData = (key: string) => {
    switch (key) {
      case 'PENDING': {
        const log = order.statusLogs?.find((l) => l.status === 'PENDING');
        return {
          isCompleted: true,
          isActive: order.status === 'PENDING',
          date: log ? log.changedAt : order.createdAt,
        };
      }
      case 'PAID': {
        const log = order.statusLogs?.find((l) => l.status === 'PAID');
        const isCompleted = ['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status);
        return {
          isCompleted,
          isActive: false,
          date: log?.changedAt,
        };
      }
      case 'PREPARING': {
        const log = order.statusLogs?.find((l) => l.status === 'PAID');
        const isCompleted = ['SHIPPED', 'DELIVERED'].includes(order.status);
        return {
          isCompleted,
          isActive: order.status === 'PAID',
          date: log?.changedAt,
        };
      }
      case 'SHIPPED': {
        const log = order.statusLogs?.find((l) => l.status === 'SHIPPED');
        const isCompleted = ['DELIVERED'].includes(order.status);
        return {
          isCompleted,
          isActive: order.status === 'SHIPPED',
          date: log?.changedAt,
        };
      }
      case 'DELIVERED': {
        const log = order.statusLogs?.find((l) => l.status === 'DELIVERED');
        const isCompleted = order.status === 'DELIVERED';
        return {
          isCompleted,
          isActive: order.status === 'DELIVERED',
          date: log?.changedAt,
        };
      }
      default:
        return { isCompleted: false, isActive: false, date: undefined };
    }
  };

  const getProgressWidth = () => {
    switch (order.status) {
      case 'PENDING': return 0;
      case 'PAID': return 50;
      case 'SHIPPED': return 75;
      case 'DELIVERED': return 100;
      default: return 0;
    }
  };

  return (
    <div className="w-full py-4 relative z-0">
      {/* Progress Bar Container */}
      <div className="relative flex items-start justify-between w-full">
        {/* Connecting Lines background */}
        <div className="absolute left-0 right-0 top-[18px] -translate-y-1/2 h-1 bg-gray-100 -z-10 rounded-full">
          <div 
            className="h-full bg-brand-accent transition-all duration-500 rounded-full"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>

        {/* Timeline Steps */}
        {steps.map((step) => {
          const StepIcon = step.icon;
          const { isCompleted, isActive, date } = getStepData(step.key);
          const showCheck = isCompleted && !isActive;

          return (
            <div key={step.key} className="flex flex-col items-center relative flex-1 text-center px-1">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-brand-accent border-brand-accent text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-400'
                } ${isActive ? 'ring-4 ring-brand-accent/20 scale-110' : ''}`}
              >
                {showCheck ? (
                  <Check className="w-4.5 h-4.5 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4.5 h-4.5" />
                )}
              </div>
              <span 
                className={`text-[9px] md:text-xs font-bold mt-2 transition-colors duration-300 ${
                  isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {date && (
                <span className="text-[8px] md:text-[9px] text-gray-400 font-semibold mt-0.5 max-w-[80px] leading-tight">
                  {formatTimelineDate(date)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
