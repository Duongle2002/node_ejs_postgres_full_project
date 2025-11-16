const router = require('express').Router();
const auth = require('../middlewares/auth')();
const { admin } = require('../middlewares/roles');
const ctrl = require('../controllers/admin.users.controller');

router.get('/', auth, admin({ redirect: true }), ctrl.list);
router.get('/:id', auth, admin({ redirect: true }), ctrl.view);
router.post('/:id', auth, admin({ redirect: true }), ctrl.update);
router.post('/:id/delete', auth, admin({ redirect: true }), ctrl.remove);

module.exports = router;
