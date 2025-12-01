const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../../middlewares/auth')({ redirect: false });
const { admin } = require('../../middlewares/roles');

// ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2,8) + ext;
    cb(null, name);
  }
});

// only accept common image types
const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ACCEPTED_MIMES.includes(file.mimetype)) return cb(null, true);
    const err = new Error('invalid_file_type'); err.code = 'INVALID_FILE_TYPE';
    return cb(err);
  }
});

// Admin-only upload endpoint
router.post('/', auth, admin({ redirect: false }), (req, res, next) => {
  // wrap multer to provide JSON friendly errors
  const handler = upload.single('file');
  handler(req, res, function(err){
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'file_too_large' });
      if (err.code === 'INVALID_FILE_TYPE') return res.status(400).json({ error: 'invalid_file_type' });
      return res.status(500).json({ error: 'upload_error' });
    }
    if (!req.file) return res.status(400).json({ error: 'missing_file' });
    const url = '/uploads/' + req.file.filename;
    return res.json({ ok: true, url });
  });
});

module.exports = router;
