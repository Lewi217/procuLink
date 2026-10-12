const BASE_URL = 'http://localhost:8030/api/v1';

export const apiClient = async (endpoint, { method = 'GET', body, ...customConfig } = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const config = {
    method,
    headers,
    ...customConfig,
  };

  if (body) {
    if (body instanceof FormData) {
      delete config.headers['Content-Type'];
      config.body = body;
    } else if (typeof body === 'string' && config.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = 'Something went wrong';
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map(d => (d.msg ? `${d.loc ? d.loc[d.loc.length - 1] + ': ' : ''}${d.msg}` : JSON.stringify(d)))
          .join(', ');
      } else if (errorData.error && typeof errorData.error === 'object' && errorData.error.message) {
        errorMessage = errorData.error.message;
      } else if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      throw new Error(errorMessage);
    }
    // Handle 204 No Content
    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    throw err;
  }
};
