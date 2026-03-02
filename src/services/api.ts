import { ReportRequest, ReportResponse } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const apiService = {
  // Report payment to server
  async reportPayment(
    serverUrl: string,
    request: ReportRequest
  ): Promise<ReportResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${serverUrl}/api/device/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceKey: request.deviceKey,
            amount: request.amount,
            type: request.type,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          message: data.message || 'Report sent successfully',
        };
      } catch (error) {
        lastError = error as Error;
        console.log(`Report attempt ${attempt} failed:`, error);

        if (attempt < MAX_RETRIES) {
          await new Promise(resolve =>
            setTimeout(resolve, RETRY_DELAY * attempt)
          );
        }
      }
    }

    return {
      success: false,
      message: lastError?.message || 'Failed to report after retries',
    };
  },

  // Test server connection
  async testConnection(serverUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Connection test failed:', error);
      return false;
    }
  },
};
