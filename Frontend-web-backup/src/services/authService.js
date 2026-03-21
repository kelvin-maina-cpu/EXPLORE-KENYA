// Auth service functions
export const loginUser = (credentials) => api.post('/auth/login', credentials);

export const registerUser = (userData) => api.post('/auth/register', userData);

export const logout = () => localStorage.removeItem('token');
