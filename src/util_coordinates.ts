import { booleanLiteral } from "@babel/types";

export interface Point {
    x: number,
    y: number
}
/**
 * Calculate which panel is selected
 * @param columns 
 * @param x e.pageX not e.clientX
 * @param y e.pageY not e.clientY
 * @param panelWidth 
 * @param panelHeight 
 * @param Ox 
 * @param Oy 
 * return index of panels
 */
export function getPanelIndex(columns: number, x: number, y: number, panelWidth: number, panelHeight: number, Ox: number, Oy: number): number {
    //console.log("getPanelIndex", arguments);
    const relativeX = x - Ox;
    const relativeY = y - Oy;
    const row = Math.floor(relativeY / panelHeight);
    const col = Math.floor(relativeX / panelWidth);
    //console.log("getPanelIndex", relativeX, relativeY, panelWidth, panelHeight);
    return columns * row + col;
}

export function calcPositions(panelWidth: number, panelHeight: number, columns: number, limit: number): Point[] {
    const positions = [];
    for (let i = 0; i < limit; i++) {
        const column_num = i % columns;
        const row_num = Math.floor(i / columns);
        const x = column_num * panelWidth;
        const y = row_num * panelHeight;
        positions.push({ x, y });
    }
    return positions;
}

export enum corners { "lt", "rt", "lb", "rb" };

export interface Bounding {
    bottom: number,
    height: number,
    left: number,
    right: number,
    top: number,
    width: number
}
/**
 * 
 * @param point {e.pageX, e.pageY} not {e.clientX, e.clientY}
 * @param bounding element.getBoundingClientRect()
 * @param scrollY this value must be added to bounding.top/bottom
 */
export function checkOutOfBound(point: Point, bounding: Bounding, scrollY: number = 0): boolean {
    const x = point.x;
    const y = point.y;
    const margin = 5;
    return point.x > (bounding.right - margin) || point.x < (bounding.left + margin) || point.y < (bounding.top + scrollY + margin) || point.y > (bounding.bottom + scrollY - margin);
}
/* Check whether touching area is scroll-area or not - one column */
export function checkRightEdge(e: TouchEvent, bounding: ClientRect) {
    if (e.touches) {
        return (bounding.right - e.touches[0].clientX) < 40;
    } else {
        return false;
    }
}
/* Check whether touching area is scroll-area or not - singleRow */
export function checkBottomEdge(e: TouchEvent, bottom: number) {
    if (e.touches) {
        return (bottom - e.touches[0].clientY) < 40;
    }
}

export function checkMultiTouch(e: TouchEvent) {
    if (e.touches) {
        return e.touches.length > 1;
    } else {
        return false;
    }
}

