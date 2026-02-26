import TimeModal from "@/components/RequestPage/TimeModal";
import ApiService from "@/services/ApiService";
import React from "react";

interface PendingApprovalData {
  IdN: number;
  EmpIdN: number;
  CodeC: string;
  NameC: string;
  CatgNameC: string;
  YearN: number;
  ApplyDateD: string;
  ApproveRejDateD: string;
  DescC: string;
  StatusC: string;
  LvDescC: string | null;
  FromDateC: string;
  ToDateC: string;
  EmpRemarksC: string;
  Remarks: string;
  LeaveDaysN: string | null;
  Approve1C: string | null;
  Approve2C: string | null;
  FinalApproveC: string | null;
}

interface PendingApprovalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: PendingApprovalData | null;
}

export default function TimeApprovalModal({
  visible,
  onClose,
  onSuccess,
  data,
}: PendingApprovalModalProps) {
  if (!data) return null;

  const handleApprovalAction = async (
    status: "Approved" | "Rejected",
    remarks: string,
  ) => {
    return ApiService.updatePendingApproval({
      IdN: data.IdN,
      StatusC: status,
      Remarks: remarks,
      EmpIdN: data.EmpIdN,
      Flag: "Time",
      ApproveAmtN: 0,
      title: "",
      DocName: "",
      ReceiveYearN: 0,
      ReceiveMonthN: 0,
      PayTypeN: 0,
      ClaimExpenseDtl1: [],
    });
  };

  return (
    <TimeModal
      visible={visible}
      onClose={onClose}
      onSuccess={onSuccess}
      item={data}
      mode="approval"
      onApprove={({ remarks }) => handleApprovalAction("Approved", remarks)}
      onReject={({ remarks }) => handleApprovalAction("Rejected", remarks)}
    />
  );
}
