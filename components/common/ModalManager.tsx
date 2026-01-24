import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalManagerValue = {
  activeId: string | null;
  requestOpen: (id: string) => void;
  requestClose: (id: string) => void;
};

const ModalManagerContext = createContext<ModalManagerValue | null>(null);

export const ModalManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stack, setStack] = useState<string[]>([]);

  const requestOpen = useCallback((id: string) => {
    setStack((prev) => {
      const next = prev.filter((item) => item !== id);
      next.push(id);
      return next;
    });
  }, []);

  const requestClose = useCallback((id: string) => {
    setStack((prev) => prev.filter((item) => item !== id));
  }, []);

  const value = useMemo<ModalManagerValue>(
    () => ({
      activeId: stack.length > 0 ? stack[stack.length - 1] : null,
      requestOpen,
      requestClose,
    }),
    [requestClose, requestOpen, stack],
  );

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
    </ModalManagerContext.Provider>
  );
};

export const useModalManager = () => useContext(ModalManagerContext);
