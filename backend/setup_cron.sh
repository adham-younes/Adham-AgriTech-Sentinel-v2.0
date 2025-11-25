#!/bin/bash
# Setup Cron Job for Adham AgriTech Sentinel v2.0

echo "🔧 Setting up Cron Job for Daily Updates"

# Get the absolute path to the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CRON_SCRIPT="$SCRIPT_DIR/app/cron/daily_updates.py"

# Make the script executable
chmod +x "$CRON_SCRIPT"

# Create cron job entry (runs daily at 2 AM)
CRON_ENTRY="0 2 * * * cd $SCRIPT_DIR && /usr/bin/python3 $CRON_SCRIPT >> $SCRIPT_DIR/logs/cron.log 2>&1"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Add to crontab
(crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT"; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job installed successfully!"
echo "📅 Schedule: Daily at 2:00 AM"
echo "📝 Logs: $SCRIPT_DIR/logs/cron.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To test manually: python3 $CRON_SCRIPT"
