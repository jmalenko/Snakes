import {AfterViewInit, Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {Path, Project} from 'paper';
import {SnakeService} from '../services/snake.service';
import {BannerComponent} from '../components/banner/banner.component';

function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

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

  private state: State;
  private countdown: number;
  message = signal("");
  // TODO Style banner

  private keys = [
    ["ShiftLeft", "KeyZ"],
    ["Comma", "Period"],
    ["ArrowLeft", "ArrowRight"]
  ];

  ngAfterViewInit() {
    this.project = new Project(this.canvas.nativeElement);
    this.startIntro();
  }

  private startIntro() {
    this.state = State.Intro;

    console.log("=== New game ===");

    this.snakeService.setupNewGame();

    this.project.clear();

    this.countdown = 3;
    this.message = signal(this.countdown.toString());

    this.intervalId = setInterval(() => {
      this.tickIntro();
    }, 1000);
  }

  private endIntro() {
    this.message = signal("");
    clearInterval(this.intervalId);
  }

  private tickIntro() {
    this.countdown--;
    this.message = signal(this.countdown.toString());

    if (this.countdown == 1) {
      this.showHeads();
    }

    if (this.countdown == 0) {
      this.hideHeads();
      this.endIntro();
      this.startGame();
    }
  }

  startGame() {
    this.state = State.Game;

    this.snakeService.snakes.forEach(snake => {
      this.project.activeLayer.addChild(snake.path);
    });

    let delayPerFrame = 1000 / this.snakeService.FPS; // ms
    this.intervalId = setInterval(() => {
      this.tickGame();
    }, delayPerFrame);
  }

  endGame() {
    clearInterval(this.intervalId);
  }

  private tickGame() {
    this.snakeService.snakes.forEach((snake, index) => {
      const keys = this.keys[index];
      if (this.pressedKeys.get(keys[0]))
        snake.turnLeft();
      if (this.pressedKeys.get(keys[1]))
        snake.turnRight();
    });

    this.snakeService.tick();

    if (this.snakeService.winner != null) {
      this.message = signal("Winner is " + this.snakeService.winner.name + ".");
    }

    if (this.snakeService.isGameOver()) {
      this.endGame();
      this.startGameOver();
    }
  }

  startGameOver() {
    this.state = State.GameOver;
    assert(this.snakeService.winner != null)
    this.message = signal("Winner is " + this.snakeService.winner.name + ". Game over.");

    this.intervalId = setTimeout(() => {
      this.endGameOver();
    }, 1000);
  }

  endGameOver() {
    this.startIntro();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDownEvent(event: KeyboardEvent) {
    // console.log("Key down " + event.key + " " + event.code + " " + event.keyCode);
    this.pressedKeys.set(event.code, true);
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUpEvent(event: KeyboardEvent) {
    // console.log("Key up " + event.key + " " + event.code);
    this.pressedKeys.set(event.code, false);
  }

  showHeads() {
    // Show dot
    this.snakeService.snakes.forEach(snake => {
      let path = snake.path;
      let point = path.segments[0].point;
      let dot = new Path.Circle(point, this.snakeService.THICKNESS / 2);
      dot.fillColor = path.strokeColor;
      this.project.activeLayer.addChild(dot);
    });
  }

  hideHeads() {
    this.project.clear();
  }

}

enum State {
  Intro,
  Game,
  GameOver
}
