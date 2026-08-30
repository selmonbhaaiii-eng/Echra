export type IndianOccasion = {
  name: string;
  date: string;
  daysBeforeAlert: number;
};

export const INDIAN_OCCASIONS: IndianOccasion[] = [
  { name: "Republic Day", date: "01-26", daysBeforeAlert: 5 },
  { name: "Holi", date: "03-14", daysBeforeAlert: 5 },
  { name: "Eid al-Fitr", date: "03-31", daysBeforeAlert: 5 },
  { name: "Good Friday", date: "04-18", daysBeforeAlert: 3 },
  { name: "Mother's Day", date: "05-11", daysBeforeAlert: 5 },
  { name: "Independence Day", date: "08-15", daysBeforeAlert: 5 },
  { name: "Ganesh Chaturthi", date: "08-27", daysBeforeAlert: 5 },
  { name: "Navratri", date: "10-02", daysBeforeAlert: 5 },
  { name: "Dussehra", date: "10-12", daysBeforeAlert: 5 },
  { name: "Diwali", date: "10-20", daysBeforeAlert: 7 },
  { name: "Christmas", date: "12-25", daysBeforeAlert: 5 },
  { name: "New Year", date: "01-01", daysBeforeAlert: 5 },
  { name: "Valentine's Day", date: "02-14", daysBeforeAlert: 5 },
];

export function occasionDateForYear(occasion: IndianOccasion, year: number) {
  const [month, day] = occasion.date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getUpcomingOccasions(daysAhead = 7, from = new Date()) {
  return INDIAN_OCCASIONS.map((occasion) => {
    let date = occasionDateForYear(occasion, from.getFullYear());
    if (date.getTime() < from.getTime()) {
      date = occasionDateForYear(occasion, from.getFullYear() + 1);
    }

    const daysUntil = Math.ceil((date.getTime() - from.getTime()) / 86_400_000);
    return { ...occasion, dateObject: date, daysUntil };
  })
    .filter((occasion) => occasion.daysUntil >= 0 && occasion.daysUntil <= Math.max(daysAhead, occasion.daysBeforeAlert))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
