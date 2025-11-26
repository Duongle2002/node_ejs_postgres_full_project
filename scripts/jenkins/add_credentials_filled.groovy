// Groovy script for Jenkins Script Console to add/update credentials
// Filled with values from the repository .env file. Edit registry username/password before running.

import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl
import com.cloudbees.plugins.credentials.CredentialsScope
import com.cloudbees.plugins.credentials.SystemCredentialsProvider
import org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl
import hudson.util.Secret

def store = SystemCredentialsProvider.getInstance().getStore()

def ensureReplace = { id, cred ->
  def existing = store.getCredentials(Domain.global()).find { it.id == id }
  if (existing) {
    store.removeCredentials(Domain.global(), existing)
    println "Replaced existing credential: ${id}"
  } else {
    println "Adding new credential: ${id}"
  }
  store.addCredentials(Domain.global(), cred)
}

// 1) Docker registry credentials (username/password)
// NOTE: update registryUser/registryPass before running if you push to a registry
def registryId = 'REGISTRY_CREDS'
def registryUser = '' // <-- INSERT your registry username (e.g. Docker Hub or private registry)
def registryPass = '' // <-- INSERT registry password or token
if (registryUser && registryPass) {
  def regCred = new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL, registryId, 'Docker registry credentials', registryUser, registryPass)
  ensureReplace(registryId, regCred)
} else {
  println "Skipping REGISTRY_CREDS: registryUser/registryPass empty. Edit the script to set them if needed."
}

// 2) DATABASE_URL (as secret text)
// from .env: DB_USER=postgres, DB_PASSWORD=Duongcs8602, DB_HOST=localhost, DB_PORT=5432, DB_NAME=ecommerce
def dbId = 'DATABASE_URL'
def dbUrl = 'postgres://postgres:Duongcs8602@localhost:5432/ecommerce'
def dbCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, dbId, 'Database URL', Secret.fromString(dbUrl))
ensureReplace(dbId, dbCred)

// 3) JWT secret
// from .env: JWT_SECRET=<redacted long string>
def jwtId = 'JWT_SECRET'
def jwtValue = 'fdf17273b4bf51b596535de1f952dcb9775b45a34c5ce162555b63fceeff53475f69497e197cd8b54773a919ffec542b5ed3a3390606c09d553c399c241fae77'
def jwtCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, jwtId, 'JWT secret', Secret.fromString(jwtValue))
ensureReplace(jwtId, jwtCred)

// 4) PayPal credentials (from .env)
def ppClientId = 'PAYPAL_CLIENT_ID'
def ppClientVal = 'Aa7GJW_EaKDwDOUxp7rM44nr0OzqcAyJjjbhcSa7Axw4YCt1GuMID5t5cdQEcb7AljHLFIYT8V523OiK'
def ppClientCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, ppClientId, 'PayPal client id', Secret.fromString(ppClientVal))
ensureReplace(ppClientId, ppClientCred)

def ppSecretId = 'PAYPAL_SECRET'
def ppSecretVal = 'EI8wvW5k2AaP1O03290gDMBWOhTCyNuaOUKIHNWGTsSMi50mZtC1EKavF8AaTK2sBjk0HTEviyRqW1EQ'
def ppSecretCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, ppSecretId, 'PayPal secret', Secret.fromString(ppSecretVal))
ensureReplace(ppSecretId, ppSecretCred)

println '\nDone. Review outputs above. If you need to add registry credentials, edit the top of this script and re-run.'
