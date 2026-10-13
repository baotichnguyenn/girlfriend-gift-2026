/* ================================================================
   EDIT THIS PART
   ================================================================ */
export const CONFIG = {
  herName: 'my love',            // each letter opens with "Dear <herName>,"
  from: 'Bao',                   // signature at the bottom of each letter
  photo: '',                     // her photo: 'her.jpg' (next to index.html) or a data: URI. Square-ish, face in the middle.
  dress: '#b8576b',              // colour of the figure's dress
  // Wall-label titles for the photos in "displayed photos": the first is for 1.jpg, and so on. Leave out any you like.
  photoTitles: [],
  title: 'Museum of Us',
  introTitle: ['Five letters.', 'One way through.'],
  introText: 'They hang in the order they were written to be read. Follow the brass line, and open each one when you reach it.',
  // The order here IS the order she has to read them in.
  letters: [
    { title: 'The first time', medium: 'Letter, ink on paper', body: [
      'I want to start at the beginning.',
      '[Write about the day you met: where you were, what you noticed first, what you thought on the way home.]',
      'I didn’t know then that it was the start of all of this.'
    ]},
    { title: 'Small things', medium: 'Letter, ink on paper', body: [
      'Some of my favourite things about you are tiny. You probably don’t know I notice them.',
      '[List three small habits of hers that you love.]',
      'If this museum had a permanent collection, those would be in it.'
    ]},
    { title: 'The hard rooms', medium: 'Letter, ink on paper', body: [
      'Not every gallery in here is bright, and that’s fine.',
      '[Write about a hard time you got through together, and what she did that helped.]',
      'I’m glad I walked through those rooms with you.'
    ]},
    { title: 'What you changed', medium: 'Letter, ink on paper', body: [
      'You changed how I see some things.',
      '[Write one way she changed you, with a real example.]',
      'I’m better for it, and I don’t say that enough.'
    ]},
    { title: 'What comes next', medium: 'Letter, ink on paper', body: [
      'This is the last letter, so I kept the most important part for here.',
      '[Write the thing you most want her to hear.]',
      'Keep walking. There’s one more room.'
    ]}
  ],
  finale: {
    eyebrow: 'Exhibit VI · Mixed media, ongoing',
    title: 'The last exhibit is you.',
    body: 'Thank you for walking all the way through. [Your closing line goes here.]'
  }
};
