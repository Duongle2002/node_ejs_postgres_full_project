const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const auth = require('../middlewares/auth')();

router.get('/', ctrl.index);
router.get('/add', auth, ctrl.renderAdd);
router.post('/add', auth, ctrl.add);
router.get('/:id', ctrl.detail);

module.exports = router;
