import { useEffect, useState } from 'react';
import { useAddresses } from './hooks/useAddresses';
import { AddressCard } from './components/AddressCard';
import { AddressFormModal } from './components/AddressFormModal';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Address } from './types/address.types';
import type { AddressFormData } from './schemas/address.schema';

export const AddressesPage = () => {
  const {
    addresses,
    isLoading,
    isSaving,
    fetchAddresses,
    addAddress,
    editAddress,
    removeAddress,
    setDefaultAddress,
  } = useAddresses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses().catch((err) => {
      toast.error(err.message || 'Error al cargar las direcciones');
    });
  }, [fetchAddresses]);

  const handleOpenAdd = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedAddress(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: AddressFormData) => {
    try {
      if (selectedAddress) {
        await editAddress(selectedAddress.id, data);
        toast.success('Dirección actualizada correctamente');
      } else {
        await addAddress(data);
        toast.success('Dirección guardada correctamente');
      }
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la dirección');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      try {
        await removeAddress(id);
        toast.success('Dirección eliminada correctamente');
      } catch (err: any) {
        toast.error(err.message || 'Error al eliminar la dirección');
      }
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      toast.success('Dirección predeterminada actualizada');
    } catch (err: any) {
      toast.error(err.message || 'Error al establecer dirección predeterminada');
    }
  };

  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-brand-primary/30 shadow-sm animate-in fade-in duration-300">
        <Loader2 className="w-12 h-12 border-4 border-brand-accent border-t-brand-primary/40 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-brand-accent animate-pulse">Cargando direcciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Direcciones de Envío</h2>
          <p className="text-xs text-brand-text/85 mt-0.5">
            Administra los destinos para tus entregas
          </p>
        </div>

        {addresses.length > 0 && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-xl text-xs font-bold hover:bg-brand-accent/90 transition-all duration-300 shadow-sm focus:ring-2 focus:ring-brand-accent/20 focus:ring-offset-2 outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Dirección</span>
          </button>
        )}
      </div>

      {/* Address Grid or Empty State */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-brand-primary/30 shadow-sm flex flex-col items-center max-w-lg mx-auto animate-in zoom-in-95 duration-300">
          <div className="p-4 bg-brand-primary/10 rounded-full text-brand-accent mb-4 animate-bounce">
            <MapPin className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-extrabold text-brand-accent mb-2">
            No tienes direcciones registradas
          </h3>
          <p className="text-brand-text mb-6 text-sm max-w-sm">
            Registra tus direcciones para que podamos procesar tus compras de manera más rápida y eficiente.
          </p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-xl text-xs font-bold hover:bg-brand-accent/90 transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-brand-accent/20 focus:ring-offset-2 outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar mi primera dirección</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        address={selectedAddress}
        isSaving={isSaving}
      />
    </div>
  );
};

export default AddressesPage;
