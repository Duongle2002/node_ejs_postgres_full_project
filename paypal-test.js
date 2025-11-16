require('dotenv').config(); 

console.log('Client ID:', process.env.PAYPAL_CLIENT_ID);
console.log('Client Secret:', process.env.PAYPAL_CLIENT_SECRET ? 'Loaded' : 'Missing');
console.log('Mode:', process.env.PAYPAL_MODE);
