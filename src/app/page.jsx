"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Check,
  X,
  RotateCcw,
  Download,
  Image as ImageIcon,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "motion/react";

const SWIPE_THRESHOLD = 80;

export default function PhotoCleaner() {
  const [photos, setPhotos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [kept, setKept] = useState([]);
  const [deleted, setDeleted] = useState([]);
  const [phase, setPhase] = useState("upload");
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;
    const newPhotos = imageFiles.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPhotos((prev) => {
      const next = [...prev, ...newPhotos];
      // auto-select all newly added photos
      setSelectedIds(new Set(next.map((p) => p.id)));
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((allPhotos) => {
    setSelectedIds((prev) =>
      prev.size === allPhotos.length
        ? new Set()
        : new Set(allPhotos.map((p) => p.id)),
    );
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const startReview = () => {
    const reviewPhotos = photos.filter((p) => selectedIds.has(p.id));
    if (reviewPhotos.length === 0) return;
    setCurrentIndex(0);
    setKept([]);
    setDeleted([]);
    setHistory([]);
    setPhotos(reviewPhotos);
    setPhase("review");
  };

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setSelectedIds(new Set());
    setKept([]);
    setDeleted([]);
    setHistory([]);
    setCurrentIndex(0);
    setPhase("upload");
  };

  const handleDecision = useCallback(
    (decision) => {
      const photo = photos[currentIndex];
      if (!photo) return;
      setHistory((prev) => [
        ...prev,
        { index: currentIndex, kept: [...kept], deleted: [...deleted] },
      ]);
      if (decision === "keep") {
        setKept((prev) => [...prev, photo]);
      } else {
        setDeleted((prev) => [...prev, photo]);
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex >= photos.length) {
        setPhase("result");
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, photos, kept, deleted],
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setCurrentIndex(prev.index);
    setKept(prev.kept);
    setDeleted(prev.deleted);
    setHistory((h) => h.slice(0, -1));
  }, [history]);

  const downloadKept = () => {
    kept.forEach((photo) => {
      const a = document.createElement("a");
      a.href = photo.url;
      a.download = photo.name;
      a.click();
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] font-inter flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <ImageIcon size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#111827] leading-none">
                フォトクリーナー
              </h1>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                スワイプで写真を整理
              </p>
            </div>
          </div>
          {phase !== "upload" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-[#6B7280] active:text-[#111827] transition-colors px-3 py-2 rounded-full border border-[#E5E7EB] bg-white"
            >
              <RotateCcw size={12} />
              最初から
            </button>
          )}
        </div>
      </header>

      {/* ===== UPLOAD PHASE ===== */}
      {phase === "upload" && (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-[#111827] tracking-tight">
              写真を読み込む
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              すべてブラウザ内で処理。外部送信なし。
            </p>
          </div>

          {/* Drop Zone / Tap Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl py-14 text-center cursor-pointer transition-colors duration-150
              ${
                dragging
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#E5E7EB] bg-white active:bg-[#F9FAFB]"
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-150 ${dragging ? "bg-[#DBEAFE]" : "bg-[#F3F4F6]"}`}
              >
                <FolderOpen
                  size={28}
                  className={dragging ? "text-[#2563EB]" : "text-[#6B7280]"}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  {dragging ? "ここにドロップ" : "タップして写真を選ぶ"}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  複数選択OK・ドラッグ＆ドロップも可
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Loaded Photo List */}
          {photos.length > 0 && (
            <div className="mt-4 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#111827]">
                  {selectedIds.size} / {photos.length}枚を選択中
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSelectAll(photos)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      selectedIds.size === photos.length
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-white text-[#2563EB] border-[#2563EB]"
                    }`}
                  >
                    {selectedIds.size === photos.length ? "全解除" : "全て選択"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      photos.forEach((p) => URL.revokeObjectURL(p.url));
                      setPhotos([]);
                      setSelectedIds(new Set());
                    }}
                    className="text-xs text-[#9CA3AF] active:text-red-500 transition-colors py-1"
                  >
                    クリア
                  </button>
                </div>
              </div>
              {/* Selectable grid */}
              <div className="grid grid-cols-4 gap-1 p-2">
                {photos.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-opacity duration-100 ${isSelected ? "opacity-100" : "opacity-30"}`}
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shadow">
                          <Check
                            size={11}
                            className="text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* How it works */}
          {photos.length === 0 && (
            <div className="mt-4 bg-white border border-[#E5E7EB] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#111827] mb-3">
                使い方
              </p>
              <div className="space-y-3">
                {[
                  { icon: "1", text: "写真を選ぶ（何枚でもOK）" },
                  { icon: "2", text: "右スワイプで「残す」" },
                  { icon: "3", text: "左スワイプで「削除候補」" },
                  { icon: "4", text: "残した写真だけダウンロード" },
                ].map((step) => (
                  <div key={step.icon} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </span>
                    <span className="text-sm text-[#6B7280]">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Start Button — sticky at bottom */}
          {photos.length > 0 && (
            <button
              onClick={startReview}
              disabled={selectedIds.size === 0}
              className="mt-4 w-full bg-[#2563EB] text-white text-base font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-blue-700 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedIds.size}枚の仕分けをはじめる <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* ===== REVIEW PHASE ===== */}
      {phase === "review" && (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          {/* Progress bar */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#9CA3AF]">
                {currentIndex + 1} / {photos.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {kept.length}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  {deleted.length}
                </span>
              </div>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-1">
              <div
                className="bg-[#2563EB] h-1 rounded-full transition-all duration-300"
                style={{ width: `${(currentIndex / photos.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card area — fills available space */}
          <div className="flex-1 relative px-4 py-3" style={{ minHeight: 0 }}>
            {/* Background stack cards */}
            {photos[currentIndex + 1] && (
              <div className="absolute inset-4 bg-white border border-[#E5E7EB] rounded-3xl scale-95 translate-y-3 opacity-50" />
            )}
            {photos[currentIndex + 2] && (
              <div className="absolute inset-4 bg-white border border-[#E5E7EB] rounded-3xl scale-90 translate-y-6 opacity-25" />
            )}

            <AnimatePresence mode="wait">
              {photos[currentIndex] && (
                <SwipeCard
                  key={photos[currentIndex].id}
                  photo={photos[currentIndex]}
                  onDecision={handleDecision}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action area */}
          <div className="flex-shrink-0 px-6 pb-8 pt-2">
            {/* Hint */}
            <p className="text-center text-[11px] text-[#C4C4C4] mb-4">
              ← 削除候補　残す →
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-center gap-5">
              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="w-12 h-12 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#9CA3AF] disabled:opacity-30 transition-all active:scale-95"
              >
                <RotateCcw size={16} />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDecision("delete")}
                className="w-20 h-20 rounded-full bg-white shadow-md border border-red-100 flex items-center justify-center text-red-400 active:scale-95 transition-all active:bg-red-50"
              >
                <X size={32} />
              </button>

              {/* Keep */}
              <button
                onClick={() => handleDecision("keep")}
                className="w-20 h-20 rounded-full bg-white shadow-md border border-green-100 flex items-center justify-center text-green-500 active:scale-95 transition-all active:bg-green-50"
              >
                <Check size={32} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESULT PHASE ===== */}
      {phase === "result" && (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          {/* Header */}
          <div className="text-center px-4 pt-6 pb-4 flex-shrink-0">
            <p className="text-3xl font-semibold text-[#111827]">🎉</p>
            <h2 className="text-xl font-semibold text-[#111827] mt-2">
              仕分け完了！
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {photos.length}枚を整理しました
            </p>

            {/* Summary pills */}
            <div className="flex justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="text-sm font-semibold text-green-700">
                  残す {kept.length}枚
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="text-sm font-semibold text-red-600">
                  削除 {deleted.length}枚
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-4"
            style={{ minHeight: 0 }}
          >
            <ResultTabs kept={kept} deleted={deleted} />
          </div>

          {/* Sticky bottom buttons */}
          <div className="flex-shrink-0 px-4 pb-8 pt-3 border-t border-[#E5E7EB] bg-white flex flex-col gap-2">
            {kept.length > 0 && (
              <button
                onClick={downloadKept}
                className="w-full bg-[#2563EB] text-white text-sm font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                残す写真をダウンロード（{kept.length}枚）
              </button>
            )}
            <button
              onClick={reset}
              className="w-full bg-[#F3F4F6] text-[#6B7280] text-sm font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 active:bg-[#E5E7EB] transition-colors"
            >
              <RotateCcw size={14} />
              もう一度はじめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Swipe Card ----
function SwipeCard({ photo, onDecision }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-15, 0, 15]);
  const keepOpacity = useTransform(x, [30, 90], [0, 1]);
  const deleteOpacity = useTransform(x, [-90, -30], [1, 0]);
  const keepBg = useTransform(
    x,
    [0, 90],
    ["rgba(34,197,94,0)", "rgba(34,197,94,0.15)"],
  );
  const deleteBg = useTransform(
    x,
    [-90, 0],
    ["rgba(248,113,113,0.15)", "rgba(248,113,113,0)"],
  );

  const handleDragEnd = (_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onDecision("keep");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onDecision("delete");
    }
  };

  return (
    <motion.div
      style={{ x, rotate, backgroundColor: keepBg }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="absolute inset-0 rounded-3xl overflow-hidden shadow-sm border border-[#E5E7EB] cursor-grab active:cursor-grabbing select-none bg-white"
      whileDrag={{ scale: 1.01 }}
    >
      {/* Keep label */}
      <motion.div
        style={{ opacity: keepOpacity }}
        className="absolute top-5 left-5 z-10 bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md"
      >
        <Check size={14} /> 残す
      </motion.div>

      {/* Delete label */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute top-5 right-5 z-10 bg-red-400 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md"
      >
        <X size={14} /> 削除
      </motion.div>

      {/* Image */}
      <img
        src={photo.url}
        alt={photo.name}
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* File name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-5 py-4">
        <p className="text-white text-xs truncate opacity-80">{photo.name}</p>
      </div>
    </motion.div>
  );
}

// ---- Result Tabs ----
function ResultTabs({ kept, deleted }) {
  const [activeTab, setActiveTab] = useState("kept");
  const current = activeTab === "kept" ? kept : deleted;

  return (
    <div>
      {/* Tabs */}
      <div className="flex bg-[#F3F4F6] rounded-xl p-1 mb-4">
        {[
          { key: "kept", label: `残す (${kept.length})` },
          { key: "deleted", label: `削除候補 (${deleted.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
              ${
                activeTab === tab.key
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#9CA3AF]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {current.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#9CA3AF]">
          写真がありません
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {current.map((p) => (
            <div
              key={p.id}
              className="aspect-square bg-[#F3F4F6] rounded-xl overflow-hidden"
            >
              <img
                src={p.url}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
