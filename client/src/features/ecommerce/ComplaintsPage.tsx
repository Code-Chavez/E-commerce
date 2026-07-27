import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock, FileText, PlusCircle } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  complaintService,
  type Complaint,
  type ComplaintCategory,
} from './services/complaint.service';

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  PRODUCTO: 'Producto',
  SERVICIO: 'Servicio',
  ENTREGA: 'Entrega',
  ATENCION: 'Atención al Cliente',
  PAGO: 'Pago',
  OTRO: 'Otro',
};

const STATUS_CONFIG = {
  OPEN: { label: 'Abierto', icon: AlertCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
  IN_REVIEW: { label: 'En revisión', icon: Clock, cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  RESOLVED: { label: 'Resuelto', icon: CheckCircle, cls: 'bg-green-50 text-green-700 border-green-200' },
};

const ComplaintsPage: React.FC = () => {
  useDocumentTitle("Libro de Reclamaciones - D'Mendoza");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [category, setCategory] = useState<ComplaintCategory>('PRODUCTO');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await complaintService.getMine();
      setComplaints(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComplaints(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await complaintService.create({
        category,
        description: description.trim(),
        orderId: orderId ? parseInt(orderId, 10) : undefined,
      });
      setSuccessMsg('Tu reclamación fue registrada. Nos comunicaremos contigo pronto.');
      setShowForm(false);
      setDescription('');
      setOrderId('');
      setCategory('PRODUCTO');
      await loadComplaints();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-brand-accent">Libro de Reclamaciones</h2>
          <p className="text-xs text-brand-text mt-0.5">
            Registra y consulta tus reclamaciones o quejas.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSuccessMsg(null); setError(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-accent text-white font-bold text-xs rounded-xl hover:bg-brand-accent/90 transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva reclamación
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-brand-primary/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-brand-accent mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Nueva reclamación
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">Categoría *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full border border-brand-primary/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  N° de pedido (opcional)
                </label>
                <input
                  type="number"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ej: 1234"
                  className="w-full border border-brand-primary/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Descripción * <span className="font-normal text-brand-text/60">(mínimo 10 caracteres)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe detalladamente tu reclamación..."
                className="w-full border border-brand-primary/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/40 resize-none"
              />
              <p className="text-right text-xs text-brand-text/50 mt-0.5">{description.length} caracteres</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-brand-primary/30 text-brand-text font-bold text-xs rounded-xl hover:bg-brand-primary/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || description.trim().length < 10}
                className="px-4 py-2 bg-brand-accent text-white font-bold text-xs rounded-xl hover:bg-brand-accent/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enviar reclamación
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-brand-primary/30 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-brand-accent mb-2" />
          <p className="text-xs text-brand-text font-semibold">Cargando reclamaciones...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-brand-primary/30 shadow-sm gap-3">
          <FileText className="h-10 w-10 text-brand-accent/30" />
          <p className="text-sm font-bold text-brand-text">No tienes reclamaciones registradas</p>
          <p className="text-xs text-brand-text/60">Si tienes algún problema, puedes crear una nueva reclamación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const sc = STATUS_CONFIG[c.status];
            const Icon = sc.icon;
            return (
              <div
                key={c.id}
                className="bg-white border border-brand-primary/20 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-brand-accent">
                      #{c.id}
                    </span>
                    <span className="text-xs font-bold bg-brand-primary/10 text-brand-accent px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[c.category]}
                    </span>
                    {c.orderId && (
                      <span className="text-xs text-brand-text/60">
                        Pedido #{c.orderId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-text leading-relaxed">{c.description}</p>
                  <p className="text-xs text-brand-text/50">
                    {new Date(c.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 ${sc.cls}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {sc.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
