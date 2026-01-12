import { API_ENDPOINTS } from "@/constants/api";
import axios from "axios";
import { getDomainUrl } from "./urldomain";

/**
 * Safely parses known server date formats
 */
/**
 * Parses server time string and returns UTC timestamp (ms)
 * Example input: "12 Jan 2026 17:01:26"
 */
const parseServerTimeToUTC = (dateInput: string | Date): number => {
  // If Date object is passed
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      throw new Error("Invalid Date object");
    }
    return Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate(),
      dateInput.getUTCHours(),
      dateInput.getUTCMinutes(),
      dateInput.getUTCSeconds()
    );
  }

  // /Date(1750159303847)/
  if (dateInput.includes("/Date(")) {
    const timestamp = Number(dateInput.replace(/\D/g, ""));
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  // dd/MM/yyyy
  const dmy = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return Date.UTC(+year, +month - 1, +day);
  }

  // "12 Jan 2026 17:01:26"
  const textDate = dateInput.match(
    /^(\d{1,2}) ([A-Za-z]{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})$/
  );

  if (textDate) {
    const [, day, mon, year, hh, mm, ss] = textDate;
    const monthIndex = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ].indexOf(mon);

    if (monthIndex !== -1) {
      return Date.UTC(+year, monthIndex, +day, +hh, +mm, +ss);
    }
  }

  throw new Error(`Invalid date format: ${dateInput}`);
};

/**
 * Converts to .NET date
 */
const toDotNetDate = (dateInput: string | Date): string => {
  const utcTimestamp = parseServerTimeToUTC(dateInput);
  return `/Date(${utcTimestamp})/`;
};

/**
 * ✅ Always uses SERVER TIME
 * ✅ Optional override date supported
 */
export const getServerTime = async (
  token: string,
  overrideDate?: string | Date
): Promise<string> => {
  // Optional override (still safe)
  if (overrideDate) {
    return toDotNetDate(overrideDate);
  }

  const domainUrl = await getDomainUrl();

  const response = await axios.post(
    `${domainUrl}${API_ENDPOINTS.SERVERTIME_URL}`,
    { TokenC: token }
  );

  // Example response: "12 Jan 2026 17:01:26"
  return toDotNetDate(response.data);
};
