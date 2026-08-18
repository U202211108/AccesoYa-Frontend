import {
    Component,
    OnInit,
    inject,
    ChangeDetectorRef,
    ElementRef,
    ViewChild
} from '@angular/core';

import {
    CommonModule
} from '@angular/common';

import {
    FormsModule
} from '@angular/forms';

import {
    RouterLink
} from '@angular/router';

import {
    DomSanitizer,
    SafeResourceUrl
} from '@angular/platform-browser';

import {
    timeout,
    finalize
} from 'rxjs';

import * as pdfjsLib from 'pdfjs-dist';

import {
    FlmNocService
} from '../../../core/services/flm-noc.service';

import {
    PlanDocumentService
} from '../../../core/services/plan-document.service';

import {
    FlmNocSiteResponse
} from '../../../core/models/flm-noc-site-response';

import {
    PlanDocumentResponse
} from '../../../core/models/plan-document-response';


// =====================================================
// CONFIGURACIÓN PDF.JS
// =====================================================

(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
    '/assets/pdf.worker.min.mjs';


@Component({

    selector: 'app-plan-management',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        RouterLink
    ],

    templateUrl:
        './plan-management.component.html',

    styleUrl:
        './plan-management.component.scss'
})
export class PlanManagementComponent
    implements OnInit {


    // =====================================================
    // SERVICIOS
    // =====================================================

    private readonly flmNocService =
        inject(FlmNocService);

    private readonly planDocumentService =
        inject(PlanDocumentService);

    private readonly cdr =
        inject(ChangeDetectorRef);

    private readonly sanitizer =
        inject(DomSanitizer);


    // =====================================================
    // PDF VIEWER
    // =====================================================

    @ViewChild(
        'pdfCanvas',
        {
            static: false
        }
    )
    pdfCanvas:
        ElementRef<HTMLCanvasElement> | undefined;


    pdfLoading = false;

    pdfError = false;

    // =====================================================
    // CONTROLES DEL VISOR DE IMAGEN
    // =====================================================

    imageZoom = 1;

    imageFitMode = true;

    // =====================================================
    // CONTROLES DEL PDF
    // =====================================================

    pdfCurrentPage = 1;

    pdfTotalPages = 0;

    pdfZoom = 1.25;

    private pdfDocument: any = null;

    private pdfRenderTask: any = null;


    // =====================================================
    // SITIOS
    // =====================================================

    sites:
        FlmNocSiteResponse[] = [];

    filteredSites:
        FlmNocSiteResponse[] = [];

    selectedSite:
        FlmNocSiteResponse | null = null;


    searchTerm = '';

    loadingSites = false;


    // =====================================================
    // PLANOS
    // =====================================================

    plans:
        PlanDocumentResponse[] = [];

    loadingPlans = false;

    uploading = false;

    deletingPlanId:
        string | null = null;


    // =====================================================
    // MODAL ELIMINACIÓN
    // =====================================================

    showDeleteModal = false;

    planToDelete:
        PlanDocumentResponse | null = null;


    // =====================================================
    // VISOR
    // =====================================================

    showPlanViewer = false;

    viewingPlan = false;

    viewerPlan:
        PlanDocumentResponse | null = null;

    viewerUrl:
        SafeResourceUrl | null = null;

    private viewerObjectUrl:
        string | null = null;


    // =====================================================
    // ARCHIVO
    // =====================================================

    selectedFile:
        File | null = null;


    // =====================================================
    // MENSAJES
    // =====================================================

    errorMessage = '';

    successMessage = '';


    // =====================================================
    // CONFIGURACIÓN
    // =====================================================

    readonly maxFileSize =
        20 * 1024 * 1024;


    readonly allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg'
    ];


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    ngOnInit(): void {

        this.loadSites();

    }


    // =====================================================
    // CARGAR SITIOS
    // =====================================================

    private loadSites(): void {

        this.loadingSites = true;

        this.errorMessage = '';


        this.flmNocService
            .getSites()
            .subscribe({

                next: (sites) => {

                    console.log(
                        'Sitios FLM/NOC recibidos:',
                        sites
                    );


                    this.sites =
                        sites;

                    this.filteredSites =
                        sites;

                    this.loadingSites =
                        false;


                    this.cdr.detectChanges();

                },


                error: (error) => {

                    console.error(
                        'Error cargando sitios FLM/NOC:',
                        error
                    );


                    this.sites = [];

                    this.filteredSites = [];

                    this.loadingSites =
                        false;


                    this.errorMessage =
                        'No se pudieron cargar los sitios FLM/NOC.';


                    this.cdr.detectChanges();

                }

            });

    }


    // =====================================================
    // BUSCAR SITIO
    // =====================================================

    onSearch(): void {

        const query =
            this.normalize(
                this.searchTerm
            );


        if (!query) {

            this.filteredSites =
                this.sites;

            return;
        }


        this.filteredSites =
            this.sites.filter(
                site => {

                    return [

                        site.name,

                        site.externalId,

                        site.codigoEmplazamiento,

                        site.nombreEnCal,

                        site.nombreControlCentral,

                        site.zonal,

                        site.department,

                        site.province,

                        site.district

                    ]
                        .filter(
                            value =>
                                value != null
                        )
                        .some(
                            value =>
                                this.normalize(
                                    value!
                                ).includes(query)
                        );

                }
            );

    }


    // =====================================================
    // SELECCIONAR SITIO
    // =====================================================

    selectSite(
        site: FlmNocSiteResponse
    ): void {

        this.selectedSite =
            site;


        this.selectedFile =
            null;


        this.errorMessage = '';

        this.successMessage = '';


        this.closePlanViewer();

        this.loadPlans();

    }


    // =====================================================
    // CARGAR PLANOS
    // =====================================================

    private loadPlans(): void {

        if (!this.selectedSite) {

            this.plans = [];

            this.loadingPlans = false;

            return;
        }


        this.loadingPlans = true;

        this.errorMessage = '';


        console.log(
            'Cargando planos del sitio:',
            this.selectedSite.id
        );


        this.planDocumentService
            .getPlans(
                this.selectedSite.id
            )
            .pipe(

                timeout(15000),

                finalize(() => {

                    console.log(
                        'Finalizó carga de planos.'
                    );


                    this.loadingPlans =
                        false;


                    this.cdr.detectChanges();

                })

            )
            .subscribe({

                next: (plans) => {

                    console.log(
                        'Planos recibidos:',
                        plans
                    );


                    this.plans =
                        plans ?? [];


                    this.cdr.detectChanges();

                },


                error: (error) => {

                    console.error(
                        'Error cargando planos:',
                        error
                    );


                    this.plans = [];


                    this.errorMessage =
                        error?.name === 'TimeoutError'
                            ? 'La carga de planos está tardando demasiado. Inténtalo nuevamente.'
                            : 'No se pudieron cargar los planos del sitio.';


                    this.cdr.detectChanges();

                }

            });

    }


    // =====================================================
    // SELECCIONAR ARCHIVO
    // =====================================================

    onFileSelected(
        event: Event
    ): void {

        const input =
            event.target as HTMLInputElement;


        if (
            !input.files ||
            input.files.length === 0
        ) {

            this.selectedFile =
                null;

            return;
        }


        const file =
            input.files[0];


        const validationError =
            this.validateFile(file);


        if (validationError) {

            this.selectedFile =
                null;

            this.errorMessage =
                validationError;

            input.value = '';

            return;
        }


        this.errorMessage = '';

        this.successMessage = '';

        this.selectedFile =
            file;


        this.cdr.detectChanges();

    }


    // =====================================================
    // VALIDAR ARCHIVO
    // =====================================================

    private validateFile(
        file: File
    ): string | null {

        if (
            !this.allowedTypes.includes(
                file.type
            )
        ) {

            return (
                'Tipo de archivo no permitido. ' +
                'Solo se permiten PDF, PNG y JPG.'
            );
        }


        if (
            file.size >
            this.maxFileSize
        ) {

            return (
                'El archivo supera el tamaño máximo permitido de 20 MB.'
            );
        }


        return null;

    }


    // =====================================================
    // SUBIR PLANO
    // =====================================================

    uploadPlan(): void {

        if (
            this.uploading
        ) {

            return;
        }


        if (!this.selectedSite) {

            this.errorMessage =
                'Primero debes seleccionar un sitio.';

            return;
        }


        if (!this.selectedFile) {

            this.errorMessage =
                'Selecciona un archivo para importar.';

            return;
        }


        const file =
            this.selectedFile;


        this.uploading = true;

        this.errorMessage = '';

        this.successMessage = '';


        console.log(
            'Iniciando importación de plano...'
        );

        console.log(
            'Sitio:',
            this.selectedSite.id
        );

        console.log(
            'Archivo:',
            file.name
        );

        console.log(
            'Tamaño:',
            file.size
        );

        console.log(
            'Tipo:',
            file.type
        );


        this.planDocumentService
            .uploadPlan(
                this.selectedSite.id,
                file
            )
            .pipe(

                timeout(15000),

                finalize(() => {

                    console.log(
                        'Finalizó petición de importación.'
                    );


                    this.uploading =
                        false;


                    this.cdr.detectChanges();

                })

            )
            .subscribe({

                next: (plan) => {

                    console.log(
                        'Plano importado correctamente:',
                        plan
                    );


                    // =========================================
                    // AGREGAR INMEDIATAMENTE A LA LISTA
                    // =========================================

                    this.plans = [
                        plan,
                        ...this.plans
                    ];


                    this.selectedFile =
                        null;


                    this.successMessage =
                        'El plano se importó correctamente.';


                    this.errorMessage = '';


                    this.cdr.detectChanges();

                },


                error: (error) => {

                    console.error(
                        'Error importando plano:',
                        error
                    );


                    this.errorMessage =
                        this.getUploadError(
                            error
                        );


                    this.cdr.detectChanges();

                }

            });

    }


    // =====================================================
    // ABRIR MODAL DE ELIMINACIÓN
    // =====================================================

    deletePlan(
        plan: PlanDocumentResponse
    ): void {

        if (
            !this.selectedSite ||
            this.deletingPlanId
        ) {

            return;
        }


        this.planToDelete =
            plan;


        this.showDeleteModal =
            true;


        this.errorMessage = '';

        this.successMessage = '';


        this.cdr.detectChanges();

    }


    // =====================================================
    // CONFIRMAR ELIMINACIÓN
    // =====================================================

    confirmDelete(): void {

        if (
            !this.selectedSite ||
            !this.planToDelete ||
            this.deletingPlanId
        ) {

            return;
        }


        const siteId =
            this.selectedSite.id;

        const plan =
            this.planToDelete;


        this.deletingPlanId =
            plan.id;


        this.errorMessage = '';

        this.successMessage = '';


        console.log(
            'Iniciando eliminación de plano...'
        );

        console.log(
            'Sitio:',
            siteId
        );

        console.log(
            'Plano:',
            plan.id
        );


        this.planDocumentService
            .deletePlan(
                siteId,
                plan.id
            )
            .pipe(

                timeout(15000),

                finalize(() => {

                    console.log(
                        'Finalizó petición de eliminación.'
                    );


                    this.deletingPlanId =
                        null;


                    this.cdr.detectChanges();

                })

            )
            .subscribe({

                next: () => {

                    console.log(
                        'Plano eliminado correctamente:',
                        plan.fileName
                    );


                    // =========================================
                    // QUITAR DE LA LISTA INMEDIATAMENTE
                    // =========================================

                    this.plans =
                        this.plans.filter(
                            item =>
                                item.id !== plan.id
                        );


                    this.showDeleteModal =
                        false;


                    this.planToDelete =
                        null;


                    this.successMessage =
                        'El plano se eliminó correctamente.';


                    this.errorMessage = '';


                    this.cdr.detectChanges();

                },


                error: (error) => {

                    console.error(
                        'Error eliminando plano:',
                        error
                    );


                    this.errorMessage =
                        this.getDeleteError(
                            error
                        );


                    this.cdr.detectChanges();

                }

            });

    }


    // =====================================================
    // CANCELAR ELIMINACIÓN
    // =====================================================

    cancelDelete(): void {

        if (
            this.deletingPlanId
        ) {

            return;
        }


        this.showDeleteModal =
            false;


        this.planToDelete =
            null;


        this.cdr.detectChanges();

    }


    // =====================================================
    // VISUALIZAR PLANO
    // =====================================================

    viewPlan(
        plan: PlanDocumentResponse
    ): void {

        if (
            !this.selectedSite ||
            this.viewingPlan
        ) {

            return;
        }


        this.closePlanViewer();


        this.viewerPlan =
            plan;


        this.showPlanViewer =
            true;


        this.viewingPlan =
            true;


        this.pdfLoading =
            false;


        this.pdfError =
            false;


        this.errorMessage = '';


        console.log(
            'Abriendo visor:',
            plan.fileName
        );


        this.planDocumentService
            .getPlanFile(
                this.selectedSite.id,
                plan.id
            )
            .pipe(
                timeout(15000)
            )
            .subscribe({

                next: async (blob) => {

                    console.log(
                        'Archivo recibido:',
                        blob.type,
                        blob.size
                    );


                    // =========================================
                    // IMAGEN
                    // =========================================

                    if (
                        plan.contentType ===
                        'image/png' ||
                        plan.contentType ===
                        'image/jpeg'
                    ) {

                        this.viewerObjectUrl =
                            URL.createObjectURL(
                                blob
                            );


                        this.viewerUrl =
                            this.sanitizer
                                .bypassSecurityTrustResourceUrl(
                                    this.viewerObjectUrl
                                );


                        // -------------------------------------------------
                        // RESET DEL VISOR DE IMAGEN
                        // -------------------------------------------------

                        this.imageZoom = 1;

                        this.imageFitMode = true;


                        this.viewingPlan =
                            false;


                        this.cdr.detectChanges();

                        return;
                    }


                    // =========================================
                    // PDF
                    // =========================================

                    if (
                        plan.contentType ===
                        'application/pdf'
                    ) {

                        this.viewingPlan =
                            false;


                        this.pdfLoading =
                            true;


                        this.cdr.detectChanges();


                        await this.renderPdf(
                            blob
                        );


                        return;
                    }


                    // =========================================
                    // FORMATO NO SOPORTADO
                    // =========================================

                    this.viewingPlan =
                        false;


                    this.pdfError =
                        true;


                    this.cdr.detectChanges();

                },


                error: (error) => {

                    console.error(
                        'Error visualizando plano:',
                        error
                    );


                    this.viewingPlan =
                        false;


                    this.showPlanViewer =
                        false;


                    this.viewerPlan =
                        null;


                    this.viewerUrl =
                        null;


                    this.errorMessage =
                        this.getViewError(
                            error
                        );


                    this.cdr.detectChanges();

                }

            });

    }


    // =====================================================
    // RENDERIZAR PDF
    // =====================================================

    private async renderPdf(
        blob: Blob
    ): Promise<void> {

        try {

            this.pdfLoading = true;

            this.pdfError = false;

            this.pdfCurrentPage = 1;

            this.pdfTotalPages = 0;

            this.pdfZoom = 1.25;

            this.pdfDocument = null;

            this.cdr.detectChanges();


            // -------------------------------------------------
            // CONVERTIR ARCHIVO A ARRAY BUFFER
            // -------------------------------------------------

            const arrayBuffer =
                await blob.arrayBuffer();


            // -------------------------------------------------
            // CARGAR PDF
            // -------------------------------------------------

            const pdf =
                await pdfjsLib
                    .getDocument({
                        data: arrayBuffer
                    })
                    .promise;


            console.log(
                'PDF cargado correctamente:',
                pdf.numPages,
                'páginas'
            );


            // -------------------------------------------------
            // GUARDAR DOCUMENTO
            // -------------------------------------------------

            this.pdfDocument =
                pdf;

            this.pdfTotalPages =
                pdf.numPages;


            // -------------------------------------------------
            // ASEGURAR QUE EL CANVAS EXISTA
            // -------------------------------------------------

            this.cdr.detectChanges();


            await new Promise<void>(
                resolve => {

                    requestAnimationFrame(
                        () => resolve()
                    );

                }
            );


            // -------------------------------------------------
            // RENDERIZAR PRIMERA PÁGINA
            // -------------------------------------------------

            await this.renderPdfPage(
                this.pdfCurrentPage
            );


            this.pdfLoading =
                false;

            this.pdfError =
                false;


            this.cdr.detectChanges();


            console.log(
                'Primera página del PDF renderizada correctamente.'
            );


        } catch (error) {

            console.error(
                'Error renderizando PDF:',
                error
            );


            this.pdfLoading =
                false;

            this.pdfError =
                true;

            this.pdfDocument =
                null;

            this.pdfTotalPages =
                0;


            this.cdr.detectChanges();

        }

    }

    // =====================================================
    // RENDERIZAR PÁGINA DEL PDF
    // =====================================================

    private async renderPdfPage(
        pageNumber: number
    ): Promise<void> {

        if (!this.pdfDocument) {

            return;
        }


        const canvas =
            this.pdfCanvas?.nativeElement;


        if (!canvas) {

            throw new Error(
                'No se encontró el canvas del visor PDF.'
            );

        }


        // -------------------------------------------------
        // CANCELAR RENDER ANTERIOR
        // -------------------------------------------------

        if (this.pdfRenderTask) {

            try {

                this.pdfRenderTask.cancel();

            } catch {

                // Ignorar si ya terminó

            }

            this.pdfRenderTask =
                null;
        }


        // -------------------------------------------------
        // OBTENER PÁGINA
        // -------------------------------------------------

        const page =
            await this.pdfDocument.getPage(
                pageNumber
            );


        // -------------------------------------------------
        // CALCULAR VIEWPORT
        // -------------------------------------------------

        const viewport =
            page.getViewport({
                scale: this.pdfZoom
            });


        // -------------------------------------------------
        // OBTENER CONTEXTO
        // -------------------------------------------------

        const context =
            canvas.getContext('2d');


        if (!context) {

            throw new Error(
                'No se pudo obtener el contexto 2D del canvas.'
            );

        }


        // -------------------------------------------------
        // CONFIGURAR CANVAS
        // -------------------------------------------------

        canvas.width =
            viewport.width;

        canvas.height =
            viewport.height;


        // -------------------------------------------------
        // LIMPIAR CANVAS
        // -------------------------------------------------

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // -------------------------------------------------
        // RENDERIZAR
        // -------------------------------------------------

        this.pdfRenderTask =
            page.render({

                canvasContext:
                    context,

                viewport:
                    viewport

            });


        try {

            await this.pdfRenderTask.promise;

        } catch (error: any) {

            // PDF.js lanza RenderingCancelledException
            // cuando cambiamos rápidamente de página.

            if (
                error?.name !==
                'RenderingCancelledException'
            ) {

                throw error;

            }

        } finally {

            this.pdfRenderTask =
                null;

        }


        console.log(
            `Página ${pageNumber} de ${this.pdfTotalPages} renderizada.`
        );


        this.cdr.detectChanges();

    }

    // =====================================================
    // PÁGINA ANTERIOR
    // =====================================================

    async previousPdfPage(): Promise<void> {

        if (
            !this.pdfDocument ||
            this.pdfCurrentPage <= 1
        ) {

            return;
        }


        this.pdfCurrentPage--;

        this.pdfLoading = true;

        this.cdr.detectChanges();


        try {

            await this.renderPdfPage(
                this.pdfCurrentPage
            );

        } catch (error) {

            console.error(
                'Error renderizando página anterior:',
                error
            );

            this.pdfError = true;

        } finally {

            this.pdfLoading = false;

            this.cdr.detectChanges();

        }

    }


    // =====================================================
    // PÁGINA SIGUIENTE
    // =====================================================

    async nextPdfPage(): Promise<void> {

        if (
            !this.pdfDocument ||
            this.pdfCurrentPage >=
            this.pdfTotalPages
        ) {

            return;
        }


        this.pdfCurrentPage++;

        this.pdfLoading = true;

        this.cdr.detectChanges();


        try {

            await this.renderPdfPage(
                this.pdfCurrentPage
            );

        } catch (error) {

            console.error(
                'Error renderizando página siguiente:',
                error
            );

            this.pdfError = true;

        } finally {

            this.pdfLoading = false;

            this.cdr.detectChanges();

        }

    }

    // =====================================================
    // ZOOM OUT
    // =====================================================

    async zoomOutPdf(): Promise<void> {

        if (
            !this.pdfDocument ||
            this.pdfZoom <= 0.75
        ) {

            return;
        }


        this.pdfZoom =
            Math.max(
                0.75,
                Number(
                    (this.pdfZoom - 0.25)
                        .toFixed(2)
                )
            );


        await this.refreshPdfPage();

    }


    // =====================================================
    // ZOOM IN
    // =====================================================

    async zoomInPdf(): Promise<void> {

        if (
            !this.pdfDocument ||
            this.pdfZoom >= 3
        ) {

            return;
        }


        this.pdfZoom =
            Math.min(
                3,
                Number(
                    (this.pdfZoom + 0.25)
                        .toFixed(2)
                )
            );


        await this.refreshPdfPage();

    }


    // =====================================================
    // ZOOM 100%
    // =====================================================

    async resetPdfZoom(): Promise<void> {

        if (!this.pdfDocument) {

            return;
        }


        this.pdfZoom =
            1;


        await this.refreshPdfPage();

    }


    // =====================================================
    // ACTUALIZAR PÁGINA
    // =====================================================

    private async refreshPdfPage(): Promise<void> {

        this.pdfLoading =
            true;

        this.cdr.detectChanges();


        try {

            await this.renderPdfPage(
                this.pdfCurrentPage
            );

        } catch (error) {

            console.error(
                'Error actualizando zoom del PDF:',
                error
            );

            this.pdfError =
                true;

        } finally {

            this.pdfLoading =
                false;

            this.cdr.detectChanges();

        }

    }


    // =====================================================
    // CERRAR VISOR
    // =====================================================

    closePlanViewer(): void {

        // -------------------------------------------------
        // CANCELAR RENDER ACTUAL
        // -------------------------------------------------

        if (this.pdfRenderTask) {

            try {

                this.pdfRenderTask.cancel();

            } catch {

                // Ignorar

            }

            this.pdfRenderTask =
                null;
        }


        // -------------------------------------------------
        // LIBERAR DOCUMENTO PDF
        // -------------------------------------------------

        if (this.pdfDocument) {

            try {

                this.pdfDocument.destroy();

            } catch {

                // Ignorar

            }

            this.pdfDocument =
                null;
        }


        // -------------------------------------------------
        // LIBERAR OBJECT URL
        // -------------------------------------------------

        if (
            this.viewerObjectUrl
        ) {

            URL.revokeObjectURL(
                this.viewerObjectUrl
            );


            this.viewerObjectUrl =
                null;
        }


        // -------------------------------------------------
        // RESET VISOR
        // -------------------------------------------------

        this.showPlanViewer =
            false;

        this.viewingPlan =
            false;

        this.pdfLoading =
            false;

        this.pdfError =
            false;

        this.pdfCurrentPage =
            1;

        this.pdfTotalPages =
            0;

        this.pdfZoom =
            1.25;

        this.viewerPlan =
            null;

        this.viewerUrl =
            null;


        this.cdr.detectChanges();

    }

    // =====================================================
    // ZOOM OUT IMAGEN
    // =====================================================

    zoomOutImage(): void {

        if (this.imageZoom <= 0.5) {

            return;
        }


        this.imageFitMode = false;


        this.imageZoom =
            Math.max(
                0.5,
                Number(
                    (this.imageZoom - 0.25)
                        .toFixed(2)
                )
            );


        this.cdr.detectChanges();

    }


    // =====================================================
    // ZOOM IN IMAGEN
    // =====================================================

    zoomInImage(): void {

        if (this.imageZoom >= 4) {

            return;
        }


        this.imageFitMode = false;


        this.imageZoom =
            Math.min(
                4,
                Number(
                    (this.imageZoom + 0.25)
                        .toFixed(2)
                )
            );


        this.cdr.detectChanges();

    }


    // =====================================================
    // ZOOM 100%
    // =====================================================

    resetImageZoom(): void {

        this.imageFitMode = false;

        this.imageZoom = 1;

        this.cdr.detectChanges();

    }


    // =====================================================
    // AJUSTAR A PANTALLA
    // =====================================================

    fitImageToScreen(): void {

        this.imageFitMode = true;

        this.imageZoom = 1;

        this.cdr.detectChanges();

    }


    // =====================================================
    // FORMATO DE TAMAÑO
    // =====================================================

    formatFileSize(
        size: number
    ): string {

        if (
            size < 1024
        ) {

            return `${size} B`;
        }


        if (
            size < 1024 * 1024
        ) {

            return `${(
                size / 1024
            ).toFixed(1)} KB`;
        }


        return `${(
            size /
            (1024 * 1024)
        ).toFixed(1)} MB`;

    }


    // =====================================================
    // FORMATO DE FECHA
    // =====================================================

    formatDate(
        value: string
    ): string {

        return new Intl.DateTimeFormat(
            'es-PE',
            {
                dateStyle: 'medium',
                timeStyle: 'short'
            }
        ).format(
            new Date(value)
        );

    }


    // =====================================================
    // ERROR DE SUBIDA
    // =====================================================

    private getUploadError(
        error: any
    ): string {

        if (
            error?.name === 'TimeoutError'
        ) {

            return (
                'La importación está tardando demasiado. ' +
                'Verifica la conexión con el servidor.'
            );
        }


        if (
            error?.status === 401
        ) {

            return (
                'Tu sesión ya no es válida. ' +
                'Inicia sesión nuevamente.'
            );
        }


        if (
            error?.status === 403
        ) {

            return (
                'No tienes permisos para importar planos.'
            );
        }


        if (
            error?.error?.message
        ) {

            return error.error.message;
        }


        return (
            'No se pudo importar el plano.'
        );

    }


    // =====================================================
    // ERROR DE ELIMINACIÓN
    // =====================================================

    private getDeleteError(
        error: any
    ): string {

        if (
            error?.name === 'TimeoutError'
        ) {

            return (
                'La eliminación está tardando demasiado. ' +
                'Verifica la conexión con el servidor.'
            );
        }


        if (
            error?.status === 401
        ) {

            return (
                'Tu sesión ya no es válida. ' +
                'Inicia sesión nuevamente.'
            );
        }


        if (
            error?.status === 403
        ) {

            return (
                'No tienes permisos para eliminar este plano.'
            );
        }


        if (
            error?.status === 404
        ) {

            return (
                'El plano que intentas eliminar ya no existe.'
            );
        }


        if (
            error?.error?.message
        ) {

            return error.error.message;
        }


        return (
            'No se pudo eliminar el plano.'
        );

    }


    // =====================================================
    // ERROR DE VISUALIZACIÓN
    // =====================================================

    private getViewError(
        error: any
    ): string {

        if (
            error?.name === 'TimeoutError'
        ) {

            return (
                'El documento está tardando demasiado en cargarse.'
            );
        }


        if (
            error?.status === 401
        ) {

            return (
                'Tu sesión ya no es válida. ' +
                'Inicia sesión nuevamente.'
            );
        }


        if (
            error?.status === 403
        ) {

            return (
                'No tienes permisos para visualizar este documento.'
            );
        }


        if (
            error?.status === 404
        ) {

            return (
                'El documento ya no existe.'
            );
        }


        return (
            'No se pudo visualizar el plano. ' +
            'Inténtalo nuevamente.'
        );

    }


    // =====================================================
    // NORMALIZAR
    // =====================================================

    private normalize(
        value: string
    ): string {

        return value
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .trim()
            .toLowerCase();

    }

}