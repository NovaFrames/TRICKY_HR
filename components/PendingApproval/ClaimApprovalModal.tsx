import ClaimModal from "@/components/RequestPage/ClaimModal";
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

const getFlag = (desc: string) => {
  const d = (desc || "").toLowerCase().trim();
  if (d.includes("claim") && !d.includes("expense")) return "Claim";
  if (d.includes("expense")) return "EmpClaimExpense";
  if (d.includes("tax")) return "EmpTaxDeclaration";
  if (d.includes("document")) return "Employee Document";
  if (d.includes("profile")) return "Profile";
  if (d.includes("loan")) return "Loan Request";
  if (d.includes("time")) return "Time";
  if (d.includes("cancel")) return "CancelLeave";
  if (d.includes("surrender") || d.includes("leave")) return "Leave";
  return "Leave";
};

export default function ClaimApprovalModal({
  visible,
  onClose,
  onSuccess,
  data,
}: PendingApprovalModalProps) {
  if (!data) return null;

  const handleApprovalAction = async (
    status: "Approved" | "Rejected",
    remarks: string,
    approveAmount: number,
  ) => {
    const flag = getFlag(data.DescC);
    return ApiService.updatePendingApproval({
      IdN: data.IdN,
      StatusC: status,
      Remarks: remarks,
      EmpIdN: data.EmpIdN,
      Flag: flag,
      ApproveAmtN: approveAmount,
      title:
        flag === "Employee Document"
          ? data.CatgNameC || data.DescC
          : flag === "Claim"
            ? "ClaimDoc"
            : "",
      DocName:
        flag === "Employee Document"
          ? data.NameC || ""
          : flag === "Claim"
            ? "tyht"
            : "",
      ReceiveYearN: 0,
      ReceiveMonthN: 0,
      PayTypeN: 0,
      ClaimExpenseDtl1: [],
    });
  };

  return (
    <ClaimModal
      visible={visible}
      onClose={onClose}
      onSuccess={onSuccess}
      item={data}
      mode="approval"
      onApprove={({ remarks, approveAmount }) =>
        handleApprovalAction("Approved", remarks, approveAmount)
      }
      onReject={({ remarks, approveAmount }) =>
        handleApprovalAction("Rejected", remarks, approveAmount)
      }
    />
  );
}
