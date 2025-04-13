import {AfterViewInit, Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {Path, Project} from 'paper';
import {SnakeControl, SnakeService} from '../services/snake.service';
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

  private state: State;
  private countdown: number;
  message = signal("");
  // TODO Style banner

  // TODO Support own name and color
  private names = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Mu"];

  private keys = [
    new SnakeControl("Backquote", "Tab"),
    new SnakeControl("ShiftLeft", "ControlLeft"),
    new SnakeControl("AltLeft", "Space"),
    new SnakeControl("KeyV", "KeyB"),
    new SnakeControl("Comma", "Period"),
    new SnakeControl("ShiftRight", "ControlRight"), // untested
    new SnakeControl("ArrowLeft", "ArrowRight"),
    new SnakeControl("0", "."), // untested
    new SnakeControl("+", "-"), // untested
    new SnakeControl("MouseButton0", "MouseButton2") // left and right mouse buttons
  ];

  ngAfterViewInit() {
    this.project = new Project(this.canvas.nativeElement);
    this.startIntro();
  }

  private startIntro() {
    this.state = State.Intro;

    this.project.clear();

    console.log("=== Intro ===");

    this.snakeService.initGame();
    this.message = signal("Start a new game by adding players. Add player by pressing it's control key.");
  }

  // Countdown starts when the first snake is added
  private startIntroCountdown() {
    this.countdown = 3;
    this.updateMessageDuringIntroCountdown();

    this.intervalId = setInterval(() => {
      this.tickIntro();
    }, 1000);
  }

  private updateMessageDuringIntroCountdown () {
    let message = this.countdown.toString();
    message += " Snakes: "
    this.snakeService.snakes.forEach((snake, index) => {
      if (0 < index)
        message += ", ";
      message += snake.name;
    });
    message += ". Add player by pressing it's control key."
    this.message = signal(message);
  }

  private endIntro() {
    this.message = signal("");
    clearInterval(this.intervalId);
  }

  private tickIntro() {
    this.countdown--;
    this.updateMessageDuringIntroCountdown();

    if (this.countdown == 1) {
      this.showHeads();
    }

    if (this.countdown == 0) {
      this.hideHeads();
      this.endIntro();
      this.startGame();
    }
  }

  private addPlayerWithKey(keyCode: string) {
    if (this.state != State.Intro)
      throw new Error("Cannot add player when not in intro.");

    this.keys.forEach((control, index) => {
      if (control.left == keyCode || control.right == keyCode) {
        let name = this.names[index];

        // If a snake with this control exists, then don't add a new one
        if (this.snakeService.getSnakeByName(name))
          return;

        console.log("Adding snake: " + name);
        this.snakeService.addSnake(name, control);
      }
    })
  }

  startGame() {
    console.log("=== Start game ===");
    this.state = State.Game;

    this.snakeService.startGame();

    // Show snake bodies (paths) in canvas
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
    this.snakeService.snakes.forEach((snake) => {
      if (this.pressedKeys.get(snake.control.left))
        snake.turnLeft();
      if (this.pressedKeys.get(snake.control.right))
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
    console.log("Game over");
    this.message = signal(this.snakeService.winner
      ? "Winner is " + this.snakeService.winner.name + ". Game over."
      : "No winner. Game over.");

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
    this.handleDownEvent(event.code);
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyUpEvent(event: KeyboardEvent) {
    // console.log("Key up " + event.key + " " + event.code);
    this.handleUpEvent(event.code);
  }

  @HostListener('document:mousedown', ['$event'])
  handleMouseDownEvent(event: MouseEvent) {
    // console.log("Mouse down " + event.button);
    const code = "MouseButton" + event.button;
    this.handleDownEvent(code);
  }

  @HostListener('document:mouseup', ['$event'])
  handleMouseUpEvent(event: MouseEvent) {
    // console.log("Mouse up " + event.button);
    const code = "MouseButton" + event.button;
    this.handleUpEvent(code);
  }

  handleDownEvent(code:string) {
    switch (this.state) {
      case State.Intro:
        const startCountdown = this.snakeService.getNumberOfSnakes() == 0;
        this.addPlayerWithKey(code);
        if (startCountdown)
          this.startIntroCountdown();
        if (this.countdown == 1) {
          this.hideHeads();
          this.showHeads();
        }
        this.updateMessageDuringIntroCountdown();
        break;
      case State.Game:
        this.pressedKeys.set(code, true);
        break;
      case State.GameOver:
    }
  }

  handleUpEvent(code: string) {
    this.pressedKeys.set(code, false);
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: Event) {
    event.preventDefault();
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
