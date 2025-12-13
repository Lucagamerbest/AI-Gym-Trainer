/**
 * Chat Text Parser
 *
 * Parses AI chat text into segments that can be rendered with different styles.
 * Handles:
 * - Markdown bold (**text**)
 * - Exercise names (from database)
 * - Regular text
 *
 * Returns an array of segments for rendering.
 */

import { findExercisesInText } from './exerciseNameMatcher';

/**
 * Segment types for rendering
 */
export const SegmentType = {
  TEXT: 'text',
  BOLD: 'bold',
  EXERCISE: 'exercise',
  BOLD_EXERCISE: 'bold_exercise', // Exercise name that's also bold
};

/**
 * Parse chat text into renderable segments
 *
 * @param {string} text - The text to parse
 * @param {Object} options - Parsing options
 * @param {boolean} options.detectExercises - Whether to detect exercise names (default: true)
 * @param {boolean} options.parseMarkdown - Whether to parse markdown bold (default: true)
 * @returns {Array} Array of segments: { type, content, exercise?, bold? }
 *
 * Example:
 * parseChatText("Try **Bench Press** for chest")
 * Returns:
 * [
 *   { type: 'text', content: 'Try ' },
 *   { type: 'bold_exercise', content: 'Bench Press', exercise: {...}, bold: true },
 *   { type: 'text', content: ' for chest' }
 * ]
 */
export const parseChatText = (text, options = {}) => {
  const {
    detectExercises = true,
    parseMarkdown = true
  } = options;

  // Safety check
  if (!text || typeof text !== 'string') {
    return [{ type: SegmentType.TEXT, content: '' }];
  }

  // Step 1: Find all bold regions
  const boldRegions = parseMarkdown ? findBoldRegions(text) : [];

  // Step 2: Find all exercise matches
  const exerciseMatches = detectExercises ? findExercisesInText(text) : [];

  // Debug logging
  if (exerciseMatches.length > 0) {
    console.log('🏋️ Found exercises in text:', exerciseMatches.map(m => m.name));
  }

  // Step 3: Create a list of all markers (bold starts/ends and exercise matches)
  const markers = [];

  // Add bold markers
  boldRegions.forEach(region => {
    markers.push({
      type: 'bold_start',
      position: region.contentStart,
      markdownStart: region.start,
    });
    markers.push({
      type: 'bold_end',
      position: region.contentEnd,
      markdownEnd: region.end,
    });
  });

  // Add exercise markers
  exerciseMatches.forEach(match => {
    markers.push({
      type: 'exercise',
      position: match.start,
      end: match.end,
      exercise: match.exercise,
      name: match.name,
    });
  });

  // Sort markers by position
  markers.sort((a, b) => a.position - b.position);

  // Step 4: Build segments by processing text with markers
  const segments = [];
  let currentPos = 0;
  let inBold = false;
  let skipUntil = -1; // For skipping markdown syntax

  // Process character by character, respecting markers
  const processedRanges = new Set(); // Track which ranges we've processed

  for (let i = 0; i < text.length; i++) {
    // Check if we should skip (markdown syntax)
    if (i < skipUntil) continue;

    // Check for bold start markers at this position
    const boldStart = boldRegions.find(r => r.start === i);
    if (boldStart) {
      // Add any pending text before the bold
      if (currentPos < i) {
        const pendingText = text.substring(currentPos, i);
        if (pendingText) {
          segments.push({ type: SegmentType.TEXT, content: pendingText });
        }
      }
      inBold = true;
      skipUntil = boldStart.contentStart;
      currentPos = boldStart.contentStart;
      i = boldStart.contentStart - 1; // -1 because loop will increment
      continue;
    }

    // Check for bold end at content end
    const boldEnd = boldRegions.find(r => r.contentEnd === i);
    if (boldEnd && inBold) {
      // Add the bold content
      const boldContent = text.substring(currentPos, i);
      if (boldContent) {
        // Check if this bold content contains an exercise
        const exerciseInBold = exerciseMatches.find(
          m => m.start >= currentPos && m.end <= i
        );

        if (exerciseInBold && exerciseInBold.start === currentPos && exerciseInBold.end === i) {
          // The entire bold section is an exercise
          segments.push({
            type: SegmentType.BOLD_EXERCISE,
            content: exerciseInBold.name,
            exercise: exerciseInBold.exercise,
            bold: true
          });
        } else {
          segments.push({ type: SegmentType.BOLD, content: boldContent, bold: true });
        }
      }
      inBold = false;
      skipUntil = boldEnd.end;
      currentPos = boldEnd.end;
      i = boldEnd.end - 1;
      continue;
    }

    // Check for exercise at this position (not in bold)
    if (!inBold) {
      const exercise = exerciseMatches.find(m => m.start === i);
      if (exercise) {
        // Add any pending text before the exercise
        if (currentPos < i) {
          const pendingText = text.substring(currentPos, i);
          if (pendingText) {
            segments.push({ type: SegmentType.TEXT, content: pendingText });
          }
        }
        // Add the exercise segment
        segments.push({
          type: SegmentType.EXERCISE,
          content: exercise.name,
          exercise: exercise.exercise
        });
        currentPos = exercise.end;
        i = exercise.end - 1;
        continue;
      }
    }
  }

  // Add any remaining text
  if (currentPos < text.length) {
    const remaining = text.substring(currentPos);
    if (remaining) {
      segments.push({ type: SegmentType.TEXT, content: remaining });
    }
  }

  // If no segments were created, return the original text
  if (segments.length === 0) {
    return [{ type: SegmentType.TEXT, content: text }];
  }

  return segments;
};

/**
 * Find all bold regions in text (markdown **text**)
 * Returns array of { start, end, contentStart, contentEnd }
 */
const findBoldRegions = (text) => {
  const regions = [];
  const regex = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    regions.push({
      start: match.index,
      end: match.index + match[0].length,
      contentStart: match.index + 2, // After **
      contentEnd: match.index + match[0].length - 2, // Before **
      content: match[1]
    });
  }

  return regions;
};

/**
 * Simple parser that only handles markdown (no exercise detection)
 * Use this for performance when exercise detection isn't needed
 */
export const parseMarkdownOnly = (text) => {
  if (!text || typeof text !== 'string') {
    return [{ type: SegmentType.TEXT, content: '' }];
  }

  const segments = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: SegmentType.TEXT,
        content: text.substring(lastIndex, match.index)
      });
    }

    // Add the bold text
    segments.push({
      type: SegmentType.BOLD,
      content: match[1],
      bold: true
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: SegmentType.TEXT,
      content: text.substring(lastIndex)
    });
  }

  return segments.length > 0 ? segments : [{ type: SegmentType.TEXT, content: text }];
};

export default {
  parseChatText,
  parseMarkdownOnly,
  SegmentType
};
