"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const UsersContext = createContext(null);

// Semilla de usuarios (mantener sincronía con LoginForm si quieres)
const MOCK_USERS = [
  { id: 1, name: "Admin Demo", email: "admin@example.com", password: "admin123", role: "admin" },
  { id: 2, name: "Usuario Uno", email: "user1@example.com", password: "password1", role: "user" },
  { id: 3, name: "Usuario Dos", email: "user2@example.com", password: "password2", role: "userAdmin" },
];

function readStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mock_users");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("UsersProvider: error leyendo localStorage", e);
    return null;
  }
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const stored = readStorage();
    if (Array.isArray(stored) && stored.length > 0) {
      setUsers(stored);
      console.debug("UsersProvider: cargado desde localStorage", stored);
    } else {
      setUsers(MOCK_USERS);
      try {
        localStorage.setItem("mock_users", JSON.stringify(MOCK_USERS));
      } catch (e) {
        console.warn("UsersProvider: no se pudo guardar seed", e);
      }
      console.debug("UsersProvider: seed inicial aplicada", MOCK_USERS);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mock_users", JSON.stringify(users));
      console.debug("UsersProvider: persistidos usuarios", users);
    } catch (e) {
      console.warn("UsersProvider: no se pudo persistir", e);
    }
  }, [users]);

  function getAll() {
    return users.slice();
  }

  function getById(id) {
    return users.find((u) => Number(u.id) === Number(id)) ?? null;
  }

  function addUser(user) {
    setUsers((s) => [...s, user]);
  }

  function updateUser(updated) {
    setUsers((s) => s.map((u) => (Number(u.id) === Number(updated.id) ? { ...u, ...updated } : u)));
  }

  function removeUser(id) {
    setUsers((s) => s.filter((u) => Number(u.id) !== Number(id)));
  }

  return (
    <UsersContext.Provider value={{ users, getAll, getById, addUser, updateUser, removeUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  return useContext(UsersContext);
}