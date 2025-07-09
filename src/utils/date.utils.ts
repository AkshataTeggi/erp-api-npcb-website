// import { format, toZonedTime } from 'date-fns-tz';



// export function formatToIST(date: Date): { date: string; time: string } {
//   const timeZone = 'Asia/Kolkata'; // Indian Standard Time (IST)
//   const zonedDate = toZonedTime(date, timeZone);
//   return {
//     date: format(zonedDate, 'dd/MM/yyyy', { timeZone }), // Example: "27/03/2025"
//     time: format(zonedDate, 'hh:mm:ss a', { timeZone }), // Example: "10:30:45 AM"
//   };
// }


import { format, toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export function formatToIST(date: Date): { date: string; time: string } {
  const zonedDate = toZonedTime(date, IST_TIMEZONE);
  return {
    date: format(zonedDate, 'dd/MM/yyyy', { timeZone: IST_TIMEZONE }),
    time: format(zonedDate, 'hh:mm:ss a', { timeZone: IST_TIMEZONE }),
  };
}

export function getPastDateInIST(daysAgo: number): Date {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - daysAgo);
  return toZonedTime(pastDate, 'Asia/Kolkata'); // Corrected
}
