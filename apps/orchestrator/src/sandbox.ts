import { getProjectRoot, ensureProjectExists } from './tools/view.js';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

async function getGit(projectId: string) {
  const root = await ensureProjectExists(projectId);
  const git = simpleGit(root);
  try {
    await git.status();
  } catch {
    await git.init();
    await git.addConfig('user.email', 'lovable@localhost');
    await git.addConfig('user.name', 'Lovable Solo');
  }
  return git;
}

export async function gitStatus(projectId: string) {
  const git = await getGit(projectId);
  return git.status();
}

export async function gitLog(projectId: string, maxCount = 50) {
  const git = await getGit(projectId);
  try {
    const log = await git.log({ maxCount });
    return log.all.map((c) => ({
      hash: c.hash,
      message: c.message,
      author: c.author_name,
      date: c.date,
    }));
  } catch {
    return [];
  }
}

export async function gitCommit(projectId: string, message: string) {
  const git = await getGit(projectId);
  await git.add('.');
  const result = await git.commit(message);
  return result;
}

export async function gitDiff(projectId: string) {
  const git = await getGit(projectId);
  return git.diff(['HEAD']);
}
