#!/bin/sh

for i in *.jpg
do 
  if [ ! -f "sm/$i" ]; then
    convert $i -resize 200x200 "sm/$i" 
  fi
done
