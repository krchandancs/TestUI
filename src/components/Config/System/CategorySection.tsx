import React from "react";
import '../../../pathscribe.css';
import { ActionDefinition } from "../../actions/actionRegistry";
import { ShortcutRow } from "./ShortcutRow";

interface CategorySectionProps {
  name: string;
  actions: ActionDefinition[];
  onChange: (actionId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  name,
  actions,
  onChange
}) => {
  return (
    <div className="category-section">
      <div className="category-title">{name}</div>

      {actions.map(action => (
        <ShortcutRow
          key={action.id}
          action={action}
          onChange={onChange}
        />
      ))}
    </div>
  );
};