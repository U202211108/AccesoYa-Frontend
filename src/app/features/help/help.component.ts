import {
    Component
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';


interface HelpItem {

    id: number;

    category: string;

    question: string;

    answer: string;

}


@Component({

    selector: 'app-help',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ],

    templateUrl:
        './help.component.html',

    styleUrl:
        './help.component.scss'

})
export class HelpComponent {


    // =====================================================
    // BÚSQUEDA
    // =====================================================

    searchTerm = '';


    // =====================================================
    // PREGUNTA ABIERTA
    // =====================================================

    openedQuestion:
        number | null =
        null;


    // =====================================================
    // PREGUNTAS
    // =====================================================

    helpItems: HelpItem[] = [

        {
            id: 1,

            category: 'Mapa',

            question:
                '¿Cómo puedo buscar un lugar?',

            answer:
                'Ingresa a la sección Mapa y utiliza el buscador para localizar el lugar que deseas consultar. También puedes explorar los lugares disponibles directamente desde el mapa.'
        },

        {
            id: 2,

            category: 'Mapa',

            question:
                '¿Cómo puedo consultar la información de un lugar?',

            answer:
                'Selecciona un lugar desde el mapa para acceder a su información detallada y consultar los datos disponibles en AccesoYa.'
        },

        {
            id: 3,

            category: 'Cuenta',

            question:
                '¿Cómo puedo actualizar mis datos?',

            answer:
                'Ingresa a Mi perfil y selecciona Editar perfil. Allí podrás actualizar tus nombres y apellidos y guardar los cambios.'
        },

        {
            id: 4,

            category: 'Notificaciones',

            question:
                '¿Cómo funcionan las notificaciones?',

            answer:
                'Las notificaciones informan sobre eventos importantes relacionados con tu cuenta y la plataforma. Puedes administrar su recepción desde Configuración.'
        },

        {
            id: 5,

            category: 'Cuenta',

            question:
                '¿Qué información puedo modificar?',

            answer:
                'Puedes modificar tus nombres y apellidos desde tu perfil. El correo electrónico y el tipo de cuenta son administrados por el sistema.'
        },

        {
            id: 6,

            category: 'Sistema',

            question:
                '¿Qué hago si encuentro un problema?',

            answer:
                'Revisa primero las Alertas y Notificaciones disponibles. Si el problema continúa, puedes comunicarlo al responsable correspondiente de tu organización.'
        }

    ];


    // =====================================================
    // RESULTADOS
    // =====================================================

    get filteredHelpItems(): HelpItem[] {

        const search =
            this.searchTerm
                .trim()
                .toLowerCase();


        if (!search) {

            return this.helpItems;

        }


        return this.helpItems.filter(
            item =>
                item.question
                    .toLowerCase()
                    .includes(search)
                ||
                item.answer
                    .toLowerCase()
                    .includes(search)
                ||
                item.category
                    .toLowerCase()
                    .includes(search)
        );

    }


    // =====================================================
    // ABRIR / CERRAR
    // =====================================================

    toggleQuestion(
        id: number
    ): void {

        this.openedQuestion =
            this.openedQuestion === id
                ? null
                : id;

    }


    // =====================================================
    // LIMPIAR BÚSQUEDA
    // =====================================================

    clearSearch(): void {

        this.searchTerm = '';

    }

}