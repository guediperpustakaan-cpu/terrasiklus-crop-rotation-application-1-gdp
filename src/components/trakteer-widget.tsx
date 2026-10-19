"use client";

import { useState } from "react";
import { Coffee, ExternalLink, QrCode, Download, X } from "lucide-react";
import { Modal } from "@/components/ui";
import { classNames } from "@/lib/utils";

const NOMINALS = [6000, 12000, 18000, 24000, 30000, 50000, 100000];

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);
  const [selectedNominal, setSelectedNominal] = useState(6000);

  const nominalList = NOMINALS.map((n) => `Rp${n.toLocaleString("id-ID")}`);

  return (
    <>
      {/* Floating trigger button (bottom-right corner) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full border border-bark-200 bg-white shadow-lift text-sm font-bold text-bark-900 transition hover:bg-leaf-50 hover:ring-2 hover:ring-leaf-500"
        aria-label="Kopi kecil, server tetap jalan"
      >
        <Coffee className="size-4 shrink-0" aria-hidden />
        <span>Kopi kecil</span>
      </button>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Kopi kecil, server tetap jalan"
        description="Web app ini gratis & bebas iklan. Dukung agar situs tetap online tanpa iklan."
        size="md"
        footer={
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.open("https://trakteer.id/perpus_opera/", "_blank")}
          >
            <ExternalLink className="size-4 mr-2" aria-hidden />
            Buka di Trakteer
          </button>
        }
      >
        <div className="space-y-4">
          {/* Nominal selection */}
          <div>
            <p className="text-xs font-bold tracking-wide text-bark-500 uppercase mb-2">Pilih nominal traktiran</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {NOMINALS.map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => setSelectedNominal(nominal)}
                  className={classNames(
                    "px-3 py-2 rounded-xl text-sm font-semibold transition border",
                    selectedNominal === nominal
                      ? "bg-leaf-600 border-leaf-600 text-white"
                      : "bg-white border-bark-200 text-bark-700 hover:bg-leaf-50 hover:border-leaf-300",
                  )}
                >
                  Rp{nominal.toLocaleString("id-ID")}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="border border-bark-100 rounded-xl p-3 bg-bark-50/50">
            <p className="text-xs font-bold tracking-wide text-bark-500 uppercase mb-2">Scan QR Code</p>
            <div className="flex flex-col items-center justify-center gap-2 p-2">
              <div className="grid place-items-center p-3 rounded-lg bg-white shadow-sm">
                <QrCode className="size-32" color="#1B5E20" size={128} />
              </div>
              <p className="text-xs text-bark-600">Atau kunjungi trakteer.id/perpus_opera/</p>
            </div>
          </div>

          {/* Download source code */}
          <div className="border border-leaf-200 rounded-xl bg-leaf-50/60 p-3">
            <div className="flex items-center gap-3 mb-2">
              <Download className="size-4 text-leaf-600" aria-hidden />
              <p className="text-xs font-bold text-leaf-800">Unduh Source Code</p>
            </div>
            <p className="text-xs text-leaf-700 leading-relaxed">
              Kode lengkap web app TerraSiklus tersedia gratis di GitHub.
              <br className="hidden sm:block" />
              <strong>Open Source oleh MZF - 2026</strong>
            </p>
            <button
              type="button"
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-leaf-300 bg-white text-sm font-semibold text-leaf-700 hover:bg-leaf-100 transition"
              onClick={() => window.open("https://github.com/MZF/terrasiklus-crop-rotation-application-1-gdp", "_blank")}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Buka GitHub
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
