export const securityQuestionText = (json: any[]): string => {
  let result = '';

  json.forEach((obj) => {
    if (obj.type === 'heading2') result += `<strong>${obj.text}</strong><br><br>`;

    if (obj.type === 'paragraph' && obj.text.trim() !== '') {
      if (typeof obj.spans[0] === 'object' && obj.spans[0].type === 'strong') {
        result += `<strong>${obj.text.trim()}</strong><br><br>`;
      } else {
        result += `${obj.text.trim()}<br><br>`;
      }
    }

    if (obj.type === 'list-item') result += `${obj.text.trim()}<br><br>`;
  });

  return result;
};
