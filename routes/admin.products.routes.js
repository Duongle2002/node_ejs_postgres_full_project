const router = require('express').Router();
const auth = require('../middlewares/auth')();
const { admin } = require('../middlewares/roles');
const ctrl = require('../controllers/admin.products.controller');

router.get('/', auth, admin({ redirect: true }), ctrl.list);
router.get('/new', auth, admin({ redirect: true }), ctrl.renderNew);
router.post('/', auth, admin({ redirect: true }), ctrl.create);
router.get('/:id/edit', auth, admin({ redirect: true }), ctrl.renderEdit);
router.post('/:id', auth, admin({ redirect: true }), ctrl.update);
router.post('/:id/delete', auth, admin({ redirect: true }), ctrl.remove);

module.exports = router;
