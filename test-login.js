import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const options = {
    stages: [
        { duration: '60s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '60s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '60s', target: 300 },
        { duration: '30s', target: 300 },
        { duration: '60s', target: 400 },
        { duration: '30s', target: 400 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% request must be under 2 seconds
        http_req_failed: ['rate<0.01'],    // Maximum failure rate 1%
    },
};

const BASE_URL = 'https://dev-api.socialvit.com';

export default function () {
    const payload = JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
    });

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const res = http.post(`${BASE_URL}/login_api`, payload, { headers });

    check(res, {
        'Login status is 200': (r) => r.status === 200,
        'Has access token': (r) => {
            try { return r.json('data.access_token') !== undefined; }
            catch (e) { return false; }
        },
    });

    sleep(1);
}

export function handleSummary(data) {
    return {
        'report-login.html': htmlReport(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
