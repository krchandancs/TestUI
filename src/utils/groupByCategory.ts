export const groupByCategory = (actions: any[]) => {
  const groups: Record<string, any[]> = {};

  actions.forEach(action => {
    const category = action.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(action);
  });

  return groups;
};
