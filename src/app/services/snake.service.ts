import {Injectable} from '@angular/core';
import paper from 'paper';

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
    let crashes: Map<Snake, paper.Point> = new Map<Snake, paper.Point>();

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
          let crashPoint = intersections[0].point;  // TODO Use nearest intersection
          // console.log("      Crash point = " + crashPoint);
          crashes.set(snake1, crashPoint);
          return
        }
      });

      // Detect crash with border
      var border = new paper.Path.Rectangle(new paper.Point(0, 5), new paper.Size(this.WIDTH, this.HEIGHT));
      let intersections = extension.getIntersections(border);
      let crash = 0 < intersections.length;
      if (crash) {
        let crashPoint = intersections[0].point;
        // console.log("      Crash point = " + crashPoint);
        crashes.set(snake1, crashPoint);
        return
      }
    });

    // Update crashed snakes
    crashes.forEach((point, snake) => {
      console.log(snake.name + " crashed");

      snake.state = SnakeState.Crashed;

      // Move the head to crash point
      snake.path.removeSegment(snake.path.segments.length - 1);
      snake.path.add(point);
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

  // TODO Add last point in case of crash, that is touching the snake

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
