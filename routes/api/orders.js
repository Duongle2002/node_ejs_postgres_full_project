const router = require('express').Router();
const ctrl = require('../../controllers/api/orders.controller');
const auth = require('../../middlewares/auth')({ redirect: false });
const { admin } = require('../../middlewares/roles');

// user endpoints
router.post('/create', auth, require('../../controllers/api/validators').orderCreate, ctrl.create);
router.post('/capture', auth, require('../../controllers/api/validators').orderCapture, ctrl.capture);
router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.view);
router.post('/:id/cancel', auth, ctrl.cancel);

// admin endpoints
router.get('/admin/all', auth, admin({ redirect: false }), ctrl.adminList);
router.put('/admin/:id', auth, admin({ redirect: false }), ctrl.adminUpdate);

module.exports = router;
