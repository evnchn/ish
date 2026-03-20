import net from 'net';
Object.defineProperty(process, 'title', { get: function() { return 'c'; }, set: function() {} });
var s = net.createServer(function(c) { c.write('ALIVE\n'); c.end(); });
s.listen(7331, '0.0.0.0');
