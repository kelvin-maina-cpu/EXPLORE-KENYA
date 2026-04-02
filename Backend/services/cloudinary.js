const getSanitizedEnvValue = (key) => `${process.env[key] || ''}`.replace(/\0/g, '').trim();

const CLOUDINARY_CLOUD_NAME = getSanitizedEnvValue('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = getSanitizedEnvValue('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = getSanitizedEnvValue('CLOUDINARY_API_SECRET');

const getCloudinaryTools = () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are missing.');
  }

  let cloudinaryPackage;
  let multerPackage;

  try {
    cloudinaryPackage = require('cloudinary');
    multerPackage = require('multer');
  } catch {
    throw new Error('Cloudinary upload dependencies are missing. Install cloudinary and multer in Backend.');
  }

  const cloudinary = cloudinaryPackage.v2;
  const multer = multerPackage;

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  const uploadBuffer = (buffer, originalName = 'upload') =>
    new Promise((resolve, reject) => {
      const publicId = `${Date.now()}-${`${originalName}`.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-')}`;

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'explore-kenya',
          public_id: publicId,
          resource_type: 'image',
          transformation: [{ width: 1200, height: 800, crop: 'limit' }],
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

      stream.end(buffer);
    });

  return {
    cloudinary,
    upload,
    uploadBuffer,
  };
};

module.exports = {
  getCloudinaryTools,
};
