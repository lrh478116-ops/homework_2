from pathlib import Path
import json
import hashlib
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent/'交付文件'
OUT.mkdir(exist_ok=True)
deployment = json.loads((ROOT/'delivery/deployment-verification.json').read_text(encoding='utf-8'))
browser = json.loads((ROOT/'docs/browser-verification-production.json').read_text(encoding='utf-8'))
redesign = json.loads((ROOT/'docs/redesign-verification-production.json').read_text(encoding='utf-8'))
media = json.loads((ROOT/'docs/media-verification.json').read_text(encoding='utf-8'))
recording = json.loads((ROOT/'delivery/recording-manifest.json').read_text(encoding='utf-8'))
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
assert deployment['result'] == browser['result'] == redesign['result'] == 'passed'
assert deployment['sourceManifest'] == browser['sourceManifest'] == redesign['sourceManifest'] == recording['sourceManifest']
for filename, expected in browser['sourceManifest'].items():
    assert sha(ROOT/filename) == expected, f'Stale evidence: {filename}'
assert media['video']['durationSeconds'] < 300
source_matches = all(sha(ROOT/filename) == expected for filename, expected in browser['sourceManifest'].items())
assert source_matches
duration = media['video']['durationSeconds']
duration_label = f'{int(duration//60)}分{round(duration%60):02}秒'
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0')
archive = OUT/'homework_2_网站源代码.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for filename in tracked:
        if filename:
            assert not filename.startswith(('.git/', '.openai/', 'delivery/'))
            z.write(ROOT/filename, filename)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for filename, expected in browser['sourceManifest'].items():
        assert hashlib.sha256(z.read(filename)).hexdigest() == expected
for name in ['智变_网站亮点说明.pdf', '智变_网站亮点演示.mp4', '智变_演示字幕.srt']:
    shutil.copy2(ROOT/'delivery'/name, OUT/name)
instructions = f'''智变 人工智能与新质生产力观察站

网站提交链接：{deployment['websiteURL']}
GitHub 源码仓库：https://github.com/lrh478116-ops/homework_2

作业提交文件：
1. homework_2_网站源代码.zip
2. 智变_网站亮点演示.mp4 （约{duration_label}，中文合成语音讲解）
3. 智变_网站亮点说明.pdf （3页）

附加：智变_演示字幕.srt （章节字幕；视频中已包含可见句子字幕）

本地运行：解压源码，进入源码目录，在终端执行 node scripts/serve.mjs。
访问 http://127.0.0.1:4173 。需要 Node.js；网页本身无需安装依赖。
请使用 HTTP 预览，不要直接双击模块化 index.html。

网站的真实统计、研究结果和教学模拟已区分。所有模拟参数为教学假设，不是企业收益预测。
发布源码 commit：{deployment['commit']}
GitHub Actions：{deployment['workflow']['url']}
'''
(OUT/'使用与提交说明.txt').write_text(instructions, encoding='utf-8-sig')
files = {p.name: {'bytes': p.stat().st_size, 'sha256': sha(p)} for p in OUT.iterdir() if p.is_file() and p.name != '交付校验.json'}
summary = {'time': deployment['time'], 'website': deployment['websiteURL'], 'sourceCommit': deployment['commit'], 'deploymentVerified': deployment['result'], 'browserCheckCount': len(browser['checks']), 'redesignCheckCount': len(redesign['checks']), 'media': media, 'files': files, 'sourceMatchesCurrentRun': source_matches, 'closure': 'CLOSED' if source_matches else 'NOT CLOSED'}
(OUT/'交付校验.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'PASS: {len(files)} deliverable files packaged; ZIP source matches current browser, video and production manifests.')
print(OUT)
