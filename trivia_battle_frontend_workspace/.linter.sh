#!/bin/bash
cd /home/kavia/workspace/code-generation/trivia-duel-91501-616974b9/trivia_battle_frontend_workspace/trivia_battle_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

