import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Sprint {
  value: string; // YYYY-MM
  label: string; // MMMM yyyy
}

export interface SprintDoc {
    id: string; // YYYY-MM (Document ID)
    label: string; // MMMM yyyy
    status: 'active' | 'closed';
    createdAt: string;
    closedAt?: string;
}

export function generateSprints(numPast = 6, numFuture = 2): Sprint[] {
  const sprints: Sprint[] = [];
  const today = new Date();

  // Past months including current
  for (let i = numPast; i >= 0; i--) {
    const date = subMonths(today, i);
    sprints.push({
      value: format(date, 'yyyy-MM'),
      label: format(startOfMonth(date), 'MMMM yyyy', { locale: es }),
    });
  }

  // Future months
  for (let i = 1; i <= numFuture; i++) {
    const date = addMonths(today, i);
    sprints.push({
      value: format(date, 'yyyy-MM'),
      label: format(startOfMonth(date), 'MMMM yyyy', { locale: es }),
    });
  }
  
  // Return in descending order
  return sprints.reverse();
}

export function getCurrentSprintValue(): string {
    return format(new Date(), 'yyyy-MM');
}

export function getSprintLabel(dateStr: string): string {
    const date = new Date(dateStr + "-02"); // add day to avoid timezone issues with YYYY-MM
    return format(date, 'MMMM yyyy', { locale: es });
}
