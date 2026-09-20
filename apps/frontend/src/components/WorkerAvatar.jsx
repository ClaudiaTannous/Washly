"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function WorkerAvatar({
  workerName,
  imageUrl,
  editable = false,
  onClick,
}) {
  const [imageError, setImageError] = useState(false);

  const imageSrc =
    imageUrl && imageUrl.startsWith("http")
      ? imageUrl
      : imageUrl
        ? `${API_BASE_URL}${imageUrl}`
        : "";

  const showImage = imageSrc && !imageError;

  return (
    <button
      type="button"
      onClick={editable ? onClick : undefined}
      className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center"
      disabled={!editable}
    >
      {showImage ? (
        <img
          src={imageSrc}
          alt="Worker avatar"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-2xl font-semibold text-slate-500">
          {workerName?.[0]?.toUpperCase() || "W"}
        </span>
      )}

      {editable && (
        <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow">
          <Camera className="w-4 h-4 text-slate-600" />
        </div>
      )}
    </button>
  );
}
