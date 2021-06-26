import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';


import { environment } from '../../environments/environment'
import { AuthData } from './auth-data.model';

const BACKEND_URL = environment.apiUrl + '/user';

@Injectable({
    providedIn: "root"
})
export class AuthService {
    private token: string;
    isAuthenticated = false;
    private tokenTimer: any;
    private userId: string;
    // That will actually be a new subject imported 
    //from rxjs and I will use that subject to push
    // the authentication information
    // to the components which are interested.
    private authStatusListener = new Subject<boolean>();

    constructor(private http: HttpClient, private router: Router){}

    getToken(){
        return this.token;
    }
    getIsAuth(){
        return this.isAuthenticated;
    }
    getUserId(){
        return this.userId;
    }
    getAuthStatusListener(){
        // I only want to return the observable 
        // part of that listener.
        // So I will return AuthStatusListener as observable
        // so that we can't emit new values from other components,
        // I only want to be able to emit from within the service but I
        // want to be able to 
        // listen from other parts
        // of the app of course.
        return this.authStatusListener.asObservable();
    }
    createUser(email: string, password: string){
        const authData: AuthData = {
            email: email,
            password: password
        }
        this.http.post(BACKEND_URL + "/signup", authData)
        .subscribe(response => {
            this.router.navigate(['/']);
        }, error => {
            this.authStatusListener.next(false);
        })
    }

    login(email: string, password: string){
        const authData: AuthData = { email: email, password: password};
        this.http.post<{token: string, expiresIn: number, userId: string}>(BACKEND_URL + '/login', authData)
        .subscribe(response => {
            const token = response.token;
            this.token = token;
            if(token){
                const expiresInDuration = response.expiresIn;
                this.setAuthTimer(expiresInDuration);
                this.isAuthenticated = true;
                this.userId = response.userId;
                this.authStatusListener.next(true);  
                const now = new Date();
                const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
                this.saveAuthData(token, expirationDate, this.userId);
                this.router.navigate(['/']);
            }
        }, error =>{
            this.authStatusListener.next(false);
        });

    }

    autoAuthUser(){ 
        const authInformation = this.getAuthData();
        if(!authInformation){
            return;
        }
        const now = new Date();
        const expiresIn = authInformation.expirationDate.getTime() - now.getTime() ;
        if(expiresIn > 0){
            this.token = authInformation.token;
            this.isAuthenticated = true;
            this.userId = authInformation.userId;
            this.setAuthTimer(expiresIn/1000);
            this.authStatusListener.next(true);
        }
    }
    logout(){
        this.token = null;
        this.isAuthenticated = false;
        this.userId = null;
        this.authStatusListener.next(false);
        this.router.navigate(['/']);
        this.clearAuthData();
        clearTimeout(this.tokenTimer);
    }

    private setAuthTimer(duration: number){
        this.tokenTimer = setTimeout(()=>{
            //after token expires then logout
            this.logout();
        }, duration*1000);
    }
    private saveAuthData(token: string, expiretionDate: Date, userId: string){
        localStorage.setItem('token', token);
        localStorage.setItem('expiration', expiretionDate.toISOString());
        localStorage.setItem('userId', userId);
    }
    private clearAuthData(){
        localStorage.removeItem('token');
        localStorage.removeItem('expiration');
        localStorage.removeItem('userId');
    }
    private getAuthData() {
        const token = localStorage.getItem('token');
        const expirationDate = localStorage.getItem('expiration');
        const userId = localStorage.getItem('userId');
        if(!token || !expirationDate){
            return;
        }
        return {
            token: token,
            expirationDate: new Date(expirationDate),
            userId: userId
        }
    }
}