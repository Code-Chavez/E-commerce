import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { newsletterService } from '../services/newsletterService';

export const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      const response = await newsletterService.subscribe({ email });

      if (response.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(response.error || 'Ocurrió un error al suscribirse.');
      }
    } catch (err: any) {
      setStatus('error');
      // If error response from backend
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('Ocurrió un error inesperado al conectarse al servidor.');
      }
    }
  };

  return (
    <div className="flex flex-col space-y-3 w-full max-w-sm">
      <h4 className="text-sm font-bold uppercase tracking-wider text-brand-primary">Newsletter</h4>
      <p className="text-xs text-slate-300 leading-relaxed">
        Suscríbete para recibir noticias, ofertas exclusivas y novedades en tu correo.
      </p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">¡Gracias por suscribirte a nuestro newsletter!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            disabled={status === 'loading'}
            placeholder="Tu correo electrónico"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email}
            className="absolute right-1 top-1 bottom-1 aspect-square bg-brand-primary hover:bg-brand-primary/90 text-brand-bg rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-brand-accent group-focus-within:text-white"
            aria-label="Suscribirme"
          >
            {status === 'loading' ? (
              <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-1.5 text-red-400 animate-slideInLeft">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <p className="text-xs">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
