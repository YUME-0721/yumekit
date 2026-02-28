export function formatDateToYYYYMMDD(date: Date): string {
	return date.toISOString().substring(0, 10);
}

export function formatPostDateForDisplay(date: Date): string {
	return date.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}
