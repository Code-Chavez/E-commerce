import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';

type RFMSegment = 'Champions' | 'Loyal' | 'At Risk' | 'Lost' | 'Promising';

interface RFMClient {
  userId: number;
  name: string;
  email: string;
  lastOrderDate: string;
  orderCount: number;
  totalSpent: number;
  recencyDays: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: number;
  segment: RFMSegment;
}

interface RFMSegmentSummary {
  segment: RFMSegment;
  count: number;
  avgRFM: number;
  totalSpent: number;
  avgRecencyDays: number;
  avgFrequency: number;
  color: string;
}

interface RFMReport {
  clients: RFMClient[];
  segments: RFMSegmentSummary[];
  totalClients: number;
}

const SEGMENT_LABELS: Record<RFMSegment, string> = {
  Champions: 'Campeones',
  Loyal: 'Leales',
  'At Risk': 'En Riesgo',
  Lost: 'Perdidos',
  Promising: 'Prometedores',
};

const SEGMENT_DESCRIPTIONS: Record<RFMSegment, string> = {
  Champions: 'Compraron recientemente, compran seguido y gastan mucho',
  Loyal: 'Compran frecuentemente con buen gasto',
  'At Risk': 'Compraban bien pero no han vuelto recientemente',
  Lost: 'Baja frecuencia y no compran hace mucho',
  Promising: 'Compradores nuevos u ocasionales con potencial',
};

const fmt = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Bubble Chart ─────────────────────────────────────────────────────────────
const BubbleChart: React.FC<{ segments: RFMSegmentSummary[]; onSelect: (s: RFMSegment | null) => void; selected: RFMSegment | null }> = ({ segments, onSelect, selected }) => {
  const W = 480, H = 280, PAD = 40;
  const maxCount = Math.max(...segments.map(s => s.count), 1);

  // X = avgFrequency (more = right), Y = avgRecencyDays inverted (fewer days = top = more recent)
  const positions: Record<RFMSegment, [number, number]> = {
    Champions:  [W * 0.82, H * 0.15],
    Loyal:      [W * 0.65, H * 0.35],
    Promising:  [W * 0.25, H * 0.20],
    'At Risk':  [W * 0.55, H * 0.72],
    Lost:       [W * 0.20, H * 0.78],
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg" style={{ overflow: 'visible' }}>
      {/* grid */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={PAD} y1={PAD + (H - 2 * PAD) * t} x2={W - PAD} y2={PAD + (H - 2 * PAD) * t}
          stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
      ))}
      {/* axis labels */}
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.4}>Frecuencia →</text>
      <text x={8} y={H / 2} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.4}
        transform={`rotate(-90, 8, ${H / 2})`}>← Recencia</text>

      {(Object.keys(positions) as RFMSegment[]).map(seg => {
        const summary = segments.find(s => s.segment === seg);
        if (!summary) return null;
        const [cx, cy] = positions[seg];
        const r = Math.max(18, Math.min(52, 18 + (summary.count / maxCount) * 34));
        const isSelected = selected === seg;
        return (
          <g key={seg} onClick={() => onSelect(selected === seg ? null : seg)} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={r} fill={summary.color}
              fillOpacity={isSelected ? 0.9 : 0.55}
              stroke={isSelected ? summary.color : 'transparent'}
              strokeWidth={2}
              style={{ transition: 'all 0.2s' }} />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize={11} fontWeight="700" fill="white">
              {summary.count}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="white" fillOpacity={0.85}>
              {seg}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Campaign Modal ────────────────────────────────────────────────────────────
const CampaignModal: React.FC<{
  segment: RFMSegment;
  clientCount: number;
  onClose: () => void;
}> = ({ segment, clientCount, onClose }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(
        `/v1/admin/clients/rfm-segments/${encodeURIComponent(segment)}/campaign`,
        { subject, body },
      );
      setResult(data.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1a] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-gray-100 dark:border-white/10">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Campaña para segmento: <span style={{ color: '#3b82f6' }}>{SEGMENT_LABELS[segment]}</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{clientCount} destinatarios</p>
        </div>

        {result ? (
          <div className="p-6 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-bold text-gray-800 dark:text-white">Campaña enviada</p>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-green-600 font-semibold">{result.sent} enviados</span>
              {result.failed > 0 && <span className="text-red-500 font-semibold">{result.failed} fallidos</span>}
            </div>
            <button onClick={onClose} className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-xs font-bold text-gray-700 dark:text-white transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Asunto</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ej: ¡Tenemos una oferta exclusiva para ti!"
                className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Mensaje</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                placeholder="Escribe tu mensaje personalizado..."
                className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !subject.trim() || !body.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? 'Enviando...' : `Enviar a ${clientCount} clientes`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────
const RFMSegmentsPage: React.FC = () => {
  const [report, setReport] = useState<RFMReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<RFMSegment | null>(null);
  const [campaignSegment, setCampaignSegment] = useState<RFMSegment | null>(null);

  const fetchReport = useCallback(async (segment?: RFMSegment) => {
    setLoading(true);
    try {
      const params = segment ? `?segment=${encodeURIComponent(segment)}` : '';
      const { data } = await axiosInstance.get(`/v1/admin/clients/rfm-segments${params}`);
      setReport(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleSelectSegment = (seg: RFMSegment | null) => {
    setSelectedSegment(seg);
    fetchReport(seg ?? undefined);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Segmentación RFM de Clientes</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Análisis por Recencia, Frecuencia y Valor Monetario · {report?.totalClients ?? 0} clientes con órdenes
          </p>
        </div>
        {selectedSegment && (
          <button
            onClick={() => setCampaignSegment(selectedSegment)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <span>✉</span> Enviar campaña
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bubble Chart */}
        <div className="bg-white dark:bg-[#1e1e1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Distribución por segmento</h2>
          {report && (
            <BubbleChart
              segments={report.segments}
              onSelect={handleSelectSegment}
              selected={selectedSegment}
            />
          )}
          <p className="text-[10px] text-gray-400 text-center mt-2">Haz clic en una burbuja para filtrar la tabla</p>
        </div>

        {/* Segment cards */}
        <div className="space-y-2">
          {report?.segments.map(seg => (
            <button
              key={seg.segment}
              onClick={() => handleSelectSegment(selectedSegment === seg.segment ? null : seg.segment)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                selectedSegment === seg.segment
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#1e1e1a] hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-white">{SEGMENT_LABELS[seg.segment]}</p>
                    <p className="text-[10px] text-gray-400">{SEGMENT_DESCRIPTIONS[seg.segment]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">{seg.count}</p>
                  <p className="text-[10px] text-gray-400">{fmt(seg.totalSpent)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white dark:bg-[#1e1e1a] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {selectedSegment ? `Clientes — ${SEGMENT_LABELS[selectedSegment]}` : 'Todos los clientes'}
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{report?.clients.length ?? 0} registros</p>
          </div>
          {selectedSegment && (
            <button onClick={() => handleSelectSegment(null)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              Limpiar filtro ×
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-xs text-gray-400">Cargando...</div>
        ) : report?.clients.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-gray-400">Sin clientes en este segmento</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Segmento</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Última compra</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Órdenes</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Total gastado</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">R / F / M</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {report?.clients.map(c => {
                  const seg = report.segments.find(s => s.segment === c.segment);
                  return (
                    <tr key={c.userId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-gray-600 dark:text-white shrink-0">
                            {(c.name || c.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{c.name || '—'}</p>
                            <p className="text-[10px] text-gray-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: seg?.color }}>
                          {SEGMENT_LABELS[c.segment]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                        <p>{new Date(c.lastOrderDate).toLocaleDateString('es-PE')}</p>
                        <p className="text-[10px] text-gray-400">{c.recencyDays}d atrás</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white">{c.orderCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-white">{fmt(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-gray-600 dark:text-gray-300">{c.rScore}/{c.fScore}/{c.mScore}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-extrabold text-gray-900 dark:text-white">{c.rfmScore}</span>
                        <span className="text-gray-400">/15</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Modal */}
      {campaignSegment && (
        <CampaignModal
          segment={campaignSegment}
          clientCount={report?.segments.find(s => s.segment === campaignSegment)?.count ?? 0}
          onClose={() => setCampaignSegment(null)}
        />
      )}
    </div>
  );
};

export default RFMSegmentsPage;
