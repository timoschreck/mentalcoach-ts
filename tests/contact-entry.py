"""Loopback-only entry path tests; synthetic config/bootstrap, no SMTP or secrets."""
import argparse
import hashlib
import json
import os
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BINDING = "$privateDirectory = '/usr/home/ct56gy/private/mentalcoach-contact';"

def run(args):
    source = (ROOT/'contact.php').read_text(encoding='utf-8')
    original = hashlib.sha256((ROOT/'contact.php').read_bytes()).hexdigest()
    assert source.count(BINDING) == 1
    args.output.mkdir(parents=True,exist_ok=True)
    cases = []
    with tempfile.TemporaryDirectory(prefix='contact-entry-') as temp:
        fixture = Path(temp)
        public, private = fixture/'public', fixture/'private'
        public.mkdir(); private.mkdir()
        child, neighbor = public/'private', fixture/'public-other'
        child.mkdir(); neighbor.mkdir()
        marker = fixture/'executed'
        stub = "<?php file_put_contents("+json.dumps(marker.as_posix())+",'fixture'); echo json_encode(['ok'=>true]);"
        for folder in [private,public,child,neighbor]:
            (folder/'bootstrap.php').write_text(stub,encoding='utf-8')
            (folder/'config.php').write_text('<?php return [];',encoding='utf-8')
        entry = public/'contact.php'
        entry.write_text(source,encoding='utf-8')
        router = public/'fixture-router.php'
        router.write_text("""<?php
// Test router only; never bundled or installed on the website.
$mode=$_SERVER['HTTP_X_FIXTURE_ROOT']??'';
if($mode==='empty'){$_SERVER['DOCUMENT_ROOT']='';}
if($mode==='missing'){unset($_SERVER['DOCUMENT_ROOT']);}
if($mode==='unresolvable'){$_SERVER['DOCUMENT_ROOT']=__DIR__.'/missing';}
if($mode==='file'){$_SERVER['DOCUMENT_ROOT']=__DIR__.'/contact.php';}
require __DIR__.'/contact.php';
""",encoding='utf-8')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
        with (args.output/'entry-server.log').open('wb') as log:
            process=subprocess.Popen([str(args.php),'-c',str(args.ini),'-d','opcache.enable=0',
                '-S',f'127.0.0.1:{port}','-t',str(public),str(router)],stdout=log,stderr=log)
            try:
                def fetch(mode=''):
                    request=urllib.request.Request(f'http://127.0.0.1:{port}/contact.php',
                        headers={'X-Fixture-Root':mode})
                    try: reply=urllib.request.urlopen(request,timeout=3)
                    except urllib.error.HTTPError as error: reply=error
                    with reply:return reply.status,json.loads(reply.read()),dict(reply.headers)
                for attempt in range(50):
                    if process.poll() is not None: raise AssertionError('PHP stopped')
                    try: fetch();break
                    except urllib.error.URLError:time.sleep(.05)
                else:raise AssertionError('Local PHP startup failed')
                def check(name,path,expected=503,execute=False,mode=''):
                    marker.unlink(missing_ok=True)
                    literal=str(path).replace('\\','\\\\').replace("'","\\'")
                    entry.write_text(source.replace(BINDING,"$privateDirectory = '"+literal+"';"),encoding='utf-8')
                    status,body,headers=fetch(mode)
                    assert status==expected,(name,status,body)
                    assert marker.exists()==execute,name
                    assert headers['Cache-Control']=='no-store'
                    assert headers['X-Content-Type-Options']=='nosniff'
                    if expected==503:
                        assert body['code']=='unavailable' and body['ok'] is False
                        assert str(fixture) not in json.dumps(body)
                        assert 'SYNTHETIC-EXCEPTION' not in json.dumps(body)
                    cases.append({'name':name,'http_status':status,'result':'PASS'})
                check('unconfigured','')
                check('relative','../private')
                check('file wrapper','file://'+private.as_posix())
                check('HTTPS wrapper','https://example.invalid/private')
                check('missing private directory',fixture/'missing')
                check('public root',public)
                check('public child',child)
                check('public dot alias',child/'..'/'private')
                check('explicit external private',private,200,True)
                check('prefix neighbor outside public',neighbor,200,True)
                for mode in ['empty','missing','unresolvable','file']:
                    check(mode+' document root',private,mode=mode)
                (private/'config.php').unlink()
                check('missing private config',private)
                (private/'config.php').write_text('<?php return [];',encoding='utf-8')
                (private/'bootstrap.php').unlink()
                check('missing bootstrap',private)
                (private/'bootstrap.php').write_text('<?php throw new RuntimeException("SYNTHETIC-EXCEPTION");',encoding='utf-8')
                check('bootstrap exception',private)
                alias=fixture/'public-alias'
                if os.name=='nt':
                    quote=lambda value:"'"+str(value).replace("'","''")+"'"
                    result=subprocess.run(['powershell','-NoProfile','-Command',
                        'New-Item -ItemType Junction -Path '+quote(alias)+' -Target '+quote(child)+' | Out-Null'],
                        capture_output=True,text=True)
                    assert result.returncode==0 and alias.is_junction(),result.stderr
                else:alias.symlink_to(child,target_is_directory=True)
                try:check('directory alias into public',alias)
                finally:os.rmdir(alias) if os.name=='nt' else alias.unlink()
            finally:
                process.terminate();process.wait(timeout=5)
    assert hashlib.sha256((ROOT/'contact.php').read_bytes()).hexdigest()==original
    report={'status':'PASS','checks':cases,'count':len(cases),'actual_smtp_connections':0,
            'source_unchanged':True,'runtime':str(args.php)}
    (args.output/'entry-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['php','ini','output']:parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    for name in ['php','ini','output']:setattr(args,name,getattr(args,name).resolve())
    run(args)
