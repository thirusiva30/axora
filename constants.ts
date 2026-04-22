export interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  status: 'ACTIVE' | 'ALERT' | 'OFFLINE' | 'SERVICE';
  fuelLevel: number;
  breakdownRisk: number;
  speed?: number;
  distance?: number;
  temp?: number;
  location?: string;
  image: string;
}

export interface Driver {
  rank: number;
  name: string;
  image: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  waste: number;
  alerts: number;
  brakes?: number;
  speeding?: number;
  idling?: number;
}

export const VEHICLES: Vehicle[] = [
  {
    id: '1',
    plate: 'TN 38 AB 1234',
    driver: 'Kannan R.',
    status: 'ACTIVE',
    fuelLevel: 78,
    breakdownRisk: 15,
    speed: 64,
    distance: 12.4,
    temp: 42,
    location: 'Coimbatore Hub',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    plate: 'KA 01 MX 9882',
    driver: 'Suresh Kumar',
    status: 'ALERT',
    fuelLevel: 12,
    breakdownRisk: 81,
    location: 'Saravanampatti',
    image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    plate: 'MH 12 JK 5541',
    driver: 'Arjun Singh',
    status: 'OFFLINE',
    fuelLevel: 45,
    breakdownRisk: 32,
    image: 'https://images.unsplash.com/photo-1586191121264-201615ad9a3d?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    plate: 'DL 01 AH 7732',
    driver: 'Vikram V.',
    status: 'ACTIVE',
    fuelLevel: 92,
    breakdownRisk: 8,
    image: 'https://images.unsplash.com/photo-1591768793355-74d7c5060ca9?auto=format&fit=crop&q=80&w=800'
  }
];

export const DRIVERS: Driver[] = [
  {
    rank: 1,
    name: 'Suresh Kumar',
    image: 'https://i.pravatar.cc/150?u=suresh',
    score: 91,
    grade: 'A',
    waste: 320,
    alerts: 1,
    brakes: 1,
    speeding: 0,
    idling: 5
  },
  {
    rank: 2,
    name: 'Rajesh K.',
    image: 'https://i.pravatar.cc/150?u=rajesh',
    score: 88,
    grade: 'B',
    waste: 1240,
    alerts: 4
  },
  {
    rank: 3,
    name: 'Amit Singh',
    image: 'https://i.pravatar.cc/150?u=amit',
    score: 78,
    grade: 'C',
    waste: 2100,
    alerts: 9
  }
];
