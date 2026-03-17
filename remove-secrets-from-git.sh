#!/bin/bash

# Script to remove sensitive files from git history
# WARNING: This rewrites git history - make sure you have a backup!

echo "🔒 Removing sensitive files from git history..."
echo ""
echo "⚠️  WARNING: This will rewrite your git history!"
echo "   - Make sure you have a backup of your repository"
echo "   - This cannot be undone without the backup"
echo ""
read -p "Continue? (yes/no): " response

if [ "$response" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "📝 Step 1: Removing .env file from history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "📝 Step 2: Removing SQL backup files from history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch *.sql" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "📝 Step 3: Removing log files from history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server.log server/*.log" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "📝 Step 4: Cleaning up..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Done! Secrets removed from git history."
echo ""
echo "📤 Next steps:"
echo "   1. Verify changes: git log --all -- .env"
echo "   2. Force push to remote: git push origin --force --all"
echo "   3. Notify collaborators to re-clone the repository"
echo ""
echo "🔑 Don't forget to:"
echo "   - Rotate all exposed credentials in Azure Portal"
echo "   - Update your local .env file with new credentials"
echo ""
