from pathlib import Path
import json
import subprocess
import imageio_ffmpeg
ROOT = Path(__file__).resolve().parents[1]
out = ROOT/'delivery'
timeline = json.loads((out/'timeline.json').read_text(encoding='utf-8'))
def stamp(t):
    ms = round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
subs = []
for i, s in enumerate(timeline):
    subs.append(f'{i+1}\n{stamp(s["start"])} --> {stamp(s["start"]+s["duration"])}\n{s["title"]}\n')
(out/'智变_演示字幕.srt').write_text('\n'.join(subs), encoding='utf-8')
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
command = [ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(out/'frames-simple/concat.txt'), '-i', str(out/'narration.wav'), '-vf', 'fps=15,format=yuv420p', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', str(out/'智变_网站亮点演示.mp4')]
subprocess.run(command, check=True)
print(out/'智变_网站亮点演示.mp4')
