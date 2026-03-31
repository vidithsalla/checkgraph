export type GuestSeed = {
  key: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNormalized?: string;
  emailNormalized?: string;
  vipTier?: string;
  guestValueScore?: number;
  notes?: string;
};

export const guestSeeds: GuestSeed[] = [
  {
    key: "ava-chen",
    displayName: "Ava Chen",
    firstName: "Ava",
    lastName: "Chen",
    phoneNormalized: "+19175550131",
    emailNormalized: "ava.chen@example.com",
    vipTier: "vip",
    guestValueScore: 91,
  },
  {
    key: "daniel-ortiz",
    displayName: "Daniel Ortiz",
    firstName: "Daniel",
    lastName: "Ortiz",
    phoneNormalized: "+16465550188",
    emailNormalized: "daniel.ortiz@example.com",
    notes: "Frequent diner",
  },
  {
    key: "maya-patel",
    displayName: "Maya Patel",
    firstName: "Maya",
    lastName: "Patel",
    phoneNormalized: "+17185550104",
    emailNormalized: "maya.patel@example.com",
  },
  {
    key: "jonathan-reed",
    displayName: "Jonathan Reed",
    firstName: "Jonathan",
    lastName: "Reed",
    phoneNormalized: "+19175550147",
    emailNormalized: "jon.reed@northpeak.co",
  },
  {
    key: "leah-kim",
    displayName: "Leah Kim",
    firstName: "Leah",
    lastName: "Kim",
    phoneNormalized: "+16465550172",
    emailNormalized: "leah.kim@example.com",
  },
  {
    key: "sophia-grant",
    displayName: "Sophia Grant",
    firstName: "Sophia",
    lastName: "Grant",
    phoneNormalized: "+12125550125",
    emailNormalized: "sophia.grant@example.com",
  },
  {
    key: "ethan-brooks",
    displayName: "Ethan Brooks",
    firstName: "Ethan",
    lastName: "Brooks",
    phoneNormalized: "+16465550194",
    emailNormalized: "ethan.brooks@example.com",
  },
  {
    key: "rachel-morgan",
    displayName: "Rachel Morgan",
    firstName: "Rachel",
    lastName: "Morgan",
    phoneNormalized: "+19175550166",
    emailNormalized: "rachel.morgan@brighttable.com",
    notes: "Organizer profile for hosted event scenario",
  },
];
