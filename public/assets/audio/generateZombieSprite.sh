#- brew install ffmpeg
#- yarn global add audiosprite
#- run the following lines (mono and 22050 KHz):

#audiosprite -f howler -r 22050 -c 1 -l info -o tessas-garden-sfx -e mp3 ./SFXTessasGarden/*.mp3

audiosprite -e 'm4a'  -r 44100 -o rewardScreenVO ./voiceOver/*.mp3
# extra mp3 steps
ffmpeg -i rewardScreenVO.mp3 tmp.mp3
cp tmp.mp3 rewardScreenVO.mp3
rm tmp.mp3
# notice
echo "IMPORTANT after generating fix json file"


audiosprite --path ./zombie --autoplay --output "./zombies" --export m4a --rate 44100 ./zombie/*.m4a