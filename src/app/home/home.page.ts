import { Component } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

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

  constructor() {
    this.initializeClock();
  }

  
  private initializeClock(): void {
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 1000);
  }

  private updateCurrentTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }

 
  startPomodoro(): void {
    const duration = this.isPomodoro ? 25 * 60 : 5 * 60; 
    this.startCountdown(duration);
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

  private handleTimerEnd(): void {
    this.notifyUser();
    this.isPomodoro = !this.isPomodoro; 
    this.startPomodoro();
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }


  async notifyUser(): Promise<void> {
    try {
      
      const hasPermission = await LocalNotifications.requestPermissions();
      if (hasPermission.display === 'granted') {
        const defaultMessage = this.isPomodoro
        ? 'Pomodoro session ended! Time for a break.'
        : 'Break ended! Time to work.';
      const message = window.prompt('Enter your notification message:', defaultMessage) || defaultMessage;

        await Haptics.vibrate({ duration: 1000 });
  
        
        console.log('Scheduling notification with message:', message);
  
    
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Pomodoro Timer',
              body: message,
              id: new Date().getTime(),
              schedule: { at: new Date(new Date().getTime() + 1000) }, 
              sound: 'default', 
              extra: { isPomodoro: this.isPomodoro }, 
            },
          ],
        });
  
       
        console.log('Notification scheduled successfully.');
      } else {
        console.error('Notification permissions not granted.');
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }
}
