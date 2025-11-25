#!/usr/bin/env bash
ENV_FILE=".env.local"
SENSITIVE_KEYS=("XAI_API_KEY" "GROQ_API_KEY" "PLANT_ID_API_KEY")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "خطأ: الملف $ENV_FILE غير موجود."
  exit 1
fi

declare -A seen
printf "\n%-20s | %-60s | %s\n" "Variable" "Value (masked)" "Notes"
printf "%-20s-+-%-60s-+-%s\n" "--------------------" "------------------------------------------------------------" "-------------------"

while IFS='=' read -r key value; do
  if [[ " ${SENSITIVE_KEYS[*]} " == *" $key "* ]]; then
    masked="${value:0:4}$(printf '%*s' $(( ${#value} - 4 )) '' | tr ' ' '*')"
    note="● موجود"
    if [[ -z "$value" ]]; then
      note="✗ فارغ"
    fi
    if [[ -n "$value" && -n "${seen[$value]}" ]]; then
      note="$note  ⚠️ مكرر مع ${seen[$value]}"
    else
      seen[$value]=$key
    fi
    printf "%-20s | %-60s | %s\n" "$key" "$masked" "$note"
  fi
done <"$ENV_FILE"

echo -e "\nتوصيات:"
echo "- لا تكرر نفس القيمة في أكثر من متغير."
echo "- خذ نسخة من هذا الملف قبل التعديل، ولا ترفعه إلى git."
