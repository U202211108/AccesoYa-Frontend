import {
    Injectable,
    inject
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Observable
} from 'rxjs';

import {
    UserRole
} from '../models/auth-user';

import {
    UserResponse,
    UserStatus
} from '../models/user-response';


@Injectable({
    providedIn: 'root'
})
export class AdminUserService {


    // =====================================================
    // HTTP
    // =====================================================

    private readonly http =
        inject(HttpClient);


    // =====================================================
    // API
    // =====================================================

    private readonly apiUrl =
        'http://localhost:8080/api/users';


    // =====================================================
    // OBTENER USUARIOS
    // =====================================================

    getUsers():
        Observable<UserResponse[]> {

        return this.http.get<UserResponse[]>(
            this.apiUrl
        );
    }


    // =====================================================
    // ACTUALIZAR ROL
    // =====================================================

    updateRole(
        id: string,
        role: UserRole
    ):
        Observable<UserResponse> {

        return this.http.patch<UserResponse>(

            `${this.apiUrl}/${id}/role`,

            {
                role
            }

        );
    }


    // =====================================================
    // ACTUALIZAR ESTADO
    // =====================================================

    updateStatus(
        id: string,
        status: UserStatus
    ):
        Observable<UserResponse> {

        return this.http.patch<UserResponse>(

            `${this.apiUrl}/${id}/status`,

            {
                status
            }

        );
    }

}