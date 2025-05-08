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
    console.log('Pomodoro cycle reset.');
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
        ? 'Pomodoro session ended! Time for a break.'
        : 'Break ended! Time to work.';

      await Haptics.vibrate({ duration: 1000 });

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Pomodoro Timer',
            body: message,
            id: new Date().getTime(),
            schedule: { at: new Date(new Date().getTime() + 1000) },
            sound: 'default',
          },
        ],
      });

      console.log('End notification scheduled:', message);
    } catch (error) {
      console.error('Error scheduling end notification:', error);
    }
  }

  async setPreferences(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Set Timer Preferences',
      message: `Start: ${this.pomodoroDuration / 60} minutes\nBreak: ${this.breakDuration / 60} minutes`,
      inputs: [
        {
          name: 'pomodoro',
          type: 'number',
          placeholder: 'Pomodoro Duration (minutes)',
          value: this.pomodoroDuration / 60,
        },
        {
          name: 'break',
          type: 'number',
          placeholder: 'Break Duration (minutes)',
          value: this.breakDuration / 60,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            this.pomodoroDuration = parseInt(data.pomodoro) * 60 || this.pomodoroDuration;
            this.breakDuration = parseInt(data.break) * 60 || this.breakDuration;
            console.log('Preferences updated:', this.pomodoroDuration, this.breakDuration);
          },
        },
      ],
    });
    await alert.present();
  }
  private handleBackButton(): void {
    this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('Back button pressed. Exiting app...');
      App.exitApp();
    });
  }
}