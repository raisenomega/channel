#!/usr/bin/env bash
# scripts/verify-personas.sh — Verificación SHA1 de las 7 personas HUB (Slide 4.0).
# Al estilo OMEGA. Si alguien cambia una persona sin firma del owner, el gate lo detecta.
set -euo pipefail

EXPECTED=$(cat scripts/personas-sha1.txt)
ACTUAL=""

for persona in victor zahra thao iris eco angel kelsy; do
  sha=$(sha1sum "src/cognition/domain/personas/persona.${persona}.ts" | cut -d' ' -f1)
  ACTUAL+="${persona}:${sha}"$'\n'
done

if [ "$EXPECTED" != "$(echo -n "$ACTUAL" | sed '/^$/d')" ]; then
  echo "❌ Personas SHA1 mismatch. Esperado:"
  echo "$EXPECTED"
  echo "---"
  echo "Actual:"
  echo -n "$ACTUAL"
  exit 1
fi

echo "✅ Las 7 personas tienen SHA1 esperado"