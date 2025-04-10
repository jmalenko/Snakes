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

  isGameOver(): boolean {
    return this.getAliveSnakes().length == 0;
  }

  getAliveSnakes(): Snake[] {
    return this.snakes
      .filter(snake => snake.state == SnakeState.Alive)
  }

  detectCrash(snake: Snake, newHead: paper.Point) {
    let crash = false;

    this.snakes.forEach((snake2, index) => {
      if (snake == snake2) return; // TODO Ignore just last part of the snake

      for (const segment of snake2.path.segments) {
        const point = segment.point
        const distance = newHead.getDistance(point)
        if (distance < 10) {
          console.log("New head " + newHead);
          console.log("Crash point " + point);
          crash = true;
        }
      }
    });

    // TODO Detect crash with border

    // Mark winner
    if (crash) {
      let remainingSnakes = this.getAliveSnakes();
      remainingSnakes = remainingSnakes.filter(snake2 => snake2 != snake);
      if (remainingSnakes.length == 1) {
        this.winner = remainingSnakes[0];
      }
    }

    return crash;
  }
}

class Snake {
  name: string;
  path: paper.Path;
  vector: paper.Point;

  game: SnakeService;
  state: SnakeState = SnakeState.Alive;

  // TODO Add state to Snake to indicate head in intro and crash in end, faster detection of game over

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
    if (this.state !== SnakeState.Alive)
      return;

    let head = this.head();

    let vectorPerFrame = new paper.Point(this.vector);
    vectorPerFrame.length /= this.game.FPS;

    let newHead = head.add(vectorPerFrame);

    if (this.game.detectCrash(this, newHead)) {
      console.log("Crash " + this.name)
      this.state = SnakeState.Crashed;
      return;
    }

    this.path.add(newHead);
  }
}

enum SnakeState {
  Alive,
  Crashed
}
