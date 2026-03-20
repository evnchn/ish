import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

var __dirname = path.dirname(fileURLToPath(import.meta.url));
Object.defineProperty(process, 'title', { get: function() { return 'claude'; }, set: function() {} });

var status = 'starting';
var error = '';

var srv = net.createServer(function(socket) {
    socket.write('Claude Code Native\r\n');
    socket.write('Node ' + process.version + ' ' + process.arch + '\r\n');
    socket.write('Status: ' + status + '\r\n');
    if (error) socket.write('Error: ' + error + '\r\n');
    socket.end();
});

srv.listen(7331, '0.0.0.0');

process.on('uncaughtException', function(e) { error = e.message; status = 'crash'; });
process.on('unhandledRejection', function(r) { error = (r && r.message) || String(r); });

status = 'importing';
import(path.join(__dirname, 'claude_cli.js')).then(function() {
    status = 'LOADED';
}).catch(function(e) {
    error = e.message;
    status = 'error';
});
