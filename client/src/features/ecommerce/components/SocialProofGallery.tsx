import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Camera } from 'lucide-react';

interface SocialProof {
  id: number;
  imageUrl: string;
  clientName: string;
}

export const SocialProofGallery: React.FC = () => {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const res = await axiosInstance.get('/v1/social-proof');
        setProofs(res.data);
      } catch (error) {
        console.error('Error fetching social proofs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProofs();
  }, []);

  if (loading || proofs.length === 0) {
    return null; // Don't show anything if loading or empty
  }

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Clientes Felices
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Únete a miles de personas que ya disfrutan de nuestros productos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {proofs.map((proof) => (
            <div 
              key={proof.id} 
              className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 aspect-[4/5] bg-gray-200"
            >
              <img 
                src={proof.imageUrl} 
                alt={`Cliente ${proof.clientName}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 w-full text-center">
                  <p className="text-white font-medium text-sm">
                    {proof.clientName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
