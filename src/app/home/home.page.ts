import { Component } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import { AlertController, IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class HomePage {
  currentTime: string = '';
  timerDisplay: string = '00:00';
  private timer: any;
  private isPomodoro: boolean = true;
  private pomodoroDuration: number = 25 * 60;
  private breakDuration: number = 5 * 60;

  constructor(
    private platform: Platform,
    private alertController: AlertController
  ) {
    this.initializeClock();
    this.handleBackButton();
    this.setupNotifications();
  }

  private async setupNotifications() {
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display === 'granted') {
      await LocalNotifications.createChannel({
        id: 'pomodoro-notifications',
        name: 'Pomodoro Timer',
        description: 'Pomodoro Timer Notifications',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#FF0000'
      });
    }
  }

  private initializeClock(): void {
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 1000);
  }

  private updateCurrentTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }

  async startPomodoro(): Promise<void> {
    const duration = this.isPomodoro ? this.pomodoroDuration : this.breakDuration;
    this.startCountdown(duration);
  }

  resetPomodoro(): void {
    clearInterval(this.timer);
    this.timerDisplay = '00:00';
  }

  private startCountdown(duration: number): void {
    clearInterval(this.timer);
    let timeLeft = duration;

    this.timer = setInterval(() => {
      this.updateTimerDisplay(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(this.timer);
        this.handleTimerEnd();
      }
      timeLeft--;
    }, 1000);
  }

  private updateTimerDisplay(timeLeft: number): void {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    this.timerDisplay = `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private async handleTimerEnd(): Promise<void> {
    await this.notifyEnd();
    this.isPomodoro = !this.isPomodoro;
    this.startPomodoro();
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  async notifyEnd(): Promise<void> {
    try {
      const message = this.isPomodoro
        ? 'Break ended! Time to work.'
        : 'Pomodoro session ended! Time for a break.';

      await Haptics.vibrate({ duration: 1000 });

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Pomodoro Timer',
            body: message,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date() },
            sound: 'default',
            channelId: 'pomodoro-notifications',
            smallIcon: 'ic_notification',
            largeIcon: 'ic_launcher',
            extra: {
              type: this.isPomodoro ? 'break' : 'pomodoro'
            }
          }
        ]
      });

      const alert = await this.alertController.create({
        header: 'Timer Complete',
        message: message,
        buttons: ['OK']
      });
      await alert.present();
    } catch (error) {
      console.error('Error in notifyEnd:', error);
    }
  }

  async setPreferences(): Promise<void> {
    const pomodoroMinutes = Math.floor(this.pomodoroDuration / 60);
    const pomodoroSeconds = this.pomodoroDuration % 60;
    const breakMinutes = Math.floor(this.breakDuration / 60);
    const breakSeconds = this.breakDuration % 60;
  
    const alert = await this.alertController.create({
      header: 'Set Timer Preferences',
      message: `Current Settings:\nStart: ${pomodoroMinutes}m ${pomodoroSeconds}s\nBreak: ${breakMinutes}m ${breakSeconds}s`,
      inputs: [
        {
          name: 'pomodoroMinutes',
          type: 'number',
          placeholder: 'Pomodoro Minutes',
          value: pomodoroMinutes,
          min: 0,
          max: 59
        },
        {
          name: 'pomodoroSeconds',
          type: 'number',
          placeholder: 'Pomodoro Seconds',
          value: pomodoroSeconds,
          min: 0,
          max: 59
        },
        {
          name: 'breakMinutes',
          type: 'number',
          placeholder: 'Break Minutes',
          value: breakMinutes,
          min: 0,
          max: 59
        },
        {
          name: 'breakSeconds',
          type: 'number',
          placeholder: 'Break Seconds',
          value: breakSeconds,
          min: 0,
          max: 59
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            const pomMin = parseInt(data.pomodoroMinutes) || 0;
            const pomSec = parseInt(data.pomodoroSeconds) || 0;
            const brkMin = parseInt(data.breakMinutes) || 0;
            const brkSec = parseInt(data.breakSeconds) || 0;
  
            this.pomodoroDuration = (pomMin * 60) + pomSec;
            this.breakDuration = (brkMin * 60) + brkSec;
  
            if (this.pomodoroDuration <= 0) this.pomodoroDuration = 60;
            if (this.breakDuration <= 0) this.breakDuration = 30;
          }
        }
      ]
    });
    await alert.present();
  }

  private handleBackButton(): void {
    this.platform.backButton.subscribeWithPriority(10, () => {
      App.exitApp();
    });
  }
}