import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const options = {
    stages: [
        { duration: '30s', target: 300 },
        { duration: '30s', target: 400 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 1200 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<4000'],
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = 'https://dev-api.socialvit.com';

export function setup() {
    const payload = JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
    });
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const res = http.post(`${BASE_URL}/login_api`, payload, { headers });

    // extract token from response
    const token = res.json('data.access_token');
    if (!token) {
        throw new Error('Failed to get authorization token during setup process!');
    }

    // This value will be passed to the `data` parameter in the default function
    return { token: token };
}

// Main load function executed by VUs
export default function (data) {
    const authHeaders = {
        'Authorization': `Bearer ${data.token}`,
        'Accept': 'application/json',
    };

    const res = http.get(`${BASE_URL}/api/loker/list`, { headers: authHeaders });

    check(res, {
        'Job vacancy list status is 200': (r) => r.status === 200,
    });

    sleep(1);
}

export function handleSummary(data) {
    return {
        'report-loker.html': htmlReport(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
