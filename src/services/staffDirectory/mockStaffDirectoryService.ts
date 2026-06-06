import {
  physicianService,
  userService,
  subspecialtyService,
} from '../index';

import type { Physician }    from '../physicians/IPhysicianService';
import type { StaffUser }    from '../users/IUserService';
import type { Subspecialty } from '../subspecialties/ISubspecialtyService';

import type { StaffMember, IStaffDirectoryService } from './IStaffDirectoryService';

export const mockStaffDirectoryService: IStaffDirectoryService = {

  async listIndividuals() {
    const physiciansResult = await physicianService.getAll();
    const usersResult      = await userService.getAll();
    const subsResult       = await subspecialtyService.getAll();

    if (!physiciansResult.ok || !usersResult.ok || !subsResult.ok) return [];

    const physicians = physiciansResult.data as Physician[];
    const users      = usersResult.data      as StaffUser[];
    const subs       = subsResult.data       as Subspecialty[];

    return physicians.map((p: Physician) => {
      const user = users.find((u: StaffUser)   => u.id === p.id);
      const sub  = subs.find((s: Subspecialty) => s.userIds.includes(p.id));
      return {
        id:           p.id,
        name:         `${p.firstName} ${p.lastName}`.trim() || 'Unknown',
        role:         user?.roles?.[0] ?? 'Pathologist',
        subspecialty: sub?.name ?? 'General',
        status:       (user?.status === 'Active' ? 'Active' : 'Available') as StaffMember['status'],
      };
    });
  },

};
