"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // ✅ Nuevo estado para el token
  const inactivityTimerRef = useRef(null);

  // Configuración de tiempos (en milisegundos)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad
  const MAX_SESSION_TIME = 24 * 60 * 60 * 1000; // 24 horas máximo de sesión
  const MAX_CLOSE_TIME = 2 * 60 * 60 * 1000; // 2 horas desde que cerró

  // Función para hacer logout
  function logout() {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // ✅ Eliminar token
      localStorage.removeItem("loginTimestamp");
      localStorage.removeItem("lastActivityTime");
    } catch (err) {
      console.warn("AuthProvider: no se pudo eliminar session", err);
    }
    setUser(null);
    setToken(null); // ✅ Limpiar token del estado
    
    // Limpiar timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }

  // Función para login - ahora acepta user y token
  function login(session, authToken) {
    try {
      localStorage.setItem("user", JSON.stringify(session));
      localStorage.setItem("token", authToken); // ✅ Guardar token
      localStorage.setItem("loginTimestamp", Date.now().toString());
      localStorage.setItem("lastActivityTime", Date.now().toString());
    } catch (err) {
      console.warn("AuthProvider: no se pudo guardar session", err);
    }
    setUser(session);
    setToken(authToken); // ✅ Guardar token en estado
  }

  // Verificar si la sesión ha expirado por tiempo máximo
  function checkSessionExpiry() {
    try {
      const loginTimestamp = localStorage.getItem("loginTimestamp");
      if (loginTimestamp) {
        const elapsed = Date.now() - parseInt(loginTimestamp);
        if (elapsed > MAX_SESSION_TIME) {
          console.log("Sesión expirada: tiempo máximo alcanzado");
          logout();
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error("Error verificando expiración:", e);
      return true;
    }
  }

  // Verificar tiempo desde última actividad o cierre
  function checkLastActivity() {
    try {
      const lastActivityTime = localStorage.getItem("lastActivityTime");
      if (lastActivityTime) {
        const elapsed = Date.now() - parseInt(lastActivityTime);
        if (elapsed > MAX_CLOSE_TIME) {
          console.log("Sesión expirada: demasiado tiempo desde última actividad");
          logout();
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error("Error verificando última actividad:", e);
      return true;
    }
  }

  // Actualizar tiempo de última actividad
  function updateLastActivity() {
    try {
      localStorage.setItem("lastActivityTime", Date.now().toString());
    } catch (e) {
      console.error("Error actualizando actividad:", e);
    }
  }

  // Reiniciar el temporizador de inactividad
  function resetInactivityTimer() {
    // Limpiar timer anterior
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Solo establecer el timer si hay un usuario logueado
    if (user) {
      updateLastActivity();
      inactivityTimerRef.current = setTimeout(() => {
        console.log("Sesión cerrada por inactividad");
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token"); // ✅ Cargar token
      
      if (raw && savedToken) {
        const parsedUser = JSON.parse(raw);
        
        // Verificar si la sesión sigue siendo válida
        if (checkSessionExpiry() && checkLastActivity()) {
          setUser(parsedUser);
          setToken(savedToken); // ✅ Restaurar token
          updateLastActivity();
        }
      }
    } catch (err) {
      console.warn("AuthProvider: error leyendo localStorage", err);
      logout();
    }
  }, []);

  // Sincronizar entre pestañas
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "user") {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
      if (e.key === "token") {
        setToken(e.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Configurar eventos de actividad del usuario
  useEffect(() => {
    if (!user) {
      // Limpiar timer si no hay usuario
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Handler para actividad
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar el timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  // Detectar cuando se cierra la ventana/pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Guardar el tiempo de última actividad al cerrar
      updateLastActivity();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Verificar periódicamente si la sesión sigue válida
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!checkSessionExpiry()) {
        // La sesión expiró, el logout ya se hizo en checkSessionExpiry
        clearInterval(interval);
      }
    }, 60 * 1000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}