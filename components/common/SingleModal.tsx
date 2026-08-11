import { useModalManager } from "@/components/common/ModalManager";
import React, { useCallback, useEffect, useRef } from "react";
import { ModalProps, Modal as RNModal } from "react-native";

let modalIdCounter = 0;

const SingleModal: React.FC<ModalProps> = ({
  visible = false,
  onRequestClose,
  presentationStyle,
  statusBarTranslucent,
  transparent,
  ...rest
}) => {
  const manager = useModalManager();
  const requestOpen = manager?.requestOpen;
  const requestClose = manager?.requestClose;
  const activeId = manager?.activeId;
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

  // Only the topmost modal in the stack may actually present a native Modal.
  // Two simultaneously-visible native Modals can get stuck mid-dismiss on iOS
  // when both close in the same tick (e.g. a success alert on top of a form modal).
  const isTopMost = !manager || activeId === null || activeId === idRef.current;

  return (
    <RNModal
      {...rest}
      visible={visible && isTopMost}
      transparent={transparent}
      presentationStyle={
        presentationStyle ?? (transparent ? "overFullScreen" : undefined)
      }
      statusBarTranslucent={statusBarTranslucent ?? transparent}
      onRequestClose={handleRequestClose}
    />
  );
};

export default SingleModal;
