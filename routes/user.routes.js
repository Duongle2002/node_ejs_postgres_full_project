const router = require('express').Router();
const auth = require('../middlewares/auth')();
const ctrl = require('../controllers/user.controller');

router.get('/', auth, ctrl.accountPage);
router.post('/profile', auth, ctrl.updateProfile);
router.post('/address', auth, ctrl.addAddress);
router.post('/address/:id/delete', auth, ctrl.deleteAddress);
router.post('/address/:id/default', auth, ctrl.setDefaultAddress);

module.exports = router;
