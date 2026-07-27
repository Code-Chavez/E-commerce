import { v2 as cloudinary } from 'cloudinary';
import { IStorageService } from '@domain/services/IStorageService';

export class CloudinaryStorageService implements IStorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(fileBuffer: Buffer, fileName: string, folder: string = 'profiles'): Promise<string> {
    return new Promise((resolve, reject) => {
      // Remove extensions and append timestamp for uniqueness
      const cleanFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${cleanFileName}_${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return reject(new Error('Error al subir la imagen al servidor de almacenamiento'));
          }
          if (!result) {
            return reject(new Error('No se recibió resultado de la subida a Cloudinary'));
          }
          resolve(result.secure_url);
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from URL: e.g. https://res.cloudinary.com/cloud/image/upload/v12345/folder/filename.jpg
      const urlParts = imageUrl.split('/');
      // The last part is filename.ext, the previous part is folder (if any)
      const fileNameWithExt = urlParts.pop();
      const folderOrVersion = urlParts.pop();

      if (!fileNameWithExt) return;

      const publicIdPart = fileNameWithExt.split('.')[0];
      
      let publicId = publicIdPart;
      // If there's a folder (not a version string like 'v123'), prepend it
      if (folderOrVersion && !folderOrVersion.startsWith('v')) {
        publicId = `${folderOrVersion}/${publicIdPart}`;
      }

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
}
