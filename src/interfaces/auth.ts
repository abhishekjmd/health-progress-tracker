export type User = {
  id: string;
  email: string;
  name?: string;
  password?: string;
};

export type Session = {
  user: User;
};
