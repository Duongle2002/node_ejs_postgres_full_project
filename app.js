require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const engine = require('ejs-mate');
const jwt = require('jsonwebtoken');
// API routes
const apiAuth = require('./routes/api/auth');
const apiUsers = require('./routes/api/users');
const apiProducts = require('./routes/api/products');
const apiCart = require('./routes/api/cart');
const apiAddresses = require('./routes/api/addresses');
const apiOrders = require('./routes/api/orders');

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// use ejs-mate for layout/partials support (enables `layout('layout')` in views)
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// pass env vars to views
app.locals.PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
app.locals.PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
// sensible defaults for layout variables
app.locals.title = 'Shop';
app.locals.LOGO_URL = process.env.LOGO_URL || '';
// VietQR config (optional)
app.locals.VIETQR_BIN = process.env.VIETQR_BIN || '';
app.locals.VIETQR_ACC = process.env.VIETQR_ACC || '';
app.locals.VIETQR_TEMPLATE = process.env.VIETQR_TEMPLATE || 'compact';
app.locals.VIETQR_ACC_NAME = process.env.VIETQR_ACC_NAME || '';

// Run basic migrations in order
(async () => {
	try { await require('./migrations/ensure_base_schema')(); } catch (e) { console.error('ensure_base_schema failed', e.message); }
	try { await require('./migrations/ensure_addresses_table')(); } catch (e) { console.error('ensure_addresses_table failed', e.message); }
	try { await require('./migrations/ensure_orders_address_id')(); } catch (e) { console.error('ensure_orders_address_id failed', e.message); }
	try { await require('./migrations/ensure_stock_column')(); } catch (e) { console.error('ensure_stock_column failed', e.message); }
	try { await require('./migrations/ensure_short_description')(); } catch (e) { console.error('ensure_short_description failed', e.message); }
	try { await require('./migrations/ensure_banners_table')(); } catch (e) { console.error('ensure_banners_table failed', e.message); }
	try { await require('./migrations/ensure_demo_banners')(); } catch (e) { console.error('ensure_demo_banners failed', e.message); }
	try { await require('./migrations/ensure_unbounded_text_columns')(); } catch (e) { console.error('ensure_unbounded_text_columns failed', e.message); }
	try { await require('./migrations/ensure_ship_method_column')(); } catch (e) { console.error('ensure_ship_method_column failed', e.message); }
	try { await require('./migrations/ensure_order_cancellation')(); } catch (e) { console.error('ensure_order_cancellation failed', e.message); }
	try { await require('./migrations/ensure_admin_user')(); } catch (e) { console.error('ensure_admin_user failed', e.message); }
})();

// expose user and path to all views (non-blocking auth)
app.use((req, res, next) => {
	const token = req.cookies.token;
	if (token) {
		try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret'); } catch {}
	}
	res.locals.user = req.user || null;
	res.locals.path = req.path || '/';
	// currency preferences
	const rate = parseFloat(process.env.USD_VND_RATE || process.env.USD_VND_EXCHANGE || '25000');
	const cookieCurrency = (req.cookies.currency === 'VND') ? 'VND' : 'USD';
	res.locals.currency = cookieCurrency;
	res.locals.usdToVnd = rate;
	res.locals.fmtPrice = (usd) => {
		const n = parseFloat(usd||0);
		if (cookieCurrency === 'VND') {
			const v = Math.round(n*rate);
			return v.toLocaleString('vi-VN') + '₫';
		}
		return '$' + n.toFixed(2);
	};
	res.locals.fmtPriceBoth = (usd) => {
		const n = parseFloat(usd||0);
		const vStr = Math.round(n*rate).toLocaleString('vi-VN') + '₫';
		return (cookieCurrency === 'VND') ? (vStr + ' (≈$' + n.toFixed(2) + ')') : ('$' + n.toFixed(2) + ' (' + vStr + ')');
	};
	next();
});

// Force admin routes to prefer VND display (override user choice)
app.use('/admin', (req, res, next) => {
	res.locals.currency = 'VND';
	// wrap fmtPrice to always show VND primary
	const baseFmt = res.locals.fmtPrice;
	res.locals.fmtPrice = (usd) => {
		const n = parseFloat(usd||0);
		const v = Math.round(n*res.locals.usdToVnd).toLocaleString('vi-VN') + '₫';
		return v; // admin primary VND
	};
	res.locals.fmtPriceBoth = (usd) => {
		const n = parseFloat(usd||0);
		const vStr = Math.round(n*res.locals.usdToVnd).toLocaleString('vi-VN') + '₫';
		return vStr + ' (≈$' + n.toFixed(2) + ')';
	};
	next();
});

// simple currency switch route
app.get('/currency/set', (req, res) => {
	const c = (req.query.c === 'VND') ? 'VND' : 'USD';
	res.cookie('currency', c, { maxAge: 30*24*60*60*1000 });
	const back = req.get('Referer') || '/';
	res.redirect(back);
});

// routes
app.use('/', require('./routes/auth.routes'));
app.use('/products', require('./routes/product.routes'));
app.use('/cart', require('./routes/cart.routes'));
app.use('/order', require('./routes/order.routes'));
app.use('/address', require('./routes/address.routes'));
app.use('/orders', require('./routes/orders.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/admin/products', require('./routes/admin.products.routes'));
app.use('/admin/orders', require('./routes/admin.orders.routes'));
app.use('/admin/users', require('./routes/admin.users.routes'));
app.use('/user', require('./routes/user.routes'));

// JSON API (cookie-JWT auth)
app.use('/api/auth', apiAuth);
app.use('/api/users', apiUsers);
app.use('/api/products', apiProducts);
app.use('/api/cart', apiCart);
app.use('/api/addresses', apiAddresses);
app.use('/api/orders', apiOrders);
app.use('/api/banners', require('./routes/api/banners'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
