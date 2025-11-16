const router = require('express').Router();
const auth = require('../middlewares/auth')();
const { admin } = require('../middlewares/roles');
const ctrl = require('../controllers/admin.orders.controller');

router.get('/', auth, admin({ redirect: true }), ctrl.list);
router.get('/:id', auth, admin({ redirect: true }), ctrl.detail);
router.post('/:id/status', auth, admin({ redirect: true }), ctrl.updateStatus);

module.exports = router;
