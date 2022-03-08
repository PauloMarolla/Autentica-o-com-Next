import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextData, SignInCredentials, User } from './types';
import Router from 'next/router';
import { api } from '../services/apiClient';

const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
	destroyCookie(undefined, 'nextauth.token');
	destroyCookie(undefined, 'nextauth.refreshToken');
	authChannel.postMessage('signOut');

	Router.push('/');
}

export const AuthProvider: React.FC = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const isAuthenticated = !!user;

	useEffect(() => {
		authChannel = new BroadcastChannel('auth');
		authChannel.onmessage = (message) => {
			switch (message.data) {
				case 'signOut':
					signOut();
					break;
				default:
					break;
			}
		};
	}, []);

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
		} catch (err: any) {
			console.log(err.response);
		}
	}

	return (
		<AuthContext.Provider value={{ isAuthenticated, signIn, user, signOut }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
