import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuthContextData, SignInCredentials, User } from './types';
import Router from 'next/router';

const AuthContext = createContext({} as AuthContextData);

export function signOut() {
	destroyCookie(undefined, 'nextauth.token');
	destroyCookie(undefined, 'nextauth.refreshToken');
	Router.push('/');
}

export const AuthProvider: React.FC = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const isAuthenticated = !!user;

	useEffect(() => {
		const { 'nextauth.token': token } = parseCookies();

		if (token) {
			api
				.get('/me')
				.then((response) => {
					const { email, permissions, roles } = response.data;
					setUser({ email, permissions, roles });
				})
				.catch(() => {
					signOut();
				});
		}
	}, []);

	async function signIn({ email, password }: SignInCredentials) {
		try {
			const response = await api.post('/sessions', {
				email,
				password,
			});

			const { token, refreshToken, permissions, roles } = response.data;

			setCookie(undefined, 'nextauth.token', token, {
				maxAge: 60 * 60 * 24 * 30,
				path: '/',
			});
			setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
				maxAge: 60 * 60 * 24 * 30,
				path: '/',
			});

			setUser({
				email,
				permissions,
				roles,
			});

			// @ts-ignore
			api.defaults.headers['Authorization'] = `Bearer ${token}`;

			Router.push('/dashboard');

			console.log(response.data);
		} catch (err: any) {
			console.log(err.response);
		}
	}

	return (
		<AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
