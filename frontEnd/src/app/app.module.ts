import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JwtInterceptor, ErrorInterceptor, appInitializer } from './_helpers';
import { fakeBackendProvider } from './_helpers/fake-backend';
import { environment } from '@environments/environment';
import { AccountService } from '@app/_services';
import { AlertComponent } from './_components';
import { HomeComponent } from './home/home.component';

console.log('Environment production:', environment.production);

@NgModule({
  declarations: [
    AppComponent,
    AlertComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: appInitializer, multi: true, deps: [AccountService] },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    ...(environment.production ? [] : [fakeBackendProvider])
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
