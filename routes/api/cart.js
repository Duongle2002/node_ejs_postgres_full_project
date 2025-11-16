const router = require('express').Router();
const ctrl = require('../../controllers/api/cart.controller');
const auth = require('../../middlewares/auth')({ redirect: false });
const v = require('../../controllers/api/validators');

router.get('/', auth, ctrl.get);
router.post('/add', auth, v.cartAdd, ctrl.add);
router.post('/update', auth, v.cartUpdate, ctrl.update);
router.post('/remove', auth, v.cartRemove, ctrl.remove);
router.post('/clear', auth, ctrl.clear);

module.exports = router;
