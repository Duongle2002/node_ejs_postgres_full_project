// Groovy script to create a Multibranch Pipeline job.
// Usage: paste into Jenkins > Manage Jenkins > Script Console.
// Edit repoUrl, credentialsId and jobName below before running.
import jenkins.model.*
import org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject
import jenkins.branch.BranchSource
import jenkins.plugins.git.GitSCMSource
import jenkins.plugins.git.traits.BranchDiscoveryTrait
import jenkins.scm.api.trait.SCMTrait

def repoUrl = 'https://github.com/youruser/yourrepo.git' // <-- set this
def credentialsId = '' // <-- set this if your repo is private
def jobName = 'node-ejs-postgres-shop-full'

def jenkins = Jenkins.get()
if (jenkins.getItem(jobName) != null) {
  println "Job ${jobName} already exists"
  return
}

def mb = new WorkflowMultiBranchProject(jenkins, jobName)

// Create Git SCM source (generic Git). It supports credentialsId for private repos.
def source = new GitSCMSource(repoUrl)
if (credentialsId) {
  source.setCredentialsId(credentialsId)
}

// Add branch discovery trait
def branchTrait = new BranchDiscoveryTrait(1) // discover branches
source.getTraits().add(branchTrait)

mb.getSourcesList().add(new BranchSource(source))
mb.save()
jenkins.add(mb, jobName)
println "Created Multibranch Pipeline job: ${jobName} (repo: ${repoUrl})"
