const os = require('os');
const networkInterfaces = os.networkInterfaces();
let localIp = '127.0.0.1';

for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const info of interfaces) {
    if (info.family === 'IPv4' && !info.internal) {
      localIp = info.address;
      break;
    }
  }
}

console.log('IP=' + localIp);
