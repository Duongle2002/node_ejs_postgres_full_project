Credentials to add in Jenkins

1) REGISTRY_CREDS (Username with password)
   - ID: REGISTRY_CREDS
   - Username: <your docker hub username or registry user>
   - Password: <your docker hub password or access token>

2) DATABASE_URL (Secret text) - optional
   - ID: DATABASE_URL
   - Value example: postgres://postgres:Duongcs8602@db-host:5432/ecommerce

3) JWT_SECRET (Secret text)
   - ID: JWT_SECRET
   - Value: <your jwt secret>

4) PAYPAL_CLIENT_ID (Secret text)
   - ID: PAYPAL_CLIENT_ID
   - Value: <paypal client id>

5) PAYPAL_CLIENT_SECRET (Secret text)
   - ID: PAYPAL_CLIENT_SECRET
   - Value: <paypal client secret>

Add these via Jenkins UI or via the `scripts/jenkins/add_credentials.groovy` script in this repository.
