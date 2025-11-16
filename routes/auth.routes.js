const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const home = require('../controllers/home.controller');

router.get('/', home.index);
router.get('/login', ctrl.renderLogin);
router.get('/register', ctrl.renderRegister);
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/logout', ctrl.logout);

module.exports = router;
