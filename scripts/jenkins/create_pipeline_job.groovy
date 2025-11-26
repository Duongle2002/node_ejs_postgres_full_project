// Groovy script to create a simple Pipeline job that runs Jenkinsfile from SCM
// Usage: paste into Jenkins > Manage Jenkins > Script Console. Edit repoUrl, credentialsId, and jobName.
import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition
import hudson.plugins.git.GitSCM
import hudson.plugins.git.BranchSpec
import hudson.plugins.git.UserRemoteConfig

def repoUrl = 'https://github.com/youruser/yourrepo.git' // set your repo
def credentialsId = '' // set if private
def jobName = 'node-ejs-postgres-shop-full-pipeline'

def jenkins = Jenkins.get()
if (jenkins.getItem(jobName) != null) {
  println "Job ${jobName} already exists"
  return
}

def job = new WorkflowJob(jenkins, jobName)

def remote = new UserRemoteConfig(repoUrl, null, null, credentialsId ?: null)
def scm = new GitSCM([remote])
scm.branches = [new BranchSpec('*/main')]

def flowDef = new CpsScmFlowDefinition(scm, 'Jenkinsfile')
job.setDefinition(flowDef)
jenkins.add(job, jobName)
job.save()
println "Created Pipeline job: ${jobName} (repo: ${repoUrl})"
