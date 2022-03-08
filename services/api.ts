import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';
import { GetServerSidePropsContext } from 'next';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;
let failedRequestQueue: any[] = [];

export function setupApiClient(
	ctx: undefined | GetServerSidePropsContext = undefined,
) {
	const initialCookies = parseCookies(ctx);

	const api = axios.create({
		baseURL: 'http://localhost:3333',
		headers: {
			Authorization: `Bearer ${initialCookies['nextauth.token']}`,
		},
	});

	api.interceptors.response.use(
		(response) => {
			return response;
		},
		(error: AxiosError) => {
			if (error.response?.status === 401) {
				if (error.response.data?.code === 'token.expired') {
					const cookies = parseCookies(ctx);

					const { 'nextauth.refreshToken': refreshToken } = cookies;

					const originalConfig = error.config;
					if (!isRefreshing) {
						isRefreshing = true;

						api
							.post('/refresh', {
								refreshToken,
							})
							.then((response) => {
								const { token } = response.data;
								setCookie(ctx, 'nextauth.token', token, {
									maxAge: 60 * 60 * 24 * 30,
									path: '/',
								});
								setCookie(
									ctx,
									'nextauth.refreshToken',
									response.data?.refreshToken,
									{
										maxAge: 60 * 60 * 24 * 30,
										path: '/',
									},
								);

								// @ts-ignore
								api.defaults.headers['Authorization'] = `Bearer ${token}`;

								failedRequestQueue.map((request) => request.onSuccess(token));
								failedRequestQueue = [];
							})
							.catch((err) => {
								failedRequestQueue.map((request) => request.onFailure(err));
								failedRequestQueue = [];

								if (process.browser) {
									signOut();
								}
							})
							.finally(() => {
								isRefreshing = false;
							});
					}

					return new Promise((resolve, reject) => {
						failedRequestQueue.push({
							onSuccess: (token: string) => {
								// @ts-ignore
								originalConfig.headers['Authorization'] = `Bearer ${token}`;
								resolve(api(originalConfig));
							},
							onFailure: (err: AxiosError) => {
								reject(err);
							},
						});
					});
				} else {
					toast.error('Sua sessão foi encerrada!');
					if (process.browser) {
						signOut();
					} else {
						return Promise.reject(new AuthTokenError());
					}
				}
			}

			toast.error('Erro na requisicao');
			return Promise.reject(error);
		},
	);

	return api;
}
