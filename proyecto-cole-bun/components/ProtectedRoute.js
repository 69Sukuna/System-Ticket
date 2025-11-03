"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function ProtectedRoute({ allowedRoles = null, children }) {
  const router = useRouter();
  const auth = useAuth();

  // fallback: usar localStorage como fuente si auth aún no se ha inicializado
  const storedRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const storedUser = storedRaw ? JSON.parse(storedRaw) : null;
  const currentUser = auth?.user ?? storedUser;

  React.useEffect(() => {
    // si no hay usuario, redirigir a login
    if (!currentUser) {
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (!currentUser) {
    // while redirecting / not logged, render nothing
    return null;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(currentUser.role)) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso denegado</h2>
          <p className="mb-4">No tienes permisos para ver esta página.</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => router.push("/")} className="px-4 py-2 bg-indigo-600 text-white rounded">
              Volver al inicio
            </button>
            <button onClick={() => { auth.logout(); router.push("/login"); }} className="px-4 py-2 bg-red-500 text-white rounded">
              Cerrar sesión
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}