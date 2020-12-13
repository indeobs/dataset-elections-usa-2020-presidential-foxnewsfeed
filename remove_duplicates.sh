#!/bin/sh

set -x
mkdir feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/t
cd feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/t

for gz in ../national_summary_results/*; do gunzip -c $gz > $(basename ${gz%.gz}); done

md5sum * | while read md5 file; do
  if [ "$PREVIOUS_MD5" = "$md5" ]; then
    echo $md5 $file;
  fi;
  PREVIOUS_MD5=$md5;
done 

cd -
rm -r feeds-elections.foxnews.com/archive/politics/elections/2020/3/2020_Generals/President/t
