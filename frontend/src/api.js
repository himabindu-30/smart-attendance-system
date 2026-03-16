const BASE = process.env.REACT_APP_API_URL || '';

export const api = (path, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};

export default BASE;
