const router = require('express').Router();
const auth = require('../middlewares/auth')();
const { admin } = require('../middlewares/roles');
const ctrl = require('../controllers/admin.controller');

router.get('/', auth, admin({ redirect: true }), ctrl.dashboard);
router.get('/stats.json', auth, admin({ redirect: true }), ctrl.statsJson);
router.get('/stats.csv', auth, admin({ redirect: true }), ctrl.statsCsv);

module.exports = router;
