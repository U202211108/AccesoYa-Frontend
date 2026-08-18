export interface FlmNocSiteResponse {

    id: string;

    externalId: string;

    name: string;

    address?: string;

    department?: string;

    province?: string;

    district?: string;

    ubigeo?: string;

    latitude?: number;

    longitude?: number;

    category?: string;

    classification?: string;

    establishmentType?: string;

    sourceStatus?: string;

    status?: string;

    nombreEnCal?: string;

    nombreControlCentral?: string;

    numeroLineaComunicacion?: string;

    localRecojoLlaves?: string;

    codigoEmplazamiento?: string;

    zonal?: string;

    propietarioTorre?: string;

    clasificacionPropietarioTorre?: string;

    coberturaReaccion?: string;

    patrullaje?: string;

    guardiania?: string;

    vigilancia?: string;

    rondaDinamica?: string;

    monitoreoCsi?: string;
}