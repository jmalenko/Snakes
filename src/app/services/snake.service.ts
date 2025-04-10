import { Injectable } from '@angular/core';
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

  snakes:Snake[];

  constructor() {
    this.setupNewGame();
  }

  setupNewGame() {
    // Clean
    this.snakes = [];

    // paper.install(this);
    paper.setup([this.WIDTH, this.HEIGHT]);

    // Setup
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
      // console.log(index + ": " + snake.name);
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
    for (const snake of this.snakes) {
      snake.extendHead();
    }
  }

  isGameOver():boolean {
    // TODO Detect game over
    // return this.snakes.map(snake => this.isCrashed(snake)).reduce((a, b) => a || b);
    return false;
  }

  isCrashed(snake:Snake):boolean {
    return false;
  }

  detectCrash(newHead: paper.Point) {
    // for (const segment of this.snake.segments) {
    //   const point = segment.point
    //   const distance = newHead.getDistance(point)
    //   if (distance < 10) {
    //     console.log("New head " + newHead);
    //     console.log("Crash point " + point);
    //     return true;
    //   }
    // }
    return false;
  }
}

class Snake {
  name: string;
  path: paper.Path;
  vector: paper.Point;

  game: SnakeService;

  constructor(game:SnakeService) {
    this.game = game;
    this.path = new paper.Path();
  }

  head() {
    let segments = this.path.segments;
    return segments[segments.length-1].point;
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

    // if (this.detectCrash(newHead)) {
    //   console.log("Crash")
    //   return;
    // }

    this.path.add(newHead);
  }
}
