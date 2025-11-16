const { body, param, query, validationResult } = require('express-validator');

const handle = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ error: 'validation', details: errs.array() });
  return next();
};

exports.authRegister = [
  body('email').isEmail().withMessage('invalid_email'),
  body('password').isLength({ min: 6 }).withMessage('password_min_6'),
  body('name').optional().isString(),
  handle
];

exports.authLogin = [
  body('email').isEmail().withMessage('invalid_email'),
  body('password').exists().withMessage('missing_password'),
  handle
];

exports.productCreate = [
  body('name').isString().notEmpty(),
  body('price').isFloat({ min: 0 }).withMessage('invalid_price'),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('slug').optional().isString(),
  handle
];

exports.productUpdate = [
  param('id').isInt().toInt(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  handle
];

exports.cartAdd = [
  body('product_id').isInt().withMessage('invalid_product_id'),
  body('qty').isInt({ min: 1 }).withMessage('qty_min_1'),
  handle
];

exports.cartUpdate = [
  body('product_id').isInt().withMessage('invalid_product_id'),
  body('qty').isInt({ min: 0 }).withMessage('qty_nonneg'),
  handle
];

exports.cartRemove = [
  body('product_id').isInt().withMessage('invalid_product_id'),
  handle
];

exports.addressCreate = [
  body('address').isString().notEmpty().withMessage('address_required'),
  body('name').optional().isString(),
  body('phone').optional().isString(),
  body('city').optional().isString(),
  body('is_default').optional().isBoolean(),
  handle
];

exports.addressUpdate = [
  param('id').isInt().toInt(),
  body('address').optional().isString(),
  handle
];

exports.orderCreate = [
  body('payment_method').isIn(['paypal','vietqr','cod']).withMessage('invalid_payment_method'),
  body('address_id').isInt().withMessage('invalid_address_id'),
  body('ship_method').optional().isIn(['express','standard']).withMessage('invalid_ship_method'),
  handle
];

exports.orderCapture = [
  body('token').isString().notEmpty().withMessage('missing_token'),
  body('address_id').optional().isInt(),
  handle
];

exports.orderCancel = [
  param('id').isInt().toInt(),
  body('reason').optional().isString(),
  handle
];

exports.userUpdate = [
  body('name').optional().isString(),
  body('email').optional().isEmail(),
  handle
];

module.exports = exports;
