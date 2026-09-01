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
    AuthService
} from '../../core/services/auth.service';


@Component({

    selector: 'app-profile',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './profile.component.html',

    styleUrl:
        './profile.component.scss'
})
export class ProfileComponent
    implements OnInit {


    // =====================================================
    // SERVICIO
    // =====================================================

    private readonly authService =
        inject(AuthService);


    // =====================================================
    // DATOS ACTUALES
    // =====================================================

    firstName = '';

    lastName = '';

    email = '';

    role = '';


    // =====================================================
    // DATOS TEMPORALES DE EDICIÓN
    // =====================================================

    editFirstName = '';

    editLastName = '';


    // =====================================================
    // ESTADO
    // =====================================================

    editMode = false;

    saving = false;

    successMessage = '';

    errorMessage = '';


    // =====================================================
    // INIT
    // =====================================================

    ngOnInit(): void {

        this.loadProfile();

    }


    // =====================================================
    // CARGAR PERFIL
    // =====================================================

    private loadProfile(): void {

        const user =
            this.authService.getCurrentUser();


        if (!user) {

            return;

        }


        this.firstName =
            user.firstName ?? '';


        this.lastName =
            user.lastName ?? '';


        this.email =
            user.email ?? '';


        this.role =
            user.role ?? '';

    }


    // =====================================================
    // INICIAR EDICIÓN
    // =====================================================

    startEditing(): void {

        this.editFirstName =
            this.firstName;


        this.editLastName =
            this.lastName;


        this.successMessage =
            '';

        this.errorMessage =
            '';


        this.editMode =
            true;

    }


    // =====================================================
    // CANCELAR
    // =====================================================

    cancelEditing(): void {

        this.editFirstName =
            this.firstName;


        this.editLastName =
            this.lastName;


        this.successMessage =
            '';

        this.errorMessage =
            '';


        this.editMode =
            false;

    }


    // =====================================================
    // GUARDAR
    // =====================================================

    saveProfile(): void {

        // -------------------------------------------------
        // EVITAR DOBLE CLIC
        // -------------------------------------------------

        if (this.saving) {

            return;

        }


        const firstName =
            this.editFirstName.trim();


        const lastName =
            this.editLastName.trim();


        // -------------------------------------------------
        // LIMPIAR MENSAJES
        // -------------------------------------------------

        this.successMessage =
            '';

        this.errorMessage =
            '';


        // -------------------------------------------------
        // VALIDACIÓN
        // -------------------------------------------------

        if (!firstName || !lastName) {

            this.errorMessage =
                'Los nombres y apellidos son obligatorios.';

            return;

        }


        // -------------------------------------------------
        // PROCESANDO
        // -------------------------------------------------

        this.saving =
            true;


        // -------------------------------------------------
        // ACTUALIZAR DATOS DEL COMPONENTE
        // -------------------------------------------------

        this.firstName =
            firstName;


        this.lastName =
            lastName;


        // -------------------------------------------------
        // ACTUALIZAR SESIÓN
        // -------------------------------------------------

        this.authService.updateCurrentUser(
            firstName,
            lastName
        );


        // -------------------------------------------------
        // FINALIZAR EDICIÓN INMEDIATAMENTE
        // -------------------------------------------------

        this.saving =
            false;


        this.editMode =
            false;


        this.successMessage =
            'Tu información se actualizó correctamente.';

    }


    // =====================================================
    // ETIQUETA DEL ROL
    // =====================================================

    getRoleLabel(): string {

        return this.authService
            .getRoleLabel();

    }

}