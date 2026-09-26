import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, User } from './authApi';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    status: 'idle' | 'loading' | 'failed';
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    status: 'idle',
    error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: any, thunkAPI) => {
        try {
            const response = await authApi.login(credentials);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (data: any, thunkAPI) => {
        try {
            const response = await authApi.register(data);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, thunkAPI: any) => {
        const state = thunkAPI.getState();
        const token = state.auth.token;
        if (!token) return thunkAPI.rejectWithValue('No token found');
        try {
            const user = await authApi.getCurrentUser(token);
            return user;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'idle';
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.status = 'idle';
                // According to instructions, redirect to login is a sensible flow after register,
                // but some APIs log you in on register. Auth API currently returns AuthResponse on register!
                // We'll log them in.
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Fetch Current User
            .addCase(fetchCurrentUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.status = 'idle';
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.status = 'failed';
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            });
    },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
