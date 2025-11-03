"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function LoginForm({ onSwitchToRegister }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function clearMessageAfter(delay = 3000) {
    setTimeout(() => setMsg(null), delay);
  }

  function handleDemoFill(userType) {
    const demos = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      user: { email: 'user1@example.com', password: 'password1' },
      eventManage: { email: 'user2@example.com', password: 'password2' }
    };
    
    const demo = demos[userType];
    setEmail(demo.email);
    setPassword(demo.password);
    setMsg({ type: "info", text: `Credenciales precargadas: ${demo.email}` });
    clearMessageAfter(2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setMsg({ type: "error", text: "Rellena email y contraseña." });
      clearMessageAfter();
      return;
    }

    setLoading(true);

    try {
      // Llamada a la API de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: trimmedEmail, 
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg({ type: "error", text: data.error || "Error al iniciar sesión" });
        setLoading(false);
        clearMessageAfter();
        return;
      }

      // ✅ Verificar que la API devuelva el token
      if (!data.token) {
        setMsg({ type: "error", text: "Error: No se recibió token de autenticación" });
        setLoading(false);
        clearMessageAfter();
        return;
      }

      // Crear sesión con los datos del usuario
      const session = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      };

      // ✅ IMPORTANTE: Pasar tanto el usuario como el token al AuthProvider
      auth.login(session, data.token);

      setMsg({ type: "success", text: `Bienvenido ${data.user.name}. Redirigiendo...` });
      setLoading(false);

      // Redirige según el rol
      setTimeout(() => {
        if (data.user.role === 'admin') {
          router.push('/home');
        } else if (data.user.role === 'eventManage') {
          router.push('/eventAdmin');
        } else {
          router.push('/myTickets');
        }
      }, 600);

    } catch (error) {
      console.error('Error en login:', error);
      setMsg({ type: "error", text: "Error de conexión. Intenta de nuevo." });
      setLoading(false);
      clearMessageAfter();
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
        Iniciar sesión
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-4">
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
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="text-indigo-600 hover:underline"
              title="Admin"
            >
              Admin
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => handleDemoFill('user')}
              className="text-indigo-600 hover:underline"
              title="Usuario normal"
            >
              User
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => handleDemoFill('eventManage')}
              className="text-indigo-600 hover:underline"
              title="Gestor de eventos"
            >
              Manager
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 border-t pt-3">
          <p className="font-semibold mb-1">Credenciales demo:</p>
          <p>• Admin: admin@example.com / admin123</p>
          <p>• Usuario: user1@example.com / password1</p>
          <p>• Manager: user2@example.com / password2</p>
        </div>

        {msg && (
          <div
            className={`mt-2 p-3 rounded text-sm ${
              msg.type === "success" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : msg.type === "error" 
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400 pt-3 border-t">
  ¿No tienes cuenta?{" "}
  <button
    type="button"
    onClick={onSwitchToRegister}
    className="text-indigo-600 hover:underline font-medium"
  >
    Regístrate aquí
  </button>
</div>
      </form>
    </div>
  );
}