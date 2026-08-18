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
    FlmNocSiteResponse
} from '../models/flm-noc-site-response';


@Injectable({
    providedIn: 'root'
})
export class FlmNocService {

    private readonly http =
        inject(HttpClient);

    private readonly apiUrl =
        'http://localhost:8080/api/places';


    // =====================================================
    // OBTENER SITIOS FLM / NOC
    // =====================================================

    getSites():
        Observable<FlmNocSiteResponse[]> {

        return this.http.get<FlmNocSiteResponse[]>(
            `${this.apiUrl}/flm-noc`
        );
    }
}