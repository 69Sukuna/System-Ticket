"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { useTheme } from "../components/ThemeWrapper";
import { useAuth } from "../components/AuthProvider";

export default function Header() {
  const router = useRouter();
  const themeContext = useTheme() || { theme: "light", toggleTheme: () => {} };
  const auth = useAuth();

  const { theme, toggleTheme } = themeContext;
  const [isDark, setIsDark] = useState(theme === "dark");

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);

  const role = auth?.user?.role;

  return (
    <header className="bg-background-light dark:bg-background-dark/50 backdrop-blur-sm sticky top-0 z-10 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="text-primary size-7">
              {/* ...svg... */}
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              TICKEDU
            </h1>
          </div>

          {/* Navegación: mostrar según role */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            {/* Home visible para todos los usuarios autenticados */}
            {(
              <a
                className="hover:text-primary dark:hover:text-primary"
                href="/home"
              >
                Home
              </a>
            )}

            {/* Mis Tickets: para todos los roles autenticados */}
            {role && (
              <a
                className="hover:text-primary dark:hover:text-primary"
                href="/myTickets"
              >
                Mis Tickets
              </a>
            )}

            {/* Lista de Usuarios: solo admin */}
            {role === "admin" && (
              <a
                className="hover:text-primary dark:hover:text-primary"
                href="/user_list"
              >
                Lista de Usuarios
              </a>
            )}
          {/* Lista de Usuarios: admin y eventManage */}
          {(role === "admin" || role === "eventManage") && (
            <a
              className="hover:text-primary dark:hover:text-primary"
              href="/eventAdmin"
            >
              Lista de Eventos
            </a>
          )}
                    {(role === "admin" || role === "eventManage") && (
            <a
              className="hover:text-primary dark:hover:text-primary"
              href="/reports"
            >
              Ventas
            </a>
          )}



            {/* Mis Eventos: solo userAdmin */}
            {role === "userAdmin" && (
              <a
                className="hover:text-primary dark:hover:text-primary"
                href="/eventAdmin"
              >
                Mis Eventos
              </a>
            )}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {auth && auth.user ? (
              <>
                <div className="text-sm text-slate-700 dark:text-slate-200 mr-2">
                  Hola,{" "}
                  <span className="font-semibold">{auth.user.name}</span>
                </div>
                <button
                  onClick={() => {
                    auth.logout();
                    // opcional: redirigir al login
                    setTimeout(() => (location.href = "/login"), 50);
                  }}
                  className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:opacity-90"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
                >
                  Log In
                </a>
                <button 
                  onClick={() => router.push('/login?mode=register')}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:opacity-90"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
