import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (!ifaces) continue;
    for (const iface of ifaces) {
      // Pular IPv6 e endereços locais
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const ip = getLocalIP();
if (ip) {
  console.log(ip);
} else {
  console.log('127.0.0.1');
}
