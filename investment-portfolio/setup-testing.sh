#!/bin/bash

# Test Setup Script - Enable tabs and seed data
# Usage: bash setup-testing.sh [enable|disable|seed|reset]

set -e

REPO_ROOT="/home/samujjwal/Developments/finance/investment-portfolio"
SERVER_ROOT="$REPO_ROOT/server"

echo "📋 Investment Portfolio - Testing Setup"
echo "==========================================="
echo ""

function enable_tabs() {
    echo "✅ Enabling all test tabs..."
    sed -i 's/const showLegacyCapitalMarketTabs = false/const showLegacyCapitalMarketTabs = true/' "$REPO_ROOT/src/App.tsx"
    sed -i 's/const showLegacyAdminTabs = false/const showLegacyAdminTabs = true/' "$REPO_ROOT/src/App.tsx"
    echo "   ✓ Legacy capital market tabs enabled"
    echo "   ✓ Admin and root tabs enabled"
    echo ""
    echo "📝 Changes made to: src/App.tsx (lines 77-78)"
    echo "🔄 Dev server will auto-reload"
}

function disable_tabs() {
    echo "❌ Disabling all test tabs..."
    sed -i 's/const showLegacyCapitalMarketTabs = true/const showLegacyCapitalMarketTabs = false/' "$REPO_ROOT/src/App.tsx"
    sed -i 's/const showLegacyAdminTabs = true/const showLegacyAdminTabs = false/' "$REPO_ROOT/src/App.tsx"
    echo "   ✓ Legacy capital market tabs disabled"
    echo "   ✓ Admin and root tabs disabled"
    echo ""
    echo "📝 Changes made to: src/App.tsx (lines 77-78)"
    echo "🔄 Dev server will auto-reload"
}

function seed_data() {
    echo "🌱 Seeding test data..."
    cd "$SERVER_ROOT"
    npx prisma db seed
    echo ""
    echo "✅ Test data seeded successfully!"
    echo ""
    echo "📊 Test Users Created:"
    echo "   👤 Admin         | username: admin     | password: Admin@123"
    echo "   👤 Portfolio Mgr | username: portmgr   | password: PortMgr@123"
    echo "   👤 Trader        | username: trader    | password: Trader@123"
    echo "   👤 Viewer        | username: viewer    | password: Viewer@123"
}

function reset_db() {
    echo "🔄 Resetting database..."
    echo "   ⚠️  This will DELETE all data and re-seed"
    read -p "   Are you sure? (type 'yes' to confirm): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "   Cancelled."
        return
    fi
    
    cd "$SERVER_ROOT"
    npx prisma migrate reset --force
    echo ""
    echo "✅ Database reset complete"
    seed_data
}

function show_help() {
    echo "Usage: bash setup-testing.sh [command]"
    echo ""
    echo "Commands:"
    echo "  enable      - Enable all legacy tabs for testing"
    echo "  disable     - Disable legacy tabs (production mode)"
    echo "  seed        - Create test users and data"
    echo "  reset       - Reset database and re-seed (DESTRUCTIVE)"
    echo "  help        - Show this help message"
    echo ""
    echo "Quick Start:"
    echo "  1. bash setup-testing.sh enable"
    echo "  2. bash setup-testing.sh seed"
    echo "  3. Open http://127.0.0.1:1421/ and login with test credentials"
    echo ""
}

case "${1:-help}" in
    enable)
        enable_tabs
        ;;
    disable)
        disable_tabs
        ;;
    seed)
        seed_data
        ;;
    reset)
        reset_db
        ;;
    help|*)
        show_help
        ;;
esac

echo "Done! ✨"
