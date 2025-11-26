// Groovy script to create a Multibranch Pipeline job.
// Usage: paste into Jenkins > Manage Jenkins > Script Console.
// Edit repoUrl, credentialsId and jobName below before running.
import jenkins.model.*
import org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject
import jenkins.branch.BranchSource
import jenkins.plugins.git.GitSCMSource

def repoUrl = 'https://github.com/Duongle2002/node_ejs_postgres_full_project.git' // set to your repo
def credentialsId = '' // set this if your repo is private (leave empty for public)
def jobName = 'node-ejs-postgres-full_project'

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

// Note: some Jenkins plugin versions use different constructors for traits.
// To keep this script broadly compatible, we avoid adding a BranchDiscoveryTrait here.
// The Multibranch job will use reasonable defaults for branch discovery.

mb.getSourcesList().add(new BranchSource(source))
mb.save()
jenkins.add(mb, jobName)
println "Created Multibranch Pipeline job: ${jobName} (repo: ${repoUrl})"
