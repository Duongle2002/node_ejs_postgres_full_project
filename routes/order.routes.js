const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const auth = require('../middlewares/auth')();

router.get('/checkout', auth, ctrl.checkoutPage);
router.post('/paypal/create', auth, ctrl.createOrder);
router.get('/paypal/success', auth, ctrl.capture);
router.get('/success', auth, ctrl.successPage);

// Additional payment methods
router.post('/qr/start', auth, ctrl.qrStart);
router.post('/qr/confirm', auth, ctrl.qrConfirm);
router.post('/cod', auth, ctrl.codCreate);

module.exports = router;
