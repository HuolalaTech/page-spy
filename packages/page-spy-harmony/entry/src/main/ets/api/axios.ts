import axios from '@ohos/axios';
const request = axios.create({
  baseURL: 'https://request.blucas.me',
  timeout: 1000 * 60,
});

export default request;
