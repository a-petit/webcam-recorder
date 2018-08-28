#! /bin/bash

filter_filename () {
    echo "$1" | sed 's/webm\///g' | sed 's/\.webm//g'
}

for video in exports/*.webm; do
     name="$(filter_filename "$video").mp4"
     ffmpeg -i "${video}" "${name}"
     echo "${name}"
done



