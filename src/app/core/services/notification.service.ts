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
    Notification
} from '../models/notification';


@Injectable({
    providedIn: 'root'
})
export class NotificationService {


    private readonly http =
        inject(HttpClient);


    private readonly apiUrl =
        'http://localhost:8080/api/notifications';


    // =====================================================
    // OBTENER TODAS
    // =====================================================

    getNotifications():
        Observable<Notification[]> {

        return this.http.get<Notification[]>(
            this.apiUrl
        );
    }


    // =====================================================
    // OBTENER NO LEÍDAS
    // =====================================================

    getUnreadNotifications():
        Observable<Notification[]> {

        return this.http.get<Notification[]>(
            `${this.apiUrl}/unread`
        );
    }


    // =====================================================
    // CONTADOR
    // =====================================================

    getUnreadCount():
        Observable<number> {

        return this.http.get<number>(
            `${this.apiUrl}/unread/count`
        );
    }


    // =====================================================
    // MARCAR UNA COMO LEÍDA
    // =====================================================

    markAsRead(
        notificationId: string
    ): Observable<void> {

        return this.http.patch<void>(
            `${this.apiUrl}/${notificationId}/read`,
            {}
        );
    }


    // =====================================================
    // MARCAR TODAS COMO LEÍDAS
    // =====================================================

    markAllAsRead():
        Observable<void> {

        return this.http.patch<void>(
            `${this.apiUrl}/read-all`,
            {}
        );
    }
}