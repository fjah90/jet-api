export const generateText = (json: any[], lang: string): string => {
  let result = '';

  json.forEach((obj) => {
    if (obj.type === 'paragraph') {
      result += obj.text.replace(/\r?\n|\r/g, '');

      obj.spans.forEach((span) => {
        if (span.type === 'hyperlink') {
          result = result.replace(
            new RegExp(`(${obj.text.substring(span.start, span.end)})`, 'g'),
            `<a href="${
              span.data.url ? span.data.url : 'https://www.iberojet.com/' + lang + '/' + span.data.uid
            }">$1</a>`
          );
        } else if (span.type === 'strong') {
          result = result.replace(
            new RegExp(`(${obj.text.substring(span.start, span.end)})`, 'g'),
            `<strong>$1</strong>`
          );
        }
      });
    }
  });
  if (result.includes('</a> de contratación')) result = result.replace('</a> de contratación', 'de contratación');
  if (result.includes('generales</a></strong>')) result = result.replace('generales</a></strong>', 'generales');
  return result;
};
