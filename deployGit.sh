#!/usr/bin/env bash

MESSAGE="${1:-save bug resolve}"

git add -A && git commit -m "$MESSAGE" && git push

# git remote set-url origin git@bitbet.org:tutorials/tutorials.git
