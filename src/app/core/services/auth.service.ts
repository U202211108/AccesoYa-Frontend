import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Observable,
    tap
} from 'rxjs';

import {
    AuthResponse
} from '../models/auth-response';

import {
    RegisterRequest
} from '../models/register-request';

import {
    AuthUser,
    UserRole
} from '../models/auth-user';


export interface LoginRequest {

    email: string;

    password: string;
}


@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly http =
        inject(HttpClient);


    private readonly apiUrl =
        'http://localhost:8080/api/auth';


    // =====================================================
    // LOGIN
    // =====================================================

    login(
        request: LoginRequest
    ): Observable<AuthResponse> {

        return this.http
            .post<AuthResponse>(
                `${this.apiUrl}/login`,
                request
            )
            .pipe(

                tap(response => {

                    const user: AuthUser = {

                        id:
                            response.id,

                        firstName:
                            response.firstName,

                        lastName:
                            response.lastName,

                        email:
                            response.email,

                        role:
                            response.role as UserRole,
                    };


                    // =================================================
                    // GUARDAR SESIÓN EN SESSION STORAGE
                    // =================================================

                    sessionStorage.setItem(
                        'access_token',
                        response.token
                    );

                    sessionStorage.setItem(
                        'user',
                        JSON.stringify(user)
                    );

                })

            );
    }


    // =====================================================
    // REFRESCAR SESIÓN
    // =====================================================

    refreshSession(): Observable<AuthResponse> {

        return this.http
            .post<AuthResponse>(
                `${this.apiUrl}/refresh`,
                {}
            )
            .pipe(

                tap(response => {

                    const user: AuthUser = {

                        id:
                            response.id,

                        firstName:
                            response.firstName,

                        lastName:
                            response.lastName,

                        email:
                            response.email,

                        role:
                            response.role as UserRole,
                    };


                    sessionStorage.setItem(
                        'access_token',
                        response.token
                    );

                    sessionStorage.setItem(
                        'user',
                        JSON.stringify(user)
                    );


                    console.log(
                        'Sesión actualizada. Rol:',
                        user.role
                    );

                })

            );
    }


    // =====================================================
    // REGISTER
    // =====================================================

    register(
        request: RegisterRequest
    ): Observable<unknown> {

        return this.http.post(
            `${this.apiUrl}/register`,
            request
        );
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    logout(): void {

        sessionStorage.removeItem(
            'access_token'
        );

        sessionStorage.removeItem(
            'user'
        );

        // Limpiar posibles datos antiguos
        // que quedaron de versiones anteriores.

        localStorage.removeItem(
            'access_token'
        );

        localStorage.removeItem(
            'user'
        );
    }


    // =====================================================
    // TOKEN
    // =====================================================

    getToken(): string | null {

        return sessionStorage.getItem(
            'access_token'
        );
    }


    // =====================================================
    // USUARIO AUTENTICADO
    // =====================================================

    getCurrentUser(): AuthUser | null {

        const userJson =
            sessionStorage.getItem(
                'user'
            );


        if (!userJson) {

            return null;
        }


        try {

            return JSON.parse(
                userJson
            ) as AuthUser;

        } catch (error) {

            console.error(
                'Error leyendo usuario autenticado:',
                error
            );

            return null;
        }
    }


    // =====================================================
    // AUTENTICACIÓN
    // =====================================================

    isAuthenticated(): boolean {

        const token =
            this.getToken();


        // -------------------------------------------------
        // No existe token
        // -------------------------------------------------

        if (!token) {

            return false;
        }


        try {

            // JWT = HEADER.PAYLOAD.SIGNATURE

            const payloadBase64 =
                token.split('.')[1];


            if (!payloadBase64) {

                this.logout();

                return false;
            }


            // -------------------------------------------------
            // Convertir Base64URL a Base64
            // -------------------------------------------------

            const base64 =
                payloadBase64
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');


            const payload =
                JSON.parse(
                    atob(base64)
                );


            // -------------------------------------------------
            // Verificar expiración
            // -------------------------------------------------

            if (
                !payload.exp ||
                Date.now() >= payload.exp * 1000
            ) {

                console.warn(
                    'JWT expirado. Cerrando sesión.'
                );

                this.logout();

                return false;
            }


            return true;

        } catch (error) {

            console.error(
                'JWT inválido:',
                error
            );

            this.logout();

            return false;
        }
    }


    // =====================================================
    // ROL ACTUAL
    // =====================================================

    getCurrentRole(): UserRole | null {

        const user =
            this.getCurrentUser();


        return user?.role ?? null;
    }


    // =====================================================
    // VERIFICAR ROL
    // =====================================================

    hasRole(
        role: UserRole
    ): boolean {

        return this.getCurrentRole() === role;
    }


    // =====================================================
    // VERIFICAR CUALQUIER ROL
    // =====================================================

    hasAnyRole(
        roles: UserRole[]
    ): boolean {

        const currentRole =
            this.getCurrentRole();


        if (!currentRole) {

            return false;
        }


        return roles.includes(
            currentRole
        );
    }


    // =====================================================
    // NOMBRE COMPLETO
    // =====================================================

    getFullName(): string {

        const user =
            this.getCurrentUser();


        if (!user) {

            return '';
        }


        return `${user.firstName} ${user.lastName}`;
    }


    // =====================================================
    // ETIQUETA DEL ROL
    // =====================================================

    getRoleLabel(): string {

        switch (
        this.getCurrentRole()
        ) {

            case 'CONSULTOR':
                return 'Consultor';

            case 'OPERADOR_FLNOC':
                return 'Operador FLM/NOC';

            case 'SUPERVISOR':
                return 'Supervisor';

            case 'ADMIN':
                return 'Administrador';

            default:
                return 'Consultor';
        }
    }
}