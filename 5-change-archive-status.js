const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function changeArchiveStatus() {
  const owner = process.env.GITHUB_USER;
  const archiveRepos = true; // Set to false to unarchive

  if (!fs.existsSync("archive.txt")) {
    console.log("❌ archive.txt not found. Please create it and add the repo names.");
    return;
  }

  const reposToUpdate = fs.readFileSync("archive.txt", "utf-8")
    .split("\n")
    .map(name => name.trim())
    .filter(name => name.length > 0);

  console.log(`Found ${reposToUpdate.length} repositories to ${archiveRepos ? "archive" : "unarchive"}.`);

  for (const repo of reposToUpdate) {
    try {
      console.log(`\nProcessing: ${repo}...`);

      const { data: repoInfo } = await octokit.rest.repos.get({
        owner: owner,
        repo: repo
      });

      if (repoInfo.archived === archiveRepos) {
        console.log(`  - Repository is already ${archiveRepos ? "archived" : "unarchived"}. Skipping.`);
        continue;
      }

      console.log(`  - 📦 ${archiveRepos ? "Archiving" : "Unarchiving"} repository...`);
      await octokit.rest.repos.update({
        owner: owner,
        repo: repo,
        archived: archiveRepos
      });
      await sleep(3000);

      console.log(`  ✅ Successfully ${archiveRepos ? "archived" : "unarchived"} ${repo}`);
    } catch (error) {
      console.error(`  ❌ Failed on ${repo}:`, error.message);
    }
  }
}

changeArchiveStatus();