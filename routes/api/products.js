const router = require('express').Router();
const ctrl = require('../../controllers/api/products.controller');
const auth = require('../../middlewares/auth')({ redirect: false });
const { admin } = require('../../middlewares/roles');
const v = require('../../controllers/api/validators');

// Public product listing and detail
router.get('/', ctrl.list);
router.get('/:id', ctrl.view);

// Admin CRUD
router.post('/', auth, admin({ redirect: false }), v.productCreate, ctrl.create);
router.put('/:id', auth, admin({ redirect: false }), v.productUpdate, ctrl.update);
router.delete('/:id', auth, admin({ redirect: false }), ctrl.remove);

module.exports = router;
