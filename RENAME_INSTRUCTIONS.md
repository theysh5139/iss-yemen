# Rename Project Instructions

## Current Situation
The project folder is currently named `user-site-about-us-page` and needs to be renamed to `iss-yemen-webpage`.

## Why Manual Steps Are Needed
The directory cannot be renamed while Cursor/VS Code is open because the editor locks the folder.

## Steps to Rename

### Option 1: Using PowerShell Script (Recommended)
1. **Close Cursor/VS Code completely**
2. Open PowerShell as Administrator
3. Navigate to the parent directory:
   ```powershell
   cd C:\Users\Dell\APPDEV
   ```
4. Run the rename script:
   ```powershell
   .\RENAME_PROJECT.ps1
   ```
5. Reopen Cursor/VS Code and open the project from the new location: `C:\Users\Dell\APPDEV\iss-yemen-webpage`

### Option 2: Manual Rename
1. **Close Cursor/VS Code completely**
2. Open File Explorer
3. Navigate to `C:\Users\Dell\APPDEV`
4. Right-click on `user-site-about-us-page` folder
5. Select "Rename"
6. Type: `iss-yemen-webpage`
7. Press Enter
8. Reopen Cursor/VS Code and open the project from the new location

## After Renaming
- All paths are relative, so no code changes are needed
- The project will work exactly as before
- All scripts and configurations will continue to work
- No environment variables or config files need updating

## Verification
After renaming, verify the project works by:
1. Opening the project in Cursor/VS Code
2. Running `npm run dev` from the root directory
3. Both frontend and backend should start normally


