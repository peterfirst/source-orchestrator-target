#!/bin/sh
npm run package:dispatcher
npm run package:processor
npm run package:health
npm run package:nodemodules
rm -rf dist/nodejs
