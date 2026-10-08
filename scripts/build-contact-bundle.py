"""Build split review bundles; never reads config.php/state and never deploys."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
STATIC = {'.html', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.css', '.js', '.mjs',
          '.ico', '.woff', '.woff2', '.ttf'}

def source_files():
    public = [p for p in ROOT.glob('*.html')]
    public += [ROOT/'contact.php', ROOT/'robots.txt', ROOT/'sitemap.xml']
    for directory in ['assets', 'life-coaching', 'sport-mentalcoaching']:
        public += [p for p in (ROOT/directory).rglob('*') if p.is_file() and p.suffix.lower() in STATIC]
    private_root = ROOT/'contact-server'
    private = [private_root/p for p in ['bootstrap.php', 'ContactService.php', 'SmtpTransport.php', 'config.example.php']]
    manifest = json.loads((private_root/'vendor/PHPMailer/PROVENANCE.json').read_text(encoding='utf-8'))
    for rel, digest in manifest['files_sha256'].items():
        file = private_root/'vendor/PHPMailer'/rel
        if hashlib.sha256(file.read_bytes()).hexdigest() != digest:
            raise ValueError('PHPMailer source hash mismatch: '+rel)
        private.append(file)
    private.append(private_root/'vendor/PHPMailer/PROVENANCE.json')
    for file in public+private:
        if not file.is_file() or file.is_symlink() or not file.resolve().is_relative_to(ROOT.resolve()):
            raise ValueError('Unsafe/missing source: '+str(file))
        if any(parent.is_symlink() or (hasattr(parent, 'is_junction') and parent.is_junction())
               for parent in file.parents if parent.is_relative_to(ROOT)):
            raise ValueError('Aliased source: '+str(file))
    return sorted(set(public)), sorted(set(private))

def build(output):
    output = output.resolve()
    if output.is_relative_to(ROOT.resolve()):
        raise ValueError('Output must be outside checkout')
    public, private = source_files()
    output.mkdir(parents=True, exist_ok=True)
    result = {'kind': 'REVIEW_PREPARATION_NOT_DEPLOYED', 'artifacts': {}, 'files_sha256': {}}
    for name, files in [('public-webroot.zip', public), ('private-contact-server.zip', private)]:
        target = output/name
        with ZipFile(target, 'x', ZIP_DEFLATED) as archive:
            for file in files:
                relative = file.relative_to(ROOT) if name.startswith('public') else Path('mentalcoach-contact')/file.relative_to(ROOT/'contact-server')
                archive.writestr(str(relative).replace('\\', '/'), file.read_bytes())
                result['files_sha256'][str(file.relative_to(ROOT)).replace('\\', '/')] = hashlib.sha256(file.read_bytes()).hexdigest()
        result['artifacts'][name] = {'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'count': len(files)}
    with (output/'bundle-manifest.json').open('x', encoding='utf-8') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(json.dumps(result['artifacts'], indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    build(parser.parse_args().output)
