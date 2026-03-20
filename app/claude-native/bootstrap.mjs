import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

var __dirname = path.dirname(fileURLToPath(import.meta.url));
Object.defineProperty(process, 'title', { get: function() { return 'claude'; }, set: function() {} });
process.exit = function(code) {
    outputBuffer.push(Buffer.from('EXIT(' + code + '): ' + new Error().stack.split('\n').slice(1,3).join(' ') + '\r\n'));
};

// WebAssembly stub (typeof === "object")
if (typeof globalThis.WebAssembly === 'undefined') {
    globalThis.WebAssembly = Object.create(null);
    globalThis.WebAssembly.Module = function() {};
    globalThis.WebAssembly.Instance = function(mod) { this.exports = {}; };
    globalThis.WebAssembly.compile = function(bytes) { return Promise.resolve(new globalThis.WebAssembly.Module()); };
    globalThis.WebAssembly.instantiate = function(bytes, imports) {
        var mod = new globalThis.WebAssembly.Module();
        var inst = new globalThis.WebAssembly.Instance(mod);
        if (bytes instanceof globalThis.WebAssembly.Module) return Promise.resolve(inst);
        return Promise.resolve({ instance: inst, module: mod });
    };
    globalThis.WebAssembly.validate = function() { return true; };
    globalThis.WebAssembly.instantiateStreaming = function(r, i) { return globalThis.WebAssembly.instantiate(new Uint8Array(0), i); };
}

// Load mock yoga as global (used by patched $W1 in CLI)
import { createRequire as _cr } from 'module';
var _req = _cr(import.meta.url);
globalThis.__mockYoga = _req(path.join(__dirname, 'mock_yoga.cjs'));

// Setup: replace stdin with a Readable that we control
var inputStream = new Readable({ read: function() {} });
inputStream.isTTY = true;
inputStream.isRaw = false;
inputStream.setRawMode = function(m) { inputStream.isRaw = m; return inputStream; };
inputStream.fd = 0;

// Replace process.stdin BEFORE CLI import
Object.defineProperty(process, 'stdin', { value: inputStream, writable: true, configurable: true });

// Setup stdout to buffer until client connects
var clientSocket = null;
var outputBuffer = [];

var origWrite = process.stdout.write;
process.stdout.write = function(chunk) {
    if (clientSocket && !clientSocket.destroyed) {
        try { clientSocket.write(chunk); } catch(x) {}
    } else {
        outputBuffer.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return true;
};
process.stdout.isTTY = true;
process.stdout.columns = 80;
process.stdout.rows = 24;
process.stdout.getColorDepth = function() { return 8; };
process.stdout.hasColors = function() { return true; };
process.stdout.getWindowSize = function() { return [80, 24]; };
process.stderr.write = process.stdout.write;
process.stderr.isTTY = true;

// Override tty.isatty to always return true for stdin/stdout/stderr
import tty from 'tty';
var origIsatty = tty.isatty;
tty.isatty = function(fd) { return fd === 0 || fd === 1 || fd === 2 ? true : origIsatty(fd); };

process.env.TERM = 'xterm-256color';
// API key from environment or hardcoded for testing
if (!process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = 'test-key-placeholder';
}
process.env.HOME = '/tmp/claude-home';
// Copy auth config
try {
    var configSrc = path.join(__dirname, 'claude_config.json');
    if (require('fs').existsSync(configSrc))
        require('fs').copyFileSync(configSrc, '/tmp/claude-home/.claude.json');
} catch(x) {}
try { require('fs').mkdirSync('/tmp/claude-home/.claude', { recursive: true }); } catch(x) {}

process.on('uncaughtException', function(x) { outputBuffer.push(Buffer.from('Error: ' + x.message + '\r\n')); });

// Import CLI immediately
import(path.join(__dirname, 'claude_cli.js')).then(function() {
    outputBuffer.push(Buffer.from('CLI loaded\r\n'));
}).catch(function(x) {
    outputBuffer.push(Buffer.from('Import error: ' + x.message + '\r\n'));
});

// Server for clients to connect
var srv = net.createServer(function(socket) {
    clientSocket = socket;
    // Flush buffered output
    for (var i = 0; i < outputBuffer.length; i++) {
        try { socket.write(outputBuffer[i]); } catch(x) {}
    }
    outputBuffer = [];
    // Pipe socket input to our fake stdin
    socket.on('data', function(data) {
        try { inputStream.push(data); } catch(x) {}
    });
    socket.on('close', function() { clientSocket = null; });
    socket.on('error', function() { clientSocket = null; });
});
srv.listen(7331, '0.0.0.0');
