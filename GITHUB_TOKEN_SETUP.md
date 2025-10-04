# GitHub Personal Access Token Setup

This document explains how to set up a GitHub Personal Access Token (PAT) for secure server-side repository synchronization.

## Why We Need This

The application syncs your GitHub repositories to display them on your personal website. For security and rate limiting benefits, this is done server-side using Convex actions rather than client-side API calls.

## Setup Steps

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Personal Access Tokens > Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Click "Generate new token"
3. Configure the token:
   - **Name**: `personal-website-sync` (or any descriptive name)
   - **Expiration**: Set according to your preference (90 days recommended)
   - **Resource owner**: Select your personal account
   - **Repository access**:
     - For public repos only: Select "Public Repositories (read-only)"
     - For all repos: Select "All repositories" and add "Contents" read permission

### 2. Set the Token in Convex

Once you have your token, set it in your Convex environment:

```bash
npx convex env set GITHUB_TOKEN your_actual_token_here
```

Replace `your_actual_token_here` with the token you just created.

### 3. Verify Setup

1. Start your development server: `pnpm dev`
2. Navigate to the Projects section of your website
3. If you're the authenticated owner, you should see a "Refresh from GitHub" button
4. Click it to test the sync - it should fetch your repositories without errors

## Security Notes

- ✅ **Secure**: Token is stored server-side in Convex environment
- ✅ **Rate Limited**: Uses authenticated endpoints with higher rate limits
- ✅ **Minimal Scope**: Only reads public repository information
- ✅ **Owner Only**: Sync function is restricted to the site owner

## Troubleshooting

### "GitHub token not configured" Error

- Ensure you've set the token in Convex: `npx convex env set GITHUB_TOKEN your_token`
- Verify the token isn't the placeholder value

### "GitHub authentication failed" Error

- Check that your token hasn't expired
- Verify the token has the correct permissions
- Try regenerating the token

### "Rate limit exceeded" Error

- Wait for the rate limit to reset (usually 1 hour)
- Authenticated requests have much higher limits than anonymous ones

### No repositories showing up

- Ensure the token has access to read your repositories
- Check that repositories are public (private repos are filtered out for public display)
- Verify your username matches the repository owner

## Rate Limits

With a Personal Access Token:

- **5,000 requests per hour** (vs 60 for unauthenticated)
- **Primary rate limit**: Uses the authenticated user's quota
- **Secondary rate limits**: Applies to specific endpoints

The sync function includes rate limit detection and provides helpful error messages if limits are exceeded.

## Token Management

- **Rotation**: Regenerate tokens periodically for security
- **Monitoring**: GitHub provides usage statistics in your token settings
- **Revocation**: Revoke old tokens when rotating to new ones

## Environment Variables

The token is managed through Convex environment variables, not local `.env` files, for security reasons:

```bash
# Set the token
npx convex env set GITHUB_TOKEN your_token

# List all environment variables (values hidden)
npx convex env list

# Remove the token (if needed)
npx convex env unset GITHUB_TOKEN
```
