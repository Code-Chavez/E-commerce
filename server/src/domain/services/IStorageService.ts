/**
 * Port: Servicio de almacenamiento de archivos (puerto de dominio).
 * Permite subir archivos y obtener su URL de acceso público.
 */
export interface IStorageService {
  uploadImage(fileBuffer: Buffer, fileName: string, folder?: string): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
}
