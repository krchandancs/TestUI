import React from 'react';
import '../../../pathscribe.css';
import { Subspecialty } from '../../../contexts/useSubspecialties';

interface Props {
  data: Subspecialty[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SubspecialtyTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <table className="w-full text-left text-sm text-gray-300">
      <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
        <tr>
          <th className="px-6 py-3 font-medium">Subspecialty Name</th>
          <th className="px-6 py-3 font-medium">Type & Scope</th>
          <th className="px-6 py-3 font-medium text-center">Staff</th>
          <th className="px-6 py-3 font-medium text-center">Specimens</th>
          <th className="px-6 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {data.map((sub) => (
          <tr key={sub.id} className="hover:bg-gray-800/30 transition-colors group">
            <td className="px-6 py-4">
              <div className="font-medium text-white">{sub.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{sub.description || 'No description'}</div>
            </td>
            
            <td className="px-6 py-4">
              <div className="flex items-center space-x-2">
                {sub.isWorkgroup ? (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Workgroup
                  </span>
                ) : (
                  <span className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Standard
                  </span>
                )}
                
                {sub.clientIds && sub.clientIds.length > 0 ? (
                  <span className="text-[#00A3C4] text-xs flex items-center">
                    <span className="mr-1">🏥</span> {sub.clientIds.length} {sub.clientIds.length === 1 ? 'Client' : 'Clients'}
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs italic">Global Pool</span>
                )}
              </div>
            </td>

            <td className="px-6 py-4 text-center">
              <span className="text-gray-300 text-xs font-mono">
                {sub.userIds?.length || 0}
              </span>
            </td>

            <td className="px-6 py-4 text-center">
              <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2 py-1 rounded text-xs">
                {sub.specimenIds?.length || 0}
              </span>
            </td>

            <td className="px-6 py-4 text-right">
              <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(sub.id)} 
                  className="text-[#00A3C4] hover:text-[#008ba8] font-medium"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(sub.id)} 
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
        
        {data.length === 0 && (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center">
              <div className="text-gray-500 italic mb-2">No subspecialties defined yet.</div>
              <div className="text-xs text-gray-600 italic max-w-xs mx-auto">
                Define your clinical divisions and link them to clients to enable smart case routing.
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};