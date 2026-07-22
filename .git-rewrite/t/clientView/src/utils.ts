export const getCookie = (name: string): string | null => {
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
  // Added decodeURIComponent to handle any URL-encoded characters safely
  return match ? decodeURIComponent(match.split('=')[1]) : null;
};