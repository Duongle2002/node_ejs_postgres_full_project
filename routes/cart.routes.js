const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');
const requireAuthRedirect = require('../middlewares/auth')({ redirect: true });
const requireAuthJson = require('../middlewares/auth')({ redirect: false });

// Page view should redirect to login if not signed in
router.get('/', requireAuthRedirect, ctrl.viewCart);
router.get('/count', requireAuthJson, ctrl.count);
// AJAX endpoints should return 401 JSON, not redirect
router.post('/add/:id', requireAuthJson, ctrl.addToCart);
router.post('/update/:id', requireAuthJson, ctrl.updateQuantity);
router.post('/remove/:id', requireAuthJson, ctrl.removeItem);
router.post('/clear', requireAuthJson, ctrl.clearCart);

module.exports = router;
