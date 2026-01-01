# Git Push Instructions - Step by Step Guide

This guide will walk you through the process of pushing files to the repository, specifically to the main branch.

## Prerequisites

1. **Git must be installed** (already installed on your system)
2. **You must have access to the repository** (you should be a collaborator or owner)
3. **You should be in the project directory**

## Step 1: Configure Your Git Identity

Before making commits, configure your Git username and email. This ensures your contributions are properly attributed to your GitHub account.

### Set Your Git Username
```bash
git config user.name "luqmanhkmii"
```

### Set Your Git Email
**Important:** Use the email address associated with your GitHub account. You can find this in your GitHub account settings.

```bash
git config user.email "your-email@example.com"
```

**To find your GitHub email:**
1. Go to GitHub.com
2. Click your profile picture → Settings
3. Go to "Emails" section
4. Use the email marked as "Primary" or add it if not listed

**Example:**
```bash
git config user.email "luqmanhkmii@users.noreply.github.com"
```

Or if you want to use your regular email:
```bash
git config user.email "your-actual-email@gmail.com"
```

### Verify Your Configuration
```bash
git config user.name
git config user.email
```

## Step 2: Check Current Status

Navigate to your project directory and check the current status:

```bash
cd C:\Backup\Dell\APPDEV\iss-yemen-webpage
git status
```

This will show you:
- Which branch you're on
- Which files have been modified
- Which files are untracked (new files)

## Step 3: Switch to Main Branch

If you're not on the main branch, switch to it:

```bash
git checkout main
```

Or if the branch is named `master`:
```bash
git checkout master
```

**Note:** If you have uncommitted changes, Git will warn you. You can either:
- Commit them first
- Stash them: `git stash` (then restore later with `git stash pop`)

## Step 4: Pull Latest Changes (Important!)

Before pushing, always pull the latest changes from the remote repository to avoid conflicts:

```bash
git pull origin main
```

Or if your branch is named `master`:
```bash
git pull origin master
```

## Step 5: Add Files to Staging

### Add All Changes
To add all modified and new files:
```bash
git add .
```

### Add Specific Files
To add only specific files:
```bash
git add path/to/file1.js
git add path/to/file2.css
```

### Add All Files in a Directory
```bash
git add frontend/src/
git add backend/src/
```

## Step 6: Check What Will Be Committed

Before committing, review what changes will be included:

```bash
git status
```

This shows you all files that are staged and ready to commit.

## Step 7: Commit Your Changes

Create a commit with a descriptive message:

```bash
git commit -m "Your descriptive commit message here"
```

**Good commit message examples:**
```bash
git commit -m "Add login credentials documentation"
git commit -m "Fix event registration form validation"
git commit -m "Update admin dashboard styling"
git commit -m "Add payment receipt generation feature"
```

**For a more detailed commit message:**
```bash
git commit -m "Add login credentials documentation

- Added LOGIN_CREDENTIALS.md with default admin and member credentials
- Included instructions for creating test accounts
- Added troubleshooting section"
```

## Step 8: Push to Main Branch

Push your committed changes to the remote repository:

```bash
git push origin main
```

Or if your branch is named `master`:
```bash
git push origin master
```

**If this is your first push to main, you might need to set upstream:**
```bash
git push -u origin main
```

## Complete Example Workflow

Here's a complete example of the entire process:

```bash
# 1. Navigate to project directory
cd C:\Backup\Dell\APPDEV\iss-yemen-webpage

# 2. Configure Git (only needed once)
git config user.name "luqmanhkmii"
git config user.email "your-email@example.com"

# 3. Check current status
git status

# 4. Switch to main branch
git checkout main

# 5. Pull latest changes
git pull origin main

# 6. Add your changes
git add .

# 7. Check what will be committed
git status

# 8. Commit with a message
git commit -m "Add new feature: payment registration form"

# 9. Push to main branch
git push origin main
```

## Troubleshooting

### Error: "Updates were rejected"

If you get an error saying "Updates were rejected because the remote contains work that you do not have locally":

**Solution:** Pull first, then push:
```bash
git pull origin main
# Resolve any conflicts if they occur
git push origin main
```

### Error: "Permission denied"

If you get a permission error:

1. **Check your GitHub access:** Make sure you're a collaborator on the repository
2. **Check authentication:** You may need to set up SSH keys or use a personal access token
3. **Verify remote URL:** 
   ```bash
   git remote -v
   ```

### Error: "Branch 'main' has no upstream branch"

**Solution:** Set upstream branch:
```bash
git push -u origin main
```

### Want to Push to a Different Branch?

If you want to push to a different branch (like `LATEST_SPRINT4`):

```bash
# Switch to the branch
git checkout LATEST_SPRINT4

# Push to that branch
git push origin LATEST_SPRINT4
```

## Best Practices

1. **Always pull before pushing** to avoid conflicts
2. **Write clear commit messages** that describe what you changed
3. **Commit frequently** with small, logical changes
4. **Don't commit sensitive data** (passwords, API keys, etc.)
5. **Use `.gitignore`** to exclude files that shouldn't be tracked

## Checking Your Contributions

After pushing, you can verify your contributions appear on GitHub:

1. Go to your repository on GitHub
2. Click on "Insights" tab
3. Click on "Contributors" to see the contributors graph
4. Your commits should appear if your email matches your GitHub account

**Note:** It may take a few minutes for GitHub to update the contributors graph.

## Quick Reference Commands

```bash
# Check status
git status

# Switch branch
git checkout main

# Pull latest changes
git pull origin main

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main

# View commit history
git log --oneline

# View your configuration
git config --list
```

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Search for the error on Google/Stack Overflow
3. Check GitHub's documentation: https://docs.github.com
4. Ask your team members for help

