// Every block Koru adds to a page, on top of ordinary rich text. The editor and the tests
// both load this list, so a block that is registered here is the same everywhere.
import { AlgoBlock } from "./AlgoBlock";
import { BitsBlock } from "./BitsBlock";
import { BlanksBlock } from "./BlanksBlock";
import { CalloutBlock } from "./CalloutBlock";
import { CodeBlock } from "./CodeBlock";
import { CodeLabBlock } from "./CodeLabBlock";
import { DiagramBlock } from "./DiagramBlock";
import { DrawingBlock } from "./DrawingBlock";
import { EmbedBlock } from "./EmbedBlock";
import { FileBlock } from "./FileBlock";
import { FillTableBlock } from "./FillTableBlock";
import { FlashcardsBlock } from "./FlashcardsBlock";
import { ImageBlock } from "./ImageBlock";
import { ColumnBlock, ColumnsBlock, DetailsBlock, HeroBlock } from "./LayoutBlocks";
import { LogicBlock } from "./LogicBlock";
import { MoveBlock } from "./MoveBlock";
import { OrderBlock } from "./OrderBlock";
import { PatternBlock } from "./PatternBlock";
import { QuizBlock } from "./QuizBlock";
import { SortBlock } from "./SortBlock";
import { SquaresBlock } from "./SquaresBlock";

export const koruBlocks = [
    CodeBlock,
    CalloutBlock,
    HeroBlock,
    ColumnsBlock,
    ColumnBlock,
    DetailsBlock,
    ImageBlock,
    EmbedBlock,
    FileBlock,
    DrawingBlock,
    DiagramBlock,
    CodeLabBlock,
    SquaresBlock,
    MoveBlock,
    QuizBlock,
    PatternBlock,
    OrderBlock,
    SortBlock,
    BlanksBlock,
    FillTableBlock,
    BitsBlock,
    FlashcardsBlock,
    AlgoBlock,
    LogicBlock,
];
