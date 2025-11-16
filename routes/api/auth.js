const router = require('express').Router();
const ctrl = require('../../controllers/api/auth.controller');
const v = require('../../controllers/api/validators');

router.post('/register', v.authRegister, ctrl.register);
router.post('/login', v.authLogin, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.me);

module.exports = router;
