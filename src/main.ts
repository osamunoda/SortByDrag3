import DraggableFrame, { FrameProps, CardProps } from './DraggableFrame';
import Controller from './Controller';
import ButtonPanel, { ButtonPanelProps, SVGIcon } from './ButtonPanel';

const cards = [
    ["1", "1", "Main-1", "aaaaa", "color", "pink"],
    ["2", "2", "Main-2", "bbbbb", "color", "pink"],
    ["3", "3", "Main-3", "ccccc", "color", "pink"],
    ["4", "4", "Main-4", "ddddd", "color", "pink"],
    ["5", "5", "Main-5", "eeeee", "color", "pink"],
    ["6", "6", "Main-6", "fffff", "color", "pink"],
    ["7", "7", "Main-7", "ggggg", "color", "pink"]]
    .map(item => {
        const obj: CardProps = {
            id: item[0],
            text1: item[2],
            text2: item[3],
            type: item[5],
            background: item[4]
        };
        return obj
    });
const columnCount = Number.isNaN(Number("__COLUMNS__")) ? 1 : Number("__COLUMNS__");

const props: FrameProps = {
    columns: columnCount,
    cellHeight: 200,
    frameWidth: window.innerWidth,
    cards: cards
}
const buttonPanelProps: ButtonPanelProps = {
    width: 80,
    height: props.cellHeight
}

// create a draggable frame and acreds
const frame = new DraggableFrame(props.columns, props.frameWidth, props.cellHeight, props.cards);
const buttonPanel = new ButtonPanel(buttonPanelProps.width, buttonPanelProps.height);

const root = document.getElementById("root");
if (root) {
    root.appendChild(frame);
    frame.appendChild(buttonPanel);
    document.body.style.margin = "0";
}

// create a controller to manage draggable cards and frame
const controller = new Controller(frame);
controller.setButton(buttonPanel)


