import { API_ENDPOINTS } from '@/constants/api';
import axios from 'axios';

export const resolveWorkingDomain = async (
  rawInput: string,
  empCode: string,
  password: string,
  domainId: string
): Promise<string> => {
  let cleaned = rawInput.trim();

  // Remove protocol if user typed it
  cleaned = cleaned.replace(/^https?:\/\//, '');

  const candidates = [
    `https://${cleaned}`,
    `http://${cleaned}`,
  ];

  for (const baseUrl of candidates) {
    try {
      await axios.post(`${baseUrl}/${API_ENDPOINTS.LOGIN}`, {
        EmpCode: empCode,
        Password: password,
        DomainId: domainId,
      }, { timeout: 6000 });

      // ✅ This URL works
      return baseUrl;
    } catch (err) {
      // ❌ Try next one
      continue;
    }
  }

  throw new Error('Server not reachable on HTTP or HTTPS');
};
