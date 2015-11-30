# cashew
Personal budgeting web app meant to be installed and served on a private network.

[![Build Status](https://travis-ci.org/ynagasaki/cashew.svg?branch=master)](https://travis-ci.org/ynagasaki/cashew)

Originally cloned from https://github.com/angular/angular-seed

## Install Notes
* Install nodejs: https://nodejs.org/en/
* Install couchdb: https://couchdb.apache.org/
* Install git and clone this repo to your comp.
* `node reset-db.js --reinstall`
  * This uses the default couchdb port; edit the file to change.
  * This will set up a couchdb DB called 'cashew'; edit the file to change.
* `npm start`
  * This will start cashew running on port 8172; edit the file to change.
  * If you changed the couchdb port, you will have to edit the file to use the new port: `require('nano')('http://localhost:5984')`
  * If you changed the app name, you will have to edit the file to use the new app name: `nano.db.use('cashew')`
* You should now be able to visit the site: http://localhost:8172

## Release Notes

### Version 1.0.0
First, very basic version. You can:
* Add monthly and yearly budget line items ("payables" and "earnables").
  * Line items can occur on multiple dates (e.g. getting paid on the 10th and 25th of each month).
  * Yearly payables can be split into monthly "set-aside" amounts (to help "save up").
  * See your approximate monthly debt-to-income ratio.
* See upcoming payables for the next 4-5 weeks, with a calendar view.
  * Check them off to indicate that they have been paid.
  * Yearly payables that have been "split" will show up as "set-aside" payments.
