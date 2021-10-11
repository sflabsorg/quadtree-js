export interface Rect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}
export declare function rectOverlaps(rect1: Rect, rect2: Rect): boolean;
export declare class Quadtree<T extends Rect> {
    private bounds;
    private maxObjects;
    private maxLevels;
    private level;
    private readonly _tempSet;
    private readonly objects;
    private nodes;
    constructor(bounds: Rect, maxObjects?: number, maxLevels?: number, level?: number);
    private split;
    private getIndex;
    private getObjectNodes;
    insert(pRect: T): void;
    remove(pRect: T): boolean;
    retrieve(pRect: Rect, cb: (rect: T) => any): void;
    clear(): void;
}
