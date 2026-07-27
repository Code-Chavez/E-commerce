import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/shared/api/axiosInstance';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const NPSSurveyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [surveyData, setSurveyData] = useState<{ userName: string; orderId: number } | null>(null);
  
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await api.get(`/nps/${token}`);
        if (response.data.success) {
          setSurveyData(response.data.data);
        } else {
          setError(response.data.error || 'No se pudo cargar la encuesta');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'El enlace de la encuesta es inválido o ya expiró.');
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === null) {
      toast.error('Por favor, selecciona una puntuación.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/nps/${token}`, { score, comment });
      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al enviar la encuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (num: number) => {
    if (num <= 6) return 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300 hover:border-red-500';
    if (num <= 8) return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300 hover:border-yellow-500';
    return 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300 hover:border-green-500';
  };

  const getScoreColorSelected = (num: number) => {
    if (num <= 6) return 'bg-red-500 text-white border-red-700';
    if (num <= 8) return 'bg-yellow-500 text-white border-yellow-700';
    return 'bg-green-500 text-white border-green-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enlace inválido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">Ir al inicio</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por tus comentarios!</h2>
          <p className="text-gray-600 mb-6">Tu opinión es muy importante para ayudarnos a mejorar cada día.</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">Volver a la tienda</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">D'Mendoza</h1>
          <p className="text-indigo-100">Encuesta de Satisfacción</p>
        </div>
        
        <div className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">¡Hola, {surveyData?.userName}!</h2>
            <p className="text-gray-600 mt-2">
              Hace poco recibiste tu pedido <strong>#{surveyData?.orderId}</strong>. Nos encantaría saber qué tan probable es que recomiendes D'Mendoza a un amigo o familiar.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="block text-center font-medium text-gray-700 mb-4">
                En una escala del 0 al 10, ¿qué tan probable es que nos recomiendes?
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setScore(num)}
                    className={`w-12 h-12 rounded-full border-2 font-bold text-lg transition-all ${
                      score === num ? getScoreColorSelected(num) : getScoreColor(num)
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2 px-2">
                <span>0 = Nada probable</span>
                <span>10 = Muy probable</span>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="comment" className="block font-medium text-gray-700 mb-2">
                ¿Qué podríamos hacer para mejorar tu experiencia? (Opcional)
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Escribe tus comentarios aquí..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/500</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium text-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Enviar respuestas'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NPSSurveyPage;
