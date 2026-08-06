import { GuestFamily } from '../types';

export const INITIAL_GUEST_FAMILIES: GuestFamily[] = [
  {
    id: 'fam-benard',
    familyName: 'Bénard',
    email: 'jean.benard@exemple.fr',
    members: [
      { id: 'm-b1', firstName: 'Jean', lastName: 'Bénard', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: false, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: false, brunchLendemain: false } },
      { id: 'm-b2', firstName: 'Valentine', lastName: 'Bénard', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: false, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: false, brunchLendemain: false } },
      { id: 'm-b3', firstName: 'Lucas', lastName: 'Bénard', isChild: true, age: 8, isAttending: true, events: { vinHonneur: true, repasNoces: false, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: false, brunchLendemain: false } },
      { id: 'm-b4', firstName: 'Camille', lastName: 'Bénard', isChild: true, age: 5, isAttending: true, events: { vinHonneur: true, repasNoces: false, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: false, brunchLendemain: false } },
    ],
  },
  {
    id: 'fam-chemlenhof',
    familyName: 'Chem-Lenhof',
    email: 'alex.chemlenhof@exemple.fr',
    members: [
      { id: 'm-c1', firstName: 'Alexandre', lastName: 'Chem-Lenhof', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
      { id: 'm-c2', firstName: 'Élodie', lastName: 'Chem-Lenhof', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
      { id: 'm-c3', firstName: 'Gabriel', lastName: 'Chem-Lenhof', isChild: true, age: 6, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
    ],
  },
  {
    id: 'fam-dubois',
    familyName: 'Dubois',
    email: 'pierre.dubois@exemple.fr',
    members: [
      { id: 'm-d1', firstName: 'Pierre', lastName: 'Dubois', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
      { id: 'm-d2', firstName: 'Sophie', lastName: 'Dubois', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
      { id: 'm-d3', firstName: 'Antoine', lastName: 'Dubois', isChild: true, age: 11, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
      { id: 'm-d4', firstName: 'Léa', lastName: 'Dubois', isChild: true, age: 4, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
    ],
  },
  {
    id: 'fam-martin',
    familyName: 'Martin',
    email: 'nicolas.martin@exemple.fr',
    members: [
      { id: 'm-m1', firstName: 'Nicolas', lastName: 'Martin', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
      { id: 'm-m2', firstName: 'Claire', lastName: 'Martin', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: true }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: true } },
    ],
  },
  {
    id: 'fam-moreau',
    familyName: 'Moreau',
    email: 'thomas.moreau@exemple.fr',
    members: [
      { id: 'm-mo1', firstName: 'Thomas', lastName: 'Moreau', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: false } },
      { id: 'm-mo2', firstName: 'Charlotte', lastName: 'Moreau', isChild: false, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: false } },
      { id: 'm-mo3', firstName: 'Emma', lastName: 'Moreau', isChild: true, age: 7, isAttending: true, events: { vinHonneur: true, repasNoces: true, brunchLendemain: false }, invitedTo: { vinHonneur: true, repasNoces: true, brunchLendemain: false } },
    ],
  },
];
