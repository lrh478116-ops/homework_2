$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectDirectory = Split-Path -Parent $PSScriptRoot
$voiceDirectory = Join-Path $projectDirectory 'delivery\voice'
New-Item -ItemType Directory -Path $voiceDirectory -Force | Out-Null
$segments = Get-Content -LiteralPath (Join-Path $projectDirectory 'docs\narration.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Huihui Desktop')
$speaker.Rate = 1
$speaker.Volume = 100
for ($index = 0; $index -lt $segments.Count; $index++) {
    $audioPath = Join-Path $voiceDirectory ("segment-{0:D2}.wav" -f $index)
    $speaker.SetOutputToWaveFile($audioPath)
    $speaker.Speak($segments[$index].text)
    $speaker.SetOutputToNull()
}
$speaker.Dispose()
Write-Output '已生成 8 段中文语音讲解。'
