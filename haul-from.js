const fs = require('fs'),
      commander = require('commander');


function adjustLinks(htmlText, redirect) {
    return htmlText.replace(/"(.*?)"/g, (m, uri) => {
        for (let [from, to] of Object.entries(redirect)) {
            if (uri === from) return `"${to}"`;
            if (uri.startsWith(`${from}/`))
                return `"${to}/${uri.slice(from.length + 1)}"`;
        }
        return m;
    })
}


function main() {
    var args = commander.arguments('<filename>')
        .action(function (filename) { this.filename = filename; })
        .parse();

    if (!args.filename) {
        process.stderr.write('missing argument: filename\n')
        process.exit(1);
    }
    if (!fs.existsSync(args.filename)) {
        process.stderr.write(`input file does not exist: ${args.filename}\n`);
        process.exit(1);
    }

    var inp = fs.readFileSync(args.filename, 'utf-8');
    process.stdout.write(adjustLinks(inp, {
        'examples/scratchpad.html': 'scratchpad.html',
        'ui-js': 'node_modules/jscoq/ui-js'
    }));
}

main();