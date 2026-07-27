import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Search, Loader2, X, UserPlus, Check } from 'lucide-react';
import { QuickRegisterModal } from './QuickRegisterModal';

interface ClientSearchBarProps {
  linkedClient: { id: number; name: string; documentId: string } | null;
  onSelectClient: (client: { id: number; name: string; documentId: string } | null) => void;
}

interface SearchClientResult {
  id: number;
  documentType: string;
  documentId: string;
  name: string;
  lastName?: string;
}

export const ClientSearchBar: React.FC<ClientSearchBarProps> = ({
  linkedClient,
  onSelectClient,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchClientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/v1/pos/clients/search?q=${encodeURIComponent(query)}`);
        if (data.success && data.clients) {
          setResults(data.clients);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error searching clients:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (client: SearchClientResult) => {
    onSelectClient({
      id: client.id,
      name: `${client.name} ${client.lastName || ''}`.trim(),
      documentId: client.documentId,
    });
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
        <UserPlus className="w-3.5 h-3.5 text-[#6B6B6B]" />
        <span>Vincular Cliente (DNI / RUC / Nombre)</span>
      </label>

      {linkedClient ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F7F7F5] border border-[#D9D9D2] rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-none mb-1">
                Cliente Seleccionado
              </p>
              <p className="text-sm font-extrabold text-[#3F3F3F] truncate">
                {linkedClient.name}
              </p>
              <p className="text-[11px] text-[#6B6B6B] font-mono leading-none mt-0.5">
                DOC: {linkedClient.documentId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectClient(null)}
            className="p-1 text-[#6B6B6B] hover:text-[#3F3F3F] hover:bg-[#D9D9D2]/30 rounded-lg transition-all cursor-pointer shrink-0"
            title="Quitar Cliente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar por DNI, RUC o Nombre del cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] border border-[#D9D9D2]/80 rounded-xl outline-none text-xs text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] transition-all font-semibold"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]/60">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="px-3.5 py-2.5 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Registrar Nuevo Cliente"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      )}

      {/* Floating Dropdown Results */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-[#D9D9D2]/70 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-[#D9D9D2]/20 animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length > 0 ? (
            results.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full text-left px-4 py-3 hover:bg-[#FAFAFA] transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-xs font-bold text-[#3F3F3F]">
                  {client.name} {client.lastName || ''}
                </span>
                <span className="text-[10px] text-[#6B6B6B] font-mono">
                  {client.documentType}: {client.documentId}
                </span>
              </button>
            ))
          ) : (
            !loading && (
              <div className="p-4 text-center text-xs text-[#6B6B6B] space-y-2">
                <p>No se encontraron clientes con "{query}"</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterOpen(true);
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-[#3F3F3F] hover:underline flex items-center gap-1 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Crear cliente nuevo
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Reused Quick Registration Modal */}
      <QuickRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(client) => {
          onSelectClient(client);
        }}
      />
    </div>
  );
};
