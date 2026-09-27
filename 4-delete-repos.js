const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function deleteRepos() {
  // If deleting from the archive org, change this to process.env.TARGET_ORG
  const targetOwner = process.env.GITHUB_USER; 
  
  if (!fs.existsSync("delete.txt")) {
    console.log("❌ delete.txt not found. Please create it and add the repo names to DELETE.");
    return;
  }

  const reposToDelete = fs.readFileSync("delete.txt", "utf-8")
    .split("\n")
    .map(name => name.trim())
    .filter(name => name.length > 0);
    
  console.log(`⚠️ WARNING: Attempting to permanently delete ${reposToDelete.length} repositories from ${targetOwner}.`);
  console.log("Starting in 5 seconds... Press Ctrl+C to abort.");
  
  await sleep(5000); // 5-second buffer to change your mind

  for (const repo of reposToDelete) {
    try {
      console.log(`Deleting ${repo}...`);
      
      await octokit.rest.repos.delete({
        owner: targetOwner,
        repo: repo
      });
      
      console.log(`  ✅ Successfully deleted ${repo}`);
      
      // Prevent hitting secondary rate limits
      await sleep(2000); 
    } catch (error) {
      console.error(`  ❌ Failed to delete ${repo}:`, error.message);
    }
  }
  
  console.log("\n🗑️ Cleanup complete.");
}

deleteRepos();