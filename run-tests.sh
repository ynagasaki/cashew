#!/bin/bash

declare HINT=0
declare UNIT=0
declare SERVER_UNIT=0
declare PROTRACTOR=0

while getopts 'husp' flag; do
  case "${flag}" in
    h) HINT=1 ;;
    u) UNIT=1 ;;
    s) SERVER_UNIT=1 ;;
    p) PROTRACTOR=1 ;;
  esac
done

node "cashew-server.js" &
declare SERVER_PID=$!
trap "kill $SERVER_PID" 0 1 2 3 4 5 6 7 8 9 10

sleep 1

if [[ HINT -eq 1 ]]; then
  echo "## Running jshint tests"
  node_modules/.bin/jshint app/ couchdb/ cashew-server.js reset-db.js --config .jshintrc --exclude app/bower_components
  echo "(Done)"
  echo
fi

if [[ SERVER_UNIT -eq 1 ]]; then
  echo "## Running server unit tests"
  node_modules/.bin/mocha ./test/unit/cashewServerTest.js
  echo "(Done)"
  echo
fi

if [[ UNIT -eq 1 ]]; then
  echo "## Running unit tests"
  node_modules/.bin/karma start karma.conf.js --no-auto-watch --single-run --reporters=dots --browsers=Firefox
  echo "(Done)"
  echo
fi

if [[ PROTRACTOR -eq 1 ]]; then
  echo "## Running end-to-end tests -- MAKE SURE VPN IS NOT ACTIVE"
  node_modules/.bin/protractor "test/e2e/protractor.conf.js" --browser=chrome
  echo "(Done)"
  echo
fi
