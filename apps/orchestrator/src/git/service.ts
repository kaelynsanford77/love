import simpleGit, { SimpleGit } from 'simple-git';

export async function initGitRepo(projectPath: string, message: string): Promise<string> {
  const git = simpleGit(projectPath);
  await git.init();
  await git.addConfig('user.email', 'love@example.com');
  await git.addConfig('user.name', 'Love IDE');
  await git.add('.');
  await git.commit(message);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash || '';
}

export async function commitChanges(projectPath: string, message: string): Promise<string> {
  const git = simpleGit(projectPath);

  // Check if there are any changes to commit
  const status = await git.status();
  if (status.files.length === 0) return '';

  await git.add('.');
  await git.commit(message);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash || '';
}

export async function getGitLog(projectPath: string): Promise<any[]> {
  const git = simpleGit(projectPath);
  try {
    const log = await git.log({ maxCount: 50 });
    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      date: entry.date,
      author: entry.author_name,
      refs: entry.refs,
    }));
  } catch {
    return [];
  }
}

export async function restoreToCommit(projectPath: string, sha: string): Promise<void> {
  const git = simpleGit(projectPath);
  await git.checkout([sha, '--', '.']);
  await git.add('.');
  await git.commit(`Restore to ${sha.slice(0, 7)}`);
}

export async function createBranchFromCommit(projectPath: string, sha: string, branchName: string): Promise<void> {
  const git = simpleGit(projectPath);
  await git.checkoutBranch(branchName, sha);
}

export async function listBranches(projectPath: string): Promise<{ current: string; branches: string[] }> {
  const git = simpleGit(projectPath);
  try {
    const result = await git.branchLocal();
    return {
      current: result.current,
      branches: result.all,
    };
  } catch {
    return { current: 'main', branches: ['main'] };
  }
}

export async function checkoutBranch(projectPath: string, branch: string): Promise<void> {
  const git = simpleGit(projectPath);
  await git.checkout(branch);
}

export async function getDiff(projectPath: string, fromSha: string, toSha: string = 'HEAD'): Promise<string> {
  const git = simpleGit(projectPath);
  return git.diff([fromSha, toSha]);
}
