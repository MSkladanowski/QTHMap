import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, PLATFORM_ID, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LatLng, LatLngBounds, LayerGroup, LeafletMouseEvent, Map, MapOptions, Polygon, circle, latLng, marker, polygon, rectangle, tileLayer } from 'leaflet';
import 'leaflet-arc'; // import leaflet-arc here
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { featherSave, featherSearch, featherArrowLeftCircle, featherSun } from '@ng-icons/feather-icons';
import "./L.Maidenhead.js"
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import terminator from '@joergdietrich/leaflet.terminator';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { ResizeDirective } from './directive/resize.directive.js';





declare let L: any;
type StoredLocalization = {
  locator: string,
  box: Polygon
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LeafletModule, ReactiveFormsModule, NgIconComponent, CdkDrag, ResizeDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  viewProviders: [provideIcons({ featherSave, featherSearch, featherArrowLeftCircle, featherSun })]
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(private cdr: ChangeDetectorRef) { }
  itemSize!: DOMRect;
  updateSize(ev: DOMRect) {
    this.itemSize = { ...ev };
  }
  @ViewChild('searchDrawer') drawer!: ElementRef<HTMLInputElement>;
  title = 'QTHMap';
  selectedPoints: StoredLocalization[] = [];
  arc: any;
  calculatedAngle: BehaviorSubject<string> = new BehaviorSubject<string>('');
  locForm: FormGroup = new FormGroup({
    sourceLocalization: new FormControl(''),
    targetLocalization: new FormControl(''),
  });

  public features: any = {};

  options: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '...', noWrap: true, bounds: [
          [-90, -180],
          [90, 180]
        ]
      })
    ],
    zoom: 5,
    minZoom: 1,
    center: latLng(0, 0),
    worldCopyJump: true,

  };

  layers: Polygon<any>[] = [];
  map?: Map;
  maidenhead: any;
  isDrawerOpen: boolean = false;

  onMapReady(map: Map) {
    this.map = map;
    this.maidenhead = L.maidenhead({
      color: 'rgba(0, 0, 0, 0.4)'
    });
    this.layers.push(this.maidenhead);
    terminator().addTo(map);
    setInterval(function () {
      terminator.setTime();
    }, 60000); // Every minute
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
    // this.renderGrid();
    if (localStorage.getItem('sourceLocalization')) {
      this.locForm.patchValue({ sourceLocalization: localStorage.getItem('sourceLocalization') });

    }
  }

  ngAfterViewInit(): void {
    this.createBox(this.locForm.value.sourceLocalization);
    this.map?.fitBounds(this.selectedPoints.map(x => x.box.getBounds()).reduce((acc, val) => acc.extend(val)));
  }


  storeLocator(locator: string, poly: Polygon) {

    if (this.selectedPoints.length == 1 && this.selectedPoints[0].locator == locator) {
      return;
    }
    poly.setStyle({ fillColor: '#6aa76b', fill: true });

    this.clearSelection(locator);
    this.selectedPoints.push({ locator, box: poly });

    if (this.arc) {
      this.map?.removeLayer(this.arc);
    }
    if (this.selectedPoints.length > 1) {
      const center1 = this.selectedPoints[0].box.getCenter();
      const center2 = this.selectedPoints[1].box.getCenter();
      this.arc = L.Polyline.Arc(center1, center2, { color: 'red', vertices: 200 });
      this.arc.addTo(this.map);
      const angle = getAngle(center1.lat, center1.lng, center2.lat, center2.lng);
      this.selectedPoints[0].box.bindPopup(`Kąt pomiędzy ${this.selectedPoints[0].locator} a ${this.selectedPoints[1].locator} wynosi: ${Math.round(angle).toString()}°`, { closeOnClick: false, autoClose: false }).openPopup();
      this.calculatedAngle.next(Math.round(angle).toString());
      this.map?.fitBounds(this.selectedPoints.map(x => x.box.getBounds()).reduce((acc, val) => acc.extend(val)));
    }
  }

  /**
   * Clears the selection of points.
   * 
   * @param locator - Optional locator string that will not be removed from selection.
   */
  private clearSelection(locator?: string) {
    if (this.selectedPoints.length == 2) {
      this.layers = this.layers.filter(x => !this.selectedPoints.map(x => x.box).includes(x));
      this.selectedPoints.length = 0;
    }
  }

  click(event: LeafletMouseEvent) {
    let res = this.maidenhead.latLngToMaidenheadIndex(event.latlng.lng, event.latlng.lat);
    this.createBox(res);
  }

  /**
   * Creates a box on the map based on the given locator.
   * @param locator The locator string.
   */
  private createBox(locator: string) {
    let box = this.maidenhead.maidehneadIndexToBBox(locator);
    let poly = rectangle(new LatLngBounds([box[0], box[1]], [box[2], box[3]]));
    if (this.map) {
      poly.addTo(this.map);
    }
    this.layers.push(poly);
    this.storeLocator(locator, poly);
  }

  saveSourceLocalization() {
    const sourceLocalization = this.locForm.value.sourceLocalization;
    localStorage.setItem('sourceLocalization', sourceLocalization);
  }
  onSubmitSearch(event: SubmitEvent) {
    this.clearSelection();
    this.createBox(this.locForm.value.sourceLocalization);
    this.createBox(this.locForm.value.targetLocalization);
    this.drawer.nativeElement.click();
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

