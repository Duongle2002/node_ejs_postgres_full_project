const router = require('express').Router();
const ctrl = require('../../controllers/api/addresses.controller');
const auth = require('../../middlewares/auth')({ redirect: false });
const v = require('../../controllers/api/validators');

router.get('/', auth, ctrl.list);
router.post('/', auth, v.addressCreate, ctrl.create);
router.put('/:id', auth, v.addressUpdate, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
