export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function rectOverlaps(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x0 >= rect2.x1 ||
    rect1.x1 <= rect2.x0 ||
    rect1.y0 >= rect2.y1 ||
    rect1.y1 <= rect2.y0
  );
}

export class Quadtree<T extends Rect> {
  private readonly _tempSet = new Set<T>();
  private readonly objects = new Set<T>();
  private nodes: Quadtree<T>[] = [];

  constructor(
    private bounds: Rect,
    private maxObjects: number = 10,
    private maxLevels: number = 8,
    private level: number = 0
  ) {
  }

  private split() {
    let nextLevel = this.level + 1;
    let subWidth = (this.bounds.x1 - this.bounds.x0) / 2;
    let subHeight = (this.bounds.y1 - this.bounds.y0) / 2;
    let x = this.bounds.x0;
    let y = this.bounds.y0;

    // Top right node.
    this.nodes[0] = new Quadtree({
      x0: x + subWidth,
      y0: y,
      x1: x + subWidth + subWidth,
      y1: y + subHeight
    }, this.maxObjects, this.maxLevels, nextLevel);

    // Top left node.
    this.nodes[1] = new Quadtree({
      x0: x,
      y0: y,
      x1: x + subWidth,
      y1: y + subHeight
    }, this.maxObjects, this.maxLevels, nextLevel);

    // Bottom left node.
    this.nodes[2] = new Quadtree({
      x0: x,
      y0: y + subHeight,
      x1: x + subWidth,
      y1: y + subHeight + subHeight
    }, this.maxObjects, this.maxLevels, nextLevel);

    // Bottom right node.
    this.nodes[3] = new Quadtree({
      x0: x + subWidth,
      y0: y + subHeight,
      x1: x + subWidth + subWidth,
      y1: y + subHeight + subHeight
    }, this.maxObjects, this.maxLevels, nextLevel);
  }

  private getIndex(pRect: Rect, cb: (index: number) => any) {
    if (this.nodes.length === 0) {
      return;
    }

    let verticalMidpoint = this.bounds.x0 + ((this.bounds.x1 - this.bounds.x0) / 2);
    let horizontalMidpoint = this.bounds.y0 + ((this.bounds.y1 - this.bounds.y0) / 2);

    let startIsNorth = pRect.y0 < horizontalMidpoint;
    let startIsWest = pRect.x0 < verticalMidpoint;
    let endIsEast = pRect.x1 > verticalMidpoint;
    let endIsSouth = pRect.y1 > horizontalMidpoint;

    // Top-right quad.
    if (startIsNorth && endIsEast) {
      cb(0);
    }

    // Top-left quad.
    if (startIsWest && startIsNorth) {
      cb(1);
    }

    // Bottom-left quad.
    if (startIsWest && endIsSouth) {
      cb(2);
    }

    // Bottom-right quad.
    if (endIsEast && endIsSouth) {
      cb(3);
    }
  }

  private getObjectNodes(pRect: T, cb: (tree: Quadtree<T>) => any) {
    // If there are no subnodes, object must be here.
    if (this.nodes.length < 1) {
      if (this.objects.has(pRect)) {
        cb(this);
      }
    } else {
      this.getIndex(pRect, index => {
        this.nodes[index].getObjectNodes(pRect, tree => {
          cb(tree);
        });
      });
    }
  }

  insert(pRect: T) {
    // If we have subnodes, call insert on matching subnodes.
    if (this.nodes.length > 0) {
      this.getIndex(pRect, index => {
        this.nodes[index].insert(pRect);
      });
      return;
    }

    // Otherwise, store object here.
    this.objects.add(pRect);

    // maxObjects reached.
    if (this.objects.size > this.maxObjects && this.level < this.maxLevels) {

      // Split if we don't already have subnodes.
      if (!this.nodes.length) {
        this.split();
      }

      // Add all objects to their corresponding subnode.
      this.objects.forEach(value => {
        this.getIndex(value, index => {
          this.nodes[index].insert(value);
        });
      });

      // Clean up this node.
      this.objects.clear();
    }
  }

  remove(pRect: T): boolean {
    let removed = false;
    if (this.objects.has(pRect)) {
      this.objects.delete(pRect);
      removed = true;
    }
    this.getObjectNodes(pRect, tree => {
      removed = tree.remove(pRect) || removed;
    });
    return removed;
  }

  retrieve(pRect: Rect, cb: (rect: T) => any) {
    this._tempSet.clear();

    this.objects.forEach(value => {
      if (rectOverlaps(pRect, value) && !this._tempSet.has(value)) {
        this._tempSet.add(value);
        cb(value)
      }
    });

    // If we have subnodes, retrieve their objects.
    if (this.nodes.length > 0) {
      this.getIndex(pRect, index => {
        this.nodes[index].retrieve(pRect, value => {
          if (rectOverlaps(pRect, value) && !this._tempSet.has(value)) {
            this._tempSet.add(value);
            cb(value)
          }
        });
      });
    }

    this._tempSet.clear();
  }

  clear() {
    this.objects.clear();

    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes.length) {
        this.nodes[i].clear();
      }
    }

    this.nodes = [];
  }
}
