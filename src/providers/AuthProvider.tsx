import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  login as loginRequest,
  logout as clearSession,
  restoreSession,
} from "../services/auth";
import { AuthContextValue, User } from "@/interfaces/auth";
import { useCheckInsStore } from "@/stores/checkIns";



const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    restoreSession()
      .then((savedUser) => {
        if (isMounted) setUser(savedUser);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const signedInUser = await loginRequest(email, password);
    setUser(signedInUser);
  }

  async function signOut() {
    await clearSession();
    useCheckInsStore.getState().clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
