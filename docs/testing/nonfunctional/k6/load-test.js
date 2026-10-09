// [Non-functional] Performance + load test for the LogiFlow backend API (k6).
//
// Scenario: authenticate once, then ramp virtual users hitting a read endpoint
// (GET /api/shipments) that exercises the backend + PostgreSQL. Thresholds assert
// the API stays responsive (p95 < 500 ms) with a near-zero error rate under load.
//
// Run:  k6 run -e BASE_URL=http://localhost:5050/api load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:5050/api';
const EMAIL = __ENV.EMAIL || 'admin@logiflow.com';
const PASSWORD = __ENV.PASSWORD || 'admin123';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // ramp up to 20 virtual users
    { duration: '20s', target: 20 }, // sustain load
    { duration: '5s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],      // < 1% request errors
    http_req_duration: ['p(95)<500'],    // 95th percentile under 500 ms
    checks: ['rate>0.99'],               // > 99% checks pass
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return { token: res.json('token') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  const res = http.get(`${BASE}/shipments`, params);
  check(res, {
    'shipments 200': (r) => r.status === 200,
    'body is a list': (r) => Array.isArray(r.json()),
  });
  sleep(1);
}
