"""Real PHP HTTP, synthetic private deployment, replaced fixture SMTP adapter only."""
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://mentalcoach-ts.de'
MOCK = '''<?php
declare(strict_types=1);
namespace Mentalcoach;
// Fixture-only replacement. This file is never placed in the real application.
final class SmtpTransport {
 public static function create(array $config): \\Closure {
  return static function(array $input) use ($config): void {
   $file = $config['state_directory'].'/mock-count';
   $count = is_file($file) ? (int)file_get_contents($file) : 0;
   file_put_contents($file,(string)($count+1));
   if ($input['message']==='FORCE_MOCK_FAILURE') throw new \\RuntimeException('FAKE-SMTP-SECRET');
  };
 }
}
'''

def run(args):
    args.output.mkdir(parents=True, exist_ok=True)
    spec = importlib.util.spec_from_file_location('bundler', ROOT/'scripts/build-contact-bundle.py')
    bundler = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bundler)
    public_files, private_files = bundler.source_files()
    original = {str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in public_files+private_files}
    checks = []
    with tempfile.TemporaryDirectory(prefix='mentalcoach-php-http-') as temp:
        fixture = Path(temp)
        public = fixture/'public_html'
        private = fixture/'private/mentalcoach-contact'
        for files, old_root, new_root in [(public_files,ROOT,public),(private_files,ROOT/'contact-server',private)]:
            for source in files:
                target = new_root/source.relative_to(old_root)
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(source,target)
        # Bind only the disposable public copy to this fixture's absolute private path.
        # Production has no environment variable or request-controlled test switch.
        entry = public/'contact.php'
        text = entry.read_text(encoding='utf-8')
        binding = "$privateDirectory = '/usr/home/ct56gy/private/mentalcoach-contact';"
        assert text.count(binding) == 1, 'production private path binding changed'
        literal = str(private).replace('\\', '\\\\').replace("'", "\\'")
        entry.write_text(text.replace(binding, "$privateDirectory = '"+literal+"';"), encoding='utf-8')
        (private/'SmtpTransport.php').write_text(MOCK,encoding='utf-8')
        state = private/'state'
        state.mkdir(mode=0o700)
        config = "<?php return ['enabled'=>true,'smtp_host'=>'smtp.example.invalid','smtp_port'=>465," \
            "'smtp_username'=>'office@mentalcoach-ts.de','smtp_password'=>'SYNTHETIC-ONLY'," \
            "'token_key'=>'SYNTHETIC-ONLY-NOT-A-SERVER-SECRET-0000','state_directory'=>__DIR__.'/state'];"
        (private/'config.php').write_text(config,encoding='utf-8')
        (private/'config.php').chmod(0o600)
        with socket.socket() as selector:
            selector.bind(('127.0.0.1',0))
            port = selector.getsockname()[1]
        url = f'http://127.0.0.1:{port}/contact.php'
        server_log = args.output/'php-local-server.log'
        with server_log.open('wb') as log:
            # Fixture config changes several times in one second; do not reuse cached PHP fixtures.
            process = subprocess.Popen([str(args.php),'-c',str(args.ini),'-d','opcache.enable=0',
                                        '-S',f'127.0.0.1:{port}','-t',str(public)],
                                       cwd=fixture,stdout=log,stderr=log)
            try:
                def request(method='GET', data=None, headers=None, suffix=''):
                    if isinstance(data,dict): data = json.dumps(data).encode()
                    defaults = {'Origin':ORIGIN}
                    if method=='POST': defaults['Content-Type']='application/json'
                    if headers is not None:
                        defaults.update(headers)
                        defaults = {k:v for k,v in defaults.items() if v is not None}
                    req = urllib.request.Request(url+suffix,data=data,headers=defaults,method=method)
                    try: response=urllib.request.urlopen(req,timeout=5)
                    except urllib.error.HTTPError as error: response=error
                    with response:
                        raw=response.read()
                        body=json.loads(raw) if raw else {}
                        return response.status,body,dict(response.headers)

                for attempt in range(50):
                    if process.poll() is not None: raise RuntimeError('PHP server stopped')
                    try:
                        request()
                        break
                    except urllib.error.URLError: time.sleep(0.05)
                else: raise RuntimeError('PHP loopback startup timeout')

                def reset():
                    for file in state.iterdir():
                        if file.is_file(): file.unlink()
                def body():
                    status,result,_=request(suffix='?token=1')
                    assert status==200 and result['ok'] is True
                    return dict(name='Synthetische HTTP Testperson',email='visitor@example.invalid',
                                message='Nur synthetische HTTP-Nachricht.',website='',token=result['token'])
                def count():
                    file=state/'mock-count'
                    return int(file.read_text()) if file.exists() else 0
                def record(name): checks.append({'name':name,'result':'PASS'})

                reset(); payload=body()
                status,result,headers=request('POST',payload)
                assert status==200 and result=={'ok':True,'code':'accepted'} and count()==1
                assert headers['Cache-Control']=='no-store' and headers['X-Content-Type-Options']=='nosniff'
                assert request('POST',payload)[0]==200 and count()==1
                assert request('POST',{**payload,'message':'Changed synthetic message.'})[0]==409 and count()==1
                record('valid route, response headers, exact and changed replay')

                for name,method,data,headers,suffix,status in [
                    ('missing Origin','POST',{}, {'Origin':None},'',403),
                    ('foreign Origin','POST',{}, {'Origin':'https://other.example.invalid'},'',403),
                    ('unsupported method','PUT',b'',{},'',405),
                    ('token query required','GET',None,{},'',405),
                    ('wrong Content-Type','POST',b'{}',{'Content-Type':'text/plain'},'',415),
                    ('bad JSON','POST',b'{broken',{},'',400),
                    ('bad UTF8 JSON','POST',b'{"name":"\xff"}',{},'',400),
                    ('oversized body','POST',b'x'*22001,{},'',413),
                ]:
                    reset(); actual,result,_=request(method,data,headers,suffix)
                    assert actual==status and result['ok'] is False and count()==0,name
                    assert 'FAKE-SMTP-SECRET' not in json.dumps(result)
                    record(name)

                for name,change in [('header injection',{'email':'visitor@example.invalid\r\nBcc: other@example.invalid'}),
                                    ('honeypot',{'website':'bot'}),('extra recipient',{'to':'other@example.invalid'}),
                                    ('forged token',{'token':'forged'})]:
                    reset(); payload=body(); payload.update(change)
                    assert request('POST',payload)[0]==400 and count()==0,name
                    record(name)

                reset(); payload=body()
                assert request('POST',payload,{'X-Forwarded-For':'192.0.2.99'})[0]==200 and count()==1
                record('untrusted proxy header ignored')

                reset()
                for attempt in range(5): assert request('POST',{})[0]==400
                status,result,headers=request('POST',{})
                assert status==429 and result['code']=='rate_limit' and headers['Retry-After']=='3600' and count()==0
                record('server POST attempt rate limit')

                reset(); payload=body(); payload['message']='FORCE_MOCK_FAILURE'
                status,result,_=request('POST',payload)
                assert status==503 and result['code']=='uncertain' and count()==1
                assert 'FAKE-SMTP-SECRET' not in json.dumps(result)
                assert request('POST',payload)[0]==409 and count()==1
                record('mock SMTP uncertainty safe and never repeated')

                reset(); (state/'contact.json').write_text('{broken')
                assert request(suffix='?token=1')[0]==503 and count()==0
                record('corrupt storage fails closed')
                reset(); (state/'contact.json').write_bytes(b'x'*1048577)
                assert request(suffix='?token=1')[0]==503 and count()==0
                record('oversized storage fails closed')
                reset(); (private/'config.php').write_text(config.replace("'enabled'=>true","'enabled'=>false"))
                assert request(suffix='?token=1')[0]==503 and count()==0
                record('disabled fixture configuration fails closed')
                (private/'config.php').unlink()
                assert request(suffix='?token=1')[0]==503 and count()==0
                record('missing fixture configuration fails closed')
                (private/'config.php').write_text(config); (private/'config.php').chmod(0o600)
                reset()

                env={**os.environ,'PLAYWRIGHT_MODULE':args.playwright,
                     'CHROME_EXECUTABLE':str(args.chrome)}
                browser=subprocess.run([str(args.node),str(ROOT/'tests/contact-php-browser.mjs'),
                    f'http://127.0.0.1:{port}',str(args.output)],capture_output=True,timeout=60,env=env)
                browser_output=(browser.stdout+browser.stderr).decode('utf-8',errors='replace')
                assert browser.returncode==0,browser_output
                assert count()==2,'unexpected actual transport count'
                report={'status':'PASS','http_checks':checks,'browser_output':browser_output,
                    'transport':'ISOLATED_FIXTURE_MOCK_ONLY','actual_smtp_connections':0,
                    'browser_origin':'test harness overrides Origin; production allowlist unchanged',
                    'source_files_unchanged':all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in original.items())}
                assert report['source_files_unchanged']
                (args.output/'php-http.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
                print(json.dumps(report,indent=2))
            finally:
                process.terminate()
                try: process.wait(timeout=5)
                except subprocess.TimeoutExpired: process.kill(); process.wait(timeout=5)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for option in ['php','ini','node','chrome','output']:
        parser.add_argument('--'+option,type=Path,required=True)
    parser.add_argument('--playwright',required=True)
    args=parser.parse_args()
    for name in ['php','ini','node','chrome','output']:
        setattr(args,name,getattr(args,name).resolve())
    run(args)
