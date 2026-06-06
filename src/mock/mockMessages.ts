export interface Message {
  id: string;
  from: string;
  role: string;
  caseId: string;
  preview: string;
  content: string;
  timestamp: Date;
  isUrgent: boolean;
  isUnread: boolean;
}

export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'Dr. Michael Smith',
    role: 'DermPath',
    caseId: 'S23-9981',
    preview: 'The frozen section margins look...',
    content: 'The frozen section margins look questionable on the lateral edge. Can you review Case S23-9981? Specifically interested in the deep margin.',
    timestamp: new Date(), // Today
    isUrgent: true,
    isUnread: true,
  },
  {
    id: '2',
    from: 'Dr. Sarah Chen',
    role: 'Oncology',
    caseId: 'S23-1002',
    preview: 'Confirming IHC results for...',
    content: 'Confirming IHC results for the breast biopsy. Does the HER2 look like a 2+ or 3+ to you?',
    timestamp: new Date(Date.now() - 86400000), // Yesterday
    isUrgent: false,
    isUnread: true,
  },
  {
    id: '3',
    from: 'Admin: Lab Core',
    role: 'System',
    caseId: 'General',
    preview: 'Maintenance window scheduled...',
    content: 'The LIS system will be undergoing maintenance this Sunday at 2:00 AM. Please ensure all reports are synced.',
    timestamp: new Date(Date.now() - 172800000), // 2 Days ago
    isUrgent: false,
    isUnread: false,
  },
  {
    id: '4',
    from: 'Dr. Robert Glass',
    role: 'Chief of Staff',
    caseId: 'S23-8842',
    preview: 'Please expedite the final report...',
    content: 'Patient is being transferred. We need the final diagnosis on S23-8842 by end of day.',
    timestamp: new Date('2026-03-05T10:00:00'), // Last Week
    isUrgent: true,
    isUnread: false,
  }
];
