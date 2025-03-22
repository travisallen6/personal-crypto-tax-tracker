export const getUnixTimestamp = (date?: Date) => {
  const dateToUse = date ?? new Date();

  return Math.floor(dateToUse.getTime() / 1000);
};
