#!/usr/bin/env bash
# Sets up Mihomo (Clash Meta) proxy on the Tencent Cloud server so the
# app can reach Google APIs, OpenAI, YouTube, etc. from mainland China.
#
# Usage:  sudo bash scripts/setup-clash.sh <SUBSCRIPTION_URL>
# Example: sudo bash scripts/setup-clash.sh "https://example.com/link/xxx"

set -euo pipefail

SUB_URL="${1:?Usage: $0 <clash-subscription-url>}"
CLASH_DIR="/opt/clash"
CLASH_BIN="$CLASH_DIR/mihomo"
CONFIG_FILE="$CLASH_DIR/config.yaml"
SERVICE_FILE="/etc/systemd/system/clash.service"

echo "── Installing Mihomo (Clash Meta) ──"

mkdir -p "$CLASH_DIR"

# Download Mihomo for Linux amd64
if [ ! -f "$CLASH_BIN" ]; then
  echo "[1/4] Downloading Mihomo..."
  MIHOMO_URL="https://github.com/MetaCubeX/mihomo/releases/download/v1.19.21/mihomo-linux-amd64-v1.19.21.gz"
  curl -fsSL "$MIHOMO_URL" -o /tmp/mihomo.gz
  gunzip -f /tmp/mihomo.gz
  mv /tmp/mihomo "$CLASH_BIN"
  chmod +x "$CLASH_BIN"
  echo "  ✓ Mihomo binary installed"
else
  echo "  ✓ Mihomo binary already exists"
fi

# Download subscription config
echo "[2/4] Downloading subscription config..."
curl -fsSL "$SUB_URL" -o "$CONFIG_FILE"

# Ensure mixed-port 7890 is set
if ! grep -q "^mixed-port:" "$CONFIG_FILE"; then
  sed -i '1i mixed-port: 7890' "$CONFIG_FILE"
fi
echo "  ✓ Config downloaded (mixed-port: 7890)"

# Create systemd service
echo "[3/4] Creating systemd service..."
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Mihomo Clash Proxy
After=network.target

[Service]
Type=simple
ExecStart=$CLASH_BIN -d $CLASH_DIR
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable clash
systemctl restart clash
echo "  ✓ Clash service started"

# Verify
echo "[4/4] Verifying proxy..."
sleep 3
if curl --max-time 15 -s --proxy http://127.0.0.1:7890 https://www.google.com > /dev/null 2>&1; then
  echo "  ✓ Proxy works! Google is reachable."
else
  echo "  ⚠ Proxy started but Google test failed. Check config or wait and retry."
  echo "  Try: curl --proxy http://127.0.0.1:7890 https://www.google.com"
fi

echo ""
echo "── Done! ──"
echo "Proxy running at: http://127.0.0.1:7890"
echo ""
echo "Next steps:"
echo "  echo 'HTTPS_PROXY=http://127.0.0.1:7890' >> /home/ubuntu/Tahoe-Agent/.env.local"
echo "  cd /home/ubuntu/Tahoe-Agent && pm2 restart tahoe-agent --update-env || pm2 restart tahoe --update-env"
