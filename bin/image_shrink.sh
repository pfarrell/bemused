#!/bin/sh

for ext in png jpg jpeg JPG JPEG PNG
do
  for i in *.$ext
  do
    if [ -f "$i" ] && [ ! -f "sm/$i" ]; then
      convert "$i" -resize 200x200 "sm/$i"
    fi
  done
done
