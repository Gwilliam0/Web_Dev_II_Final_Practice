import cloudinary from '../config/cloudinary.js';

class CloudinaryService {
  // Upload an image to Cloudinary
  async uploadImage(buffer, options = {}) {
    return this.uploadBuffer(buffer, {
      folder: 'images',
      resourceType: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    });
  }

  // Erase an image from Cloudinary by public ID
  async delete(publicId, resourceType = 'image') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
  }
}

export default new CloudinaryService();