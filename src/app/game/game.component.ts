import {AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject} from '@angular/core';
import {Project, Path, Color, Point, View, project} from 'paper';
import {SnakeService} from '../services/snake.service';
// import NodeJS from 'NodeJS';
// import NodeJS from 'nodejs';
// import {Timeout} from 'node';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef;
  private project: paper.Project;

  private snakeService = inject(SnakeService);
  private pressedKeys = new Map<string, boolean>();
  // private intervalId: NodeJS.Timeout;
  private intervalId: any; // TODO Fix

  ngAfterViewInit() {
    this.project = new Project(this.canvas.nativeElement);

    this.snakeService.setupNewGame();

    this.snakeService.snakes.forEach(snake => {
      this.project.activeLayer.addChild(snake.path);
    });

    let delayPerFrame = 1000 / this.snakeService.FPS; // ms
    this.intervalId = setInterval(() => {
      this.tick();
    }, delayPerFrame);
  }

  private tick() {
    console.log("Tick");

    for (const snake of this.snakeService.snakes) {
      if (this.pressedKeys.get("ArrowLeft")) // TODO Different controls for  each snake
        snake.turnLeft();
      if (this.pressedKeys.get("ArrowRight"))
        snake.turnRight();
    }

    this.snakeService.tick();

    // clearInterval(this.intervalId); // TODO Stop timer at the end of the game
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
}
