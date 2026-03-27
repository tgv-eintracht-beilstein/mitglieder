"use client";

import { useEffect, useState } from "react";
import { getUsername, login, logout } from "@/lib/auth";

export default function AuthButton() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getUsername());
  }, []);

  if (username) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-100 hidden sm:inline">{username}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          Abmelden
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-[#b11217] hover:bg-red-50 transition-colors"
    >
      Anmelden
    </button>
  );
}
