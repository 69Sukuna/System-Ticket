"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LoginForm from "../../components/LoginForm";
import RegisterForm from "../../components/RegisterForm";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
  // Si mode=register, mostrar registro por defecto
  const [showLogin, setShowLogin] = useState(mode !== 'register');

  // Actualizar cuando cambie el parámetro de URL
  useEffect(() => {
    setShowLogin(mode !== 'register');
  }, [mode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      {showLogin ? (
        <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setShowLogin(true)} />
      )}
    </div>
  );
}