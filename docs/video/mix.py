"""Mezcla la narración con la grabación y exporta MP4 (H.264 + AAC) y WebM (VP8 + Opus).

Uso: python3 mix.py <carpeta de trabajo> <nombre de salida sin extensión> [carpeta del video: video|video2]
La carpeta de trabajo tiene audio/<id>.wav (synth.py) y <video>/raw.webm + <video>/marks.json (grabación).
Coloca cada audio en el segundo en que empezó su segmento y deja <salida>.mp4 y <salida>.webm en la carpeta.
Necesita ffmpeg en el PATH o `pip install imageio-ffmpeg`.
"""
import json, os, shutil, subprocess, sys, wave

S, out = sys.argv[1], sys.argv[2]
vdir = os.path.join(S, sys.argv[3] if len(sys.argv) > 3 else 'video')
ff = shutil.which('ffmpeg')
if not ff:
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()

marks = json.load(open(os.path.join(vdir, 'marks.json')))
total = marks['total']
rate, width, chans = None, None, None
pcm = None
for m in marks['marks']:
    with wave.open(os.path.join(S, 'audio', f"{m['id']}.wav")) as w:
        if rate is None:
            rate, width, chans = w.getframerate(), w.getsampwidth(), w.getnchannels()
            pcm = bytearray(int((total + 1) * rate) * width * chans)
        data = w.readframes(w.getnframes())
    at = int(m['start'] * rate) * width * chans
    end = at + len(data)
    if end > len(pcm):
        pcm.extend(bytes(end - len(pcm)))
    pcm[at:end] = data
narr = os.path.join(S, 'narration.wav')
with wave.open(narr, 'wb') as w:
    w.setnchannels(chans); w.setsampwidth(width); w.setframerate(rate); w.writeframes(bytes(pcm))

raw = os.path.join(vdir, 'raw.webm')
subprocess.run([ff, '-y', '-loglevel', 'error', '-i', raw, '-i', narr, '-c:v', 'libx264', '-crf', '26', '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '96k', '-shortest', os.path.join(S, f'{out}.mp4')], check=True)
subprocess.run([ff, '-y', '-loglevel', 'error', '-i', raw, '-i', narr, '-c:v', 'libvpx', '-b:v', '600k', '-crf', '12',
                '-c:a', 'libopus', '-b:a', '64k', '-shortest', os.path.join(S, f'{out}.webm')], check=True)
print('listo:', f'{out}.mp4', f'{out}.webm', f'({round(total)} s)')
