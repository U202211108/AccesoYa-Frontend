import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    AdminUserService
} from '../../../core/services/admin-user.service';

import {
    AuthService
} from '../../../core/services/auth.service';

import {
    UserRole
} from '../../../core/models/auth-user';

import {
    UserResponse,
    UserStatus
} from '../../../core/models/user-response';


@Component({

    selector: 'app-admin-users',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './admin-users.component.html',

    styleUrl:
        './admin-users.component.scss'
})
export class AdminUsersComponent
    implements OnInit {


    private readonly adminUserService =
        inject(AdminUserService);

    private readonly authService =
        inject(AuthService);


    users: UserResponse[] = [];

    loading = false;

    savingId: string | null = null;

    search = '';

    errorMessage = '';

    successMessage = '';


    readonly roles: UserRole[] = [

        'CONSULTOR',

        'OPERADOR_FLNOC',

        'SUPERVISOR',

        'ADMIN'
    ];


    ngOnInit(): void {

        this.loadUsers();
    }


    loadUsers(): void {

        this.loading = true;

        this.errorMessage = '';

        this.adminUserService
            .getUsers()
            .subscribe({

                next: users => {

                    this.users =
                        users;

                    this.loading =
                        false;
                },

                error: error => {

                    console.error(
                        error);

                    this.errorMessage =
                        'No se pudo cargar la lista de usuarios.';

                    this.loading =
                        false;
                }
            });
    }


    get filteredUsers():
        UserResponse[] {

        const text =
            this.search
                .trim()
                .toLowerCase();


        if (!text) {

            return this.users;
        }


        return this.users.filter(
            user =>
                `${user.firstName}
                ${user.lastName}
                ${user.email}
                ${user.role}`
                    .toLowerCase()
                    .includes(text)
        );
    }


    isCurrentUser(
        user: UserResponse
    ): boolean {

        return user.id ===
            this.authService
                .getCurrentUser()
                ?.id;
    }


    changeRole(

        user: UserResponse,

        role: UserRole

    ): void {

        if (
            this.isCurrentUser(user)
        ) {

            return;
        }


        if (
            role === user.role
        ) {

            return;
        }


        const confirmed =
            confirm(

                `¿Cambiar el rol de
                ${user.firstName}
                ${user.lastName}
                a ${this.getRoleLabel(role)}?`
            );


        if (!confirmed) {

            return;
        }


        this.savingId =
            user.id;


        this.errorMessage = '';

        this.successMessage = '';


        this.adminUserService
            .updateRole(
                user.id,
                role
            )
            .subscribe({

                next: updatedUser => {

                    this.users =
                        this.users.map(
                            item =>
                                item.id === updatedUser.id
                                    ? updatedUser
                                    : item
                        );

                    this.savingId =
                        null;

                    this.successMessage =
                        'Rol actualizado correctamente.';
                },

                error: error => {

                    console.error(
                        error);

                    this.savingId =
                        null;

                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudo actualizar el rol.';
                }
            });
    }


    changeStatus(
        user: UserResponse
    ): void {

        if (
            this.isCurrentUser(user)
        ) {

            return;
        }


        const newStatus:
            UserStatus =
            user.status === 'ACTIVE'
                ? 'INACTIVE'
                : 'ACTIVE';


        const confirmed =
            confirm(

                `¿Deseas ${newStatus === 'ACTIVE'
                    ? 'activar'
                    : 'desactivar'
                } a ${user.firstName
                } ${user.lastName
                }?`
            );


        if (!confirmed) {

            return;
        }


        this.savingId =
            user.id;


        this.errorMessage = '';

        this.successMessage = '';


        this.adminUserService
            .updateStatus(
                user.id,
                newStatus
            )
            .subscribe({

                next: updatedUser => {

                    this.users =
                        this.users.map(
                            item =>
                                item.id === updatedUser.id
                                    ? updatedUser
                                    : item
                        );

                    this.savingId =
                        null;

                    this.successMessage =
                        'Estado actualizado correctamente.';
                },

                error: error => {

                    console.error(
                        error);

                    this.savingId =
                        null;

                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudo actualizar el estado.';
                }
            });
    }


    getRoleLabel(
        role: UserRole
    ): string {

        switch (role) {

            case 'CONSULTOR':
                return 'Consultor';

            case 'OPERADOR_FLNOC':
                return 'Operador FLM/NOC';

            case 'SUPERVISOR':
                return 'Supervisor';

            case 'ADMIN':
                return 'Administrador';
        }
    }


    getStatusLabel(
        status: UserStatus
    ): string {

        return status === 'ACTIVE'
            ? 'Activo'
            : 'Inactivo';
    }
}