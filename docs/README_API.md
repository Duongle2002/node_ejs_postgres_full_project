# API test instructions (Postman)

This folder contains a Postman collection to test the API endpoints in this project.

Files
- `postman_collection.json`: Postman collection (v2.1) with requests for auth, products, cart, addresses and orders.

Quick start

1. Start the server locally:

```powershell
node app.js
```

2. Import `docs/postman_collection.json` into Postman (File → Import).

3. In Postman, edit the collection variables if needed (click the collection → Variables):
   - `baseUrl` — default `http://localhost:3001`.

4. Run requests in order:
   - `Auth - Register` (optional)
   - `Auth - Login` (this saves the JWT cookie into the environment variable `token` if server sets cookie)
   - `Auth - Me` to validate login
   - `Products - List`
   - `Products - Create (admin)` (requires admin user token)
   - `Cart` requests, `Addresses` requests
   - `Orders - Create COD` and `Orders - List`

Running with Newman

You can run the collection from the command line using Newman:

```powershell
npm install -g newman
newman run docs/postman_collection.json --env-var "baseUrl=http://localhost:3001"
```

Notes
- The collection uses a simple approach to authentication: after a successful login the collection test script attempts to extract the `token` cookie from the `Set-Cookie` header and store it in the environment variable `token`. Subsequent requests send a header `Cookie: token={{token}}`.
- PayPal flows are partially supported: creating a PayPal order returns the PayPal object (with approval link). To fully test PayPal capture via API you can use the `POST /api/orders/capture` endpoint — provide the PayPal order id as `token` in the body.
- Some endpoints require an admin account (e.g. product creation). Create or promote a user to `role: 'admin'` in the DB for those tests.

If you want, I can also:
- Export a Postman environment file with saved variables (token, productId).
- Produce a Newman script that runs the collection and asserts a few business flows end-to-end.
