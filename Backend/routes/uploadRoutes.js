const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getCloudinaryTools } = require('../services/cloudinary');

router.post('/image', adminAuth, (req, res, next) => {
  let upload;
  let uploadBuffer;

  try {
    ({ upload, uploadBuffer } = getCloudinaryTools());
  } catch (error) {
    res.status(503);
    return next(error);
  }

  return upload.single('image')(req, res, async (error) => {
    if (error) {
      res.status(400);
      return next(error);
    }

    if (!req.file?.buffer) {
      res.status(400);
      return next(new Error('No image file uploaded.'));
    }

    try {
      const result = await uploadBuffer(req.file.buffer, req.file.originalname);

      return res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (uploadError) {
      res.status(502);
      return next(uploadError);
    }
  });
});

module.exports = router;
