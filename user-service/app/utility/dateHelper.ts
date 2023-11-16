import dayjs from "dayjs";

export const TimeDifference = (
  fromDate: string,
  toDate: string,
  type: "h" | "d" | "m"
) => {
  const startDate = dayjs(fromDate);
  return startDate.diff(toDate, type, true);
};
