import { useModalManager } from "@/components/common/ModalManager";
import React, { useCallback, useEffect, useRef } from "react";
import { ModalProps, Modal as RNModal } from "react-native";

let modalIdCounter = 0;

const SingleModal: React.FC<ModalProps> = ({
  visible = false,
  onRequestClose,
  ...rest
}) => {
  const manager = useModalManager();
  const requestOpen = manager?.requestOpen;
  const requestClose = manager?.requestClose;

  const idRef = useRef<string>("");
  const wasVisibleRef = useRef<boolean>(false);

  if (!idRef.current) {
    modalIdCounter += 1;
    idRef.current = `modal-${modalIdCounter}`;
  }

  const handleRequestClose = useCallback(
    (event?: any) => {
      onRequestClose?.(event as any);
    },
    [onRequestClose]
  );

  // Track ONLY visibility transitions
  useEffect(() => {
    if (!requestOpen || !requestClose) return;

    if (visible && !wasVisibleRef.current) {
      requestOpen(idRef.current);
    }

    if (!visible && wasVisibleRef.current) {
      requestClose(idRef.current);
    }

    wasVisibleRef.current = visible;
  }, [visible, requestOpen, requestClose]);

  // Cleanup ONLY on unmount
  useEffect(() => {
    return () => {
      if (wasVisibleRef.current) {
        requestClose?.(idRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RNModal
      {...rest}
      visible={visible}
      onRequestClose={handleRequestClose}
    />
  );
};

export default SingleModal;
