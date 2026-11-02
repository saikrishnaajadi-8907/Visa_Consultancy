export interface NavSubItem {
  name: string;
  href: string;
}

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  subItems?: NavSubItem[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    iconName: 'LayoutDashboard',
  },
  {
    name: 'Customers',
    href: '/customers',
    iconName: 'Users',
  },
  {
    name: 'Banks & Branches',
    href: '/banks',
    iconName: 'Landmark',
    subItems: [
      { name: 'Bank Master', href: '/banks' },
      { name: 'Branch Master', href: '/branches' },
    ],
  },
  {
    name: 'Financial Records',
    href: '/financial-records',
    iconName: 'Receipt',
  },
  {
    name: 'Documents & Handovers',
    href: '/documents',
    iconName: 'Folder',
    subItems: [
      { name: 'Document Repository', href: '/documents' },
      { name: 'Chain of Custody', href: '/document-handovers' },
    ],
  },
  {
    name: 'Tasks & Follow-ups',
    href: '/tasks',
    iconName: 'CheckSquare',
    subItems: [
      { name: 'Casework Tasks', href: '/tasks' },
      { name: 'Scheduled Follow-ups', href: '/follow-ups' },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    iconName: 'BarChart2',
  },
  {
    name: 'Employee Management',
    href: '/employees',
    iconName: 'UserCheck',
  },
];

