import React, { useState } from "react";
import { ParsedTradeline } from "@/utils/tradelineParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManualTradelineModalProps {
  onClose: () => void;
  onAdd: (tradeline: ParsedTradeline) => void;
}

export const ManualTradelineModal: React.FC<ManualTradelineModalProps> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState<ParsedTradeline>({
    creditorName: "",
    accountNumber: "",
    status: "",
    isNegative: true,
    negativeReason: "",
    balance: 0,
    dateOpened: ""
  });

  const updateField = (field: keyof ParsedTradeline, value: string | number | boolean) => {
    setForm({ ...form, [field]: value });
  };

  const handleAdd = () => {
    if (!form.creditorName || !form.accountNumber) {
      alert("Creditor name and account number are required.");
      return;
    }
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Add Tradeline Manually</h3>
        <div className="space-y-2">
          <Input placeholder="Creditor Name" value={form.creditorName} onChange={e => updateField("creditorName", e.target.value)} />
          <Input placeholder="Account Number" value={form.accountNumber} onChange={e => updateField("accountNumber", e.target.value)} />
          <Input placeholder="Status" value={form.status} onChange={e => updateField("status", e.target.value)} />
          <Input placeholder="Reason for Dispute" value={form.negativeReason} onChange={e => updateField("negativeReason", e.target.value)} />
          <Input placeholder="Balance" type="number" value={form.balance} onChange={e => updateField("balance", Number(e.target.value))} />
          <Input placeholder="Date Opened" value={form.dateOpened} onChange={e => updateField("dateOpened", e.target.value)} />
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleAdd}>Add</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};
