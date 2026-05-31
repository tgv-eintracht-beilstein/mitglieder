"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Container from "@/app/_components/container";
import { getTokens } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [tokens, setTokens] = useState<any>(null);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t = getTokens();
    if (!t) { router.push("/"); return; }
    setTokens(t);
  }, [router]);

  if (!tokens) return null;

  const valid = oldPw.length >= 1 && newPw.length >= 8 && newPw === confirmPw;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    setLoading(true);
    try {
      // Cognito ChangePassword via the hosted API
      const res = await fetch("https://benutzer.tgveintrachtbeilstein.de/oauth2/token", { method: "HEAD" }).catch(() => null);
      
      // Use the Cognito SDK directly via API
      const response = await fetch("https://cognito-idp.eu-central-1.amazonaws.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-amz-json-1.1",
          "X-Amz-Target": "AWSCognitoIdentityProviderService.ChangePassword",
        },
        body: JSON.stringify({
          AccessToken: tokens.access_token,
          PreviousPassword: oldPw,
          ProposedPassword: newPw,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const msg = data.__type?.includes("NotAuthorized") ? "Altes Passwort ist falsch." :
          data.__type?.includes("InvalidPassword") ? "Neues Passwort erfüllt nicht die Anforderungen (min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl)." :
          data.message || "Fehler beim Ändern des Passworts.";
        setError(msg);
      } else {
        setSuccess(true);
        setOldPw(""); setNewPw(""); setConfirmPw("");
      }
    } catch (e) {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Container>
        <div className="max-w-md mx-auto mt-10">
          <Link href="/profil" className="text-sm text-gray-500 hover:text-[#b11217] mb-4 inline-flex items-center gap-1 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Zurück zum Profil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Passwort ändern</h1>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              Passwort erfolgreich geändert.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktuelles Passwort</label>
              <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b11217] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b11217] focus:border-transparent" />
              <p className="text-xs text-gray-500 mt-1">Min. 8 Zeichen, Groß-/Kleinbuchstaben und eine Zahl.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort bestätigen</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b11217] focus:border-transparent" />
              {confirmPw && newPw !== confirmPw && <p className="text-xs text-red-500 mt-1">Passwörter stimmen nicht überein.</p>}
            </div>
            <button
              type="submit"
              disabled={!valid || loading}
              className="w-full px-4 py-2 rounded-lg bg-[#b11217] text-white font-medium hover:bg-[#8f0f13] transition-colors disabled:opacity-40"
            >
              {loading ? "Wird geändert…" : "Passwort ändern"}
            </button>
          </form>
        </div>
      </Container>
    </main>
  );
}
