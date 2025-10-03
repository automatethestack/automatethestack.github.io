# ATS

most info re: this project was ripped from: https://transloadit.com/devtips/create-ascii-art-from-videos-with-lua-and-ffmpeg/

## GENERATING PNG IMAGES
- ffmpeg to generate png frames on your input video

```bash
cd frame_generation_pipeline

mkdir -p frames

ffmpeg -i input.mp4 -vf "fps=10,scale=420:-1" frames/frame_%04d.png
```

## GENERATING ASCII FRAMES
- ascii.lua to generate ascii frames

```bash
cd frame_generation_pipeline

lua ascii.lua frames/frame_0001.png ascii_frames/frame_0001.txt
```

## GENERATING ASCII VIDEO
- create_ascii_video.sh to generate ascii video

```bash
cd frame_generation_pipeline

./create_ascii_video.sh
```
