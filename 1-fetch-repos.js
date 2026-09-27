const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function fetchRepos() {
  try {
    console.log("Fetching your repositories...");
    
    // Fetch all repositories where you are the owner
    const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      affiliation: "owner",
      per_page: 100
    });
    
    // Extract names and write to file
    const repoNames = repos.map(repo => repo.name).join("\n");
    fs.writeFileSync("all_repos.txt", repoNames);
    
    console.log(`✅ Saved ${repos.length} repositories to all_repos.txt`);
    console.log("Next step: Copy the names you want to move into a new file called 'move.txt'");
  } catch (error) {
    console.error("Error fetching repositories:", error.message);
  }
}

fetchRepos();