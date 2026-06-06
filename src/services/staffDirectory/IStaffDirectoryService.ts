export interface StaffMember {
  id:           string;
  name:         string;
  role:         string;
  subspecialty: string;
  status:       'Available' | 'Busy' | 'Active';
}

export interface IStaffDirectoryService {
  listIndividuals(): Promise<StaffMember[]>;
}
