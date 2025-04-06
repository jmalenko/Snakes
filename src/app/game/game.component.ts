import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Project, Path, Color, Point, View} from 'paper';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef;

  // TODO Map internal coordinates to real canvas size
  // WIDTH = 1920; // pixels
  WIDTH = 800; // pixels
  HEIGHT = this.WIDTH * 9 / 16; // pixels

  SPEED = 200; // pixels per second
  ANGLE = 360; // turn by this angle, per second

  THICKNESS = 8; // pixels

  // TODO: Change FPS to realtime
  FPS = 5; // frames per second

  snake: paper.Path;
  head: paper.Point;
  vector: paper.Point;

  pressedKeys = new Map<string, boolean>();

  ngAfterViewInit() {
    const project = new Project(this.canvas.nativeElement);

    this.snake = new Path();
    this.snake.strokeColor = Color.random();
    this.snake.strokeWidth = this.THICKNESS;

    this.head = new Point(this.WIDTH / 2, 0.5 * this.HEIGHT);
    this.vector = new Point(this.SPEED / this.FPS, 0);
    this.snake.add(this.head);

    let delay_per_frame = 1000 / this.FPS; // ms
    setInterval(() => {
      this.tick();
    }, delay_per_frame);
  }

  private tick() {
    console.log("Tick");

    let angle_per_frame = this.ANGLE / this.FPS;

    if (this.pressedKeys.get("ArrowLeft"))
      this.vector.angle -= angle_per_frame;
    if (this.pressedKeys.get("ArrowRight"))
      this.vector.angle += angle_per_frame;

    let newHead = this.head.add(this.vector);

    if (this.detectCrash(newHead)) {
      console.log("Crash")
      return;
    }

    this.head = newHead;

    this.snake.add(this.head);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDownEvent(event: KeyboardEvent) {
    console.log("Key down " + event.key + " " + event.code + " " + event.keyCode);
    this.pressedKeys.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUpEvent(event: KeyboardEvent) {
    console.log("Key up " + event.key + " " + event.code);
    this.pressedKeys.set(event.code, false);
  }

  detectCrash(newHead: paper.Point) {
    for (const segment of this.snake.segments) {
      const point = segment.point
      const distance = newHead.getDistance(point)
      if (distance < 10) {
        console.log("New head " + newHead);
        console.log("Crash point " + point);
        return true;
      }
    }
    return false;
  }
}
