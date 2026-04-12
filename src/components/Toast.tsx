"use client";

export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-green-500/30">
        {message}
      </div>
    </div>
  );
}
