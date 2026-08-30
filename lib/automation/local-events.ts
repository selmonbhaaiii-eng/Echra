export type LocalEvent = {
  id: string;
  name: string;
  date: string; // ISO string
  city: string;
  type: "festival" | "market" | "concert" | "community";
};

// Mock local events database for MVP
const MOCK_EVENTS: LocalEvent[] = [
  {
    id: "evt_1",
    name: "Bandra Fair",
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    city: "Mumbai",
    type: "festival",
  },
  {
    id: "evt_2",
    name: "Sunday Farmers Market",
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    city: "Mumbai",
    type: "market",
  },
  {
    id: "evt_3",
    name: "Kala Ghoda Arts Festival",
    date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    city: "Mumbai",
    type: "festival",
  },
  {
    id: "evt_4",
    name: "Night Market",
    date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString(),
    city: "Pune",
    type: "market",
  },
];

/**
 * In a real app, this would poll Eventbrite or Google Events API based on the business's latitude/longitude.
 * For MVP, we mock the location check using a simple city string match.
 */
export function getUpcomingLocalEvents(businessLocation: string | null, daysAhead = 14): LocalEvent[] {
  if (!businessLocation) return [];
  
  const from = new Date();
  const maxDate = new Date();
  maxDate.setDate(from.getDate() + daysAhead);

  return MOCK_EVENTS.filter((event) => {
    // Check if event city is mentioned in business location (case-insensitive)
    const isLocal = businessLocation.toLowerCase().includes(event.city.toLowerCase());
    if (!isLocal) return false;

    const eventDate = new Date(event.date);
    return eventDate >= from && eventDate <= maxDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
