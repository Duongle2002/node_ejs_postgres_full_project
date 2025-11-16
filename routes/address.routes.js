const router = require('express').Router();
const ctrl = require('../controllers/address.controller');
const authJson = require('../middlewares/auth')({ redirect: false });

router.get('/', authJson, ctrl.listJson);
router.post('/', authJson, ctrl.add);
router.post('/:id/default', authJson, ctrl.setDefault);

module.exports = router;
