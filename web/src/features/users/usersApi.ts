// [S1-area]  users API slice
import { baseApi } from '../../app/api';
import type { User, Role, CreateUserRequest } from './types';

export const usersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '/users',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'User', id: 'LIST' }]
                    : [{ type: 'User', id: 'LIST' }],
        }),
        getRoles: builder.query<Role[], void>({
            query: () => '/users/roles',
            providesTags: [{ type: 'Role', id: 'LIST' }],
        }),
        createUser: builder.mutation<User, CreateUserRequest>({
            query: (body) => ({ url: '/users', method: 'POST', body }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),
        changeUserRole: builder.mutation<User, { id: string; roleId: string }>({
            query: ({ id, roleId }) => ({ url: `/users/${id}/role`, method: 'PUT', body: { roleId } }),
            invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
        }),
        setUserStatus: builder.mutation<User, { id: string; isActive: boolean }>({
            query: ({ id, isActive }) => ({ url: `/users/${id}/status`, method: 'PUT', body: { isActive } }),
            invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetUsersQuery,
    useGetRolesQuery,
    useCreateUserMutation,
    useChangeUserRoleMutation,
    useSetUserStatusMutation,
} = usersApi;
