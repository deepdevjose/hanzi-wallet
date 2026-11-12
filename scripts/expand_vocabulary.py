from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'public/data/vocabulary.json'
entries=json.loads(path.read_text())[:151]
lookup={e['char']:e for e in entries}
for line in (ROOT/'scripts/data/original-translations.tsv').read_text().splitlines():
 h,en,fr,pt,zh=line.split('|');e=lookup[h];e['meanings']={'es':e['meaning'],'en':en,'fr':fr,'pt':pt,'zh-CN':zh}
added=0
for line in (ROOT/'scripts/data/extra-vocabulary.tsv').read_text().splitlines():
 h,p,es,en,fr,pt,zh,c=line.split('|')
 if h in lookup:continue
 source=ROOT/'node_modules/hanzi-writer-data'/f'{h}.json'
 if not source.exists():raise ValueError(f'No template for {h}')
 e=dict(id=len(entries),char=h,pinyin=p,meaning=es,meanings={'es':es,'en':en,'fr':fr,'pt':pt,'zh-CN':zh},category=c)
 entries.append(e);lookup[h]=e;added+=1
 if len(entries)==500:break
if len(entries)!=500:raise ValueError(f'Need {500-len(entries)} more unique characters; got {len(entries)}')
if any('meanings'not in e for e in entries):raise ValueError('Missing translations')
path.write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')))
print(f'{len(entries)} unique characters, {added} additions, 5 gloss languages')
