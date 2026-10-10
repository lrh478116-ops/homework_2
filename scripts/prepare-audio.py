from pathlib import Path
import json
import wave
ROOT = Path(__file__).resolve().parents[1]
segments = json.loads((ROOT/'docs/narration.json').read_text(encoding='utf-8'))
out = ROOT/'delivery'
params = None
audio = bytearray()
for i, s in enumerate(segments):
    with wave.open(str(out/f'voice/segment-{i:02}.wav'), 'rb') as w:
        if params is None:
            params = w.getparams()
        assert w.getframerate() == params.framerate
        assert w.getnchannels() == params.nchannels
        assert w.getsampwidth() == params.sampwidth
        data = w.readframes(w.getnframes())
        seconds = w.getnframes()/w.getframerate()
        s['start'] = len(audio)/(params.framerate*params.nchannels*params.sampwidth)
        s['duration'] = seconds+1.5
        audio.extend(data)
        audio.extend(b'\0'*int(1.5*params.framerate*params.nchannels*params.sampwidth))
with wave.open(str(out/'narration.wav'), 'wb') as w:
    w.setparams(params)
    w.writeframes(bytes(audio))
(out/'timeline.json').write_text(json.dumps(segments, ensure_ascii=False, indent=2), encoding='utf-8')
duration = len(audio)/(params.framerate*params.nchannels*params.sampwidth)
assert duration < 300, duration
print(f'总时长 {duration:.1f} 秒，小于五分钟。')
