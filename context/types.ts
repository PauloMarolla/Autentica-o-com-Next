export type SignInCredentials = {
	email: string;
	password: string;
};

export type User = {
	email: string;
	permissions: string[];
	roles: string[];
};

export type AuthContextData = {
	signIn: (credentials: SignInCredentials) => Promise<void>;
	signOut: () => void;
	isAuthenticated: boolean;
	user: User | null;
};
