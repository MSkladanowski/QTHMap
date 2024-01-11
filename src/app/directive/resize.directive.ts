import { DOCUMENT } from '@angular/common';
import {
    Directive,
    ElementRef,
    AfterViewInit,
    HostListener,
    Output,
    EventEmitter,
    Inject,
} from '@angular/core';

const enum Cursor {
    SIDE = 'ew-resize',
    UPDOWN = 'ns-resize',
    DIAGONAL = "nw-resize"
}

const enum Move {
    VERTICAL = 'vertical',
    HORIZONTAL = 'horizontal',
    DIAGONAL = 'diagonal',
}

const enum Start {
    TOP = 'top',
    BOTTOM = 'bottom',
    LEFT = 'left',
    RIGHT = 'right',
}

@Directive({
    selector: '[resize]',
    standalone: true,
})
export class ResizeDirective implements AfterViewInit {
    previousSize: {
        left: number;
        top: number;
        width: number;
        height: number;
        right: number;
        bottom: number;
    } = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
    resizers: ElementRef<HTMLDivElement>[] = [];
    isResizing: boolean = false;
    move!: Move;
    start!: Start;
    mouseX!: number;
    mouseY!: number;
    prevDistance: number = 0;
    MIN_SIZE = 20;
    @Output('resizeEnd') updatedSize = new EventEmitter<DOMRect>();

    constructor(
        private ele: ElementRef,
        @Inject(DOCUMENT) private _document: Document
    ) { }

    @HostListener('mouseleave', ['$event'])
    onMouseLeave(ev: MouseEvent) {
        if (!this.isResizing) {
            this.resizers.forEach((single) => {
                single.nativeElement.remove();
            });
            this.resizers = [];
        }
    }

    @HostListener('window:mouseup', ['$event'])
    onMouseUp(ev: MouseEvent) {
        this.isResizing = false;
    }

    @HostListener('mouseover', ['$event'])
    onMouseOver(ev: MouseEvent) {
        ev.stopPropagation();
        // this.previousSize = this.ele.nativeElement.getBoundingClientRect();

        this.resizers.push(
            new ElementRef(
                this.createResizers(
                    Cursor.DIAGONAL,
                    'top-full left-full',
                    Move.VERTICAL,
                    Start.BOTTOM
                )
            )
        );

        this.resizers.forEach((single) => {
            this.ele.nativeElement.appendChild(single.nativeElement);
        });
    }

    createResizers(cursor: Cursor, position: string, move: Move, start: Start) {
        let div = document.createElement('div');
        div.className = 'absolute ' + position;
        div.style.cursor = cursor;
        div.style.width = '15px';
        div.style.height = '15px';
        div.style.background = 'red';
        div.style.transform = 'translate(-50%,-50%)';
        div.addEventListener('mousedown', (e: MouseEvent) => {
            e.stopPropagation();
            this.setResizePositions(e, move, start);
            this.isResizing = true;
        });
        return div;
    }

    setResizePositions(e: MouseEvent, move: Move, start: Start) {
        this.move = move;
        this.start = start;
        this.isResizing = true;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    @HostListener('window:mousemove', ['$event'])
    resizeDiv(e: any) {
        if (this.isResizing) {
            e.stopPropagation();
            this.setPreviousState();
            if (this.move === Move.VERTICAL) {
                if (this.start === Start.TOP) {
                    console.log('hererere');
                    let dist = e.clientY - this.mouseY;
                    let updatedSize = {
                        bottom: this.previousSize.bottom,
                        left: this.previousSize.left,
                        width: this.previousSize.width,
                        right: this.previousSize.right,
                        top: this.previousSize.top + dist,
                        height: this.previousSize.height - dist,
                    } as DOMRect;
                    this.updatedSize.emit(updatedSize);
                    this.setResizePositions(e, this.move, this.start);
                } else {
                    let dist = e.clientY - this.mouseY;
                    let updatedSize = {
                        bottom: this.previousSize.bottom + dist,
                        left: this.previousSize.left,
                        width: this.previousSize.width,
                        right: this.previousSize.right,
                        top: this.previousSize.top,
                        height: this.previousSize.height + dist,
                    } as DOMRect;
                    this.updatedSize.emit(updatedSize);
                    this.setResizePositions(e, this.move, this.start);
                }
            } else {
                let dist = e.clientX - this.mouseX;
                if (this.start === Start.LEFT) {
                    let updatedSize = {
                        bottom: this.previousSize.bottom,
                        top: this.previousSize.top,
                        height: this.previousSize.height,
                        right: this.previousSize.right,
                        left:
                            this.previousSize.left + dist > 0
                                ? this.previousSize.left + dist
                                : this.previousSize.left,
                        width:
                            this.previousSize.left + dist > 0
                                ? this.previousSize.width - dist
                                : this.previousSize.width,
                    } as DOMRect;
                    this.updatedSize.emit(updatedSize);
                    this.setResizePositions(e, this.move, this.start);
                } else {
                    let updatedSize = {
                        bottom: this.previousSize.bottom,
                        top: this.previousSize.top,
                        height: this.previousSize.height,
                        left: this.previousSize.left,
                        right: this.previousSize.right + dist,
                        width: this.previousSize.width + dist,
                    } as DOMRect;
                    this.updatedSize.emit(updatedSize);
                    this.setResizePositions(e, this.move, this.start);
                }
            }
            this.setPreviousState();
        }
    }

    ngAfterViewInit() {
        this.setPreviousState();
    }

    setPreviousState() {
        const element = this.ele.nativeElement;
        this.previousSize.width = element.offsetWidth;
        this.previousSize.height = element.offsetHeight;
        const values = element.style.transform?.split(/\w+\(|\);?/);
        const transform = values[1]
            ?.split(/,\s?/g)
            .map((numStr: any) => parseInt(numStr));
        let result = { x: 0, y: 0, z: 0 };
        if (transform)
            result = {
                x: transform[0],
                y: transform[1],
                z: transform[2],
            };
        this.previousSize.left = result.x;
        this.previousSize.top = result.y;
        this.previousSize.right = result.x + this.previousSize.width;
        this.previousSize.bottom = result.y + this.previousSize.height;

        return result;
    }
}
