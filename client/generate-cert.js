import selfsigned from 'selfsigned';
import fs from 'fs';

console.log("Generating certificates...");

const attrs = [
    { name: 'commonName', value: 'PushBet' },
    { name: 'organizationName', value: 'PushBet' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'State' },
    { name: 'localityName', value: 'City' }
];

const pems = selfsigned.generate(attrs, { days: 365, algorithm: 'sha256' });

fs.writeFileSync('server.key', pems.private);
fs.writeFileSync('server.crt', pems.cert);

console.log('Certificates generated successfully: server.key, server.crt');
