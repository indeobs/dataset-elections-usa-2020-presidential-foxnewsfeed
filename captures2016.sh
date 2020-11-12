#!/bin/sh

# set -x
DATE=$(TZ=utc date +%Y-%m-%dT%H:%M:%SZ)

for folder in Congress/balance_of_power Electoral President/national_level_results President/national_summary_results; do
  DIR=feeds-elections.foxnews.com/archive/politics/elections/2016/3/2016_Generals/$folder
  [ -d $DIR ] || mkdir -p $DIR
  curl https://$DIR/file.json?cb=$DATE > $DIR/file.$DATE.json
done
