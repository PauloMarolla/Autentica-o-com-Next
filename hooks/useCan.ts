import { useAuth } from '../context/AuthContext';
import { validateUserPermissions } from '../utils/validateUserPermissions';

type useCamParams = {
	permissions?: string[];
	roles?: string[];
};

export function useCan({ permissions, roles }: useCamParams) {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return false;
	}

	const userHasValidPermissions = validateUserPermissions({
		user,
		permissions,
		roles,
	});

	return userHasValidPermissions;
}
