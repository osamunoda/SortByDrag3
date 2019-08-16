export interface SVGIcon {
    label: string,
    code: string,
    background: string,
    color: string,
    handler: () => void
    option?: () => void
}
export interface ButtonPanelProps {
    width: number,
    height: number,
    svgIcon?: SVGIcon
}
/**
 * Panel which displays info/delete button
 * methods:
 * getWidth
 * changeIcon: change info/display
 * addIcon: add new Icon
 */
export default class ButtonPanel extends HTMLElement {
    private width: number;
    private height: number;
    private text: string;
    private icon: string;
    private handler: () => void;/** click event handler, this is replaced when changing ICON */
    private option: () => void;
    private labels: { [key: string]: SVGIcon };/** SVGIcons Map */
    private currentLabel: string;/** current set */
    private cardID: string;
    private svgIcon: SVGIcon;/** a set of icon,label,handler */
    private _shadow: ShadowRoot;
    private _svg: HTMLElement | null;

    constructor(width: number, height: number, svgIcon?: SVGIcon) {
        super();
        this.width = width;
        this.height = height;
        this.currentLabel = "info"; /** default set */
        this.labels = {};/** SVGIcon Map */
        if (svgIcon) {
            /** When specifying svgIcon, this svgIcon is the default. */
            this.text = svgIcon.label;
            this.icon = svgIcon.code;
            this.handler = svgIcon.handler;
            this.currentLabel = this.text;
            if (svgIcon.option) {
                this.option = svgIcon.option;
            }
            this.labels[svgIcon.label] = svgIcon;
        }

        /** info/delete are preset SVVGIcons. Default one is "info" */
        const infoIcon = {
            label: "info",
            code: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" stroke-width="10" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
            background: "rgb(0,0,160)",
            color: "white",
            handler: () => {
                location.href = "fmp://$/__SORTDB__?script=sortByDrag_info&$selectedID=" + this.cardID;
            }
        };
        this.labels["info"] = infoIcon;
        const deleteIcon = {
            label: "delete",
            code: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
            background: "rgb(160,0,0)",
            color: "white",
            handler: () => { location.href = "fmp://$/__SORTDB__?script=sortByDrag_delete&$selectedID=" + this.cardID; }
        };
        this.labels["delete"] = deleteIcon;

        this.svgIcon = this.labels[this.currentLabel];

        const shadow = this.attachShadow({ mode: "closed" });
        shadow.innerHTML = `<style>
                :host{
                    margin:0;
                    --bg-color:${this.svgIcon.background};
                    border-radius:4px;
                    transition:0.3s;
                    opacity:0;
                    position:absolute;
                    box-sizing:border-box;
                    display:none;
                    justify-content:center;
                    align-items:center;
                    background:var(--bg-color);
                    color:white;
                    width:${this.width}px;
                    height:${this.height}px;
                }
                div{
                    font-weight:bold;
                    font:1rem sans-serif;
                    text-align:center;
                }
            </style>
            <div class="buttonPanel">
                ${this.svgIcon.code}
                <div>${this.text}</div>
            </div>
        `;
        this._shadow = shadow;
        this._svg = shadow.querySelector(".buttonPanel");
    }
    connectedCallback() {
        this.onmousedown = this.svgIcon.handler;
        this.ontouchend = this.svgIcon.handler;
    }
    attributeChangedCallback() {

    }
    static get observedAttributes() {
        return []
    }
    getWidth() {
        return this.width;
    }
    changeIcon(labelName: string) {
        this.svgIcon = this.labels[labelName];
        if (this._shadow) {
            const sheet = <CSSStyleSheet>this._shadow.styleSheets[0];
            const rule = <CSSStyleRule>sheet.rules[0];
            rule.style.setProperty("--bg-color", this.svgIcon.background);
            if (this._svg) {
                this._svg.innerHTML = `${this.svgIcon.code}
                <div>${this.svgIcon.label}</div>`;
                this.onmousedown = this.svgIcon.handler;
                this.ontouchend = this.svgIcon.handler;
            }
        }
    }
    addIcon(svgIcon: SVGIcon) {
        this.labels[svgIcon.label] = svgIcon;
    }
    setCardID(id: string) {
        this.cardID = id;
    }
}
customElements.define("button-panel", ButtonPanel);