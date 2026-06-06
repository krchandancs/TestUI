import React from "react";

type AppRootProps = React.PropsWithChildren;

export const AppRoot = ({ children }: AppRootProps) => {
  return <>{children}</>;
};
