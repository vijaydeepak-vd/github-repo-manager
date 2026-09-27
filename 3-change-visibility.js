const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function changeVisibility() {
  const owner = process.env.GITHUB_USER;
  const makePrivate = true; // Set to false to make public
  
  if (!fs.existsSync("visibility.txt")) {
    console.log("❌ visibility.txt not found. Please create it and add the repo names.");
    return;
  }

  const reposToUpdate = fs.readFileSync("visibility.txt", "utf-8")
    .split("\n")
    .map(name => name.trim())
    .filter(name => name.length > 0);
    
  console.log(`Found ${reposToUpdate.length} repositories to update.`);

  for (const repo of reposToUpdate) {
    try {
      console.log(`\nProcessing: ${repo}...`);
      
      const { data: repoInfo } = await octokit.rest.repos.get({
        owner: owner,
        repo: repo
      });

      const wasArchived = repoInfo.archived;

      if (wasArchived) {
        console.log(`  - 📦 Repository is archived. Unarchiving first...`);
        await octokit.rest.repos.update({
          owner: owner,
          repo: repo,
          archived: false
        });
        await sleep(3000);
      }

      console.log(`  - 🔒 Changing visibility to ${makePrivate ? 'private' : 'public'}...`);
      await octokit.rest.repos.update({
        owner: owner,
        repo: repo,
        private: makePrivate
      });
      await sleep(3000);

      // Restore archived status if it was archived initially
      if (wasArchived) {
        console.log(`  - 📦 Restoring archived status...`);
        await octokit.rest.repos.update({
          owner: owner,
          repo: repo,
          archived: true
        });
        await sleep(3000);
      }
      
      console.log(`  ✅ Successfully updated ${repo}`);
    } catch (error) {
      console.error(`  ❌ Failed on ${repo}:`, error.message);
    }
  }
}

changeVisibility();