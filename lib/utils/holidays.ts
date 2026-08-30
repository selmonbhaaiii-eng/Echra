export type Holiday = {
  day: number;
  month: number;
  name: string;
};

// Static list of common US/International holidays for demonstration
export const HOLIDAYS: Holiday[] = [
  { month: 0, day: 1, name: "New Year" },
  { month: 0, day: 26, name: "Republic Day" },
  { month: 1, day: 14, name: "Valentine's Day" },
  { month: 2, day: 14, name: "Holi" },
  { month: 2, day: 31, name: "Eid al-Fitr" },
  { month: 3, day: 18, name: "Good Friday" },
  { month: 4, day: 11, name: "Mother's Day" },
  { month: 7, day: 15, name: "Independence Day" },
  { month: 7, day: 27, name: "Ganesh Chaturthi" },
  { month: 9, day: 2, name: "Navratri" },
  { month: 9, day: 12, name: "Dussehra" },
  { month: 9, day: 20, name: "Diwali" },
  { month: 11, day: 25, name: "Christmas" },
];

export function getHolidaysForMonth(month: number): Holiday[] {
  return HOLIDAYS.filter((h) => h.month === month);
}
