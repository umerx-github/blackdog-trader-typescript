#!/usr/bin/env bash

npm run build && git add . && git commit -m"$1" && npm version patch && npm publish --access public
