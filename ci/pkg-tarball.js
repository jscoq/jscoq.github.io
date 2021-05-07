import fs from 'fs';
import zlib from 'zlib';
import tar from 'tar-stream';
import gunzip from 'gunzip-maybe';
import concat from 'concat-stream';


class PackageTarball {
    constructor(filename) {
        this.filename = filename;
    }

    getManifest() {
        var extract = tar.extract();

        return new Promise(resolve => {
            extract.on('entry', (header, stream, next) => {
                stream.on('end', () => next());

                if (this._isPackageJsonFn(header.name)) {
                    stream.pipe(concat(d => { try { resolve(JSON.parse(d)); } catch { } } ));
                }
                else stream.resume(); // just drain the stream so that we can continue
            });
            extract.on('finish', resolve);

            fs.createReadStream(this.filename).pipe(gunzip()).pipe(extract);
        });
    }

    transform(outfn, entryTransform) {
        var extract = tar.extract();
        var pack = tar.pack();

        extract.on('entry', (header, stream, next) => {
            var xout = entryTransform(header, stream, pack);
            if (xout) {
                stream.pipe(xout);
                stream.on('end', next);
            }
            else stream.pipe(pack.entry(header, next));
        });
        
        extract.on('finish', () => pack.finalize());

        fs.createReadStream(this.filename).pipe(gunzip()).pipe(extract);
        return pack.pipe(zlib.createGzip()).pipe(fs.createWriteStream(outfn));
    }

    transformManifest(outfn, jsonTransform) {
        return this.transform(outfn, (header, stream, pack) => {
            if (this._isPackageJsonFn(header.name)) {
                return concat(d =>
                    pack.entry({name: header.name},
                        JSON.stringify(jsonTransform(JSON.parse(d)))));
            }
        });
    }

    _isPackageJsonFn(fn) { return fn.match(/[/]package.json$/); }
}


export { PackageTarball }