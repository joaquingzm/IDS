import React, { createContext, useState, useContext } from "react";

export const AuthContext = createContext(); // exportado

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // Podés simular un login básico:
    if (email && password) {
      setUser({ email }); // almacena el usuario
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login }}>
      {children}
    </AuthContext.Provider>
  );
};