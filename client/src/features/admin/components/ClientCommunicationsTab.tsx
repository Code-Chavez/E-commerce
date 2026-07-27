import React, { useEffect, useState } from 'react';
import { Mail, MessageSquare, Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { communicationService } from '../services/communicationService';
import type { CommunicationLog } from '../types/communication.types';

interface ClientCommunicationsTabProps {
  clientId: number;
}

export const ClientCommunicationsTab: React.FC<ClientCommunicationsTabProps> = ({ clientId }) => {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communicationService.getClientCommunications(clientId);
      if (response.success) {
        setLogs(response.data || []);
      } else {
        setError('Ocurrió un error inesperado al consultar las comunicaciones.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'No se pudo conectar con el servidor para obtener el historial.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [clientId]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[300px] text-gray-500 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
        <p className="text-xs font-semibold">Cargando historial de comunicaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[300px] p-6 text-center space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-full">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-800">Error al Cargar Comunicaciones</p>
          <p className="text-xs text-gray-500 max-w-sm">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchCommunications}
          className="px-4 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[300px] p-6 text-center space-y-3">
        <div className="p-3 bg-gray-50 border border-gray-200/60 text-gray-400 rounded-full">
          <Inbox className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-800">Sin Comunicaciones</p>
          <p className="text-xs text-gray-400 max-w-xs">
            No se han registrado correos ni mensajes de WhatsApp enviados a este cliente aún.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex-grow flex flex-col justify-between h-full">
      <div className="overflow-x-auto bg-white rounded-xl border border-[#D9D9D2]/60 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#3F3F3F] uppercase text-xs font-bold tracking-wider border-b border-[#D9D9D2]/40">
              <th className="px-6 py-4">Canal</th>
              <th className="px-6 py-4">Asunto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Fecha de Envío</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/40 text-[#3F3F3F]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#FAFAFA]/50 transition-colors text-sm">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    log.channel === 'EMAIL' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {log.channel === 'EMAIL' ? (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-[#3F3F3F]">{log.subject}</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{log.type}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{formatDate(log.sentAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
