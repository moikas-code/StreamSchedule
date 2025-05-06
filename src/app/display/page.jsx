"use client";
import { Suspense, useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { verify_jwt } from "@/lib/jwt";


function DisplayPageContent() {
  const search_params = useSearchParams();
  const token_param = search_params.get("token");
  const [sections, set_sections] = useState([]);
  const [current_index, set_current_index] = useState(0);
  const [time, set_time] = useState(0);
  const timer_ref = useRef(null);

  useEffect(() => {
    async function decode_token() {
      if (token_param && process.env.NEXT_PUBLIC_JWT_SECRET) {
        const payload = await verify_jwt(token_param, process.env.NEXT_PUBLIC_JWT_SECRET);
        if (payload && Array.isArray(payload.sections)) {
          set_sections(payload.sections);
          set_current_index(0);
          set_time(0);
          return;
        }
      }
      set_sections([]);
      set_current_index(0);
      set_time(0);
    }
    decode_token();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token_param]);

  useEffect(() => {
    if (!sections.length || current_index >= sections.length) return;
    if (timer_ref.current) clearInterval(timer_ref.current);
    timer_ref.current = setInterval(() => {
      set_time((prev_time) => {
        const duration = sections[current_index]?.duration || 0;
        if (prev_time + 1 >= duration * 60) {
          if (current_index < sections.length - 1) {
            set_current_index((idx) => idx + 1);
            return 0;
          } else {
            clearInterval(timer_ref.current);
            return duration * 60;
          }
        }
        return prev_time + 1;
      });
    }, 1000);
    return () => clearInterval(timer_ref.current);
  }, [sections, current_index]);

  const format_time = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const current = useMemo(() => sections[current_index], [sections, current_index]);
  const upcoming = useMemo(() => sections.slice(current_index + 1), [sections, current_index]);
  const progress = useMemo(() =>
    current ? (time / (current.duration * 60)) * 100 : 0,
    [current, time]
  );

  if (!sections.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl font-bold">No sections found. Please use a valid share link.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-gray-800/70 rounded-2xl shadow-2xl p-8 border-4 border-purple-700">
        <h1 className="text-4xl font-extrabold text-purple-400 mb-8 text-center tracking-widest drop-shadow-lg">STREAM TIMER</h1>
        <div className="mb-10">
          <div className="text-2xl font-bold text-white mb-2 text-center">Current Section</div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl font-extrabold text-purple-200 mb-2 drop-shadow-lg">{current.name}</div>
            <div className="text-6xl font-mono font-black text-white mb-4 drop-shadow-lg">{format_time(time)} / {format_time(current.duration * 60)}</div>
            <div className="w-full">
              <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {upcoming.length > 0 && (
          <div>
            <div className="text-xl font-bold text-white mb-2">Upcoming Sections</div>
            <ul className="space-y-2">
              {upcoming.map((section, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2 text-white font-semibold shadow-md"
                >
                  <span className="text-lg">{section.name}</span>
                  <span className="text-purple-300 font-mono">{section.duration} min</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DisplayPageContent />
    </Suspense>
  );
} 