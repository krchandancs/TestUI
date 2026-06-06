import React from 'react';
import '../../../pathscribe.css';
import MacroPanel from './MacroPanel';

const MacrosTab: React.FC = () => {
  const approvedFonts = ['Arial', 'Times New Roman', 'Courier New', 'Roboto'];
  return <MacroPanel approvedFonts={approvedFonts} />;
};

export default MacrosTab;
