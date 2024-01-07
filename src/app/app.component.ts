import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LatLng, Map, Polygon, circle, latLng, marker, polygon, tileLayer } from 'leaflet';
import { log } from 'console';
import 'leaflet-arc'; // import leaflet-arc here
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';



declare let L: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LeafletModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit {


  title = 'QTHMap';
  selectedPoints: Polygon[] = [];
  arc: any;
  calculatedAngle: BehaviorSubject<string> = new BehaviorSubject<string>('');
  locForm: FormGroup = new FormGroup({
    sourceLocalization: new FormControl(''),
    targetLocalization: new FormControl(''),
  });

  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 5,
    center: latLng(46.879966, -121.726909)
  };

  layers = [
    polygon([[46.8, -121.85], [46.8, -121.92], [46.87, -121.8]]),
  ];
  map?: Map;
  onMapReady(map: Map) {
    // Do stuff with map
    this.map = map;
  }

  platformId = inject(PLATFORM_ID);
  showLeaflet = false;
  //...
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.showLeaflet = true;
    }
    //1: wysokość^
    //2: szerokość<>
    this.renderGrid();
    if (localStorage.getItem('sourceLocalization')) {
      this.locForm.patchValue({ sourceLocalization: localStorage.getItem('sourceLocalization') });

    }
  }

  ngAfterViewInit(): void {
    this.layers.filter(x => x.getTooltip()?.getContent() == this.locForm.value.sourceLocalization).forEach(x => {
      this.storeLocator(this.locForm.value.sourceLocalization, x);
      console.log(this.map);
      this.map?.setView(x.getCenter(), 5);
    });
  }
  private renderGrid() {
    this.layers.length = 0;
    let iPases = 0;
    let jPases = 0;
    for (let j = -180; j < 180; j += 20) {
      iPases++;
      for (let i = -90; i < 90; i += 10) {
        jPases++;
        let locator = `${(iPases + 9).toString(36).toUpperCase()}${(jPases + 9).toString(36).toUpperCase()}`;

        let poly = polygon([[i, j], [i, j + 20], [i + 10, j + 20], [i + 10, j]], { fillColor: 'transparent', fill: true });
        poly.on('click', (e) => { this.storeLocator(locator, poly); });
        poly.bindTooltip(locator, { permanent: true, direction: "center", className: "leaflet-no-background" });
        poly.closePopup();
        this.layers.push(poly);
      }
      jPases = 0;
    }
  }

  storeLocator(locator: string, poly: Polygon) {
    poly.setStyle({ fillColor: '#6aa76b', fill: true });

    if (this.selectedPoints.length == 2) {
      this.selectedPoints.filter(x => x != poly).forEach(x => {
        x.setStyle({ fillColor: 'transparent', fill: true });
      });
      this.selectedPoints.length = 0;
    }

    this.selectedPoints.push(poly);
    this.layers.forEach(x => {
      x.closePopup();
      x.unbindPopup();
    });
    if (this.arc) {
      this.map?.removeLayer(this.arc);
    }
    if (this.selectedPoints.length > 1) {
      console.log(this.selectedPoints);
      this.arc = L.Polyline.Arc(this.selectedPoints[0].getCenter(), this.selectedPoints[1].getCenter(), { color: 'red', vertices: 200 });
      this.arc.addTo(this.map);
      let angle2 = getAngle(this.selectedPoints[0].getCenter().lat, this.selectedPoints[0].getCenter().lng, this.selectedPoints[1].getCenter().lat, this.selectedPoints[1].getCenter().lng);
      this.selectedPoints[0].bindPopup(`Kąt pomiędzy ${this.selectedPoints[0].getTooltip()?.getContent()?.toString()} a  ${this.selectedPoints[1].getTooltip()?.getContent()?.toString()} wynosi: ${Math.round(angle2).toString()}`, { closeOnClick: false, autoClose: false }).openPopup();
      // this.angle.set(Math.round(angle2).toString());
      console.log(this.calculatedAngle.value);
      this.calculatedAngle.next(Math.round(angle2).toString());
      console.log(this.calculatedAngle);
    }
  }
  saveSourceLocalization() {
    const sourceLocalization = this.locForm.value.sourceLocalization;
    localStorage.setItem('sourceLocalization', sourceLocalization);
  }
  onSubmitSearch(event: SubmitEvent) {

    console.log(this.locForm.value)
    this.layers.filter(x => x.getTooltip()?.getContent() == this.locForm.value.sourceLocalization).forEach(x => {
      this.storeLocator(this.locForm.value.sourceLocalization, x);
    });
    this.layers.filter(x => x.getTooltip()?.getContent() == this.locForm.value.targetLocalization).forEach(x => {
      this.storeLocator(this.locForm.value.targetLocalization, x);
    });
  }
}
function getAngle(x1: any, y1: any, x2: any, y2: any) {
  var a = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  a = (a < 0) ? map(a, -90, 0, 270, 360) : a;
  return a;
}
function map(value: any, min1: any, max1: any, min2: any, max2: any) {
  return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
}

