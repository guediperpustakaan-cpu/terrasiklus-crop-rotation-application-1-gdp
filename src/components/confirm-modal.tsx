"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={pending}>
            Batal
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={pending}>
            <AlertTriangle className="size-4" aria-hidden />
            {pending ? "Memproses…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-bark-700">{description}</p>
    </Modal>
  );
}
