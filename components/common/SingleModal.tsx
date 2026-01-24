import React, { useCallback, useEffect, useRef } from "react";
import { Modal as RNModal, ModalProps } from "react-native";
import { useModalManager } from "@/components/common/ModalManager";

let modalIdCounter = 0;

const SingleModal: React.FC<ModalProps> = ({
  visible,
  onRequestClose,
  ...rest
}) => {
  const manager = useModalManager();
  const requestOpen = manager?.requestOpen;
  const requestClose = manager?.requestClose;
  const activeId = manager?.activeId ?? null;
  const idRef = useRef<string>("");

  if (!idRef.current) {
    modalIdCounter += 1;
    idRef.current = `modal-${modalIdCounter}`;
  }

  const handleRequestClose = useCallback(() => {
    requestClose?.(idRef.current);
    onRequestClose?.();
  }, [onRequestClose, requestClose]);

  useEffect(() => {
    if (!requestOpen || !requestClose) return;

    if (visible) {
      requestOpen(idRef.current);
    } else {
      requestClose(idRef.current);
    }

    return () => {
      requestClose(idRef.current);
    };
  }, [requestClose, requestOpen, visible]);

  const effectiveVisible =
    activeId && visible ? activeId === idRef.current : !!visible;

  return (
    <RNModal
      {...rest}
      visible={effectiveVisible}
      onRequestClose={handleRequestClose}
    />
  );
};

export default SingleModal;
