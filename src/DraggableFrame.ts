import DraggableCard from './Card';
import { calcPositions } from './util_coordinates';

export interface CardProps {
    text1: string,
    text2: string,
    type: string,
    background: string,
    id: string
}
export interface FrameProps {
    columns: number,
    frameWidth: number,
    cellHeight: number,
    cards: CardProps[]
}
/**
 * Draggable Area of cards
 * methods:
 * getFrame: return refrence to this frame
 * getCardWidth: return width of each card
 * getCardHeight: return height of each card
 * getFramwWidth: return this width of frame
 * getCoumns: return number of columns
 * getPositions: wrapper of calcPositions: return array of points (coordinats of cards)
 */
export default class DraggableFrame extends HTMLElement {
    private _cards: CardProps[];
    private _columns: number;
    private _cellWidth: number;
    private _cellHeight: number;
    private _frameWidth: number;
    private _frame: HTMLDivElement;
    private _shadow: ShadowRoot | null;

    constructor(columns: number, frameWidth: number, cellHeight: number, cards: CardProps[]) {
        super();
        this._cards = cards;
        this._columns = columns;
        this._frameWidth = frameWidth;
        this._cellHeight = cellHeight;
        this._cellWidth = this._frameWidth / this._columns;
        const shadow = this.attachShadow({ mode: "closed" });
        shadow.innerHTML = `<style>
        :host{
            --width:${this._frameWidth};
        }
        .frame{
            overflow-x:hidden;
            width:calc(1px*var(--width));
            display:flex;
            flex-wrap:wrap;
        }
        </style><div class="frame"><slot></slot></div>`;
        this._frame = shadow.querySelector("div") || new HTMLDivElement();
        this._shadow = shadow;
    }
    getFrame() {
        return this._frame;
    }
    connectedCallback() {
        this._cards.forEach((item: CardProps) => {
            const card = new DraggableCard(this._cellWidth, this._cellHeight, item.background, item.text1, item.text2, item.id);
            if (this._frame)
                this._frame.appendChild(card);
        });
    }
    static get observedAttributes() {
        return [];
    }
    getCardWidth() {
        return this._cellWidth;
    }
    getCardHeight() {
        return this._cellHeight;
    }
    getPositions(numberOfCrds: number) {
        return calcPositions(this._cellWidth, this._cellHeight, this._columns, numberOfCrds)
    }
    getFrameWidth() {
        return this._frameWidth;
    }
    getColumns() {
        return this._columns;
    }
    attributeChangedCallback(attr: string, oldValue: string, newValue: string) {

    }
}

customElements.define("draggable-frame", DraggableFrame);