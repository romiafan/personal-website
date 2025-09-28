#!/usr/bin/env node
/**
 * Debug script to replicate the logic in convex/projects.ts syncViaGithub action.
 * Usage: pnpm run debug:github [username]
 */

import process from 'node:process';
import https from 'node:https';

const username = process.argv[2] || 'romiafan';
const token = process.env.GITHUB_TOKEN;

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,200)}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'personal-website-debug' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const publicEndpoint = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
  const authEndpoint = `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member`;

  const [publicList, authList] = await Promise.all([
    fetchJson(publicEndpoint, headers).catch(e => ({ error: e.message })),
    token ? fetchJson(authEndpoint, headers).catch(e => ({ error: e.message })) : Promise.resolve({ skipped: true })
  ]);

  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.map(r => ({
      owner: r.owner?.login,
      name: r.name,
      private: !!r.private,
      fork: !!r.fork,
      stars: r.stargazers_count ?? 0,
    }));
  }

  const pubNorm = normalize(publicList);
  const authNorm = normalize(authList);

  const ownedPublic = pubNorm.filter(r => r.owner === username && !r.private);
  const ownedAuth = authNorm.filter(r => r.owner === username && !r.private);

  console.log('--- GitHub Debug ---');
  console.log('Token present:', !!token);
  console.log('Public endpoint total:', pubNorm.length);
  console.log('Public endpoint owned+public:', ownedPublic.length);
  if (token) {
    console.log('Auth endpoint total:', authNorm.length);
    console.log('Auth endpoint owned+public:', ownedAuth.length);
  } else {
    console.log('Auth endpoint skipped (no token)');
  }
  console.log('\nNames (owned+public from chosen source):');
  const chosen = token ? ownedAuth : ownedPublic;
  chosen.forEach(r => console.log('-', r.name, r.fork ? '(fork)' : '', `★${r.stars}`));
}

main().catch(e => {
  console.error('Debug failed:', e);
  process.exit(1);
});
