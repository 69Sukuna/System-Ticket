"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RegisterForm({ onSwitchToLogin }) {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function clearMessageAfter(delay = 3000) {
    setTimeout(() => setMsg(null), delay);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setMsg({ type: "error", text: "Todos los campos son requeridos" });
      clearMessageAfter();
      return;
    }

    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden" });
      clearMessageAfter();
      return;
    }

    if (password.length < 6) {
      setMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      clearMessageAfter();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg({ type: "error", text: data.error || "Error al registrarse" });
        setLoading(false);
        clearMessageAfter();
        return;
      }

      const session = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      };

      auth.login(session, data.token);

      setMsg({ type: "success", text: `¡Bienvenido ${data.user.name}! Redirigiendo...` });
      setLoading(false);

      setTimeout(() => {
        router.push('/myTickets');
      }, 1000);

    } catch (error) {
      console.error('Error en registro:', error);
      setMsg({ type: "error", text: "Error de conexión. Intenta de nuevo." });
      setLoading(false);
      clearMessageAfter();
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
        Crear cuenta
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Juan Pérez"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="usuario@ejemplo.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Repite tu contraseña"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
        >
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>

        {msg && (
          <div
            className={`mt-2 p-3 rounded text-sm ${
              msg.type === "success" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="text-center text-sm text-slate-600 dark:text-slate-400 pt-3 border-t">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-indigo-600 hover:underline font-medium"
          >
            Inicia sesión aquí
          </button>
        </div>
      </form>
    </div>
  );
}