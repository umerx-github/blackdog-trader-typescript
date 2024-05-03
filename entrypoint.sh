# SOURCE ENVIRONMENT
# Option 1
# env | grep -E "^BLACKDOG" > /etc/environment
# Option 2
# Just use source <(tr '\0' '\n' < /proc/1/environ) where applicable

cron -f
