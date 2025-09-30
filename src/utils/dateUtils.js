export const formatDate = (date, formatString = 'dd.MM.yyyy HH:mm') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const differenceInMinutes = (date1, date2) => {
  return Math.floor((date1 - date2) / (1000 * 60));
};

export const differenceInHours = (date1, date2) => {
  return Math.floor((date1 - date2) / (1000 * 60 * 60));
};

export const differenceInDays = (date1, date2) => {
  const diff = (date1 - date2) / (1000 * 60 * 60 * 24);
  if (diff >= 0) {
    return Math.ceil(diff);
  }
  return Math.floor(diff);
};

export const isBefore = (date1, date2) => {
  return date1 < date2;
};

export const getRemainingTime = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  
  if (isBefore(due, now)) {
    return { text: 'Süre doldu', color: '#DC2626', status: 'overdue' };
  }
  
  const diffMinutes = Math.max(1, differenceInMinutes(due, now));
  const diffHours = Math.max(1, differenceInHours(due, now));
  const diffDays = Math.max(1, differenceInDays(due, now));

  if (diffMinutes < 60) {
    return { text: `${diffMinutes} dakika kaldı`, color: '#D97706', status: 'urgent' };
  }

  if (diffHours < 24) {
    return { text: `${diffHours} saat kaldı`, color: '#D97706', status: 'urgent' };
  }
  
  if (diffDays < 7) {
    return { text: `${diffDays} gün kaldı`, color: '#059669', status: 'normal' };
  }
  
  return { text: `${diffDays} gün kaldı`, color: '#2563EB', status: 'normal' };
};

export const calculateDueDate = (startDate, cureDays) => {
  return addDays(new Date(startDate), cureDays);
};

export const getStatusInfo = (dueDate, completed) => {
  if (completed) {
    return { text: 'Tamamlandı', color: '#059669', status: 'completed' };
  }
  
  return getRemainingTime(dueDate);
};
