import { HttpProxyAgent } from 'http-proxy-agent';

export const PROXY_LIST = [
  'http://139.99.237.62:80',
  'http://123.30.154.171:7777',
  'http://23.247.136.254:80',
  'http://152.53.107.230:80',
  'http://181.174.164.221:80',
  'http://4.245.123.244:80',
  'http://4.195.16.140:80',
  'http://108.141.130.146:80',
  'http://89.58.57.45:80',
  'http://160.251.142.232:80',
  'http://47.56.110.204:8989',
  'http://97.74.87.226:80',
  'http://4.156.78.45:80',
  'http://93.127.180.126:80',
  'http://8.17.0.15:8080',
  'http://197.221.234.253:80',
  'http://41.59.90.168:80',
  'http://41.59.90.175:80',
];

let currentProxy = 0;

export default function getAgent() {
  const proxy = PROXY_LIST[currentProxy];
  currentProxy = (currentProxy + 1) % PROXY_LIST.length;
  return new HttpProxyAgent(proxy);
}
