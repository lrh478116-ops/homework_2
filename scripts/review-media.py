from pathlib import Path
import json
import subprocess
import re
import array
import math
import imageio_ffmpeg
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
video = ROOT/'delivery/智变_网站亮点演示.mp4'
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
info = subprocess.run([ffmpeg, '-hide_banner', '-i', str(video)], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
duration = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', info)
assert duration, info
h, m, s = map(float, duration.groups())
seconds = h*3600+m*60+s
assert 240 < seconds < 300, seconds
assert 'Video: h264' in info and 'Audio: aac' in info, info
assert '1440x1100' in info, info
audio = subprocess.run([ffmpeg, '-loglevel', 'error', '-i', str(video), '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
samples = array.array('h', audio)
rms = math.sqrt(sum(x*x for x in samples)/len(samples))
assert rms > 100, rms
review = ROOT/'docs/video-review'
review.mkdir(exist_ok=True)
for t in [0, 35, 80, 120, 155, 178, 215, 240]:
    subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-ss', str(t), '-i', str(video), '-frames:v', '1', str(review/f'frame-{t:03}.jpg')], check=True)
pdf = PdfReader(str(ROOT/'delivery/智变_网站亮点说明.pdf'))
assert len(pdf.pages) == 3
for page in pdf.pages:
    assert len(page.extract_text()) > 200
(ROOT/'docs/media-verification.json').write_text(json.dumps({
  'video': {'durationSeconds': seconds, 'videoCodec': 'h264', 'audioCodec': 'aac', 'resolution': '1440x1100', 'decodedAudioRMS': round(rms,2), 'voice': 'Microsoft Huihui Desktop Chinese synthesized narration', 'capture': 'actual local website Chrome CDP frames'},
  'pdf': {'pages': 3, 'textExtractedOnEveryPage': True, 'renderedReview': 'docs/pdf-review/page-1.png through page-3.png'},
}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'PASS: video {seconds:.2f}s, H264 + audible AAC, PDF 3 pages.')
