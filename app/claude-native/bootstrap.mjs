import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

var __dirname = path.dirname(fileURLToPath(import.meta.url));
Object.defineProperty(process, 'title', { get: function() { return 'claude'; }, set: function() {}, configurable: true });

var s = 'pre-import';
var srv = net.createServer(function(c) { c.write(s+'\n'); c.end(); });
srv.listen(7331, '0.0.0.0');

s = 'importing';
import(path.join(__dirname, 'claude_cli.js')).then(function() { s = 'LOADED'; }).catch(function(x) { s = 'err:' + x.message; });
