export const isGuest = () => {
  try {
    const token = localStorage.getItem('token');
    return !token;
  } catch {
    return true;
  }
};
