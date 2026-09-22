import json, wave, sherpa_onnx, sys, os
M = 'vits-piper-es_MX-claude-high'
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f'{M}/es_MX-claude-high.onnx', tokens=f'{M}/tokens.txt', data_dir=f'{M}/espeak-ng-data', length_scale=1.02),
    num_threads=4))
tts = sherpa_onnx.OfflineTts(cfg)
os.makedirs('audio', exist_ok=True)
segs = json.load(open('narration.json'))
out = {}
for s in segs:
    a = tts.generate(s['text'], sid=0, speed=1.0)
    path = f"audio/{s['id']}.wav"
    sherpa_onnx.write_wave(path, a.samples, a.sample_rate)
    with wave.open(path) as w:
        dur = w.getnframes() / w.getframerate()
    out[s['id']] = round(dur, 2)
    print(s['id'], round(dur, 1), 's')
json.dump(out, open('audio/durations.json', 'w'))
print('total', round(sum(out.values()), 1), 's')
