import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorComponent } from './error/error.component';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor{

    constructor(private dialog: MatDialog){}
  
    
    intercept(req: HttpRequest<any>, next: HttpHandler){
    // I just want to return next händler request
    // but now we can actually also listen to the response there.
    // I don't want to edit the request,
    // I want to listen to the response and handle actually gives us back the response observable stream and
    // we can just hook into that stream and listen to events and we can use the pipe method provided by rxjs
    // to add an operator to that stream and I want to add a special operator, the catch error operator which
    // you need to import from rxjs/operators. Catch error as the name suggests is an operator
    // that allows us to handle errors emitted in this stream
    // and since this is for an HTTP request, we'll be talking about HTTP errors.
    
       return next.handle(req).pipe(
           catchError((error: HttpErrorResponse) => {
            let errorMessage = "An unkonown error ocurred!"   
            if(error.error.message){
                errorMessage = error.error.message;
            }
            this.dialog.open(ErrorComponent, {
                data: {message: errorMessage}
            });
            return throwError(error);
           })
       );
    }
}