import { useState } from "react";

export default function useAuth() {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // llamar a API
    setUser({ email });
  };

  const logout = () => setUser(null);

  return { user, login, logout };
}