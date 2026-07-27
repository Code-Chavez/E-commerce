import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Loader2, AlertCircle, CheckCircle, Clock, FileText, Filter,
} from 'lucide-react';
import {
  complaintService,
  type Complaint,
  type ComplaintStatus,
} from '../ecommerce/services/complaint.service';

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCTO: 'Producto',
  SERVICIO: 'Servicio',
  ENTREGA: 'Entrega',
  ATENCION: 'Atención',
  PAGO: 'Pago',
  OTRO: 'Otro',
};

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; icon: React.FC<any>; cls: string; badgeCls: string }> = {
  OPEN: {
    label: 'Abierto',
    icon: AlertCircle,
    cls: 'bg-red-50 text-red-700 border-red-200',
    badgeCls: 'bg-red-100 text-red-700',
  },
  IN_REVIEW: {
    label: 'En revisión',
    icon: Clock,
    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    badgeCls: 'bg-yellow-100 text-yellow-700',
  },
  RESOLVED: {
    label: 'Resuelto',
    icon: CheckCircle,
    cls: 'bg-green-50 text-green-700 border-green-200',
    badgeCls: 'bg-green-100 text-green-700',
  },
};

const NEXT_STATUS: Record<ComplaintStatus, ComplaintStatus | null> = {
  OPEN: 'IN_REVIEW',
  IN_REVIEW: 'RESOLVED',
  RESOLVED: null,
};

const NEXT_LABEL: Record<ComplaintStatus, string> = {
  OPEN: 'Poner en revisión',
  IN_REVIEW: 'Marcar resuelto',
  RESOLVED: '',
};

const ComplaintsAdminPage: React.FC = () => {
  useDocumentTitle("Libro de Reclamaciones — E-Commerce Admin");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [updating, setUpdating] = useState<number | null>(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintService.getAll(statusFilter || undefined);
      setComplaints(data);
    } catch (e: any) {
      toast.error(e.message || 'Error al cargar reclamaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComplaints(); }, [statusFilter]);

  const handleStatusUpdate = async (id: number, newStatus: ComplaintStatus) => {
    setUpdating(id);
    try {
      const updated = await complaintService.updateStatus(id, newStatus);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: updated.status } : c));
      toast.success(`Reclamación #${id} actualizada a "${STATUS_CONFIG[newStatus].label}"`);
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  const counts = {
    OPEN: complaints.filter(c => c.status === 'OPEN').length,
    IN_REVIEW: complaints.filter(c => c.status === 'IN_REVIEW').length,
    RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Libro de Reclamaciones
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Gestión de quejas y reclamaciones de clientes</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(STATUS_CONFIG) as [ComplaintStatus, typeof STATUS_CONFIG[ComplaintStatus]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                statusFilter === key
                  ? `${cfg.cls} shadow-md`
                  : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-extrabold">{counts[key]}</p>
                  <p className="text-xs font-bold mt-0.5">{cfg.label}</p>
                </div>
                <Icon className="w-8 h-8 opacity-40" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500 font-semibold">Filtrar por estado:</span>
        {(['', 'OPEN', 'IN_REVIEW', 'RESOLVED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'Todos' : STATUS_CONFIG[s as ComplaintStatus].label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mr-2" />
          <span className="text-sm text-gray-500 font-semibold">Cargando reclamaciones...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm gap-3">
          <FileText className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-500">
            {statusFilter ? `No hay reclamaciones con estado "${STATUS_CONFIG[statusFilter].label}"` : 'No hay reclamaciones registradas'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Pedido</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const sc = STATUS_CONFIG[c.status];
                  const StatusIcon = sc.icon;
                  const next = NEXT_STATUS[c.status];
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-indigo-600">#{c.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">
                          {c.user ? `${c.user.name ?? ''} ${c.user.lastName ?? ''}`.trim() || 'Sin nombre' : '—'}
                        </div>
                        <div className="text-gray-400">{c.user?.email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                          {CATEGORY_LABELS[c.category] ?? c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.orderId ? `#${c.orderId}` : '—'}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-gray-600" title={c.description}>{c.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${sc.badgeCls}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {next ? (
                          <button
                            onClick={() => handleStatusUpdate(c.id, next)}
                            disabled={updating === c.id}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-xs disabled:opacity-50"
                          >
                            {updating === c.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : null}
                            {NEXT_LABEL[c.status]}
                          </button>
                        ) : (
                          <span className="text-gray-300 font-semibold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsAdminPage;
