import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  ext: {
    loadimpact: {
      // Project: iberojet-backend
      projectID: 3650051,
      // Test runs with the same name groups test runs together
      name: 'iberojet-backend-dev',
    },
  },
};

export default function () {
  http.get('http://test.k6.io');
  sleep(1);
}
