/**
 * Extract date from user message
 * Handles relative dates ("in 2 days"), specific dates ("October 20"), and named days ("tomorrow", "Monday")
 * @param {string} message - User's message
 * @returns {Object|null} - Date object with type, dateString, and displayText, or null if no date found
 */
export function extractDateFromMessage(message) {
  const lowerMsg = message.toLowerCase();

  // Relative dates: "in 2 days", "in 3 days", "in a week"
  const relativeDaysMatch = lowerMsg.match(/in (\d+) days?/);
  if (relativeDaysMatch) {
    const daysAhead = parseInt(relativeDaysMatch[1]);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    return {
      type: 'relative',
      daysAhead,
      dateString: targetDate.toISOString().split('T')[0],
      displayText: `in ${daysAhead} day${daysAhead > 1 ? 's' : ''}`
    };
  }

  // "in a week"
  if (lowerMsg.match(/in a week/)) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    return {
      type: 'relative',
      daysAhead: 7,
      dateString: targetDate.toISOString().split('T')[0],
      displayText: 'in a week'
    };
  }

  // Specific dates: "October 20", "Oct 20", "10/20"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbrev = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                       'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  for (let i = 0; i < monthNames.length; i++) {
    const fullMonth = monthNames[i];
    const abbrev = monthAbbrev[i];
    const monthRegex = new RegExp(`(${fullMonth}|${abbrev})\\s+(\\d{1,2})`, 'i');
    const match = lowerMsg.match(monthRegex);

    if (match) {
      const day = parseInt(match[2]);
      const month = i;
      const year = new Date().getFullYear();
      const targetDate = new Date(year, month, day);

      return {
        type: 'specific',
        dateString: targetDate.toISOString().split('T')[0],
        displayText: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      };
    }
  }

  // Named days: "today", "tomorrow", day of week
  if (lowerMsg.includes('today')) {
    return {
      type: 'named',
      day: 'today',
      dateString: new Date().toISOString().split('T')[0],
      displayText: 'today'
    };
  }

  if (lowerMsg.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      type: 'named',
      day: 'tomorrow',
      dateString: tomorrow.toISOString().split('T')[0],
      displayText: 'tomorrow'
    };
  }

  // Days of week
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const dayName of daysOfWeek) {
    if (lowerMsg.includes(dayName)) {
      const targetDayIndex = daysOfWeek.indexOf(dayName);
      const currentDate = new Date();
      const currentDayIndex = currentDate.getDay();

      let daysToAdd = targetDayIndex - currentDayIndex;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Schedule for next week
      }

      const targetDate = new Date();
      targetDate.setDate(currentDate.getDate() + daysToAdd);

      return {
        type: 'named',
        day: dayName,
        dateString: targetDate.toISOString().split('T')[0],
        displayText: dayName.charAt(0).toUpperCase() + dayName.slice(1)
      };
    }
  }

  return null; // No date found
}
