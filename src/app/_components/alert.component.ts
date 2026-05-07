import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { Alert, AlertType } from '@app/_models';
import { AlertService } from '@app/_services';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.less']
})
export class AlertComponent implements OnInit, OnDestroy {
  @Input() id = 'default-alert';

  alerts: Alert[] = [];
  subscription?: Subscription;
  routeSubscription?: Subscription;

  constructor(
    private router: Router,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.subscription = this.alertService.onAlert(this.id).subscribe(alert => {
      if (!alert.message) {
        this.alerts = this.alerts.filter(x => x.id !== alert.id);
        return;
      }

      const newAlert = new Alert({ ...alert, id: alert.id });
      this.alerts.push(newAlert);

      if (alert.autoClose) {
        setTimeout(() => this.removeAlert(newAlert), 3000);
      }
    });

    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const alerts = this.alerts.filter(x => x.keepAfterRouteChange);
        this.alerts = [];
        alerts.forEach(x => this.alerts.push(x));
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  removeAlert(alert: Alert) {
    this.alerts = this.alerts.filter(x => x !== alert);
  }

  cssClasses(alert: Alert) {
    if (!alert) return '';

    const classes = ['alert'];

    const alertTypeClass = {
      [AlertType.Success]: 'alert-success',
      [AlertType.Error]: 'alert-danger',
      [AlertType.Info]: 'alert-info',
      [AlertType.Warning]: 'alert-warning'
    };

    classes.push(alertTypeClass[alert.type!]);

    return classes.join(' ');
  }
}
