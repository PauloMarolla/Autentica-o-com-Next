import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';

const initialCookies = parseCookies();
let isRefreshing = false;
let failedRequestQueue: any[] = [];

export const api = axios.create({
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
				const cookies = parseCookies();

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
							setCookie(undefined, 'nextauth.token', token, {
								maxAge: 60 * 60 * 24 * 30,
								path: '/',
							});
							setCookie(
								undefined,
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
				signOut();
			}
		}

		toast.error('Erro na requisicao');
		return Promise.reject(error);
	},
);
