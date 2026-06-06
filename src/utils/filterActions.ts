export const filterActions = (search: string, actions: any[]) => {
  if (!search || search.trim() === "") {
    return actions;
  }

  const term = search.toLowerCase();

  return actions.filter(action => {
    return (
      action.label.toLowerCase().includes(term) ||
      action.category.toLowerCase().includes(term) ||
      action.id.toLowerCase().includes(term)
    );
  });
};
