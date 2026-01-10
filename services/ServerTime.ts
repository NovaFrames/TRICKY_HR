import { API_ENDPOINTS } from "@/constants/api";
import axios from "axios";

/**
 * Safely parses known server date formats
 */
const parseDateString = (dateStr: string): Date => {
  // 1️⃣ .NET format: /Date(1750159303847)/
  if (dateStr.includes("/Date(")) {
    const timestamp = Number(dateStr.replace(/\D/g, ""));
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp);
    }
  }

  // 2️⃣ dd/MM/yyyy (force UTC)
  const dmy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return new Date(Date.UTC(+year, +month - 1, +day));
  }

  // 3️⃣ "10 Jan 2026 23:53:07" (server-style)
  const textDate = dateStr.match(
    /^(\d{1,2}) ([A-Za-z]{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})$/
  );

  if (textDate) {
    const [, day, mon, year, hh, mm, ss] = textDate;

    const monthIndex = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ].indexOf(mon);

    if (monthIndex !== -1) {
      return new Date(
        Date.UTC(+year, monthIndex, +day, +hh, +mm, +ss)
      );
    }
  }

  // 4️⃣ ISO only (safe)
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    const iso = new Date(dateStr);
    if (!isNaN(iso.getTime())) return iso;
  }

  throw new Error(`Invalid date format: ${dateStr}`);
};

/**
 * Converts any supported date input to .NET date format
 */
const toDotNetDate = (dateInput: string | Date): string => {
  const date =
    dateInput instanceof Date
      ? dateInput
      : parseDateString(dateInput);

      console.log("Original Input:", dateInput);
      console.log("Parsed Date:", date);
      console.log("Converted Date from toDotNetDate:", `/Date(${date.getTime()})/`);

  return `/Date(${date.getTime()})/`;
};

/**
 * Always uses SERVER TIME (never device time)
 */
export const getServerTime = async (
  token?: string,
  dateStr?: string
) => {
  // If explicit date passed (testing / overrides)
  if (dateStr) {
    return toDotNetDate(dateStr);
  }

  if (!token) {
    throw new Error("Token is required to fetch server time.");
  }

  const response = await axios.post(
    `${API_ENDPOINTS.CompanyUrl}${API_ENDPOINTS.SERVERTIME_URL}`,
    { TokenC: token }
  );

  return toDotNetDate(response.data);
};
