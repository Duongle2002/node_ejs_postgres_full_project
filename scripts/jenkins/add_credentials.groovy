// Groovy script for Jenkins Script Console to add credentials
// Usage: paste into Jenkins > Manage Jenkins > Script Console
import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl
import com.cloudbees.plugins.credentials.CredentialsScope
import com.cloudbees.plugins.credentials.SystemCredentialsProvider

def credsStore = SystemCredentialsProvider.getInstance().getStore()

// Create REGISTRY_CREDS (username/password)
def registryId = 'REGISTRY_CREDS'
def registryUser = 'YOUR_REGISTRY_USERNAME'
def registryPass = 'YOUR_REGISTRY_PASSWORD_OR_TOKEN'

def regCred = new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL, registryId, 'Docker registry creds', registryUser, registryPass)
credsStore.addCredentials(Domain.global(), regCred)

// Add secret text examples (replace values)
def StringCredentials = org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl
def SecretBytes = hudson.util.Secret
def databaseUrl = new StringCredentials(CredentialsScope.GLOBAL, 'DATABASE_URL', 'Database URL', SecretBytes.fromString('postgres://postgres:Duongcs8602@host:5432/ecommerce'))
credsStore.addCredentials(Domain.global(), databaseUrl)

def jwt = new StringCredentials(CredentialsScope.GLOBAL, 'JWT_SECRET', 'JWT secret', SecretBytes.fromString('change-me'))
credsStore.addCredentials(Domain.global(), jwt)

println 'Credentials added (edit script to set real values before running).'
