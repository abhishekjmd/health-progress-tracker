export type User = {
  id: string;
  email: string;
  name?: string;
  password?: string;
};

export type Session = {
  user: User;
};

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
