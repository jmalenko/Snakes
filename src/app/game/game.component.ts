import {AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, signal} from '@angular/core';
import {Project, Path, Color, Point, View, project} from 'paper';
import {SnakeService} from '../services/snake.service';
import {BannerComponent} from '../components/banner/banner.component';

@Component({
  selector: 'app-game',
  imports: [
    BannerComponent
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef;
  private project: paper.Project;

  private snakeService = inject(SnakeService);
  private pressedKeys = new Map<string, boolean>();
  private intervalId: any;

  state = State.Intro;
  countdown = 3;
  message = signal(this.countdown.toString()); // TODO Style banner

  ngAfterViewInit() {
    this.project = new Project(this.canvas.nativeElement);

    this.snakeService.setupNewGame();

    this.intervalId = setInterval(() => {
      this.tickIntro();
    }, 1000);
  }

  private tickIntro() {
    this.countdown--;
    this.message = signal(this.countdown.toString());

    if (this.countdown == 1) {
      this.showHeads();
    }

    if (this.countdown == 0) {
      this.hideHeads();
      this.message = signal("");
      clearInterval(this.intervalId);

      this.state = State.Game;

      this.snakeService.snakes.forEach(snake => {
        this.project.activeLayer.addChild(snake.path);
      });

      let delayPerFrame = 1000 / this.snakeService.FPS; // ms
      this.intervalId = setInterval(() => {
        this.tickGame();
      }, delayPerFrame);
    }
  }

  showHeads() {
    // TODO Change to dot (instead of tick)
    this.snakeService.snakes.forEach(snake => {
      this.project.activeLayer.addChild(snake.path);
    });
    this.snakeService.tick();
  }

  hideHeads() {
    this.project.clear();
  }

  private tickGame() {
    for (const snake of this.snakeService.snakes) {
      if (this.pressedKeys.get("ArrowLeft")) // TODO Different controls for  each snake
        snake.turnLeft();
      if (this.pressedKeys.get("ArrowRight"))
        snake.turnRight();
    }

    this.snakeService.tick();

    if (this.snakeService.isGameOver()) {
      clearInterval(this.intervalId);

      this.state = State.GameOver;
      this.message = signal("Game over."); // TODO Add name
    }
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

enum State {
  Intro,
  Game,
  GameOver
}
