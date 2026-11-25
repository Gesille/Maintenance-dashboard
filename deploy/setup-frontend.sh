#!/usr/bin/env bash
# One-time setup of the MAINTENANCE DASHBOARD (Next.js) on the VPS (Docker, Caddy and the "deploy" user already exist).
# Safe to re-run. Run as root:
#
#   sudo bash setup-frontend.sh <github-repo-url> <web-domain> <api-url> [app-name] [port] [backend-app]
#   e.g. sudo bash setup-frontend.sh https://github.com/nextinternational/MAINTENANCE-DASHBOARD-REPO \
#          maintenance.72-167-148-252.sslip.io https://maintenance-api.72-167-148-252.sslip.io/api/v1
#
# Also links it to the backend (default /opt/apps/maintenance-api): adds https://<web-domain> to the
# backend's CORS_ORIGINS, sets CLIENT_URL and restarts the backend API container.
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }
step() { echo; echo "==== $* ===="; }

[ "$(id -u)" -eq 0 ] || die "run as root (sudo bash $0 ...)"
[ $# -ge 3 ] || die "usage: sudo bash $0 <github-repo-url> <web-domain> <api-url> [app-name] [port] [backend-app]"

REPO_URL="$1"; DOMAIN="$2"; API_URL="$3"; APP="${4:-maintenance-dashboard}"; PORT="${5:-3005}"
BACKEND_APP="${6:-maintenance-api}"; BACKEND_SERVICE="${7:-mnt-api}"
DEPLOY_USER=deploy
APP_DIR="/opt/apps/$APP"
BACKEND_ENV="/opt/apps/$BACKEND_APP/deploy/.env.production"

REPO_PATH="$(echo "$REPO_URL" | sed -E 's#^(https://github.com/|git@github.com:)##; s#\.git$##; s#/$##')"
[[ "$REPO_PATH" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "could not read owner/repo from: $REPO_URL"
[[ "$APP" =~ ^[a-z0-9-]+$ ]] || die "app-name must be lowercase letters, digits or -"
[[ "$PORT" =~ ^[0-9]+$ ]] || die "port must be a number"
[[ "$API_URL" =~ ^https://[^[:space:]]+$ ]] || die "api-url must start with https://"
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || die "web-domain must be a bare host name (no https://, no /)"

step "Checks"
id "$DEPLOY_USER" >/dev/null 2>&1 || die "user '$DEPLOY_USER' missing"
command -v docker >/dev/null || die "docker missing"
command -v caddy >/dev/null || die "caddy missing"
if grep -q "127.0.0.1:$PORT\b" /etc/caddy/sites/*.caddy 2>/dev/null && ! grep -q "127.0.0.1:$PORT\b" "/etc/caddy/sites/$APP.caddy" 2>/dev/null; then
  die "port $PORT is already used by another site in /etc/caddy/sites"
fi
DHOME="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
[ -f "$DHOME/.ssh/gh_actions" ] || die "GitHub Actions key missing ($DHOME/.ssh/gh_actions)"
echo "ok"

step "HTTPS site (Caddy)"
cat > "/etc/caddy/sites/$APP.caddy" <<EOF
$DOMAIN {
	encode gzip
	reverse_proxy 127.0.0.1:$PORT
}
EOF
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl reload caddy
echo "https://$DOMAIN -> 127.0.0.1:$PORT"

step "GitHub deploy key for $REPO_PATH"
[ -f "$DHOME/.ssh/deploy_$APP" ] || sudo -H -u "$DEPLOY_USER" ssh-keygen -q -t ed25519 -N "" -C "vps-deploy-$APP" -f "$DHOME/.ssh/deploy_$APP"
if ! grep -q "^Host github-$APP\$" "$DHOME/.ssh/config"; then
  printf '\nHost github-%s\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/deploy_%s\n  IdentitiesOnly yes\n' "$APP" "$APP" >> "$DHOME/.ssh/config"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$DHOME/.ssh/config"
fi
github_ok() {
  local out
  out="$(sudo -H -u "$DEPLOY_USER" ssh -o BatchMode=yes -T "git@github-$APP" 2>&1 || true)"
  [[ "$out" == *"successfully authenticated"* ]]
}
if ! github_ok; then
  echo "Open:  https://github.com/$REPO_PATH/settings/keys/new"
  echo "Title: vps-$APP     (leave 'Allow write access' UNCHECKED)"
  echo "Key:"
  echo
  cat "$DHOME/.ssh/deploy_$APP.pub"
  echo
  until github_ok; do read -rp "Press Enter after you saved the key on GitHub... "; done
fi
echo "GitHub access OK"

step "Clone"
if [ -d "$APP_DIR/.git" ]; then
  sudo -H -u "$DEPLOY_USER" git -C "$APP_DIR" fetch --prune origin
else
  sudo -H -u "$DEPLOY_USER" git clone "git@github-$APP:$REPO_PATH.git" "$APP_DIR"
fi
cd "$APP_DIR/deploy" || die "the repo has no deploy/ folder: push the deploy files first"
printf 'WEB_DOMAIN=%s\nWEB_PORT=%s\nNEXT_PUBLIC_SERVER_URL=%s\n' "$DOMAIN" "$PORT" "$API_URL" > .env
chown "$DEPLOY_USER:$DEPLOY_USER" .env
echo "deploy/.env: API = $API_URL"

step "Link to the backend ($BACKEND_APP)"
if [ -f "$BACKEND_ENV" ]; then
  ORIGIN="https://$DOMAIN"
  CUR="$(grep '^CORS_ORIGINS=' "$BACKEND_ENV" | cut -d= -f2- || true)"
  if [[ ",$CUR," != *",$ORIGIN,"* ]]; then
    NEW="${CUR:+$CUR,}$ORIGIN"
    if grep -q '^CORS_ORIGINS=' "$BACKEND_ENV"; then sed -i "s#^CORS_ORIGINS=.*#CORS_ORIGINS=$NEW#" "$BACKEND_ENV"; else echo "CORS_ORIGINS=$NEW" >> "$BACKEND_ENV"; fi
    echo "CORS_ORIGINS += $ORIGIN"
  fi
  if grep -q '^CLIENT_URL=' "$BACKEND_ENV"; then sed -i "s#^CLIENT_URL=.*#CLIENT_URL=$ORIGIN#" "$BACKEND_ENV"; else echo "CLIENT_URL=$ORIGIN" >> "$BACKEND_ENV"; fi
  echo "CLIENT_URL = $ORIGIN"
  (cd "/opt/apps/$BACKEND_APP/deploy" && sudo -H -u "$DEPLOY_USER" docker compose -f docker-compose.prod.yml up -d --force-recreate "$BACKEND_SERVICE" >/dev/null)
  echo "backend restarted with the new settings"
else
  echo "WARNING: $BACKEND_ENV not found; add https://$DOMAIN to the backend CORS yourself"
fi

step "GitHub Actions key (same key as the other projects, copied for you to download)"
SUDO_HOME="$(getent passwd "${SUDO_USER:-root}" | cut -d: -f6)"
cp "$DHOME/.ssh/gh_actions" "$SUDO_HOME/gh_key.txt"
chown "${SUDO_USER:-root}" "$SUDO_HOME/gh_key.txt"
chmod 600 "$SUDO_HOME/gh_key.txt"

PUBLIC_IP="$(curl -fsS4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"
step "DONE - GitHub: https://github.com/$REPO_PATH/settings/secrets/actions"
cat <<EOF
Add these 4 repository secrets:
  VPS_HOST      $PUBLIC_IP
  VPS_USER      $DEPLOY_USER
  VPS_APP_DIR   $APP_DIR
  VPS_SSH_KEY   the content of gh_key.txt

Download the key on your computer (then delete it everywhere):
  scp ${SUDO_USER:-root}@$PUBLIC_IP:gh_key.txt .
  notepad gh_key.txt        (copy all into VPS_SSH_KEY, then: del gh_key.txt)
  and here on the server:   rm ~/gh_key.txt

First start:
  sudo -H -u $DEPLOY_USER bash $APP_DIR/deploy/deploy.sh
EOF
