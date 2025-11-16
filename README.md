Full Node.js + EJS + PostgreSQL e‑Commerce sample

Run:
1. Create PostgreSQL database and run sql/schema.sql
2. Copy .env.example -> .env and fill values
3. npm install
4. npm start
5. Visit http://localhost:3000

Notes:
- Create an admin user in DB to access product add page:
  INSERT INTO users (name,email,password,role) VALUES ('Admin','admin@example.com','<bcrypt-hash>','admin');
  (Use bcrypt to hash; or register then update role in DB)
- Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET for sandbox testing.
