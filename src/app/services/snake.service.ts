import {Injectable} from '@angular/core';
import paper from 'paper';
import {assert} from '../utils/assert';

@Injectable({
  providedIn: 'root'
})
export class SnakeService {

  // TODO Map internal coordinates to real canvas size
  // WIDTH = 1920; // pixels
  WIDTH = 800; // pixels
  HEIGHT = this.WIDTH * 9 / 16; // pixels

  SPEED = 200; // pixels per second
  ANGLE = 360; // turn by this angle, per second

  THICKNESS = 8; // pixels

  // TODO: Change FPS to realtime
  FPS = 60; // frames per second

  snakes: Snake[];
  winner: Snake | null;

  constructor() {
    this.setupNewGame();
  }

  setupNewGame() {
    // Clean
    this.snakes = [];

    // paper.install(this);
    paper.setup([this.WIDTH, this.HEIGHT]);

    // Setup
    this.winner = null;
    this.setupSnakes()
    this.setupStartPositions();
  }

  private setupSnakes() {
    // TODO Support up to 8 players
    const NAMES = ["Alpha", "Beta", "Gamma"];

    NAMES.forEach(name => {
      let snake = new Snake(this);
      snake.name = name;

      snake.path.strokeColor = paper.Color.random();
      snake.path.strokeWidth = this.THICKNESS;
      snake.path.strokeCap = "round";

      this.snakes.push(snake);
    });
  }

  private setupStartPositions() {
    const START_DIAMETER = 80; // percentage of playground size
    const ANGLE1 = 180; // angle at which the snake 1 starts

    const min = Math.min(this.WIDTH, this.HEIGHT);
    const diameter = min * START_DIAMETER / 100;
    const radius = diameter / 2;

    const center = new paper.Point(this.WIDTH / 2, this.HEIGHT / 2);

    this.snakes.forEach((snake, index) => {
      let vectorCenterToHead = new paper.Point(radius, 0);
      vectorCenterToHead.angle = ANGLE1 + 360 / this.getNumberOfSnakes() * index;

      let head = center.add(vectorCenterToHead);
      snake.path.add(head);

      let vectorHeadToCenter = new paper.Point(this.SPEED, 0);
      vectorHeadToCenter.angle = vectorCenterToHead.angle + 180;
      snake.vector = vectorHeadToCenter;
    })
  }

  getNumberOfSnakes() {
    return this.snakes.length;
  }

  tick() {
    // Extend heads (with new head candidates)
    for (const snake of this.snakes) {
      if (snake.state !== SnakeState.Alive)
        continue;
      snake.extendHead();
    }

    // Detect crashes (and update head point when crashed)
    this.detectCrashes();

    // Detect winner
    this.detectWinner();
  }

  isGameOver(): boolean {
    return this.getAliveSnakes().length == 0;
  }

  getAliveSnakes(): Snake[] {
    return this.snakes
      .filter(snake => snake.state == SnakeState.Alive)
  }

  detectCrashes() {
    let crashes: Map<Snake, Crash> = new Map<Snake, Crash>();

    this.snakes.forEach((snake1, index1) => {
      if (snake1.state != SnakeState.Alive)
        return;

      let path1 = snake1.path

      let extension = new paper.Path();
      extension.add(path1.segments[path1.segments.length - 2]);
      extension.add(path1.segments[path1.segments.length - 1]);

      // console.log(snake1.name + ", extension=" + this.pathToString(extension));

      // Detect crash with snakes
      // Algorithm: Check intersection of the extension (head, new head candidate) with the path of snakes.
      this.snakes.forEach((snake2) => {
        let path2: paper.Path;
        if (snake1 == snake2) {
          // Ignore just last part of the same snake
          path2 = new paper.Path();
          path1.segments.forEach((segment, indexSegment) => {
            if (indexSegment <= path1.segments.length - 3) {
              path2.add(segment.point);
            }
          });
          // TODO Do we need to remove this path (to prevent memory leaks)?
        } else path2 = snake2.path

        // console.log("   " + snake2.name + ", path=" + this.pathToString(path2));

        let intersections = extension.getIntersections(path2);
        let crash = 0 < intersections.length;
        if (crash) {
          // Find nearest intersection
          let previousHead = snake1.path.segments[snake1.path.segments.length - 2];
          let crashPoint: paper.Point|undefined = undefined;
          let distance: number|undefined = undefined;
          intersections.forEach((intersection) => {
            let distanceI = previousHead.point.getDistance(intersection.point);
            if (distance == undefined || distanceI < distance) {
              crashPoint = intersection.point;
              distance = distanceI;
            }
          });
          assert(crashPoint != null);
          assert(distance != null);

          // Check there's no nearer crash
          let crash1 = crashes.get(snake1)
          if (crash1 != null) {
            let distanceI = previousHead.point.getDistance(crash1.crashPoint);
            if (distanceI < distance) {
              return
            }
          }

          // console.log("      Crash point = " + crashPoint);
          crashes.set(snake1, new CrashWithSnake(snake1, crashPoint, snake2));
          return
        }
      });

      // Detect crash with border
      const borders = [
        new paper.Path.Line(new paper.Point(0, 0), new paper.Size(this.WIDTH, 0)),
        new paper.Path.Line(new paper.Size(this.WIDTH, 0), new paper.Point(this.WIDTH, this.HEIGHT)),
        new paper.Path.Line(new paper.Point(this.WIDTH, this.HEIGHT), new paper.Point(0, this.HEIGHT)),
        new paper.Path.Line(new paper.Size(0, this.HEIGHT), new paper.Point(0, 0))
      ];
      borders.forEach((border) => {
        let intersections = extension.getIntersections(border);
        let crash = 0 < intersections.length;
        if (crash) {
          let crashPoint = intersections[0].point;
          // console.log("      Crash point = " + crashPoint);
          crashes.set(snake1, new CrashWithWall(snake1, crashPoint, border));
          return
        }
      });
    });

    // Update crashed snakes
    crashes.forEach((crash, snake) => {
      console.log(snake.name + ": Crashed");

      snake.state = SnakeState.Crashed;

      // Move head
      let newHead: paper.Point;

      // Method 1: just use the crashPoint (the center of the snake body)
      newHead = crash.crashPoint;
      console.log(snake.name + ": Moving head. Crash point = " + crash.crashPoint + ", new head = " + newHead)
      snake.path.removeSegment(snake.path.segments.length - 1);
      snake.path.add(newHead);

      // Method 2: Move the head to crash crashPoint
      // let crashPath: paper.Path;
      // let distanceThreshold: number;
      // if (crash instanceof CrashWithSnake) {
      //   crashPath = crash.snake2.path;
      //   distanceThreshold = this.THICKNESS;
      // } else if (crash instanceof CrashWithWall) {
      //   crashPath = crash.wall;
      //   distanceThreshold = this.THICKNESS / 2;
      // } else {
      //   throw new Error("Unsupported crash type");
      // }
      // let newHeadOffset = snake.path.getOffsetOf(crash.crashPoint);
      // while (true) {
      //   newHead = snake.path.getPointAt(newHeadOffset);
      //   const nearest = crashPath.getNearestPoint(newHead);
      //   const distToPath2 = newHead.getDistance(nearest);
      //
      //   if (distToPath2 > distanceThreshold) {
      //     break;
      //   }
      //   newHeadOffset -= 0.5;
      // }
      // console.log(snake.name + ": Moving head. Crash point = " + crash.crashPoint + ", new head = " + newHead)
      // let extension = snake.path.splitAt(newHeadOffset);
      // if (extension) {
      //   extension.remove();
      // }
    });
  }

  detectWinner() {
    if (this.winner != null)
      return;

    let remainingSnakes = this.getAliveSnakes();
    if (remainingSnakes.length == 1) {
      this.winner = remainingSnakes[0];
      console.log("Winner is " + this.winner.name);
    }
  }

  pathToString(path: paper.Path): String {
    let str = "[";

    path.segments.forEach((segment, index) => {
      if (index)
        str += ", ";
      str += "[" + segment.point.x + ", " + segment.point.y + "]";
    });

    str += "]"
    return str
  }
}

class Snake {
  name: string;
  path: paper.Path;
  vector: paper.Point;

  game: SnakeService;
  state: SnakeState = SnakeState.Alive;

  constructor(game: SnakeService) {
    this.game = game;
    this.path = new paper.Path();
  }

  head() {
    let segments = this.path.segments;
    return segments[segments.length - 1].point;
  }

  turnLeft() {
    this.vector.angle -= this.angle_per_frame();
  }

  turnRight() {
    this.vector.angle += this.angle_per_frame();
  }

  private angle_per_frame() {
    return this.game.ANGLE / this.game.FPS;
  }

  extendHead() {
    let head = this.head();

    let vectorPerFrame = new paper.Point(this.vector);
    vectorPerFrame.length /= this.game.FPS;

    let newHead = head.add(vectorPerFrame);

    this.path.add(newHead);
  }
}

enum SnakeState {
  Alive,
  Crashed
}

class Crash {
  snake: Snake;
  crashPoint: paper.Point;

  constructor(snake: Snake, crashPoint: paper.Point) {
    this.snake = snake;
    this.crashPoint = crashPoint;
  }
}

class CrashWithSnake extends Crash {
  snake2: Snake;

  constructor(snake: Snake, crashPoint: paper.Point, snake2: Snake) {
    super(snake, crashPoint);
    this.snake2 = snake2;
  }
}

class CrashWithWall extends Crash {
  wall: paper.Path;

  constructor(snake: Snake, crashPoint: paper.Point, wall: paper.Path) {
    super(snake, crashPoint);
    this.wall = wall;
  }
}
