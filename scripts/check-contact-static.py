"""Bounded structural/source checks. Not a PHP parser or backend runtime test."""
import hashlib
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
BASE = '1b8add8d36136975e6af73bb7a51f28cac5939ef'

class FormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.form = None
        self.fields = {}
        self.status = False
        self.in_form = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'form' and attrs.get('id') == 'contactForm':
            self.form = attrs
            self.in_form = True
        if self.in_form and tag in ('input', 'textarea'):
            self.fields[attrs.get('name')] = attrs
        if self.in_form and attrs.get('role') == 'status' and attrs.get('aria-live') == 'polite':
            self.status = True

    def handle_endtag(self, tag):
        if tag == 'form':
            self.in_form = False

def run():
    vendor = ROOT/'contact-server/vendor/PHPMailer'
    manifest = json.loads((vendor/'PROVENANCE.json').read_text(encoding='utf-8'))
    for name, expected in manifest['files_sha256'].items():
        assert hashlib.sha256((vendor/name).read_bytes()).hexdigest() == expected, name
    current = (ROOT/'kontakt.html').read_text(encoding='utf-8')
    parser = FormParser()
    parser.feed(current)
    assert parser.form['action'] == 'contact.php' and parser.form['method'] == 'POST'
    assert set(parser.fields) == {'name','email','message','website'}
    assert parser.fields['name']['maxlength'] == '120'
    assert parser.fields['email']['maxlength'] == '254'
    assert parser.fields['message']['maxlength'] == '5000'
    assert parser.fields['message']['minlength'] == '10'
    assert parser.status
    assert 'formspree.io' not in current
    original = subprocess.check_output(['git', '-C', str(ROOT), 'show', f'{BASE}:kontakt.html']).decode('utf-8')
    prefix = '<form class="contact-form" id="contactForm"'
    assert current.split(prefix)[0] == original.split(prefix)[0], 'design/header/CSS changed'
    new_tail = current.split('</form>',1)[1].replace('<script type="module" src="assets/contact-form.mjs"></script>\n','')
    assert new_tail == original.split('</form>',1)[1], 'navigation/footer/other content changed'
    existing = set(subprocess.check_output(['git','-C',str(ROOT),'ls-tree','-r','--name-only',BASE]).decode().splitlines())
    changed = set(subprocess.check_output(['git','-C',str(ROOT),'diff','--name-only',BASE]).decode().splitlines())
    assert sorted(existing & changed) == ['kontakt.html'], 'unrelated existing page modified'
    service = (ROOT/'contact-server/ContactService.php').read_text(encoding='utf-8')
    transport = (ROOT/'contact-server/SmtpTransport.php').read_text(encoding='utf-8')
    assert service.count("= 'office@mentalcoach-ts.de';") == 2
    assert 'LOCK_EX | LOCK_NB' in service and 'rename($temporary, $statePath)' in service
    assert 'hash_hmac' in service and "'pending'" in service
    assert 'addAddress(ContactService::RECIPIENT)' in transport
    assert "addReplyTo($input['email'], $input['name'])" in transport
    assert 'allow_self_signed\' => false' in transport and "'verify_peer' => true" in transport
    assert 'SMTPDebug = 0' in transport and 'isHTML(false)' in transport
    assert not re.search(r'addAttachment|addCC|addBCC|\bmail\(', transport)
    config = (ROOT/'contact-server/config.example.php').read_text(encoding='utf-8')
    assert "'enabled' => false" in config and "'smtp_password' => ''" in config and "'token_key' => ''" in config
    assert not (ROOT/'contact-server/config.php').exists()
    print(json.dumps({'result':'PASS','kind':'STRUCTURAL_CHECK_ONLY_NOT_PHP_SYNTAX_OR_RUNTIME',
        'vendor_hashes':len(manifest['files_sha256']), 'html_design_outside_form':'UNCHANGED',
        'fixed_envelope_and_recipient':'PRESENT','secret_config':'ABSENT'},indent=2))

if __name__ == '__main__':
    run()
