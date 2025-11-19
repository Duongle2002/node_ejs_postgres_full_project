const router = require('express').Router();
const ctrl = require('../../controllers/api/banners.controller');
const auth = require('../../middlewares/auth')({ redirect: false });
const { admin } = require('../../middlewares/roles');

router.get('/', ctrl.list);

// Admin CRUD
router.post('/', auth, admin({ redirect: false }), ctrl.create);
router.put('/:id', auth, admin({ redirect: false }), ctrl.update);
router.delete('/:id', auth, admin({ redirect: false }), ctrl.remove);

module.exports = router;
