// Groovy script for Jenkins Script Console to add/update credentials
// Usage: paste into Jenkins > Manage Jenkins > Script Console

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
def registryId = 'REGISTRY_CREDS'
def registryUser = 'YOUR_REGISTRY_USERNAME' // <-- EDIT
def registryPass = 'YOUR_REGISTRY_PASSWORD_OR_TOKEN' // <-- EDIT
def regCred = new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL, registryId, 'Docker registry credentials', registryUser, registryPass)
ensureReplace(registryId, regCred)

// 2) DATABASE_URL (as secret text)
def dbId = 'DATABASE_URL'
def dbUrl = 'postgres://postgres:Duongcs8602@host:5432/ecommerce' // <-- EDIT
def dbCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, dbId, 'Database URL', Secret.fromString(dbUrl))
ensureReplace(dbId, dbCred)

// 3) JWT secret
def jwtId = 'JWT_SECRET'
def jwtValue = 'change-me' // <-- EDIT
def jwtCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, jwtId, 'JWT secret', Secret.fromString(jwtValue))
ensureReplace(jwtId, jwtCred)

// 4) PayPal credentials (if used)
def ppClientId = 'PAYPAL_CLIENT_ID'
def ppClientVal = 'your-paypal-client-id' // <-- EDIT
def ppClientCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, ppClientId, 'PayPal client id', Secret.fromString(ppClientVal))
ensureReplace(ppClientId, ppClientCred)

def ppSecretId = 'PAYPAL_SECRET'
def ppSecretVal = 'your-paypal-secret' // <-- EDIT
def ppSecretCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, ppSecretId, 'PayPal secret', Secret.fromString(ppSecretVal))
ensureReplace(ppSecretId, ppSecretCred)

// Optional: GitHub token for private repo access
def ghId = 'GITHUB_TOKEN'
def ghVal = '' // <-- set if your repo is private and you need token
if (ghVal) {
  def ghCred = new StringCredentialsImpl(CredentialsScope.GLOBAL, ghId, 'GitHub token', Secret.fromString(ghVal))
  ensureReplace(ghId, ghCred)
}

println '\nDone. Edit the placeholder values above before running this script in the Script Console.'
