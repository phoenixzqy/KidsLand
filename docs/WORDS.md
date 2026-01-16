# Managing Words

This guide explains how to add, update, or delete words in KidsLand.

## Overview

Words are stored in `src/data/words.json`. Each word includes:
- The word itself
- 3 sample sentences with the word highlighted

## File Location

```
src/data/words.json
```

## Word Structure

```json
{
  "id": "apple",              // Unique ID (use the word itself)
  "word": "apple",            // The word to learn
  "sentences": [
    {
      "text": "I eat an apple every day.",
      "highlightIndex": 3     // Word position in sentence (0-indexed)
    },
    {
      "text": "The apple is red and sweet.",
      "highlightIndex": 1
    },
    {
      "text": "She gave me an apple.",
      "highlightIndex": 4
    }
  ]
}
```

## Adding a New Word

### Step 1: Add to words.json

```json
{
  "words": [
    // ... existing words ...

    {
      "id": "elephant",
      "word": "elephant",
      "sentences": [
        {"text": "The elephant is very big.", "highlightIndex": 1},
        {"text": "I saw an elephant at the zoo.", "highlightIndex": 4},
        {"text": "The baby elephant was cute.", "highlightIndex": 2}
      ]
    }
  ]
}
```

### Step 2: Update version.json

```json
{
  "words": 2,    // Increment this number
  "prizes": 1
}
```

## Sentence Guidelines

When writing sentences for kids:

1. **Keep it simple** - Use short, clear sentences
2. **Kid-friendly vocabulary** - Avoid complex words
3. **Relatable context** - Use familiar situations (school, family, pets)
4. **Positive tone** - Keep content upbeat and encouraging

### Good Examples ✅

```
"I love my family."
"The cat is sleeping."
"We play at the park."
```

### Avoid ❌

```
"The conglomerate acquired substantial assets."  // Too complex
"He was very angry and yelled."                  // Negative tone
```

## Calculating highlightIndex

The `highlightIndex` is the position of the target word in the sentence (0-indexed).

**Example**: `"The dog runs fast."`

| Index | Word |
|-------|------|
| 0 | The |
| 1 | dog |
| 2 | runs |
| 3 | fast. |

If the target word is "dog", then `highlightIndex: 1`

## Updating a Word

1. Find the word by `id` in `words.json`
2. Modify the word or sentences
3. Bump the version in `version.json`

```json
// Adding a 4th sentence
{
  "id": "happy",
  "word": "happy",
  "sentences": [
    {"text": "I am happy today.", "highlightIndex": 2},
    {"text": "The happy dog wags its tail.", "highlightIndex": 1},
    {"text": "She looks very happy.", "highlightIndex": 3},
    {"text": "We are happy to see you.", "highlightIndex": 2}  // New
  ]
}
```

## Deleting a Word

⚠️ **Note**: Deleting a word will remove it from the list, but user progress for that word remains in their local database.

1. Remove the word object from `words.json`
2. Bump the version in `version.json`

## Bulk Adding Words

For adding many words at once, you can:

1. Prepare a JSON file with new words
2. Merge into `words.json`
3. Bump the version

### Script Example (Node.js)

```javascript
const fs = require('fs');

const existingWords = require('./src/data/words.json');
const newWords = require('./new-words.json');

const merged = {
  words: [...existingWords.words, ...newWords.words]
};

fs.writeFileSync(
  './src/data/words.json',
  JSON.stringify(merged, null, 2)
);

console.log(`Added ${newWords.words.length} new words`);
```

## Current Word List

The app currently includes 120 high-frequency words:

```
about, after, again, all, always, another, and, are, away, because,
before, boy, brown, buy, by, call, change, city, come, could,
country, do, does, done, draw, earth, even, every, far, find,
for, four, found, from, give, go, good, great, have, her,
here, house, how, hurt, jump, know, large, laugh, little, live,
long, look, many, move, my, near, no, now, off, old,
on, one, only, our, out, over, people, play, put, right,
round, said, saw, school, see, she, small, some, start, that,
the, their, them, then, there, these, they, this, through, to,
try, two, under, upon, walk, want, was, wash, went, were,
what, when, where, which, who, why, with, work, year, you
```

## Testing Changes

1. Run the dev server: `npm run dev`
2. Open the Words page
3. Search for your new word
4. Click on it to verify sentences display correctly
5. Test the speech button
6. Try a quiz with the new word
