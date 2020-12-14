const { htmlEscape } = require('escape-goat');
const { getGit } = require('@nodecorejs/dot-runtime');
const git = require('./git');

exports.getChangelog = async () => {
  const repoUrl = getGit();
  if (!repoUrl) {
    throw new Error(`Development git not found at runtime`);
  }
  const latest = await git.latestTagOrFirstCommit();
  const log = await git.commitLogFromRevision(latest);

  if (!log) {
    throw new Error(`Get changelog failed, no new commits was found.`);
  }

  const commits = log.split('\n').map((commit) => {
    const splitIndex = commit.lastIndexOf(' ');
    return {
      message: commit.slice(0, splitIndex),
      id: commit.slice(splitIndex + 1),
    };
  });

  return (nextTag) =>
    commits
      .map((commit) => `- ${htmlEscape(commit.message)}  ${commit.id}`)
      .join('\n') + `\n\n${repoUrl}/compare/${latest}...${nextTag}`;
};