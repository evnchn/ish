import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
Object.defineProperty(process, 'title', { get: function() { return 'c'; }, set: function() {} });
// Override process.exit at JS level
var _origExit = process.exit;
process.exit = function(code) {
    try { require('fs').appendFileSync('/tmp/exit-trace.txt', 'exit('+code+') ' + new Error().stack.split('\n')[1] + '\n'); } catch(x) {}
};
var s = 'start', e = '';
var srv = net.createServer(function(c) { c.write(s+'\n'+e+'\n'); c.end(); });
srv.listen(7331, '0.0.0.0');
process.on('uncaughtException', function(x) { e = x.message; s = 'crash'; });
process.on('unhandledRejection', function(x) { e = (x&&x.message)||String(x); });
s = 'importing';
import(path.join(__dirname, 'claude_cli.js')).then(function() { s = 'LOADED'; }).catch(function(x) { e = x.message; s = 'err'; });
