"""Validate SOC output, approved information architecture, and source text preservation."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,json,sys,xml.etree.ElementTree as ET,unicodedata
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'_site'
prefix=sys.argv[1].rstrip('/') if len(sys.argv)>1 else ''
r=json.loads((ROOT/'reference/migration-report.json').read_text());errors=[]
class Scan(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.links=[];self.ids=[];self.text=[];self.h1=[];self.title=[];self.description=None;self.head=False;self.h=False;self.t=False;self.skip=0
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='h1':self.h=True;self.h1.append('')
  if t=='title':self.t=True
  if t in ['script','style']:self.skip+=1
  if 'id' in a:self.ids.append(a['id'])
  if t in ['a','img','script','link','iframe']:
   v=a.get('href') if t in ['a','link'] else a.get('src')
   if v:self.links.append(v)
  if t=='meta' and a.get('name')=='description':self.description=a.get('content')
 def handle_endtag(self,t):
  if t=='h1':self.h=False
  if t=='title':self.t=False
  if t in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,d):
  if self.h:self.h1[-1]+=d
  if self.t:self.title.append(d)
  if not self.skip:self.text.append(d)
def scan(text):
 s=Scan();s.feed(text);return s
def flat(text):return re.sub(r'\s+','',unicodedata.normalize('NFC',text))
files=list(OUT.rglob('*.html'));parsed={p:scan(p.read_text()) for p in files}
expected={p['file'] for p in r['pages']}|{'privacy.html'}
actual={str(p.relative_to(OUT)) for p in files}
if actual!=expected:errors.append('Unexpected output file set: '+str(actual^expected))
heroes=json.loads((ROOT.parent/'css-shared/src/data/units/soc/heroes.json').read_text())['pages']
faculty_heroes=json.loads((ROOT.parent/'css-shared/src/data/units/soc/faculty-heroes.json').read_text())['pages']
heroes.update(faculty_heroes)
for p,s in parsed.items():
 rel=str(p.relative_to(OUT));raw=p.read_text()
 if len(s.h1)!=1:errors.append(rel+': expected one H1')
 if len(s.ids)!=len(set(s.ids)):errors.append(rel+': duplicate IDs')
 if not s.description:errors.append(rel+': missing description')
 if s.h1 and not ''.join(s.title).startswith(' '.join(s.h1[0].split())+' | '):errors.append(rel+': title differs from H1')
 url='/' if rel=='index.html' else '/'+rel[:-10] if rel.endswith('index.html') else '/'+rel
 assigned=heroes.get(url)
 if not assigned or 'page-hero--compact' not in raw or assigned['image'] not in raw:errors.append(rel+': missing assigned hero')
 elif ('/saunders-mural/' if url in faculty_heroes else '/students/') not in assigned['image']:errors.append(rel+': incorrect hero collection')
 if any(token in raw for token in ['{{','{%','[custom-twitter','fl-builder','fl-accordion']):errors.append(rel+': leftover template or WordPress plugin')
 for value in s.links:
  u=urlsplit(value)
  if u.scheme or u.netloc:continue
  if not u.path:target=p
  elif u.path.startswith('/'):
   if prefix and not u.path.startswith(prefix+'/'):errors.append(rel+': missing path prefix '+value);continue
   target=OUT/unquote(u.path[len(prefix):].lstrip('/'))
  else:target=p.parent/unquote(u.path)
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(rel+': missing target '+value)
  elif target.suffix=='.html' and u.fragment and target in parsed and unquote(u.fragment) not in parsed[target].ids:errors.append(rel+': missing anchor '+value)
 for key,front in [('title','title'),('description','description')]:
  if not re.search('^'+front+r':\s*\S',(ROOT/'src'/rel).read_text(),re.M):errors.append(rel+': missing source metadata '+key)
for entry in r['pages']:
 if entry['destination'] not in heroes:errors.append('Missing hero assignment '+entry['destination'])
 if not re.fullmatch(r'[a-z0-9/.-]+',entry['destination']):errors.append('Invalid URL '+entry['destination'])
assert r['facultyCount']==14
assert not (OUT/'undergraduate/index.html').exists()
assert not (OUT/'graduate/index.html').exists()
assert (OUT/'hormann-prize.html').is_file() and (OUT/'alpha-kappa-delta.html').is_file()
# Compare preserved source text, excluding replaced page H1s and plugin controls.
ns={'w':'http://wordpress.org/export/1.2/','c':'http://purl.org/rss/1.0/modules/content/'}
source={i.findtext('link'):i for i in ET.parse(ROOT/'reference'/r['source']).findall('./channel/item')}
for entry in r['pages']:
 if entry['destination'] in ['/faculty/','/about-soc/news-events.html','/graduate/current-cohort.html']:continue
 output=flat(''.join(parsed[OUT/entry['file']].text))
 for url in entry['sources']:
  raw=source[url].findtext('c:encoded','',ns)
  if entry['destination'].startswith('/faculty/'):
   boundary=re.search(r'<h[1-6][^>]*>\s*Background\s*</h[1-6]>',raw,re.I)
   if not boundary:raise ValueError('Missing faculty Background: '+url)
   raw=raw[boundary.start():]
  raw=re.sub(r'<h1\b[^>]*>.*?</h1>|<button\b[^>]*>.*?</button>|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>','',raw,flags=re.S|re.I)
  raw=re.sub(r'\[(?:/?(?:custom-twitter-feeds|fl_builder|embed|gallery))\b[^\]]*\]','',raw)
  expected=flat(''.join(scan(raw).text))
  cursor=0
  for chunk in scan(raw).text:
   chunk=flat(chunk)
   if not chunk:continue
   cursor=output.find(chunk,cursor)
   if cursor<0:
    errors.append(entry['file']+': source text requires review: '+url);break
   cursor+=len(chunk)

nav=json.loads((ROOT.parent/'css-shared/src/data/units/soc/navigation.json').read_text())
navtext=json.dumps(nav)
for hidden in ['gssa.html','annual-review.html','course-identification.html','hormann-prize.html','alpha-kappa-delta.html']:
 if hidden in navtext:errors.append('Hidden page in navigation '+hidden)
if errors:print('\n'.join(errors));sys.exit(1)
print(f'Checked {len(files)} pages: metadata, H1s, local links/assets/anchors, hero coverage, source text, 14 profiles, navigation exclusions. Prefix: {prefix or "/"}.')
