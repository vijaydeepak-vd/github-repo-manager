const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Helper function to pause execution and let GitHub process background jobs
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function transferRepos() {
  const owner = process.env.GITHUB_USER;
  const targetOrg = process.env.TARGET_ORG;
  
  if (!fs.existsSync("move.txt")) {
    console.log("❌ move.txt not found. Please create it and add the repo names to transfer.");
    return;
  }

  const reposToMove = fs.readFileSync("move.txt", "utf-8")
    .split("\n")
    .map(name => name.trim())
    .filter(name => name.length > 0);
    
  console.log(`Found ${reposToMove.length} repositories to transfer to ${targetOrg}.`);

  for (const repo of reposToMove) {
    try {
      console.log(`\nProcessing: ${repo}...`);
      
      // 1. Check current status of the repository
      const { data: repoInfo } = await octokit.rest.repos.get({
        owner: owner,
        repo: repo
      });

      // 2. Unarchive if necessary
      if (repoInfo.archived) {
        console.log(`  - 📦 Repository is archived. Unarchiving first...`);
        await octokit.rest.repos.update({
          owner: owner,
          repo: repo,
          archived: false
        });
        await sleep(3000); // Wait 3 seconds for GitHub to process the unarchive
      }

      // 3. Set to private
      if (!repoInfo.private) {
        console.log(`  - 🔒 Setting visibility to private...`);
        await octokit.rest.repos.update({
          owner: owner,
          repo: repo,
          private: true
        });
        await sleep(3000); // Wait 3 seconds for the privacy change to propagate
      }

      // 4. Execute Transfer
      console.log(`  - 🚚 Transferring to ${targetOrg}...`);
      await octokit.rest.repos.transfer({
        owner: owner,
        repo: repo,
        new_owner: targetOrg
      });
      
      console.log(`  ✅ Successfully transferred ${repo}`);
      
      // Final pause before moving to the next repository in the list
      await sleep(2000); 

    } catch (error) {
      console.error(`  ❌ Failed on ${repo}:`, error.message);
    }
  }
  
  console.log("\n🎉 Transfer complete! Check your target organization.");
}

transferRepos();