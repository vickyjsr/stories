#!/bin/bash

# Static Grievance Portal - GitHub Pages Deployment Script
# This script copies the necessary files for static deployment

echo "🌸 Preparing Static Grievance Portal for GitHub Pages..."

# Create deployment directory
mkdir -p static-deploy

# Copy static files
echo "📁 Copying files..."
cp public/index.html static-deploy/
cp public/style.css static-deploy/
cp public/script-static.js static-deploy/script.js

# Rename the script file to script.js for simplicity
sed -i '' 's/script-static.js/script.js/g' static-deploy/index.html

echo "✅ Files copied to 'static-deploy' folder:"
echo "   - index.html"
echo "   - style.css"
echo "   - script.js"
echo ""
echo "🚀 Next steps:"
echo "1. Set up Firebase project and update config in index.html"
echo "2. (Optional) Set up EmailJS and update script.js"
echo "3. Upload static-deploy contents to your GitHub repository"
echo "4. Enable GitHub Pages in repository settings"
echo ""
echo "📖 See README-static.md for detailed setup instructions"

# Check if git is available and offer to initialize
if command -v git &> /dev/null; then
    echo ""
    read -p "Initialize git repository in static-deploy folder? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd static-deploy
        git init
        echo "index.html" > .gitignore
        echo "style.css" >> .gitignore  
        echo "script.js" >> .gitignore
        rm .gitignore  # We actually want these files
        git add .
        git commit -m "Initial commit: Static grievance portal"
        echo "✅ Git repository initialized in static-deploy/"
        echo "🔗 Add your GitHub remote with: git remote add origin https://github.com/yourusername/repo-name.git"
        echo "📤 Push with: git push -u origin main"
    fi
fi

echo ""
echo "🎉 Static deployment ready!" 