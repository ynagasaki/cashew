#!/bin/bash

node "run-server.js" &
declare SERVER_PID=$!
trap "kill $SERVER_PID" 0 1 2 3 4 5 6 7 8 9 10

echo "## Running jshint tests"
node_modules/.bin/jshint app/ --config .jshintrc --exclude app/bower_components
echo "(Done)"

echo "## Running unit tests"
node_modules/.bin/karma start karma.conf.js --no-auto-watch --single-run --reporters=dots --browsers=Firefox
echo "(Done)"

echo "## Running end-to-end tests"
node_modules/.bin/protractor "test/e2e/protractor.conf.js" --browser=firefox
echo "(Done)"

