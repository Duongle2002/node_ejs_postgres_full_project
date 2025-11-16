const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const auth = require('../middlewares/auth')();

// Order history (must be before '/:id' so it doesn't get treated as an id)
router.get('/history', auth, ctrl.orderHistory);

// View order detail (user-facing)
router.get('/:id', auth, ctrl.viewOrder);
// Provide simple status endpoint for polling
router.get('/:id/status', auth, ctrl.orderStatus);
// Cancel order
router.post('/:id/cancel', auth, ctrl.orderCancel);

module.exports = router;
