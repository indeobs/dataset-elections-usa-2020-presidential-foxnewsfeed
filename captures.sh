#!/bin/sh

# set -x
DIR=feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/national_summary_results
HASH=

[ -d $DIR ] || mkdir -p $DIR
while sleep 10; do
  DATE=$(TZ=utc date +%Y%m%dT%H%M%SZ)
  curl https://$DIR/file.json?cb=20201104113930 > $DIR/$DATE.json
  HASHNEW=$(md5sum $DIR/$DATE.json |cut -d ' ' -f 1 )
  if [ "$HASH" != "$HASHNEW" ]; then
    gzip $DIR/$DATE.json
    HASH=$HASHNEW
  else
    rm $DIR/$DATE.json
  fi
done
