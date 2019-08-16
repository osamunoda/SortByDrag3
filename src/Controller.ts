import { Point, getPanelIndex, checkOutOfBound, checkMultiTouch, checkBottomEdge, checkRightEdge } from './util_coordinates';
import DraggableFrame from './DraggableFrame';
import ButtonPanel from './ButtonPanel';
import DraggableCard from './Card';
/**
 * SortByDrag
 * UI: DraggableCard, ButtonPanel, DraggableFrame
 * Logic: Controller
 * -----------
 * Basically events are handled in DraggableFrame layer, tracking mouse down,move,up,drag,long-press
 * Controller instance holds those values and manage.
 */
export default class Controller {
    /** ========================== references to main element　=========================== */
    private _frame: HTMLDivElement; /** an elemenent which contains panels(cards) */
    private _target: HTMLElement | null; /** an element which is tracked */
    private _prevTarget: HTMLElement | null; /** an element which was tracked previously */
    private _buttonPanel: ButtonPanel | null;
    /** ========================== Check touches.length　=========================== */
    private multiTouch: boolean | undefined;
    /** ========================== track mouse cursor　=========================== */
    private down: boolean; /** whether mouse is down or not */
    private startX: number;//e.pageX on mousedown
    private startY: number;//e.pageY on mousedown
    private currentX: number; /** e.pageX on mousemove */
    private currentY: number;/** e.pageY on mousemove */
    private dragDirection: number/** 1: vertical -1:horizontal -- 1 column only      0:multi-column free drag */
    /** ======================== info of _frame　=========================== */
    private Ox: number; /** _frame's Bounding.left */
    private Oy: number;/** _frame's bounding.top */
    private scrollY: number; /** vertical scroll amount */
    private startTime: number | null; /** Date.getTime() */
    private panels: HTMLElement[];/** array of panels(cards) */
    private positions: Point[]; /** positions where panels should be placed */
    private columns: number; /** number of columns */
    private panelWidth: number;/** width of each panel */
    private panelHeight: number;/** height of each panel */
    private startIndex: number; /** index of selected panels */
    private notSelectedPositions: Point[];/** array of positions(selected panel is excluded) */
    private notSelectedPanels: HTMLElement[];/** array of panels(selected panel is excluded) */
    private startPanelsOrder: string | null;/** panel id list delimitted by '_' */
    private enableSlide: boolean;
    //members not used
    private frameWidth: number;
    private bounding: DOMRect | ClientRect; /** bounidng of the taeget */
    private left: number;/** bounding.left of the target */
    private top: number; /** bounding.top of the target */
    private startLeft: number | null; /** left position of the target on mousedown */
    private startTop: number | null; /** top position of the target on mousedown */
    private currentLeft: number | null;/** マウスムーブ時のtargetの左上座標 */
    private currentTop: number | null;/** マウスムーブ時のtargetの左上座標 */
    private scrollX: number; /** 水平スクロール量 */
    private currentTime: Date | null; /** 現在の時刻 */
    /** ========================== monitor keys　=========================== */
    private shiftDown: boolean; /** シフトキーが押されているかどうか */
    private ctrlDown: boolean;/** ctrlキーが押されているかどうか */
    private commandDown: boolean;/** commandキーが押されているかどうか */
    private optionDown: boolean;/** optionキーが押されているかどうか */
    private keys: string[];/** 押されているキーの配列 */
    /** ========================== timer　=========================== */
    private timer: any;
    /** ========================== option button　=========================== */
    private buttonMode: string; /** whether showing 'info' or 'delete' button or not */
    private buttonWidth: number;

    // constructor
    constructor(dFrame: DraggableFrame) {

        this.scrollY = Number.isNaN(Number("__SORTSCROLL__")) ? 0 : Number("__SORTSCROLL__");
        if (dFrame) {
            this._init(dFrame);
        }
    }

    /** ========================== handlers　=========================== */
    /**
     * Monitor the selected panel via e.target on _frame layer
     * clickHandler
     * mouseDownHandler
     * mouseMoveHandler
     * mouseUpHandler
     */

    clickHandler(e: MouseEvent) {
        // Do Nothing
    }
    mouseDownHandler(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        /**Check e.target is <draggable-card> or <button-panel>*/
        if (e.target && e.target instanceof HTMLElement && (e.target.tagName === "DRAGGABLE-CARD" || e.target.tagName === "BUTTON-PANEL")) {
            // gather informations on mousedown
            this._target = e.target;
            this.down = true;
            this.startX = e.pageX;
            this.startY = e.pageY;
            const targetBounding = e.target.getBoundingClientRect();
            this.startLeft = targetBounding.left;
            this.startTop = targetBounding.top;
            this.startTime = Date.now();
            this.scrollY = window.scrollY;
            this.dragDirection = 0;
            this.startPanelsOrder = this.getPanelsIDList();
            // in case of showing Delete/Info Button
            if (this.buttonMode) {
                this.buttonMode = "";

                setTimeout(() => {
                    if (this._prevTarget) {
                        if (this._buttonPanel) {
                            this._buttonPanel.style.zIndex = "-1";
                            this._buttonPanel.style.display = "none";
                            this._buttonPanel.style.opacity = "0";
                        }
                        this.setBasicStyle(this._prevTarget);
                        this._prevTarget.style.transform = "none";
                    }
                }, 200);
                this.mouseUpHandler(e);
                return;
            }
            /* multiTouch mode ( scroll mode ) is enabled by multi finger touches or touching right edge of the window */
            //this.multiTouch = checkMultiTouch(e) || checkRightEdge(e) || checkBottomEdge(e, height);
            if (this.multiTouch) {
                /* Do nothing - Default scroll begins */
            } else {
                /* add an effect to the selected panel */
                this.setSelectedStyle(this._target);
                /* Start the timer(It runs only in the case of single column)  - moving the touch stops the timer */
                if (this.columns !== 1) {
                    this.timer = setTimeout(() => {
                        if (this._target) {
                            location.href = "fmp://$/__SORTDB__?script=sortByDrag_longPress&$selectedID=" + this._target.id;
                        }
                    }, 1000);
                }
                /* move the selected panel freely without transition via dragging */
                this._target.style.transition = "none";
                /* Save the panels order except selected one */
                const toRemoveIndex = getPanelIndex(this.columns, this.startX, this.startY, this.panelWidth, this.panelHeight, this.Ox, this.Oy);
                this.startIndex = toRemoveIndex;
                this.notSelectedPositions = this.positions.filter((item, index) => {
                    return index != toRemoveIndex
                });
                this.notSelectedPanels = this.panels.filter((item, index) => {
                    return index != toRemoveIndex
                });
            }
        }
    }
    touchStartHandler(e: TouchEvent) {

        this.multiTouch = checkMultiTouch(e) || checkRightEdge(e, this._frame.getBoundingClientRect()) || checkBottomEdge(e, this._frame.getBoundingClientRect().height);
        if (this.multiTouch) {
            return;
            /* Do nothing - Default scroll begins */
        }
        e.stopPropagation();
        e.preventDefault();
        /**Check e.target is <draggable-card> or <button-panel>*/
        if (e.target && e.target instanceof HTMLElement && (e.target.tagName === "DRAGGABLE-CARD" || e.target.tagName === "BUTTON-PANEL")) {
            // gather informations on mousedown
            this._target = e.target;
            this.down = true;
            this.startX = e.touches[0].pageX;
            this.startY = e.touches[0].pageY;
            const targetBounding = e.target.getBoundingClientRect();
            this.startLeft = targetBounding.left;
            this.startTop = targetBounding.top;
            this.startTime = Date.now();
            this.scrollY = window.scrollY;
            this.dragDirection = 0;
            // in case of showing Delete/Info Button
            if (this.buttonMode) {
                this.buttonMode = "";
                if (this._buttonPanel) {
                    this._buttonPanel.style.zIndex = "-1";
                    this._buttonPanel.style.display = "none";
                    this._buttonPanel.style.opacity = "0";
                }
                setTimeout(() => {
                    if (this._prevTarget) {
                        this.setBasicStyle(this._prevTarget);
                        this._prevTarget.style.transform = "none";
                    }
                }, 0);
                this.touchEndHandler(e);
                return;
            }
            /* multiTouch mode ( scroll mode ) is enabled by multi finger touches or touching right edge of the window */
            this.multiTouch = checkMultiTouch(e) || checkRightEdge(e, this.bounding) || checkBottomEdge(e, window.innerHeight);
            if (this.multiTouch) {
                /* Do nothing - Default scroll begins */
            } else {
                /* add an effect to the selected panel */
                this.setSelectedStyle(this._target);
                /* Start the timer(It runs only in the case of single column)  - moving the touch stops the timer */
                if (this.columns !== 1) {
                    this.timer = setTimeout(() => {
                        if (this._target) {
                            location.href = "fmp://$/__SORTDB__?script=sortByDrag_longPress&$selectedID=" + this._target.id;
                        }
                    }, 1000);
                }

                /* move the selected panel freely without transition via dragging */
                this._target.style.transition = "none";
                /* Save the panels order except selected one */
                const toRemoveIndex = getPanelIndex(this.columns, this.startX, this.startY, this.panelWidth, this.panelHeight, this.Ox, this.Oy);
                //alert(toRemoveIndex);
                this.startIndex = toRemoveIndex;
                this.notSelectedPositions = this.positions.filter((item, index) => {
                    return index != toRemoveIndex
                });
                this.notSelectedPanels = this.panels.filter((item, index) => {
                    return index != toRemoveIndex
                });
            }
        }
    }
    mouseMoveHandler(e: MouseEvent) {

        e.stopPropagation();
        e.preventDefault();

        if (e.target && e.target instanceof HTMLElement && e.target.tagName === "DRAGGABLE-CARD" && this.down && e.target === this._target) {
            const point = { x: e.pageX, y: e.pageY };
            if (checkOutOfBound(point, this.bounding, 0)) {
                this.mouseUpHandler(e);
                return;
            }
            if (this.multiTouch) {
                /* Do nothing, default scrolling */
            } else {
                /**
                 * Timer Check
                 * /
                 /* monitoring the mouse/touch move - if detecting a drag gesture, stop the timer.Otherwise run the timer script*/
                /* Get the current mouse(touch) position */
                this.currentX = e.pageX;
                this.currentY = e.pageY;
                this.scrollY = window.scrollY;
                const absDiffX = Math.abs(this.currentX - this.startX);
                const absDiffY = Math.abs(this.currentY - this.startY);
                if (this.columns !== 1) {
                    if (this.startTime && Math.abs(this.startX - this.currentX) < 20 && Math.abs(this.startY - this.currentY) < 20) {
                        if (Date.now() - this.startTime > 1100) {
                            /* In case of multi-columns*/
                            //location.href = "fmp://__HOST__/__DB__?script=goLink&param=" + e.target.id;
                            this.startTime = null;
                            e.target.style.boxShadow = "none";
                        }
                    } else {
                        this.startTime = null;
                        if (this.timer) {
                            clearTimeout(this.timer);
                        }
                    }
                } else { /** 1 COLUMN - check Drag direction*/
                    if (this.dragDirection === 0) {
                        if (absDiffY > 20 && absDiffX < 10) {
                            this.dragDirection = 1
                        } else if (absDiffX > 20 && absDiffY < 10) {
                            this.dragDirection = -1;
                        }
                        console.log("slide", this.enableSlide);
                        if (!this.enableSlide) {
                            this.dragDirection = 1;
                        }
                    }
                }
                /**
                 * Main part of this handler
                 ** /
                 *
                 /* calculate the order of panels */
                /* slice: to copy an array */
                /* splice: to insert new element(selected panel) to the existing array
                *  second argument: number of elements to replace
                *  0 means 'Don't replace, simply insert this(3rd argument) into the position(1st argument)!'
                * */
                let currentIndex = getPanelIndex(this.columns, this.currentX, this.currentY, this.panelWidth, this.panelHeight, this.Ox, this.Oy);
                if (currentIndex > this.panels.length - 1) {
                    let currentIndex = this.panels.length - 1;
                }
                const newPositions = this.notSelectedPositions.slice();
                newPositions.splice(currentIndex, 0, {
                    x: 0, y: 0 /* These values have no meaning, because they are not evaluated */
                });
                const reorderedPanels = this.notSelectedPanels.slice();
                reorderedPanels.splice(currentIndex, 0, e.target);
                /* move all panels except selected one*/
                const that = this;
                reorderedPanels.forEach((item, index) => {
                    let diffX = 0, diffY = 0;
                    if (item == e.target) {
                        diffX = that.currentX - that.startX;
                        diffY = that.currentY - that.startY;
                        /** restrict drag direction in 1-COLUMN */
                        if (this.dragDirection === -1) {
                            diffY = 0;
                            if (diffX > this.buttonWidth) {
                                diffX = this.buttonWidth;
                            } else if (diffX < -1 * this.buttonWidth) {
                                diffX = -1 * this.buttonWidth;
                            }
                        } else if (this.dragDirection === 1) {
                            diffX = 0;
                        }
                    } else {
                        diffX = that.positions[index].x - newPositions[index].x;
                        diffY = that.positions[index].y - newPositions[index].y;
                    }

                    item.style.transform = "translate(" + diffX + "px," + diffY + "px)";

                    /**SCROLL */
                    if (window.innerHeight - e.clientY < 20) {
                        window.scrollBy(0, 2);
                    } else if (e.clientY < 20) {
                        window.scrollBy(0, -2);
                    }
                    /** drag horizontaly to show options */
                    if (this.columns === 1 && Math.abs(diffX) >= this.buttonWidth) {
                        if (diffX >= this.buttonWidth) {
                            this.buttonMode = "info";
                        } else if (diffX <= -1 * this.buttonWidth) {
                            this.buttonMode = "delete";
                        }
                        this.mouseUpHandler(e);
                    }
                });
            }
        }
    }
    touchMoveHandler(e: TouchEvent) {
        if (this.multiTouch) return;
        e.stopPropagation();
        e.preventDefault();
        if (e.target && e.target instanceof HTMLElement && e.target.tagName === "DRAGGABLE-CARD" && this.down && e.target === this._target) {
            const point = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY };
            if (checkOutOfBound(point, this.bounding, 0)) {
                this.touchEndHandler(e);
                return;
            }
            if (this.multiTouch) {
                /* Do nothing, default scrolling */
            } else {
                /**
                 * Timer Check
                 * /
                 /* monitoring the mouse/touch move - if detecting a drag gesture, stop the timer.Otherwise run the timer script*/
                /* Get the current mouse(touch) position */
                this.currentX = e.changedTouches[0].pageX;
                this.currentY = e.changedTouches[0].pageY;
                this.scrollY = window.scrollY;
                const absDiffX = Math.abs(this.currentX - this.startX);
                const absDiffY = Math.abs(this.currentY - this.startY);
                if (this.columns !== 1) {
                    if (this.startTime && Math.abs(this.startX - this.currentX) < 20 && Math.abs(this.startY - this.currentY) < 20) {
                        if (Date.now() - this.startTime > 1100) {
                            /* In case of multi-columns*/
                            //location.href = "fmp://__HOST__/__DB__?script=goLink&param=" + e.target.id;
                            this.startTime = null;
                            e.target.style.boxShadow = "none";
                        }
                    } else {
                        this.startTime = null;
                        if (this.timer) {
                            clearTimeout(this.timer);
                        }
                    }
                } else { /** 1 COLUMN - check Drag direction*/
                    if (this.dragDirection === 0) {
                        if (absDiffY > 20 && absDiffX < 10) {
                            this.dragDirection = 1
                        } else if (absDiffX > 20 && absDiffY < 10) {
                            this.dragDirection = -1;
                        }
                    }
                }
                /**
                 * Main part of this handler
                 ** /
                 *
                 /* calculate the order of panels */
                /* slice: to copy an array */
                /* splice: to insert new element(selected panel) to the existing array
                *  second argument: number of elements to replace
                *  0 means 'Don't replace, simply insert this(3rd argument) into the position(1st argument)!'
                * */
                let currentIndex = getPanelIndex(this.columns, this.currentX, this.currentY, this.panelWidth, this.panelHeight, this.Ox, this.Oy);
                if (currentIndex > this.panels.length - 1) {
                    let currentIndex = this.panels.length - 1;
                }
                const newPositions = this.notSelectedPositions.slice();
                newPositions.splice(currentIndex, 0, {
                    x: 0, y: 0 /* These values have no meaning, because they are not evaluated */
                });
                const reorderedPanels = this.notSelectedPanels.slice();
                reorderedPanels.splice(currentIndex, 0, e.target);
                /* move all panels except selected one*/
                const that = this;
                reorderedPanels.forEach((item, index) => {
                    let diffX = 0, diffY = 0;
                    if (item == e.target) {
                        diffX = that.currentX - that.startX;
                        diffY = that.currentY - that.startY;
                        /** restrict drag direction in 1-COLUMN */
                        if (this.dragDirection === -1) {
                            diffY = 0;
                            if (diffX > this.buttonWidth) {
                                diffX = this.buttonWidth;
                            } else if (diffX < -1 * this.buttonWidth) {
                                diffX = -1 * this.buttonWidth;
                            }
                        } else if (this.dragDirection === 1) {
                            diffX = 0;
                        }
                    } else {
                        diffX = that.positions[index].x - newPositions[index].x;
                        diffY = that.positions[index].y - newPositions[index].y;
                    }

                    item.style.transform = "translate(" + diffX + "px," + diffY + "px)";

                    /**SCROLL */
                    if (window.innerHeight - e.changedTouches[0].clientY < 70) {
                        window.scrollBy(0, 2);
                    } else if (e.changedTouches[0].clientY < 70) {
                        window.scrollBy(0, -2);
                    }
                    /** drag horizontaly to show options */
                    if (this.columns === 1 && Math.abs(diffX) >= this.buttonWidth) {
                        if (diffX >= this.buttonWidth) {
                            this.buttonMode = "info";
                        } else if (diffX <= -1 * this.buttonWidth) {
                            this.buttonMode = "delete";
                        }
                        this.touchEndHandler(e);
                    }
                });
            }
        }
    }
    mouseUpHandler(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();

        if (e.target && e.target instanceof HTMLElement && e.target.tagName === "DRAGGABLE-CARD" && this.down && e.target === this._target) {
            this._prevTarget = this._target;
            this.currentX = e.pageX;
            this.currentY = e.pageY;
            this.startTime = null;
            this.setBasicStyle(this._target);
            this._target.style.transition = "none";
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (this.multiTouch) {

            } else {
                /*reset properties*/
                if (!this.down) return;
                if (!this._frame) return;

                let index = getPanelIndex(this.columns, this.currentX, this.currentY, this.panelWidth, this.panelHeight, this.Ox, this.Oy);
                if (index > this.panels.length - 1) {
                    index = this.panels.length - 1;
                }
                const diffX = this.positions[index].x - this.positions[this.startIndex].x;
                const diffY = this.positions[index].y - this.positions[this.startIndex].y;

                e.target.style.transform = "translate(" + diffX + "px," + diffY + "px)";

                this.down = false;
                this._target = null;
                this.dragDirection = 0;
                /* Reset the transform property of all panels once*/
                this.panels.forEach(item => {
                    item.style.transition = "none";
                    item.style.transform = "none";
                });
                //* re-insert the selected panel in _frame */
                this._frame.insertBefore(e.target, this.panels[index + (index > this.startIndex ? 1 : 0)]);
                this.panels = Array.from(this._frame.querySelectorAll("draggable-card"));
                setTimeout(() => {
                    const arr: string[] = [];
                    this.panels.forEach(item => {
                        this.setBasicStyle(item);
                        arr.push(item.id);
                    });
                    const currentPanelsOrder = arr.join("_");
                    if (this.startPanelsOrder !== currentPanelsOrder) {
                        location.href = "fmp://$/__SORTDB__?script=sortByDrag_interaction&$scroll=" + document.body.scrollTop + "&$panelOrder=" + currentPanelsOrder;
                    }

                }, 0)
                /** in case of showing options info/delete */
                if (this.buttonMode) {
                    this.showButton(this.buttonMode, index);
                }
            }
        }
    }
    touchEndHandler(e: TouchEvent) {
        if (this.multiTouch) return;
        e.stopPropagation();
        e.preventDefault();
        if (e.target && e.target instanceof HTMLElement && e.target.tagName === "DRAGGABLE-CARD" && this.down && e.target === this._target) {
            this._prevTarget = this._target;
            this.currentX = e.changedTouches[0].pageX;
            this.currentY = e.changedTouches[0].pageY;
            this.startTime = null;
            this.setBasicStyle(this._target);
            this._target.style.transition = "none";
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (this.multiTouch) {

            } else {
                /*reset properties*/
                if (!this.down) return;
                if (!this._frame) return;

                let index = getPanelIndex(this.columns, this.currentX, this.currentY, this.panelWidth, this.panelHeight, this.Ox, this.Oy);
                if (index > this.panels.length - 1) {
                    index = this.panels.length - 1;
                }
                const diffX = this.positions[index].x - this.positions[this.startIndex].x;
                const diffY = this.positions[index].y - this.positions[this.startIndex].y;

                e.target.style.transform = "translate(" + diffX + "px," + diffY + "px)";

                this.down = false;
                this._target = null;
                this.dragDirection = 0;
                /* Reset the transform property of all panels once*/
                this.panels.forEach(item => {
                    item.style.transition = "none";
                    item.style.transform = "none";
                });
                //* re-insert the selected panel in _frame */
                this._frame.insertBefore(e.target, this.panels[index + (index > this.startIndex ? 1 : 0)]);
                this.panels = Array.from(this._frame.querySelectorAll("draggable-card"));
                setTimeout(() => {
                    const arr: string[] = [];
                    this.panels.forEach(item => {
                        this.setBasicStyle(item);
                        arr.push(item.id);
                    });
                    const currentPanelsOrder = arr.join("_");
                    if (this.startPanelsOrder !== currentPanelsOrder) {
                        location.href = "fmp://$/__SORTDB__?script=sortByDrag_interaction&$scroll=" + document.body.scrollTop + "&$panelOrder=" + currentPanelsOrder;
                    }
                }, 0)
                /** in case of showing options info/delete */
                if (this.buttonMode) {
                    this.showButton(this.buttonMode, index);
                }
            }
        }
    }
    /************************ initialize *************************************/
    _init(dFrame: DraggableFrame) {
        this.gatherInformationFromDraggableFrame(dFrame);
        /** TEMPORARY */
        this.multiTouch = false;
        this.setupBasicCardBehavior();
        this.setupHandlers();
        document.body.scrollTo(0, this.scrollY);

    }
    gatherInformationFromDraggableFrame(dFrame: DraggableFrame) {
        if (!dFrame) return;
        this._frame = dFrame.getFrame();
        if (!this._frame) return;
        const frameBounding = this._frame.getBoundingClientRect();
        this.bounding = frameBounding;
        this.Ox = frameBounding.left;
        this.Oy = frameBounding.top;
        this.panels = Array.from(this._frame.querySelectorAll("draggable-card"));
        this.positions = dFrame.getPositions(this.panels.length);
        this.panelWidth = dFrame.getCardWidth();
        this.panelHeight = dFrame.getCardHeight();
        this.frameWidth = dFrame.getFrameWidth();
        this.columns = dFrame.getColumns();
        this.enableSlide = dFrame.canSlide();
    }
    setupHandlers() {
        if (!this._frame) return;
        this._frame.addEventListener("mousedown", this.mouseDownHandler.bind(this));
        this._frame.addEventListener("mousemove", this.mouseMoveHandler.bind(this))
        this._frame.addEventListener("mouseup", this.mouseUpHandler.bind(this));
        this._frame.addEventListener("mouseout", this.mouseUpHandler.bind(this));
        this._frame.addEventListener("mouseclick", this.clickHandler.bind(this));
        this._frame.addEventListener("touchstart", this.touchStartHandler.bind(this));
        this._frame.addEventListener("touchmove", this.touchMoveHandler.bind(this))
        this._frame.addEventListener("touchend", this.touchEndHandler.bind(this));
    }
    setupBasicCardBehavior() {
        if (this.panels) {
            this.panels.forEach(panel => {
                this.setBasicStyle(panel);
            })
        }
    }
    // Add or remove styles
    setSelectedStyle(elm: HTMLElement) {
        elm.style.boxShadow = "inset 0 0 50px";
        elm.style.zIndex = "10";
        elm.style.transition = "none";
    }
    setBasicStyle(elm: HTMLElement) {
        elm.style.boxShadow = "none";
        elm.style.zIndex = "1";
        elm.style.transition = "0.3s";
    }
    setButton(btn: ButtonPanel) {
        this._buttonPanel = document.querySelector("button-panel");
        this.buttonWidth = btn.getWidth()
            ;
    }
    showButton(label: string, index: number) {
        if (this._prevTarget) {
            this._prevTarget.style.transform = (label === "info") ? `translateX(${this.buttonWidth}px)` : `translateX(-${this.buttonWidth}px)`;
            if (this._buttonPanel) {
                this._buttonPanel.style.left = (label === "info") ? "0" : (this.frameWidth - this.buttonWidth + "px");
                this._buttonPanel.style.top = index * this.panelHeight + "px";
                this._buttonPanel.changeIcon(label);
                this._buttonPanel.style.transition = "0.6s";
                this._buttonPanel.style.display = "flex";
                this._buttonPanel.style.zIndex = "10";
                const cardID: string = this.getPanelsIDList() || "";
                const cardIDarray = cardID.split("_");
                const id = cardIDarray[index];
                this._buttonPanel.setCardID(id);
                setTimeout(() => {
                    if (this._buttonPanel) {
                        this._buttonPanel.style.opacity = "1";
                    }
                })
            }
        }
    }
    isClick(x1: number, y1: number, x2: number, y2: number): boolean {
        return Math.abs(x1 - x2) < 5 && Math.abs(y1 - y2) < 5
    }
    getPanelsIDList() {
        if (this._frame) {
            this.panels = Array.from(this._frame.querySelectorAll("draggable-card"));
            const arr: string[] = [];
            this.panels.forEach(item => {
                arr.push(item.id);
            });
            return arr.join("_");
        } else {
            return null;
        }
    }
}