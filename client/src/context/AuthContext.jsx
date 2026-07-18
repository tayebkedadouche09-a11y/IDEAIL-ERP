import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "ideail_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to restore auth state", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (authPayload) => {
    const payload = {
      token: authPayload.token,
      user: authPayload.user,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setToken(payload.token);
    setUser(payload.user);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
