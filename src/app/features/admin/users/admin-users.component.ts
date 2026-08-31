import {
    Component,
    OnInit,
    ChangeDetectorRef,
    inject
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    finalize
} from 'rxjs';

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


// =====================================================
// TIPO DE CONFIRMACIÓN
// =====================================================

type ConfirmationType =
    | 'ROLE'
    | 'STATUS';


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


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly adminUserService =
        inject(AdminUserService);


    private readonly authService =
        inject(AuthService);


    private readonly changeDetectorRef =
        inject(ChangeDetectorRef);


    // =====================================================
    // DATOS
    // =====================================================

    users: UserResponse[] = [];


    loading = false;


    savingId: string | null = null;


    search = '';


    errorMessage = '';


    successMessage = '';

    /**
 * Guarda temporalmente el rol seleccionado mientras
 * el usuario decide si confirma o cancela el cambio.
 *
 * No modifica user.role hasta que el backend confirme
 * correctamente la operación.
 */
    private readonly selectedRoles =
        new Map<string, UserRole>();


    // =====================================================
    // CONFIRMACIÓN
    // =====================================================

    confirmationVisible = false;


    confirmationType:
        ConfirmationType |
        null = null;


    pendingUser:
        UserResponse |
        null = null;


    pendingRole:
        UserRole |
        null = null;


    pendingStatus:
        UserStatus |
        null = null;


    // =====================================================
    // ROLES
    // =====================================================

    readonly roles: UserRole[] = [

        'CONSULTOR',

        'OPERADOR_FLNOC',

        'SUPERVISOR',

        'ADMIN'

    ];


    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        this.loadUsers();

    }


    // =====================================================
    // CARGAR USUARIOS
    // =====================================================

    loadUsers(): void {

        // Evita lanzar varias peticiones
        // simultáneamente desde el botón.

        if (this.loading) {

            return;

        }


        this.loading = true;

        this.errorMessage = '';

        this.successMessage = '';


        /*
         * Forzamos la actualización visual inmediatamente.
         *
         * Esto permite que el spinner y el estado
         * "Actualizando..." aparezcan antes de que
         * finalice la petición HTTP.
         */

        this.changeDetectorRef.detectChanges();


        this.adminUserService
            .getUsers()

            .pipe(

                finalize(() => {

                    this.loading = false;

                    this.changeDetectorRef.detectChanges();

                })

            )

            .subscribe({

                next: users => {

                    this.users = users;

                    this.changeDetectorRef.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error cargando usuarios:',
                        error
                    );


                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudo cargar la lista de usuarios.';


                    this.changeDetectorRef.detectChanges();

                }

            });

    }


    // =====================================================
    // USUARIOS FILTRADOS
    // =====================================================

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
            user => {

                const fullName =
                    `${user.firstName ?? ''}
                     ${user.lastName ?? ''}`
                        .toLowerCase();


                const email =
                    `${user.email ?? ''}`
                        .toLowerCase();


                const role =
                    `${user.role ?? ''}`
                        .toLowerCase();


                return (
                    fullName.includes(text) ||
                    email.includes(text) ||
                    role.includes(text)
                );

            }
        );

    }


    // =====================================================
    // ESTADÍSTICAS
    // =====================================================

    get activeUsersCount(): number {

        return this.users.filter(
            user =>
                user.status === 'ACTIVE'
        ).length;

    }


    get inactiveUsersCount(): number {

        return this.users.filter(
            user =>
                user.status !== 'ACTIVE'
        ).length;

    }


    get adminUsersCount(): number {

        return this.users.filter(
            user =>
                user.role === 'ADMIN'
        ).length;

    }


    // =====================================================
    // USUARIO ACTUAL
    // =====================================================

    isCurrentUser(
        user: UserResponse
    ): boolean {

        return user.id ===
            this.authService
                .getCurrentUser()
                ?.id;

    }

    getSelectedRole(
        user: UserResponse
    ): UserRole {

        return this.selectedRoles.get(user.id)
            ?? user.role;
    }


    // =====================================================
    // INICIA CAMBIO DE ROL
    // =====================================================

    changeRole(

        user: UserResponse,

        role: UserRole

    ): void {

        // =====================================================
        // SEGURIDAD
        // =====================================================

        if (
            this.isCurrentUser(user)
        ) {

            return;
        }


        // =====================================================
        // SI SELECCIONA EL MISMO ROL
        // =====================================================

        if (
            role === user.role
        ) {

            this.selectedRoles.delete(
                user.id
            );

            this.changeDetectorRef.detectChanges();

            return;
        }


        // =====================================================
        // GUARDAR SELECCIÓN TEMPORAL
        // =====================================================

        this.selectedRoles.set(
            user.id,
            role
        );


        // =====================================================
        // CONFIGURAR CONFIRMACIÓN
        // =====================================================

        this.pendingUser =
            user;

        this.pendingRole =
            role;

        this.pendingStatus =
            null;

        this.confirmationType =
            'ROLE';

        this.confirmationVisible =
            true;


        // =====================================================
        // ACTUALIZACIÓN VISUAL
        // =====================================================

        this.changeDetectorRef.detectChanges();
    }


    // =====================================================
    // INICIA CAMBIO DE ESTADO
    // =====================================================

    changeStatus(
        user: UserResponse
    ): void {

        // Nunca permitir modificar el propio usuario.

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


        this.pendingUser = user;

        this.pendingRole = null;

        this.pendingStatus = newStatus;

        this.confirmationType = 'STATUS';

        this.confirmationVisible = true;


        // Actualización inmediata del modal.

        this.changeDetectorRef.detectChanges();

    }


    // =====================================================
    // CONFIRMAR ACCIÓN
    // =====================================================

    confirmAction(): void {

        if (
            !this.pendingUser ||
            !this.confirmationType
        ) {

            return;

        }


        if (

            this.confirmationType === 'ROLE' &&

            this.pendingRole

        ) {

            this.executeRoleChange();

            return;

        }


        if (

            this.confirmationType === 'STATUS' &&

            this.pendingStatus

        ) {

            this.executeStatusChange();

        }

    }


    // =====================================================
    // ACTUALIZAR ROL
    // =====================================================

    private executeRoleChange(): void {

        if (
            !this.pendingUser ||
            !this.pendingRole
        ) {

            return;

        }


        const user =
            this.pendingUser;


        const role =
            this.pendingRole;


        this.savingId =
            user.id;


        this.errorMessage = '';

        this.successMessage = '';


        // Cerramos el modal inmediatamente.

        this.confirmationVisible = false;


        this.changeDetectorRef.detectChanges();


        this.adminUserService

            .updateRole(
                user.id,
                role
            )

            .pipe(

                finalize(() => {

                    this.savingId = null;

                    this.changeDetectorRef.detectChanges();

                })

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


                    // El cambio ya fue confirmado por el backend,
                    // por lo que eliminamos la selección temporal.

                    this.selectedRoles.delete(
                        updatedUser.id
                    );


                    this.successMessage =
                        'El rol del usuario se actualizó correctamente.';


                    this.clearPendingAction();


                    this.changeDetectorRef.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error actualizando rol:',
                        error
                    );


                    if (
                        user
                    ) {

                        this.selectedRoles.delete(
                            user.id
                        );
                    }


                    this.savingId =
                        null;


                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudo actualizar el rol.';


                    this.changeDetectorRef.detectChanges();
                }

            });

    }


    // =====================================================
    // ACTUALIZAR ESTADO
    // =====================================================

    private executeStatusChange(): void {

        if (
            !this.pendingUser ||
            !this.pendingStatus
        ) {

            return;

        }


        const user =
            this.pendingUser;


        const newStatus =
            this.pendingStatus;


        this.savingId =
            user.id;


        this.errorMessage = '';

        this.successMessage = '';


        // Cerramos inmediatamente el modal.

        this.confirmationVisible = false;


        this.changeDetectorRef.detectChanges();


        this.adminUserService

            .updateStatus(
                user.id,
                newStatus
            )

            .pipe(

                finalize(() => {

                    this.savingId = null;

                    this.changeDetectorRef.detectChanges();

                })

            )

            .subscribe({

                next: updatedUser => {

                    this.users =
                        this.users.map(
                            item =>

                                item.id ===
                                    updatedUser.id

                                    ? updatedUser

                                    : item
                        );


                    this.successMessage =

                        newStatus === 'ACTIVE'

                            ? 'El usuario fue activado correctamente.'

                            : 'El usuario fue desactivado correctamente.';


                    this.clearPendingAction();


                    this.changeDetectorRef.detectChanges();

                },


                error: error => {

                    console.error(
                        'Error actualizando estado:',
                        error
                    );


                    this.errorMessage =
                        error?.error?.message ??
                        'No se pudo actualizar el estado.';


                    this.changeDetectorRef.detectChanges();

                }

            });

    }


    // =====================================================
    // CANCELAR MODAL
    // =====================================================

    cancelConfirmation(): void {

        // =====================================================
        // RESTAURAR SELECCIÓN VISUAL
        // =====================================================

        if (
            this.pendingUser
        ) {

            this.selectedRoles.delete(
                this.pendingUser.id
            );
        }


        // =====================================================
        // CERRAR MODAL
        // =====================================================

        this.confirmationVisible =
            false;


        // =====================================================
        // LIMPIAR OPERACIÓN
        // =====================================================

        this.clearPendingAction();


        // =====================================================
        // FORZAR ACTUALIZACIÓN
        // =====================================================

        this.changeDetectorRef.detectChanges();
    }


    // =====================================================
    // LIMPIAR OPERACIÓN PENDIENTE
    // =====================================================

    private clearPendingAction(): void {

        this.pendingUser = null;

        this.pendingRole = null;

        this.pendingStatus = null;

        this.confirmationType = null;

    }


    // =====================================================
    // ETIQUETA DEL ROL
    // =====================================================

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


    // =====================================================
    // ETIQUETA DEL ESTADO
    // =====================================================

    getStatusLabel(
        status: UserStatus
    ): string {

        return status === 'ACTIVE'

            ? 'Activo'

            : 'Inactivo';

    }


    // =====================================================
    // INICIALES
    // =====================================================

    getInitials(
        user: UserResponse
    ): string {

        const first =
            user.firstName
                ?.trim()
                .charAt(0)
                .toUpperCase() ?? '';


        const last =
            user.lastName
                ?.trim()
                .charAt(0)
                .toUpperCase() ?? '';


        return `${first}${last}`;

    }

}