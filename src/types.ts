export type IssueStatus = 'reported' | 'verified' | 'assigned' | 'in-progress' | 'resolved' | 'rejected';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Issue {
  id: string;
  imageUrl: string;
  location: Location;
  category: string;
  description: string;
  isGovernmentConcern: boolean;
  severity: number;
  isLifeThreatening: boolean;
  status: IssueStatus;
  priorityScore: number;
  reportedAt: string;
  reportedBy: string; // user ID
  resolvedAt?: string;
  resolvedImageUrl?: string;
  assignedTo?: string; // official ID
  upvotes: number;
}

export interface User {
  id: string;
  role: 'citizen' | 'official';
  points: number;
  name: string;
  tier: string;
  department?: string; // for officials
}
