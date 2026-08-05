/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  iconName: string;
}

export interface RegistryItem {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: 'honeymoon' | 'home' | 'tableware' | 'charity';
  imageUrl?: string;
  characteristics: string[];
  personalNote: string;
}

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  isChild: boolean;
  age?: number;
  isAttending: boolean;
  invitedTo?: {
    vinHonneur: boolean;
    repasNoces: boolean;
    brunchLendemain: boolean;
  };
  events: {
    vinHonneur: boolean;
    repasNoces: boolean;
    brunchLendemain: boolean;
  };
  dietaryNotes?: string;
}

export interface GuestFamily {
  id: string;
  familyName: string;
  email?: string;
  hasResponded?: boolean;
  respondedAt?: string;
  lastMessage?: string;
  members: FamilyMember[];
}

export interface RSVP {
  id: string;
  familyId?: string;
  familyName: string;
  email: string;
  members: FamilyMember[];
  message?: string;
  createdAt: string;
}

export interface RSVPStats {
  totalFamilies: number;
  totalInvited: number;
  totalAttending: number;
  totalVinHonneur: number;
  totalRepasNoces: number;
  totalBrunch: number;
}

export interface PracticalInfoItem {
  title: string;
  description: string;
  details: string[];
}
