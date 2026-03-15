import type { User, Ride } from "./types";

// Mock users (MongoDB-ready structure)
export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    name: "Praneetha Chandra Prakash",
    email: "praneetha.chandraprakash@university.edu",
    university: "State University",
    phone: "+1 555-0101",
    bio: "CS senior, often heading to the airport on Fridays.",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "user-2",
    name: "Benwin George",
    email: "benwin.george@university.edu",
    university: "State University",
    bio: "Grad student, grocery runs every Sunday.",
    createdAt: "2025-01-16T09:00:00Z",
    updatedAt: "2025-01-16T09:00:00Z",
  },
];

// Mock rides (MongoDB-ready structure)
export const createInitialRides = (): Ride[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "ride-1",
      createdByUserId: "user-1",
      creatorName: "Praneetha Chandra Prakash",
      creatorEmail: "praneetha.chandraprakash@university.edu",
      startLocation: "Campus Main Gate",
      destination: "Walmart",
      date: "2025-03-20",
      time: "14:00",
      note: "Grocery run, can make a quick stop at Target if needed.",
      price: 0,
      isFree: true,
      availableSeats: 2,
      totalSeats: 3,
      status: "active",
      joinedUserIds: ["user-2"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ride-2",
      createdByUserId: "user-1",
      creatorName: "Praneetha Chandra Prakash",
      creatorEmail: "praneetha.chandraprakash@university.edu",
      startLocation: "Student Union",
      destination: "Airport (SFO)",
      date: "2025-03-22",
      time: "06:00",
      note: "Early flight. Share gas and tolls.",
      price: 25,
      isFree: false,
      availableSeats: 1,
      totalSeats: 3,
      status: "active",
      joinedUserIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ride-3",
      createdByUserId: "user-2",
      creatorName: "Benwin George",
      creatorEmail: "benwin.george@university.edu",
      startLocation: "North Dorm Lot",
      destination: "Trader Joe's",
      date: "2025-03-18",
      time: "10:00",
      note: "Weekly grocery trip.",
      price: 0,
      isFree: true,
      availableSeats: 0,
      totalSeats: 2,
      status: "full",
      joinedUserIds: ["user-1"],
      createdAt: now,
      updatedAt: now,
    },
  ];
};
