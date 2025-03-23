export const getUnixTimestamp = (date?: Date) => {
  const dateToUse = date ?? new Date();

  return Math.floor(dateToUse.getTime() / 1000);
};

export const getHourTimeRange = (date: Date) => {
  const start = new Date(date);
  const end = new Date(date);

  start.setMinutes(0, 0, 0);
  end.setMinutes(59, 59, 999);

  return [start, end];
};
