const router = require('express').Router();
const auth = require('../../middlewares/auth')({ redirect: false });
const { admin } = require('../../middlewares/roles');
const ctrl = require('../../controllers/api/users.controller');
const v = require('../../controllers/api/validators');

router.get('/me', auth, ctrl.me);
router.put('/me', auth, v.userUpdate, ctrl.updateMe);

// admin endpoints
router.get('/', auth, admin({ redirect: false }), ctrl.list);
router.get('/:id', auth, admin({ redirect: false }), ctrl.view);
router.put('/:id', auth, admin({ redirect: false }), ctrl.update);
router.delete('/:id', auth, admin({ redirect: false }), ctrl.remove);

module.exports = router;
