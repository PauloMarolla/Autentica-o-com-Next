import type { GetServerSideProps, NextPage } from 'next';
import { parseCookies } from 'nookies';
import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { withSSRGuest } from '../utils/withSSRGuest';

const Home: NextPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const { signIn } = useAuth();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const data = {
			email,
			password,
		};

		await signIn(data);
	}
	return (
		<>
			<h1>olá</h1>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<button type="submit">Entrar</button>
			</form>
		</>
	);
};

export default Home;

export const getServerSideProps = withSSRGuest(async (ctx) => {
	return {
		props: {},
	};
});
