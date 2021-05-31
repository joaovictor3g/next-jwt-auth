import { createContext, useEffect, useState } from "react";
import { setCookie, parseCookies } from 'nookies';
import { recoverUserInformation, signInRequest } from "../services/auth";
import Router from 'next/router';
import { api } from "../services/api";

type AuthContextData = {
    isAuthenticated: boolean;
    signIn: (data: SignInData) => Promise<void>;
    user: User;
}

type SignInData = {
    email: string;
    password: string;
};

type User = {
    name: string;
    email: string;
    avatar_url: string;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }) {
    const [user, setUser] = useState<User | null>(null);
    
    const isAuthenticated = !!user;

    useEffect(() => {
        const { 'nextauth:token': token } = parseCookies();
    
        if(token) {
            recoverUserInformation().then(response => setUser(response.user))
        }
    }, []);

    async function signIn({ email, password }: SignInData) {
        const { token, user } = await signInRequest({
            email,
            password
        });

        setCookie(undefined, 'nextauth:token', token, {
            maxAge: 60 * 60, // 1 hour
        });

        api.defaults.headers['Authorization'] = `Bearer ${token}`;

        setUser(user);

        Router.push('/dashboard');
    }

    return (
        <AuthContext.Provider 
            value={{ 
                isAuthenticated,
                signIn,
                user
            }}>
            {children}
        </AuthContext.Provider>
    );
}