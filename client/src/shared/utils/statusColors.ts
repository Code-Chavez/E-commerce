export interface StatusStyle {
  bg: string;
  border: string;
  text: string;
  glow: string;
  badge: string;
  label: string;
}

export const DELIVERY_STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING: {
    bg: 'bg-amber-500/10 backdrop-blur-md',
    border: 'border-amber-500/30',
    text: 'text-amber-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]',
    badge: 'bg-amber-500/20 text-amber-800 border-amber-500/30',
    label: 'Pendiente'
  },
  ASSIGNED: {
    bg: 'bg-indigo-500/10 backdrop-blur-md',
    border: 'border-indigo-500/30',
    text: 'text-indigo-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]',
    badge: 'bg-indigo-500/20 text-indigo-800 border-indigo-500/30',
    label: 'Asignado'
  },
  IN_TRANSIT: {
    bg: 'bg-sky-500/10 backdrop-blur-md',
    border: 'border-sky-500/30',
    text: 'text-sky-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(14,165,233,0.2)]',
    badge: 'bg-sky-500/20 text-sky-800 border-sky-500/30',
    label: 'En Camino'
  },
  DELIVERED: {
    bg: 'bg-emerald-500/10 backdrop-blur-md',
    border: 'border-emerald-500/30',
    text: 'text-emerald-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]',
    badge: 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30',
    label: 'Entregado'
  },
  FAILED: {
    bg: 'bg-rose-500/10 backdrop-blur-md',
    border: 'border-rose-500/30',
    text: 'text-rose-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]',
    badge: 'bg-rose-500/20 text-rose-800 border-rose-500/30',
    label: 'Fallido'
  },
  AWAITING_CLIENT_DECISION: {
    bg: 'bg-orange-500/10 backdrop-blur-md',
    border: 'border-orange-500/30',
    text: 'text-orange-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(249,115,22,0.2)]',
    badge: 'bg-orange-500/20 text-orange-800 border-orange-500/30',
    label: 'Esperando al Cliente'
  },
  CANCELLED: {
    bg: 'bg-gray-500/10 backdrop-blur-md',
    border: 'border-gray-500/30',
    text: 'text-gray-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(107,114,128,0.2)]',
    badge: 'bg-gray-500/20 text-gray-800 border-gray-500/30',
    label: 'Cancelado'
  },
  RETURNED: {
    bg: 'bg-purple-500/10 backdrop-blur-md',
    border: 'border-purple-500/30',
    text: 'text-purple-700 font-semibold',
    glow: 'shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]',
    badge: 'bg-purple-500/20 text-purple-800 border-purple-500/30',
    label: 'Devuelto'
  }
};

export const getStatusStyle = (status: string): StatusStyle => {
  return DELIVERY_STATUS_STYLES[status] || {
    bg: 'bg-gray-500/10 backdrop-blur-md',
    border: 'border-gray-500/30',
    text: 'text-gray-700 font-semibold',
    glow: '',
    badge: 'bg-gray-500/20 text-gray-800 border-gray-500/30',
    label: status
  };
};
