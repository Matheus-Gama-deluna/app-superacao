/**
 * Gerenciador de Notificações Web para Descanso em Segundo Plano.
 * Avisa o praticante quando o descanso termina caso ele esteja com outra aba
 * aberta ou o celular no bolso.
 */
class WorkoutNotificationService {
  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  }

  public notifyRestFinished(nextExerciseName: string, nextSetNumber: number) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification('Descanso Concluído! 🔔', {
          body: `Hora da Série ${nextSetNumber}: ${nextExerciseName}. Vamos lá!`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'rest-finished',
          silent: false,
        });
      }
    } catch {
      // Ignora erro
    }
  }
}

export const workoutNotifications = new WorkoutNotificationService();
