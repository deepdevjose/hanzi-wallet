"""Build a deterministic pack of separately decodable MP3 recordings, not an audio sprite."""
from __future__ import annotations
import argparse,concurrent.futures,hashlib,json,pathlib,subprocess,tarfile,urllib.request,wave
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
MARKS={c:(base,str(i+1))for base,chars in [('a','āáǎà'),('e','ēéěè'),('i','īíǐì'),('o','ōóǒò'),('u','ūúǔù'),('v','ǖǘǚǜ')]for i,c in enumerate(chars)}
def pinyin_key(p:str)->str:
 out='';tone='5'
 for c in p:
  if c in MARKS:b,tone=MARKS[c];out+=b
  else:out+='v'if c=='ü'else c
 return out+tone

def main()->None:
 parser=argparse.ArgumentParser();parser.add_argument('--archive',type=pathlib.Path,required=True);parser.add_argument('--commons-metadata',type=pathlib.Path,required=True);parser.add_argument('--work-dir',type=pathlib.Path,required=True);args=parser.parse_args();args.work_dir.mkdir(parents=True,exist_ok=True)
 metadata=json.loads(args.commons_metadata.read_text());commons={p['title']:p['imageinfo'][0]for p in metadata['query']['pages'].values()if'imageinfo'in p} if 'query' in metadata else metadata
 paths={};sources={}
 vocab=json.loads((ROOT/'public/data/vocabulary.json').read_text());keys=sorted({pinyin_key(e['pinyin'])for e in vocab})
 with tarfile.open(args.archive)as tar:
  members={pathlib.PurePosixPath(m.name).stem:m for m in tar.getmembers()if m.isfile()and m.name.endswith('.mp3')}
  for key in keys:
   alias=key.replace('lv','luu').replace('nv','nuu')
   if alias not in members:continue
   out=args.work_dir/f'{key}.mp3';out.write_bytes(tar.extractfile(members[alias]).read());paths[key]=out;sources[key]='David Fifield / The Unlicense'
  (ROOT/'public/audio/UNLICENSE.txt').write_bytes(tar.extractfile('mp3-chinese-pinyin-sound-master/LICENSE').read())
 def download(pair:tuple[str,str])->tuple[str,pathlib.Path]:
  key,title=pair;info=commons[title];out=args.work_dir/f'{key}.ogg'
  if not out.exists():
   request=urllib.request.Request(info['url'],headers={'User-Agent':'HanziWallet/1.1 (educational pronunciation)'})
   with urllib.request.urlopen(request,timeout=25)as response:out.write_bytes(response.read())
  return key,out
 for key,out in concurrent.futures.ThreadPoolExecutor(4).map(download,[(key,'File:Zh-'+key[:-1]+'.ogg')for key in ['a5','ba5','men5','zhe5']]):
  paths[key]=out;sources[key]=f'Wikimedia Commons: {out.stem[:-1]}'
 # Derive an isolated neutral /mə/ from the recorded /mən/: keep onset and vowel,
 # remove the final /n/. The edit is disclosed under its CC BY 2.0 FR licence.
 wav=args.work_dir/'men5.wav';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(paths['men5']),'-ac','1','-ar','24000',str(wav)],check=True)
 with wave.open(str(wav))as f:rate=f.getframerate();signal=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float64)
 frames=signal[:len(signal)//240*240].reshape(-1,240);rms=np.sqrt((frames**2).mean(axis=1));active=np.flatnonzero(rms>rms.max()*.12);peak=int(rms.argmax());end=int(active[-1]);start=int(active[0]);cut=peak+int((end-peak)*.60)
 print('Neutral syllable edit boundaries (seconds):',dict(start=start/100,peak=peak/100,cut=cut/100,end=end/100),flush=True)
 # Small fades avoid discontinuities at the edited boundary; no pitch/tone change.
 me=args.work_dir/'me5.mp3';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af',f'atrim=start={max(0,start/100-.02)}:end={cut/100},asetpts=PTS-STARTPTS,afade=t=out:st={max(0,cut/100-max(0,start/100-.02)-.014)}:d=0.014','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','48k',str(me)],check=True);paths['me5']=me;sources['me5']='Edited from Zh-men.ogg by Wei Gao and Vion Nicolas (CC BY 2.0 FR): final nasal removed.'
 if set(keys)-set(paths):raise ValueError('Missing audio: '+str(set(keys)-set(paths)))
 out_dir=args.work_dir/'encoded';out_dir.mkdir(exist_ok=True)
 def encode(key:str)->tuple[str,bytes]:
  out=out_dir/f'{key}.mp3';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(paths[key]),'-map_metadata','-1','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','48k',str(out)],check=True);return key,out.read_bytes()
 chunks=[];clips={};offset=0
 with concurrent.futures.ThreadPoolExecutor(4)as pool:
  for key,content in pool.map(encode,keys):clips[key]=dict(offset=offset,length=len(content),source=sources[key]);chunks.append(content);offset+=len(content)
 data=b''.join(chunks);(ROOT/'public/audio/pronunciation.bin').write_bytes(data)
 (ROOT/'public/audio/index.json').write_text(json.dumps(dict(version=1,sha256=hashlib.sha256(data).hexdigest(),clips=clips),ensure_ascii=False,separators=(',',':')))
 lines=['Hanzi Wallet pronunciation recordings','', 'Most recordings: David Fifield, mp3-chinese-pinyin-sound. The Unlicense (public domain).','https://github.com/davinfifield/mp3-chinese-pinyin-sound','Archive SHA-256: '+hashlib.sha256(args.archive.read_bytes()).hexdigest(),'Original audio re-encoded to mono MP3 at 24 kHz / 48 kbit/s. Individual clips are concatenated as a byte archive and decoded separately.','']
 import re
 for title,info in commons.items():
  m=info['extmetadata'];artist=re.sub('<[^>]+>','',m['Artist']['value']);license=m['LicenseShortName']['value'];url=m.get('LicenseUrl',{}).get('value','')
  lines+=[title,artist,license,url,info.get('descriptionurl',''), 'Changes: re-encoded as MP3.','']
 lines+=['me5: edited from the neutral men recording by Wei Gao and Vion Nicolas; final /n/ removed, short fade added; CC BY 2.0 FR. This phonetic edit needs native-speaker listening validation.','Source metadata is retained in SOURCES.json.']
 (ROOT/'public/audio/ATTRIBUTION.txt').write_text('\n'.join(lines)+'\n')
 (ROOT/'public/audio/SOURCES.json').write_text(json.dumps(commons,ensure_ascii=False,indent=2)+'\n')
 print(f'{len(keys)} readings cover {len(vocab)} characters; {len(data):,} bytes',flush=True)
if __name__=='__main__':main()
