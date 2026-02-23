#!/bin/bash

# DashV Setup Check Script

echo "🔍 DashV Setup Check"
echo "======================="
echo ""

# Check Node.js
echo -n "✓ Node.js: "
if command -v node &> /dev/null; then
    echo "$(node --version)"
else
    echo "❌ MISSING - Install from https://nodejs.org"
fi

# Check npm
echo -n "✓ npm: "
if command -v npm &> /dev/null; then
    echo "$(npm --version)"
else
    echo "❌ MISSING"
fi

# Check Docker
echo -n "✓ Docker: "
if command -v docker &> /dev/null; then
    echo "$(docker --version)"
else
    echo "❌ MISSING - Install from https://docker.com"
fi

# Check Docker Compose
echo -n "✓ Docker Compose: "
if command -v docker-compose &> /dev/null; then
    echo "$(docker-compose --version)"
else
    echo "❌ MISSING"
fi

echo ""
echo "Project Structure:"
echo "===================="

# Check directories
for dir in frontend backend shared .github; do
    if [ -d "$dir" ]; then
        echo "✓ $dir/"
    else
        echo "❌ $dir/ missing"
    fi
done

echo ""
echo "Configuration Files:"
echo "===================="

# Check config files
for file in package.json tsconfig.json docker-compose.yml .env .gitignore; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "Ports Check:"
echo "===================="

# Check if ports are free
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "❌ Port $1 already in use"
    else
        echo "✓ Port $1 is free"
    fi
}

check_port 80
check_port 3001
check_port 5432

echo ""
echo "Next Steps:"
echo "===================="
echo "1. Install dependencies:  npm install"
echo "2. Start Docker:          docker-compose up -d"
echo "3. Start development:     npm run dev"
echo "4. Open in browser:       http://localhost:80"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: cat QUICKSTART.md"
echo "   - Dev Guide:   cat DEVELOPMENT.md"
echo "   - Architecture: cat ARCHITECTURE.md"
echo ""
