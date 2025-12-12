import { FormBlueprintResponse, MockServerResponse } from '../types';
import { transformMockServerResponse } from './responseTransformer';

/**
 * API Configuration
 * Update these values based on your mock server setup
 *
 * Note: baseUrl is now a relative path (/api) because Vite proxy
 * will automatically forward requests to http://localhost:3000
 */
const API_CONFIG = {
  baseUrl: '/api', // Relative path - Vite will proxy to http://localhost:3000
  tenantId: 't_01jk71bxfsewajm2vb41twnk2h',
  blueprintId: 'ab_01jk7at9w9eweev3fq8rrv3sbv',
};

/**
 * Constructs the full API endpoint URL
 *
 * Returns: /api/v1/{tenantId}/actions/blueprints/{blueprintId}/graph
 * Vite proxy will forward to: http://localhost:3000/api/v1/...
 */
function getApiUrl(): string {
  const { baseUrl, tenantId, blueprintId } = API_CONFIG;
  return `${baseUrl}/v1/${tenantId}/actions/blueprints/${blueprintId}/graph`;
}

/**
 * Fetches the form blueprint graph from the Avantos mock server
 *
 * @returns Promise resolving to the form blueprint data
 * @throws {ApiError} If the request fails or returns an error
 */
export async function fetchFormBlueprint(): Promise<FormBlueprintResponse> {
  const url = getApiUrl();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch form blueprint: ${response.statusText}`,
        response.status
      );
    }

    // Parse the JSON response
    const mockServerData: MockServerResponse = await response.json();

    // Transform the mock server response to our application's format
    const transformedData = transformMockServerResponse(mockServerData);

    return transformedData;
  } catch (error) {
    // Handle network errors or JSON parsing errors
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        'Network error: Unable to connect to the API. Make sure the mock server is running on http://localhost:3000 and Vite dev server is running with proxy enabled.'
      );
    }

    throw new ApiError(
      `Unexpected error fetching form blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Error class for API-related errors
 */
export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}
