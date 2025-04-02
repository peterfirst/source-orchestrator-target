export const generateTimeStamp = (): number => {
  return Math.floor(new Date().getTime() / 1000);
};
