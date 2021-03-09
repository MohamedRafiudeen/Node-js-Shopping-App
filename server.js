const http = require('http');
const fs = require('fs');

const router = require('./router.js');

const server  = http.createServer(router).listen(2000); 